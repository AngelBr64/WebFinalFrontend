import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBNcP63idcLxrXQoc4AhazMI-ieCr5j-kU",
  authDomain: "web-final-73344.firebaseapp.com",
  projectId: "web-final-73344",
  storageBucket: "web-final-73344.firebasestorage.app",
  messagingSenderId: "428581696341",
  appId: "1:428581696341:web:6c8fbdce9d673c0195b5dc",
  measurementId: "G-PT266YCSMY"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export { auth };