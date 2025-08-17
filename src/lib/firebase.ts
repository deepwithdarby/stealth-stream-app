import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, User } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyAQ4sTdy1dC4IyMJFC9Yz3bVEBSEU_sbHI",
  authDomain: "messaging-website-8cee3.firebaseapp.com",
  databaseURL: "https://messaging-website-8cee3-default-rtdb.firebaseio.com",
  projectId: "messaging-website-8cee3",
  storageBucket: "messaging-website-8cee3.firebasestorage.app",
  messagingSenderId: "1017918066104",
  appId: "1:1017918066104:web:823f87c4b2c3d4929ed34d",
  measurementId: "G-Q07MV0TB0H"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Google Auth Provider
const googleProvider = new GoogleAuthProvider();

export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return { user: result.user, error: null };
  } catch (error: any) {
    return { user: null, error: error.message };
  }
};

export const signOutUser = async () => {
  try {
    await signOut(auth);
    return { error: null };
  } catch (error: any) {
    return { error: error.message };
  }
};

export const onAuthStateChange = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};