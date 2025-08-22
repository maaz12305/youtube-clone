import { initializeApp } from "firebase/app";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, User } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCXl-GDZaUXZRS0UrbxjXKcc9WZ8I9ziXQ",
  authDomain: "yt-clone-f4daa.firebaseapp.com",
  projectId: "yt-clone-f4daa",
  appId: "1:249387146915:web:06008f76c3faa111062916",
  measurementId: "G-W89D6V85NQ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

const auth = getAuth(app);

export function signInWithGoogle() {
  const provider = new GoogleAuthProvider();
  return signInWithPopup(auth, provider);
}

export function signOut() {
    return auth.signOut();
}

export function onAuthStateChangedHelper(callback: (user: User | null) => void) {
    return onAuthStateChanged(auth, callback);
}