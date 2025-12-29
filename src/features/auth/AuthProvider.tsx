import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithCredential,
  signOut,
  User,
} from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert } from 'react-native';
import { GoogleAuth } from 'react-native-google-auth';

import { CURRENCIES } from '@/src/constants/currencies';
import { firestore, getFirebaseAuth, isFirebaseConfigured } from '@/src/lib/firebase';
import { getFirestoreErrorMessage } from '@/src/lib/firestore';

// Web Client ID from google-services.json (client_type: 3)
const WEB_CLIENT_ID = '845079285876-u5aeaifg6nsqa3jkjtit099tfarmdvps.apps.googleusercontent.com';

export type UserSettings = {
  remindDaysBeforeBilling: number;
  currency: string;
};

export type PlanStatus = {
  isPremium: boolean;
  updatedAt?: number;
};

export type AuthState = {
  user: User | null;
  isReady: boolean;
  isFirebaseReady: boolean;
  isPremium: boolean;
  settings: UserSettings;
  signOutUser: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  setReminderDays: (days: number) => Promise<void>;
  setCurrency: (currency: string) => Promise<void>;
  setPremiumMock: (value: boolean) => Promise<void>;
  markOnboardingComplete: () => Promise<void>;
  hasCompletedOnboarding: boolean;
};

const DEFAULT_SETTINGS: UserSettings = {
  remindDaysBeforeBilling: 3,
  currency: 'USD',
};

const ONBOARDING_KEY = 'onboardingComplete:v1';

export const [AuthProvider, useAuth] = createContextHook<AuthState>(() => {
  const [user, setUser] = useState<User | null>(null);
  const [isReady, setIsReady] = useState<boolean>(false);
  const [isPremium, setIsPremium] = useState<boolean>(false);
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState<boolean>(false);

  const isFirebaseReady = isFirebaseConfigured();

  useEffect(() => {
    let cancelled = false;

    const loadLocal = async () => {
      try {
        const onboarding = await AsyncStorage.getItem(ONBOARDING_KEY);
        if (!cancelled) setHasCompletedOnboarding(onboarding === '1');
      } catch (e) {
        console.log('[auth] loadLocal failed', e);
      }
    };

    loadLocal();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!isFirebaseReady) {
      console.log('[auth] Firebase not configured; app will run in limited mode');
      setIsReady(true);
      return;
    }

    const auth = getFirebaseAuth();

    const unsub = onAuthStateChanged(auth, async (u) => {
      console.log('[auth] onAuthStateChanged', { uid: u?.uid ?? null });
      setUser(u);

      if (!u) {
        setIsPremium(false);
        setSettings(DEFAULT_SETTINGS);
        setIsReady(true);
        return;
      }

      try {
        const userRef = doc(firestore, 'users', u.uid);
        const snap = await getDoc(userRef);

        if (!snap.exists()) {
          // Determine auth provider from user's providerData
          const authProvider =
            u.providerData[0]?.providerId === 'google.com'
              ? 'google'
              : u.providerData[0]?.providerId === 'apple.com'
                ? 'apple'
                : u.isAnonymous
                  ? 'anonymous'
                  : 'unknown';

          await setDoc(userRef, {
            createdAt: serverTimestamp(),
            email: u.email ?? null,
            displayName: u.displayName ?? null,
            photoURL: u.photoURL ?? null,
            isPremium: false,
            settings: {
              remindDaysBeforeBilling: DEFAULT_SETTINGS.remindDaysBeforeBilling,
              currency: DEFAULT_SETTINGS.currency,
            },
            authProvider,
          });
          setIsPremium(false);
          setSettings(DEFAULT_SETTINGS);
        } else {
          const data = snap.data() as {
            isPremium?: boolean;
            settings?: Partial<UserSettings>;
            displayName?: string;
            photoURL?: string;
            email?: string;
          };

          // Update profile data if it has changed (e.g., user updated their Google profile)
          const updates: Record<string, unknown> = {};
          if (u.displayName && data.displayName !== u.displayName) {
            updates.displayName = u.displayName;
          }
          if (u.photoURL && data.photoURL !== u.photoURL) {
            updates.photoURL = u.photoURL;
          }
          if (u.email && data.email !== u.email) {
            updates.email = u.email;
          }
          if (Object.keys(updates).length > 0) {
            await updateDoc(userRef, updates);
          }

          setIsPremium(Boolean(data.isPremium));
          setSettings({
            remindDaysBeforeBilling:
              data.settings?.remindDaysBeforeBilling ?? DEFAULT_SETTINGS.remindDaysBeforeBilling,
            currency: data.settings?.currency ?? DEFAULT_SETTINGS.currency,
          });
        }
      } catch (e) {
        console.log('[auth] failed to hydrate user doc', e);
      } finally {
        setIsReady(true);
      }
    });

    return () => unsub();
  }, [isFirebaseReady]);

  useEffect(() => {
    GoogleAuth.configure({
      androidClientId: WEB_CLIENT_ID,
      offlineAccess: false,
    });
  }, []);

  const signInWithGoogle = useCallback(async () => {
    console.log('[auth] signInWithGoogle');
    if (!isFirebaseReady) throw new Error('Firebase is not configured');

    try {
      // Sign in with Google - uses response.type pattern per library API
      const response = await GoogleAuth.signIn();

      if (response.type === 'cancelled') {
        // User cancelled the sign-in flow - don't show alert, just return
        console.log('[auth] Google Sign-In cancelled by user');
        return;
      }

      if (response.type === 'noSavedCredentialFound') {
        // No saved credential found - this shouldn't happen with interactive sign-in
        // but handle it gracefully
        console.log('[auth] No saved Google credential found');
        Alert.alert('Sign-in Error', 'No Google account found. Please try again.');
        return;
      }

      const { idToken } = response.data;

      if (!idToken) {
        throw new Error('No ID token received from Google');
      }

      // Create Firebase credential
      const credential = GoogleAuthProvider.credential(idToken);

      // Sign in to Firebase with the credential
      const auth = getFirebaseAuth();
      await signInWithCredential(auth, credential);

      // The onAuthStateChanged listener will handle setting the user state and creating/updating the user document
    } catch (error: unknown) {
      console.error('[auth] Google Sign-In Error:', error);

      // Handle specific error cases
      const errorCode = (error as { code?: string })?.code;
      const errorMessage = (error as { message?: string })?.message || '';

      if (errorCode === 'IN_PROGRESS' || errorMessage.includes('in progress')) {
        Alert.alert('Sign-in in progress', 'Please wait for the current sign-in to complete.');
      } else if (
        errorCode === 'PLAY_SERVICES_NOT_AVAILABLE' ||
        errorMessage.includes('Play Services')
      ) {
        Alert.alert(
          'Google Play Services',
          'Google Play Services is not available on this device.'
        );
      } else {
        Alert.alert('Sign-in Error', 'Failed to sign in with Google. Please try again.');
      }

      throw error;
    }
  }, [isFirebaseReady]);

  const signOutUser = useCallback(async () => {
    console.log('[auth] signOutUser');
    if (!isFirebaseReady) {
      setUser(null);
      return;
    }
    try {
      const auth = getFirebaseAuth();
      const currentUser = auth.currentUser;

      // Check if user signed in with Google
      const isGoogleUser = currentUser?.providerData.some(
        (provider) => provider.providerId === 'google.com'
      );

      if (isGoogleUser) {
        // Sign out from Google
        try {
          await GoogleAuth.signOut();
        } catch (e) {
          console.log('[auth] GoogleAuth.signOut failed (may not be signed in):', e);
        }
      }

      // Sign out from Firebase
      await signOut(auth);
    } catch (e) {
      throw new Error(getFirestoreErrorMessage(e));
    }
  }, [isFirebaseReady]);

  const setReminderDays = useCallback(
    async (days: number) => {
      const safeDays = Math.max(0, Math.min(14, Math.round(days)));
      setSettings((prev) => ({ ...prev, remindDaysBeforeBilling: safeDays }));

      if (!isFirebaseReady || !user) return;

      try {
        const userRef = doc(firestore, 'users', user.uid);
        await updateDoc(userRef, {
          'settings.remindDaysBeforeBilling': safeDays,
        });
      } catch (e) {
        console.log('[auth] setReminderDays update failed', e);
      }
    },
    [isFirebaseReady, user]
  );

  const setCurrency = useCallback(
    async (currency: string) => {
      // Validate currency is a valid ISO-4217 code from our allowed list
      const isValidCurrency = CURRENCIES.some((c) => c.code === currency);
      if (!isValidCurrency) {
        console.warn(
          `[auth] setCurrency: invalid currency code "${currency}". Must be a valid ISO-4217 code.`
        );
        return;
      }

      try {
        setSettings((prev) => ({ ...prev, currency }));

        if (!isFirebaseReady || !user) return;

        const userRef = doc(firestore, 'users', user.uid);
        await updateDoc(userRef, {
          'settings.currency': currency,
        });
      } catch (e) {
        console.log('[auth] setCurrency update failed', e);
      }
    },
    [isFirebaseReady, user]
  );

  const setPremiumMock = useCallback(
    async (value: boolean) => {
      console.log('[auth] setPremiumMock', { value });
      setIsPremium(value);
      if (!isFirebaseReady || !user) return;

      try {
        const userRef = doc(firestore, 'users', user.uid);
        await updateDoc(userRef, {
          isPremium: value,
          premiumUpdatedAt: serverTimestamp(),
        });
      } catch (e) {
        console.log('[auth] setPremiumMock update failed', e);
      }
    },
    [isFirebaseReady, user]
  );

  const markOnboardingComplete = useCallback(async () => {
    setHasCompletedOnboarding(true);
    try {
      await AsyncStorage.setItem(ONBOARDING_KEY, '1');
    } catch (e) {
      console.log('[auth] markOnboardingComplete failed', e);
    }
  }, []);

  return useMemo(
    () => ({
      user,
      isReady,
      isFirebaseReady,
      isPremium,
      settings,
      signOutUser,
      signInWithGoogle,
      setReminderDays,
      setCurrency,
      setPremiumMock,
      markOnboardingComplete,
      hasCompletedOnboarding,
    }),
    [
      user,
      isReady,
      isFirebaseReady,
      isPremium,
      settings,
      signOutUser,
      signInWithGoogle,
      setReminderDays,
      setCurrency,
      setPremiumMock,
      markOnboardingComplete,
      hasCompletedOnboarding,
    ]
  );
});
