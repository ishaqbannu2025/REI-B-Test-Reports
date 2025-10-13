'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore'

// IMPORTANT: DO NOT MODIFY THIS FUNCTION
export function initializeFirebase() {
  if (!getApps().length) {
    // During development, always use the firebaseConfig object.
    // In production, Firebase App Hosting integrates with initializeApp()
    // to provide the necessary environment variables.
    if (process.env.NODE_ENV === 'development') {
      return getSdks(initializeApp(firebaseConfig));
    }

    // In production, attempt to initialize without arguments first.
    let firebaseApp;
    try {
      firebaseApp = initializeApp();
    } catch (e) {
      console.warn('Automatic Firebase initialization failed, falling back to config object.', e);
      firebaseApp = initializeApp(firebaseConfig);
    }
    return getSdks(firebaseApp);
  }

  // If already initialized, return the SDKs with the already initialized App
  return getSdks(getApp());
}

export function getSdks(firebaseApp: FirebaseApp) {
  return {
    firebaseApp,
    auth: getAuth(firebaseApp),
    firestore: getFirestore(firebaseApp)
  };
}

export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './non-blocking-updates';
export * from './non-blocking-login';
export * from './errors';
export * from './error-emitter';
