// Script to initialize Firestore collections for the password manager
// Run this once to create the collections

import { db } from '../lib/firebase.js';
import { collection, addDoc, deleteDoc, doc } from 'firebase/firestore';

async function initializeFirestore() {
  try {
    console.log('🔄 Initializing Firestore collections...');

    // Create a temporary document in password_vaults collection
    const vaultsCollection = collection(db, 'password_vaults');
    const tempVaultDoc = await addDoc(vaultsCollection, {
      temp: true,
      createdAt: new Date()
    });
    console.log('✅ Created password_vaults collection');

    // Create a temporary document in password_records collection
    const recordsCollection = collection(db, 'password_records');
    const tempRecordDoc = await addDoc(recordsCollection, {
      temp: true,
      createdAt: new Date()
    });
    console.log('✅ Created password_records collection');

    // Delete the temporary documents
    await deleteDoc(tempVaultDoc);
    await deleteDoc(tempRecordDoc);
    console.log('✅ Cleaned up temporary documents');

    console.log('🎉 Firestore collections initialized successfully!');
  } catch (error) {
    console.error('❌ Failed to initialize Firestore:', error);
  }
}

// Export for use in browser console or Node.js
if (typeof window !== 'undefined') {
  window.initializeFirestore = initializeFirestore;
} else {
  // Node.js environment
  initializeFirestore();
} 