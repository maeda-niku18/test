import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBKhb3ctxhr-KT_4z32Iyfjo_tOc7LpImA",
  authDomain: "auth-test-ba58c.firebaseapp.com",
  projectId: "auth-test-ba58c",
  storageBucket: "auth-test-ba58c.firebasestorage.app",
  messagingSenderId: "856692946306",
  appId: "1:856692946306:web:d8cbddf97686f542bd0b9b"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);