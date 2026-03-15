'use client';

import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { firebaseConfig } from '@/firebase/config';

/**
 * Creates a new user in Firebase Authentication using a secondary app instance.
 * This pattern allows an administrative user to create another account without
 * being signed out of their own session.
 * 
 * @param email The email for the new user.
 * @param password The initial password for the new user.
 * @returns The UID of the newly created user.
 */
export async function adminCreateUser(email: string, password: string): Promise<string> {
  // Generate a unique name for the secondary app instance
  const secondaryAppName = `admin-action-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  
  // Initialize a temporary app
  const secondaryApp = initializeApp(firebaseConfig, secondaryAppName);
  const secondaryAuth = getAuth(secondaryApp);
  
  try {
    // 1. Create the user in Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(secondaryAuth, email, password);
    const uid = userCredential.user.uid;
    
    // 2. Immediately sign out of the secondary app session to keep it clean
    await signOut(secondaryAuth);
    
    // 3. Clean up the temporary app instance
    await deleteApp(secondaryApp);
    
    return uid;
  } catch (error) {
    // Ensure clean up even on failure
    await deleteApp(secondaryApp);
    throw error;
  }
}
