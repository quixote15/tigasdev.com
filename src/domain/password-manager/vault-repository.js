// Firebase repository for password vault operations
import { db } from '../../lib/firebase';
import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy,
  serverTimestamp 
} from 'firebase/firestore';

export class VaultRepository {
  constructor() {
    this.vaultsCollection = 'password_vaults';
    this.recordsCollection = 'password_records';
  }

  /**
   * Create a new password vault
   * @param {Object} vaultData - Vault data
   * @returns {Promise<string>} Vault ID
   */
  async createVault(vaultData) {
    try {
      const vault = {
        name: vaultData.name,
        description: vaultData.description || '',
        email: vaultData.email,
        masterPasswordHash: vaultData.masterPasswordHash,
        salt: vaultData.salt, // For key derivation
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        isActive: true
      };

      const docRef = await addDoc(collection(db, this.vaultsCollection), vault);
      return docRef.id;
    } catch (error) {
      throw new Error(`Failed to create vault: ${error.message}`);
    }
  }

  /**
   * Get vault by email
   * @param {string} email - Vault email
   * @returns {Promise<Object|null>} Vault data
   */
  async getVaultByEmail(email) {
    try {
      const q = query(
        collection(db, this.vaultsCollection),
        where('email', '==', email),
        where('isActive', '==', true)
      );
      
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        return null;
      }

      const doc = querySnapshot.docs[0];
      return {
        id: doc.id,
        ...doc.data()
      };
    } catch (error) {
      throw new Error(`Failed to get vault: ${error.message}`);
    }
  }

  /**
   * Get vault by ID
   * @param {string} vaultId - Vault ID
   * @returns {Promise<Object|null>} Vault data
   */
  async getVaultById(vaultId) {
    try {
      const docRef = doc(db, this.vaultsCollection, vaultId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data()
        };
      } else {
        return null;
      }
    } catch (error) {
      throw new Error(`Failed to get vault: ${error.message}`);
    }
  }

  /**
   * Update vault
   * @param {string} vaultId - Vault ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<void>}
   */
  async updateVault(vaultId, updateData) {
    try {
      const docRef = doc(db, this.vaultsCollection, vaultId);
      await updateDoc(docRef, {
        ...updateData,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      throw new Error(`Failed to update vault: ${error.message}`);
    }
  }

  /**
   * Add password record to vault
   * @param {string} vaultId - Vault ID
   * @param {Object} encryptedRecord - Encrypted password record
   * @returns {Promise<string>} Record ID
   */
  async addPasswordRecord(vaultId, encryptedRecord) {
    try {
      const record = {
        vaultId: vaultId,
        encryptedData: encryptedRecord,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        isActive: true
      };

      const docRef = await addDoc(collection(db, this.recordsCollection), record);
      return docRef.id;
    } catch (error) {
      throw new Error(`Failed to add password record: ${error.message}`);
    }
  }

  /**
   * Get all password records for a vault
   * @param {string} vaultId - Vault ID
   * @returns {Promise<Array>} Array of password records
   */
  async getPasswordRecords(vaultId) {
    try {
      const q = query(
        collection(db, this.recordsCollection),
        where('vaultId', '==', vaultId),
        where('isActive', '==', true),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const records = [];
      
      querySnapshot.forEach((doc) => {
        records.push({
          id: doc.id,
          ...doc.data()
        });
      });

      return records;
    } catch (error) {
      throw new Error(`Failed to get password records: ${error.message}`);
    }
  }

  /**
   * Get password record by ID
   * @param {string} recordId - Record ID
   * @returns {Promise<Object|null>} Password record
   */
  async getPasswordRecord(recordId) {
    try {
      const docRef = doc(db, this.recordsCollection, recordId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data()
        };
      } else {
        return null;
      }
    } catch (error) {
      throw new Error(`Failed to get password record: ${error.message}`);
    }
  }

  /**
   * Update password record
   * @param {string} recordId - Record ID
   * @param {Object} encryptedRecord - Updated encrypted record
   * @returns {Promise<void>}
   */
  async updatePasswordRecord(recordId, encryptedRecord) {
    try {
      const docRef = doc(db, this.recordsCollection, recordId);
      await updateDoc(docRef, {
        encryptedData: encryptedRecord,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      throw new Error(`Failed to update password record: ${error.message}`);
    }
  }

  /**
   * Delete password record (soft delete)
   * @param {string} recordId - Record ID
   * @returns {Promise<void>}
   */
  async deletePasswordRecord(recordId) {
    try {
      const docRef = doc(db, this.recordsCollection, recordId);
      await updateDoc(docRef, {
        isActive: false,
        deletedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      throw new Error(`Failed to delete password record: ${error.message}`);
    }
  }

  /**
   * Search password records by title or website
   * @param {string} vaultId - Vault ID
   * @param {string} searchTerm - Search term
   * @returns {Promise<Array>} Array of matching records
   */
  async searchPasswordRecords(vaultId, searchTerm) {
    try {
      // Note: This is a basic implementation. For better search,
      // consider using Algolia or implementing client-side filtering
      // after decryption
      const records = await this.getPasswordRecords(vaultId);
      
      // This would need to be done after decryption in the service layer
      return records;
    } catch (error) {
      throw new Error(`Failed to search password records: ${error.message}`);
    }
  }

  /**
   * Get vault statistics
   * @param {string} vaultId - Vault ID
   * @returns {Promise<Object>} Vault statistics
   */
  async getVaultStats(vaultId) {
    try {
      const records = await this.getPasswordRecords(vaultId);
      
      return {
        totalRecords: records.length,
        lastUpdated: records.length > 0 ? records[0].updatedAt : null
      };
    } catch (error) {
      throw new Error(`Failed to get vault statistics: ${error.message}`);
    }
  }

  /**
   * Check if email is already used for a vault
   * @param {string} email - Email to check
   * @returns {Promise<boolean>} True if email exists
   */
  async emailExists(email) {
    try {
      const vault = await this.getVaultByEmail(email);
      return vault !== null;
    } catch (error) {
      throw new Error(`Failed to check email existence: ${error.message}`);
    }
  }
} 