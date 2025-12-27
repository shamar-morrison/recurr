import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInAnonymously,
  signInWithEmailAndPassword,
  signOut,
  User,
} from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { firestore, getFirebaseAuth, isFirebaseConfigured } from '@/src/lib/firebase';

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
  signInEmail: (email: string, password: string) => Promise<void>;
  signUpEmail: (email: string, password: string) => Promise<void>;
  signOutUser: () => Promise<void>;
  signInWithGoogleMock: () => Promise<void>;
  setReminderDays: (days: number) => Promise<void>;
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
          await setDoc(userRef, {
            createdAt: serverTimestamp(),
            email: u.email ?? null,
            isPremium: false,
            settings: {
              remindDaysBeforeBilling: DEFAULT_SETTINGS.remindDaysBeforeBilling,
              currency: DEFAULT_SETTINGS.currency,
            },
          });
          setIsPremium(false);
          setSettings(DEFAULT_SETTINGS);
        } else {
          const data = snap.data() as unknown as {
            isPremium?: boolean;
            settings?: Partial<UserSettings>;
          };
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

  const signInEmail = useCallback(
    async (email: string, password: string) => {
      console.log('[auth] signInEmail', { email });
      if (!isFirebaseReady) throw new Error('Firebase is not configured');
      const auth = getFirebaseAuth();
      await signInWithEmailAndPassword(auth, email, password);
    },
    [isFirebaseReady]
  );

  const signUpEmail = useCallback(
    async (email: string, password: string) => {
      console.log('[auth] signUpEmail', { email });
      if (!isFirebaseReady) throw new Error('Firebase is not configured');
      const auth = getFirebaseAuth();
      await createUserWithEmailAndPassword(auth, email, password);
    },
    [isFirebaseReady]
  );

  const signOutUser = useCallback(async () => {
    console.log('[auth] signOutUser');
    if (!isFirebaseReady) {
      setUser(null);
      return;
    }
    const auth = getFirebaseAuth();
    await signOut(auth);
  }, [isFirebaseReady]);

  const signInWithGoogleMock = useCallback(async () => {
    console.log('[auth] signInWithGoogleMock -> signInAnonymously');
    if (!isFirebaseReady) throw new Error('Firebase is not configured');
    const auth = getFirebaseAuth();
    await signInAnonymously(auth);
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
      signInEmail,
      signUpEmail,
      signOutUser,
      signInWithGoogleMock,
      setReminderDays,
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
      signInEmail,
      signUpEmail,
      signOutUser,
      signInWithGoogleMock,
      setReminderDays,
      setPremiumMock,
      markOnboardingComplete,
      hasCompletedOnboarding,
    ]
  );
});
