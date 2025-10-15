import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyDzVMOpzaKPRDEF1lFN2qj27SCa4XRATp0",
    authDomain: "carecircle-demo-24f83.firebaseapp.com",
    projectId: "carecircle-demo-24f83",
    storageBucket: "carecircle-demo-24f83.firebasestorage.app",
    messagingSenderId: "448779653369",
    appId: "1:448779653369:web:60e0267e4ad783edb19228",
    measurementId: "G-3FEHD24CYL"
  };

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
