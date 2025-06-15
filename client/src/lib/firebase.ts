import { initializeApp } from "firebase/app";
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "mock-api-key-for-development",
  authDomain: `${import.meta.env.VITE_FIREBASE_PROJECT_ID || "dright-marketplace"}.firebaseapp.com`,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "dright-marketplace",
  storageBucket: `${import.meta.env.VITE_FIREBASE_PROJECT_ID || "dright-marketplace"}.firebasestorage.app`,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:123456789:web:abcdef123456",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Google OAuth provider with YouTube scope
const provider = new GoogleAuthProvider();
provider.addScope('https://www.googleapis.com/auth/youtube.readonly');
provider.addScope('https://www.googleapis.com/auth/youtube.channel-memberships.creator');

export const signInWithGoogle = async () => {
  try {
    console.log('Firebase config check:', {
      hasApiKey: !!import.meta.env.VITE_FIREBASE_API_KEY,
      hasProjectId: !!import.meta.env.VITE_FIREBASE_PROJECT_ID,
      hasAppId: !!import.meta.env.VITE_FIREBASE_APP_ID,
      authDomain: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`
    });
    
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const token = credential?.accessToken;
    
    return {
      user: result.user,
      accessToken: token,
      success: true
    };
  } catch (error: any) {
    console.error('Google sign-in error:', error);
    console.error('Error details:', {
      code: error.code,
      message: error.message,
      customData: error.customData
    });
    
    // Provide specific error guidance
    let userMessage = error.message;
    if (error.code === 'auth/internal-error') {
      userMessage = 'Firebase authentication configuration error. Please check domain authorization in Firebase Console.';
    } else if (error.code === 'auth/unauthorized-domain') {
      userMessage = 'Domain not authorized. Add this domain to Firebase Console > Authentication > Settings > Authorized domains.';
    }
    
    return {
      success: false,
      error: userMessage
    };
  }
};

export const signOutUser = async () => {
  try {
    await signOut(auth);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export { GoogleAuthProvider };