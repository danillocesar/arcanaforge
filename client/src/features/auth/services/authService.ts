import {
  createUserWithEmailAndPassword,
  getRedirectResult,
  reload,
  sendEmailVerification,
  signInWithEmailAndPassword,
  signInWithRedirect,
  signOut,
  type User,
  type UserCredential,
} from 'firebase/auth';
import { auth, googleProvider } from '../firebase';

/** Redireciona para o Google (sem popup). Evita COOP/window.closed e erros em alguns browsers. */
export function signInWithGoogle(): Promise<void> {
  return signInWithRedirect(auth, googleProvider);
}

export function getGoogleRedirectResult(): Promise<UserCredential | null> {
  return getRedirectResult(auth);
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

export async function getCurrentUserToken() {
  const user = auth.currentUser;
  if (!user) return null;
  return user.getIdToken();
}
