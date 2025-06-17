import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut } from "firebase/auth";

// Extract the actual project ID from the app ID (format: "1:123456:web:abcdef")
const extractProjectId = (appId: string) => {
  const parts = appId.split(':');
  return parts.length >= 2 ? parts[1] : appId;
};

const actualProjectId = import.meta.env.VITE_FIREBASE_APP_ID ? 
  extractProjectId(import.meta.env.VITE_FIREBASE_APP_ID) : 
  import.meta.env.VITE_FIREBASE_PROJECT_ID;

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: `${actualProjectId}.firebaseapp.com`,
  projectId: actualProjectId,
  storageBucket: `${actualProjectId}.appspot.com`,
  messagingSenderId: actualProjectId,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Initialize Firebase only if not already initialized
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

// Google OAuth provider with YouTube scope
const provider = new GoogleAuthProvider();
provider.addScope('https://www.googleapis.com/auth/youtube.readonly');
provider.addScope('https://www.googleapis.com/auth/youtube.channel-memberships.creator');

export const signInWithGoogle = async () => {
  try {
    console.log('Corrected Firebase config:', {
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY?.substring(0, 10) + '...',
      authDomain: `${actualProjectId}.firebaseapp.com`,
      projectId: actualProjectId,
      appId: import.meta.env.VITE_FIREBASE_APP_ID?.substring(0, 20) + '...',
      currentUrl: window.location.hostname,
      extractedProjectId: actualProjectId
    });
    
    // Check if Firebase is properly initialized
    if (!import.meta.env.VITE_FIREBASE_API_KEY || !import.meta.env.VITE_FIREBASE_APP_ID) {
      throw new Error('Missing Firebase configuration. Please check environment variables.');
    }
    
    // Validate Firebase project setup
    console.log('Testing Firebase Auth state...');
    console.log('Auth domain check:', auth.app.options.authDomain);
    console.log('Current domain:', window.location.hostname);
    
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const token = credential?.accessToken;
    
    console.log('Authentication successful');
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
      customData: error.customData,
      stack: error.stack
    });
    
    // Provide specific error guidance
    let userMessage = error.message;
    if (error.code === 'auth/internal-error') {
      userMessage = 'Firebase internal error - this usually indicates a configuration issue with the Firebase project setup or API restrictions.';
    } else if (error.code === 'auth/unauthorized-domain') {
      userMessage = 'Domain not authorized. Add this domain to Firebase Console > Authentication > Settings > Authorized domains.';
    } else if (error.code === 'auth/popup-blocked') {
      userMessage = 'Popup was blocked by browser. Please allow popups for this site.';
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