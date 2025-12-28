import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApp, getApps, initializeApp } from 'firebase/app';
import {
  Auth,
  getAuth,
  getReactNativePersistence,
  initializeAuth,
  onAuthStateChanged,
} from 'firebase/auth';
import {
  connectFirestoreEmulator,
  Firestore,
  getFirestore,
  setLogLevel,
  Timestamp,
} from 'firebase/firestore';
import { fetchAndActivate, getRemoteConfig, RemoteConfig } from 'firebase/remote-config';
import { Platform } from 'react-native';

type FirebaseWebConfig = {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId: string;
};

function getFirebaseConfig(): FirebaseWebConfig {
  const apiKey = process.env.EXPO_PUBLIC_FIREBASE_API_KEY ?? '';
  const authDomain = process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ?? '';
  const projectId = process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ?? '';
  const appId = process.env.EXPO_PUBLIC_FIREBASE_APP_ID ?? '';

  return {
    apiKey,
    authDomain,
    projectId,
    appId,
    storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  };
}

export function isFirebaseConfigured() {
  const cfg = getFirebaseConfig();
  return Boolean(cfg.apiKey && cfg.authDomain && cfg.projectId && cfg.appId);
}

export const firebaseApp = (() => {
  const cfg = getFirebaseConfig();

  if (!getApps().length) {
    console.log('[firebase] initializeApp', {
      hasApiKey: Boolean(cfg.apiKey),
      hasProjectId: Boolean(cfg.projectId),
      platform: Platform.OS,
    });
    return initializeApp(cfg);
  }

  return getApp();
})();

try {
  setLogLevel('error');
} catch (e) {
  console.log('[firebase] setLogLevel failed', e);
}

let _auth: Auth | null = null;

export function getFirebaseAuth(): Auth {
  if (_auth) return _auth;

  try {
    // Try to initialize with persistence
    _auth = initializeAuth(firebaseApp, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
    onAuthStateChanged(_auth, (u) => console.log('[firebase] auth state', { uid: u?.uid ?? null }));
    return _auth;
  } catch (e) {
    console.log('[firebase] initializeAuth fallback -> getAuth', e);
    // Fallback if already initialized (though with single instance logic this shouldn't happen often)
    _auth = getAuth(firebaseApp);
    return _auth;
  }
}

export const firestore: Firestore = getFirestore(firebaseApp);

export const remoteConfig: RemoteConfig = getRemoteConfig(firebaseApp);
remoteConfig.settings.minimumFetchIntervalMillis = 1000 * 60 * 60; // 1 hr default
remoteConfig.defaultConfig = {
  FREE_TIER_LIMIT: 3,
};

// Initial fetch (fire & forget)
fetchAndActivate(remoteConfig).catch((e) =>
  console.log('[firebase] remote config fetch failed', e)
);

export function timestampToMillis(value: unknown): number {
  if (typeof value === 'number') return value;
  if (value instanceof Date) return value.getTime();
  if (value && typeof value === 'object') {
    const maybeTs = value as Partial<Timestamp>;
    if (typeof maybeTs.toMillis === 'function') return maybeTs.toMillis();
    const maybeSeconds = (value as { seconds?: unknown }).seconds;
    if (typeof maybeSeconds === 'number') return maybeSeconds * 1000;
  }
  return Date.now();
}

export function maybeConnectEmulators() {
  if (process.env.EXPO_PUBLIC_USE_FIREBASE_EMULATORS !== '1') return;

  console.log('[firebase] connecting emulators');
  try {
    connectFirestoreEmulator(firestore, 'localhost', 8080);
  } catch (e) {
    console.log('[firebase] connectFirestoreEmulator failed', e);
  }
}
