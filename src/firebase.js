// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCWbnDY6Q3W9Hjqk32dNVrEgJ4wQSdtAWE",
  authDomain: "smartbasketplan.firebaseapp.com",
  projectId: "smartbasketplan",
  storageBucket: "smartbasketplan.appspot.com", // แก้ไขค่านี้
  messagingSenderId: "567515868965",
  appId: "1:567515868965:web:561af0b6bfd0173d25b4cc"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Import and initialize other Firebase services
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";
import { getAnalytics } from "firebase/analytics";

// Initialize services
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);
const analytics = getAnalytics(app);

// Export the services
export { app, db, auth, storage, analytics };