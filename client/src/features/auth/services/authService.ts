import {
  createUserWithEmailAndPassword,
  reload,
  sendEmailVerification,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  type User,
} from 'firebase/auth';
import { auth, googleProvider } from '../firebase';

export function signInWithGoogle() {
  return signInWithPopup(auth, googleProvider);
}

export function signInWithEmail(email: string, password: string) {
  return signInWithEmailAndPassword(auth, email, password);
}

export async function signUpWithEmail(email: string, password: string) {
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  if (credential.user) {
    await sendEmailVerification(credential.user);
  }
  return credential;
}

export function signOutUser() {
  return signOut(auth);
}

export async function resendVerification(user: User) {
  return sendEmailVerification(user);
}

export async function refreshUser(user: User) {
  await reload(user);
  return auth.currentUser;
}

let authReadyPromise: Promise<void> | null = null;

export function ensureAuthReady(): Promise<void> {
  if (!authReadyPromise) {
    authReadyPromise = auth.authStateReady();
  }
  return authReadyPromise;
}

export async function getCurrentUserToken(forceRefresh = false): Promise<string | null> {
  await ensureAuthReady();
  const user = auth.currentUser;
  if (!user) return null;
  return user.getIdToken(forceRefresh);
}
