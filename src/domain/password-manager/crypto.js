// Cryptographic utilities for password manager
// Uses Web Crypto API for secure encryption/decryption

export class CryptoManager {
  constructor() {
    this.algorithm = 'AES-GCM';
    this.keyLength = 256;
    this.ivLength = 12; // 96 bits for AES-GCM
    this.saltLength = 16; // 128 bits
    this.tagLength = 16; // 128 bits
  }

  /**
   * Generate a salt for key derivation
   * @returns {Uint8Array} Random salt
   */
  generateSalt() {
    return crypto.getRandomValues(new Uint8Array(this.saltLength));
  }

  /**
   * Generate an initialization vector for encryption
   * @returns {Uint8Array} Random IV
   */
  generateIV() {
    return crypto.getRandomValues(new Uint8Array(this.ivLength));
  }

  /**
   * Derive encryption key from master password using PBKDF2
   * @param {string} masterPassword - The master password
   * @param {Uint8Array} salt - Salt for key derivation
   * @param {number} iterations - Number of iterations (default: 100000)
   * @returns {Promise<CryptoKey>} Derived encryption key
   */
  async deriveKey(masterPassword, salt, iterations = 100000) {
    try {
      // Convert password to key material
      const encoder = new TextEncoder();
      const keyMaterial = await crypto.subtle.importKey(
        'raw',
        encoder.encode(masterPassword),
        'PBKDF2',
        false,
        ['deriveBits', 'deriveKey']
      );

      // Derive key using PBKDF2
      const key = await crypto.subtle.deriveKey(
        {
          name: 'PBKDF2',
          salt: salt,
          iterations: iterations,
          hash: 'SHA-256'
        },
        keyMaterial,
        {
          name: this.algorithm,
          length: this.keyLength
        },
        false, // Key is not extractable
        ['encrypt', 'decrypt']
      );

      return key;
    } catch (error) {
      throw new Error(`Key derivation failed: ${error.message}`);
    }
  }

  /**
   * Encrypt data using AES-GCM
   * @param {string} plaintext - Data to encrypt
   * @param {CryptoKey} key - Encryption key
   * @param {Uint8Array} iv - Initialization vector
   * @returns {Promise<Uint8Array>} Encrypted data
   */
  async encrypt(plaintext, key, iv) {
    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(plaintext);

      const encrypted = await crypto.subtle.encrypt(
        {
          name: this.algorithm,
          iv: iv
        },
        key,
        data
      );

      return new Uint8Array(encrypted);
    } catch (error) {
      throw new Error(`Encryption failed: ${error.message}`);
    }
  }

  /**
   * Decrypt data using AES-GCM
   * @param {Uint8Array} encryptedData - Data to decrypt
   * @param {CryptoKey} key - Decryption key
   * @param {Uint8Array} iv - Initialization vector
   * @returns {Promise<string>} Decrypted plaintext
   */
  async decrypt(encryptedData, key, iv) {
    try {
      const decrypted = await crypto.subtle.decrypt(
        {
          name: this.algorithm,
          iv: iv
        },
        key,
        encryptedData
      );

      const decoder = new TextDecoder();
      return decoder.decode(decrypted);
    } catch (error) {
      throw new Error(`Decryption failed: ${error.message}`);
    }
  }

  /**
   * Encrypt password record
   * @param {Object} record - Password record to encrypt
   * @param {CryptoKey} key - Encryption key
   * @returns {Promise<Object>} Encrypted record with metadata
   */
  async encryptRecord(record, key) {
    try {
      const iv = this.generateIV();
      const plaintext = JSON.stringify(record);
      const encryptedData = await this.encrypt(plaintext, key, iv);

      return {
        data: Array.from(encryptedData), // Convert to array for JSON serialization
        iv: Array.from(iv),
        algorithm: this.algorithm,
        timestamp: Date.now()
      };
    } catch (error) {
      throw new Error(`Record encryption failed: ${error.message}`);
    }
  }

  /**
   * Decrypt password record
   * @param {Object} encryptedRecord - Encrypted record
   * @param {CryptoKey} key - Decryption key
   * @returns {Promise<Object>} Decrypted record
   */
  async decryptRecord(encryptedRecord, key) {
    try {
      const encryptedData = new Uint8Array(encryptedRecord.data);
      const iv = new Uint8Array(encryptedRecord.iv);
      
      const plaintext = await this.decrypt(encryptedData, key, iv);
      return JSON.parse(plaintext);
    } catch (error) {
      throw new Error(`Record decryption failed: ${error.message}`);
    }
  }

  /**
   * Generate a secure random password
   * @param {number} length - Password length
   * @param {Object} options - Password generation options
   * @returns {string} Generated password
   */
  generatePassword(length = 16, options = {}) {
    const {
      includeUppercase = true,
      includeLowercase = true,
      includeNumbers = true,
      includeSymbols = true,
      excludeSimilar = false
    } = options;

    let charset = '';
    if (includeUppercase) charset += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (includeLowercase) charset += 'abcdefghijklmnopqrstuvwxyz';
    if (includeNumbers) charset += '0123456789';
    if (includeSymbols) charset += '!@#$%^&*()_+-=[]{}|;:,.<>?';

    if (excludeSimilar) {
      charset = charset.replace(/[il1Lo0O]/g, '');
    }

    if (charset.length === 0) {
      throw new Error('At least one character type must be included');
    }

    const array = new Uint8Array(length);
    crypto.getRandomValues(array);

    let password = '';
    for (let i = 0; i < length; i++) {
      password += charset[array[i] % charset.length];
    }

    return password;
  }

  /**
   * Convert Uint8Array to base64 string
   * @param {Uint8Array} array
   * @returns {string}
   */
  arrayToBase64(array) {
    return btoa(String.fromCharCode.apply(null, array));
  }

  /**
   * Convert base64 string to Uint8Array
   * @param {string} base64
   * @returns {Uint8Array}
   */
  base64ToArray(base64) {
    return new Uint8Array(atob(base64).split('').map(char => char.charCodeAt(0)));
  }

  /**
   * Hash master password for verification (without salt for simplicity)
   * @param {string} masterPassword
   * @returns {Promise<string>} Hash in hex format
   */
  async hashPassword(masterPassword) {
    const encoder = new TextEncoder();
    const data = encoder.encode(masterPassword);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = new Uint8Array(hashBuffer);
    const hashHex = Array.from(hashArray)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    return hashHex;
  }
} 