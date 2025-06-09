// Main password manager service
import { CryptoManager } from './crypto.js';
import { VaultRepository } from './vault-repository.js';

export class PasswordManagerService {
  constructor() {
    this.crypto = new CryptoManager();
    this.repository = new VaultRepository();
    this.currentVault = null;
    this.currentKey = null;
    this.isUnlocked = false;
  }

  /**
   * Create a new password vault
   * @param {Object} vaultData - Vault creation data
   * @returns {Promise<string>} Vault ID
   */
  async createVault({ name, description, email, masterPassword }) {
    try {
      // Check if email already exists
      const exists = await this.repository.emailExists(email);
      if (exists) {
        throw new Error('A vault with this email already exists');
      }

      // Generate salt for key derivation
      const salt = this.crypto.generateSalt();
      
      // Hash master password for verification
      const masterPasswordHash = await this.crypto.hashPassword(masterPassword);

      // Create vault data
      const vaultData = {
        name,
        description,
        email,
        masterPasswordHash,
        salt: Array.from(salt) // Convert to array for JSON serialization
      };

      // Create vault in Firebase
      const vaultId = await this.repository.createVault(vaultData);

      console.log(`✅ Vault created successfully with ID: ${vaultId}`);
      return vaultId;
    } catch (error) {
      console.error('❌ Failed to create vault:', error);
      throw error;
    }
  }

  /**
   * Sign in to an existing vault
   * @param {string} email - Vault email
   * @param {string} masterPassword - Master password
   * @returns {Promise<Object>} Vault information
   */
  async signInToVault(email, masterPassword) {
    try {
      // Get vault by email
      const vault = await this.repository.getVaultByEmail(email);
      if (!vault) {
        throw new Error('Vault not found with this email');
      }

      // Verify master password
      const masterPasswordHash = await this.crypto.hashPassword(masterPassword);
      if (masterPasswordHash !== vault.masterPasswordHash) {
        throw new Error('Invalid master password');
      }

      // Derive encryption key
      const salt = new Uint8Array(vault.salt);
      const key = await this.crypto.deriveKey(masterPassword, salt);

      // Set current session
      this.currentVault = vault;
      this.currentKey = key;
      this.isUnlocked = true;

      console.log(`✅ Successfully signed in to vault: ${vault.name}`);
      return {
        id: vault.id,
        name: vault.name,
        description: vault.description,
        email: vault.email,
        createdAt: vault.createdAt
      };
    } catch (error) {
      console.error('❌ Failed to sign in to vault:', error);
      throw error;
    }
  }

  /**
   * Lock the current vault (clear session)
   */
  lockVault() {
    this.currentVault = null;
    this.currentKey = null;
    this.isUnlocked = false;
    console.log('🔒 Vault locked');
  }

  /**
   * Check if vault is currently unlocked
   * @returns {boolean}
   */
  isVaultUnlocked() {
    return this.isUnlocked && this.currentVault && this.currentKey;
  }

  /**
   * Get current vault info
   * @returns {Object|null}
   */
  getCurrentVault() {
    if (!this.isVaultUnlocked()) {
      return null;
    }
    return {
      id: this.currentVault.id,
      name: this.currentVault.name,
      description: this.currentVault.description,
      email: this.currentVault.email
    };
  }

  /**
   * Add a new password record to the current vault
   * @param {Object} recordData - Password record data
   * @returns {Promise<string>} Record ID
   */
  async addPasswordRecord({ title, website, username, password, notes = '', tags = [] }) {
    if (!this.isVaultUnlocked()) {
      throw new Error('Vault is locked. Please sign in first.');
    }

    try {
      // Create password record
      const record = {
        title,
        website,
        username,
        password,
        notes,
        tags,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Encrypt the record
      const encryptedRecord = await this.crypto.encryptRecord(record, this.currentKey);

      // Save to Firebase
      const recordId = await this.repository.addPasswordRecord(
        this.currentVault.id,
        encryptedRecord
      );

      console.log(`✅ Password record added with ID: ${recordId}`);
      return recordId;
    } catch (error) {
      console.error('❌ Failed to add password record:', error);
      throw error;
    }
  }

  /**
   * Get all password records from the current vault
   * @returns {Promise<Array>} Array of decrypted password records
   */
  async getPasswordRecords() {
    if (!this.isVaultUnlocked()) {
      throw new Error('Vault is locked. Please sign in first.');
    }

    try {
      // Get encrypted records from Firebase
      const encryptedRecords = await this.repository.getPasswordRecords(this.currentVault.id);

      // Decrypt all records
      const decryptedRecords = await Promise.all(
        encryptedRecords.map(async (encryptedRecord) => {
          try {
            const decryptedData = await this.crypto.decryptRecord(
              encryptedRecord.encryptedData,
              this.currentKey
            );
            return {
              id: encryptedRecord.id,
              ...decryptedData,
              createdAt: encryptedRecord.createdAt,
              updatedAt: encryptedRecord.updatedAt
            };
          } catch (error) {
            console.warn(`Failed to decrypt record ${encryptedRecord.id}:`, error);
            return null; // Skip corrupted records
          }
        })
      );

      // Filter out failed decryptions
      const validRecords = decryptedRecords.filter(record => record !== null);

      console.log(`✅ Retrieved ${validRecords.length} password records`);
      return validRecords;
    } catch (error) {
      console.error('❌ Failed to get password records:', error);
      throw error;
    }
  }

  /**
   * Get a specific password record by ID
   * @param {string} recordId - Record ID
   * @returns {Promise<Object>} Decrypted password record
   */
  async getPasswordRecord(recordId) {
    if (!this.isVaultUnlocked()) {
      throw new Error('Vault is locked. Please sign in first.');
    }

    try {
      // Get encrypted record from Firebase
      const encryptedRecord = await this.repository.getPasswordRecord(recordId);
      if (!encryptedRecord) {
        throw new Error('Password record not found');
      }

      // Verify it belongs to current vault
      if (encryptedRecord.vaultId !== this.currentVault.id) {
        throw new Error('Password record does not belong to current vault');
      }

      // Decrypt the record
      const decryptedData = await this.crypto.decryptRecord(
        encryptedRecord.encryptedData,
        this.currentKey
      );

      return {
        id: encryptedRecord.id,
        ...decryptedData,
        createdAt: encryptedRecord.createdAt,
        updatedAt: encryptedRecord.updatedAt
      };
    } catch (error) {
      console.error('❌ Failed to get password record:', error);
      throw error;
    }
  }

  /**
   * Update a password record
   * @param {string} recordId - Record ID
   * @param {Object} updateData - Updated record data
   * @returns {Promise<void>}
   */
  async updatePasswordRecord(recordId, updateData) {
    if (!this.isVaultUnlocked()) {
      throw new Error('Vault is locked. Please sign in first.');
    }

    try {
      // Get existing record to merge data
      const existingRecord = await this.getPasswordRecord(recordId);
      
      // Merge existing data with updates
      const updatedRecord = {
        ...existingRecord,
        ...updateData,
        updatedAt: new Date().toISOString()
      };

      // Remove metadata fields before encryption
      const { id, createdAt, updatedAt, ...recordData } = updatedRecord;

      // Encrypt the updated record
      const encryptedRecord = await this.crypto.encryptRecord(recordData, this.currentKey);

      // Update in Firebase
      await this.repository.updatePasswordRecord(recordId, encryptedRecord);

      console.log(`✅ Password record updated: ${recordId}`);
    } catch (error) {
      console.error('❌ Failed to update password record:', error);
      throw error;
    }
  }

  /**
   * Delete a password record
   * @param {string} recordId - Record ID
   * @returns {Promise<void>}
   */
  async deletePasswordRecord(recordId) {
    if (!this.isVaultUnlocked()) {
      throw new Error('Vault is locked. Please sign in first.');
    }

    try {
      await this.repository.deletePasswordRecord(recordId);
      console.log(`✅ Password record deleted: ${recordId}`);
    } catch (error) {
      console.error('❌ Failed to delete password record:', error);
      throw error;
    }
  }

  /**
   * Search password records
   * @param {string} searchTerm - Search term
   * @returns {Promise<Array>} Array of matching records
   */
  async searchPasswordRecords(searchTerm) {
    if (!this.isVaultUnlocked()) {
      throw new Error('Vault is locked. Please sign in first.');
    }

    try {
      // Get all records first (since they're encrypted, we need to decrypt to search)
      const allRecords = await this.getPasswordRecords();

      // Filter records based on search term
      const searchTermLower = searchTerm.toLowerCase();
      const matchingRecords = allRecords.filter(record => {
        return (
          record.title?.toLowerCase().includes(searchTermLower) ||
          record.website?.toLowerCase().includes(searchTermLower) ||
          record.username?.toLowerCase().includes(searchTermLower) ||
          record.notes?.toLowerCase().includes(searchTermLower) ||
          record.tags?.some(tag => tag.toLowerCase().includes(searchTermLower))
        );
      });

      console.log(`✅ Found ${matchingRecords.length} matching records`);
      return matchingRecords;
    } catch (error) {
      console.error('❌ Failed to search password records:', error);
      throw error;
    }
  }

  /**
   * Generate a secure password
   * @param {number} length - Password length
   * @param {Object} options - Generation options
   * @returns {string} Generated password
   */
  generatePassword(length = 16, options = {}) {
    return this.crypto.generatePassword(length, options);
  }

  /**
   * Get vault statistics
   * @returns {Promise<Object>} Vault statistics
   */
  async getVaultStats() {
    if (!this.isVaultUnlocked()) {
      throw new Error('Vault is locked. Please sign in first.');
    }

    try {
      const stats = await this.repository.getVaultStats(this.currentVault.id);
      return stats;
    } catch (error) {
      console.error('❌ Failed to get vault statistics:', error);
      throw error;
    }
  }

  /**
   * Export vault data (encrypted)
   * @returns {Promise<Object>} Encrypted vault export
   */
  async exportVault() {
    if (!this.isVaultUnlocked()) {
      throw new Error('Vault is locked. Please sign in first.');
    }

    try {
      const encryptedRecords = await this.repository.getPasswordRecords(this.currentVault.id);
      
      return {
        vault: {
          name: this.currentVault.name,
          description: this.currentVault.description,
          createdAt: this.currentVault.createdAt
        },
        records: encryptedRecords,
        exportedAt: new Date().toISOString(),
        version: '1.0'
      };
    } catch (error) {
      console.error('❌ Failed to export vault:', error);
      throw error;
    }
  }
} 