import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getDoc, setDoc, doc, collection } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};
const app = initializeApp(firebaseConfig);
const firestore = getFirestore(app);
const auth = getAuth(app);

async function userExists(uid) {
  const docRef = doc(firestore, "users", uid);
  const res = await getDoc(docRef);
  return res.exists();
}

async function registerNewUser(user) {
  try {
    const collectionRef = collection(firestore, "users");
    const docRef = doc(collectionRef, user.uid);
    await setDoc(docRef, user);
  } catch (error) {}
}

async function getUserInfo(uid) {
  try {
    const docRef = doc(firestore, "users", uid);
    const document = await getDoc(docRef);
    return document.data();
  } catch (error) {
    console.error(error);
  }
}

export { firestore, auth, userExists, registerNewUser, getUserInfo };
