// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
// import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyB6KDFmSc2Vh9C1yv-zdgWLNHtcOJOMY2Y",
  authDomain: "legalai-496b8.firebaseapp.com",
  projectId: "legalai-496b8",
  storageBucket: "legalai-496b8.firebasestorage.app",
  messagingSenderId: "899769528644",
  appId: "1:899769528644:web:7873cfa6e18b253eeda711",
  measurementId: "G-S8J45XGM24"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
// const analytics = getAnalytics(app);