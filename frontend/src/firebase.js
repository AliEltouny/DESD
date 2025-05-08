// frontend/src/firebase.js
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, FacebookAuthProvider } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyAot16z89V7c4J3qbW2xg9dedtjRiGeM60",
  authDomain: "daesd-49c04.firebaseapp.com",
  projectId: "daesd-49c04",
  storageBucket: "daesd-49c04.firebasestorage.app",
  messagingSenderId: "1090223281051",
  appId: "1:1090223281051:web:f9238a904a45a38f28873e",
  measurementId: "G-3MXHNLNR6R"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

const googleProvider = new GoogleAuthProvider();
const facebookProvider = new FacebookAuthProvider();

export { auth, googleProvider, facebookProvider };
