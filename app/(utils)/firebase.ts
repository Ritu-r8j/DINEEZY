import { initializeApp } from "firebase/app";

import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged, User } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { sendNotification } from "./notification";

const firebaseConfig = {
  apiKey: "AIzaSyAuHIaVqXaacq9ZbpN8IBaDtg7m6yPFpZc",
  authDomain: "restro-qr-2dce4.firebaseapp.com",
  projectId: "restro-qr-2dce4",
  storageBucket: "restro-qr-2dce4.firebasestorage.app",
  messagingSenderId: "155780978938",
  appId: "1:155780978938:web:2309569d729a33c4101143",
  measurementId: "G-HLTC0VXB27"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);

export const db = getFirestore(app);

export const googleProvider = new GoogleAuthProvider();

export const signInWithEmail = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return { success: true, user: userCredential.user };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const signUpWithEmail = async (email: string, password: string) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    
    return { success: true, user: userCredential.user };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    await sendNotification("WELCOME_LOGIN", result?.user?.phoneNumber || "", { name: result.user.displayName || "" });
    return { success: true, user: result.user };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const logout = async () => {
  try {
    await signOut(auth);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const onAuthStateChange = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

export const confirmPasswordReset = ()=>{
  
}

export default app;