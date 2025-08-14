// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from 'firebase/firestore';
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyC3Yj4cXWTsSq9qWJFDjPeOTi1UfxVYCWI",
  authDomain: "pusaka-3525c.firebaseapp.com",
  projectId: "pusaka-3525c",
  storageBucket: "pusaka-3525c.firebasestorage.app",
  messagingSenderId: "701527694209",
  appId: "1:701527694209:web:58f951a2100e5bc5486680",
  measurementId: "G-CXPCW5GXW9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);
export const auth = getAuth(app);

export { db };