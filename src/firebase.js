import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import {
  deleteDoc,
  getDocs,
  getFirestore,
  runTransaction,
} from "firebase/firestore";
import { getDoc, setDoc, doc, collection, addDoc } from "firebase/firestore";
import { getStorage } from "firebase/storage";

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
const storage = getStorage(app);

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
async function itemAlreadyRegistered(user_uid, name) {
  //check if user item name already exists
  try {
    console.log("item name:", name);
    const userDocRef = doc(firestore, "users", user_uid);
    const itemsCollectionRef = collection(userDocRef, "items");
    //iterate
    console.log("checking if item already exists");
    const querySnapshot = await getDocs(itemsCollectionRef);
    let exists = false;
    querySnapshot.forEach((doc) => {
      console.log(doc.data());
      if (doc.data().name === name) {
        console.log("Item already exists");
        exists = true;
      }
    });
    return exists;
  } catch (error) {
    console.error("Error checking if item already exists:", error);
  }
}
async function submitItem(user_uid, item) {
  try {
    const userDocRef = doc(firestore, "users", user_uid);
    const itemsCollectionRef = collection(userDocRef, "items");
    const itemDocRef = doc(itemsCollectionRef, item.name);

    // Use a transaction to ensure atomicity
    await runTransaction(firestore, async (transaction) => {
      transaction.set(itemDocRef, item);
    });
  } catch (error) {
    console.error("Error submitting item:", error);
  }
}

async function deleteItem(user_uid, name) {
  try {
    const userDocRef = doc(firestore, "users", user_uid);
    const itemsCollectionRef = collection(userDocRef, "items");
    const itemDocRef = doc(itemsCollectionRef, name);

    await deleteDoc(itemDocRef);
  } catch (error) {
    console.error("Error deleting item:", error);
  }
}

async function incrementItemQuantity(user_uid, itemName) {
  try {
    console.log("incrementing item quantity: ", itemName, " : ", user_uid);
    const userDocRef = doc(firestore, "users", user_uid);
    const itemsCollectionRef = collection(userDocRef, "items");
    const itemDocRef = doc(itemsCollectionRef, itemName);
    // Use a transaction to ensure that the increment operation is atomic
    await runTransaction(firestore, async (transaction) => {
      const itemDoc = await transaction.get(itemDocRef);
      console.log("itemDoc: ", itemDoc);
      if (itemDoc.exists()) {
        const newQuantity = itemDoc.data().quantity + 1;
        transaction.update(itemDocRef, { quantity: newQuantity });
      } else {
        throw new Error("Item does not exist.");
      }
    });
  } catch (error) {
    console.error("Error incrementing item quantity:", error);
  }
}

async function decreaseItemQuantity(user_uid, name) {
  try {
    const userDocRef = doc(firestore, "users", user_uid);
    const itemsCollectionRef = collection(userDocRef, "items");
    const itemDocRef = doc(itemsCollectionRef, name);

    // Use a transaction to ensure that the decrement operation is atomic
    await runTransaction(firestore, async (transaction) => {
      const itemDoc = await transaction.get(itemDocRef);

      if (itemDoc.exists()) {
        const newQuantity = itemDoc.data().quantity - 1;
        if (newQuantity === 0) {
          transaction.delete(itemDocRef);
        } else {
          transaction.update(itemDocRef, { quantity: newQuantity });
        }
      } else {
        throw new Error("Item does not exist.");
      }
    });
  } catch (error) {
    console.error("Error decrementing item quantity:", error);
  }
}

async function getRecipeLast(user_uid) {
  try {
    const userDocRef = doc(firestore, "users", user_uid);
    const recipeCollectionRef = collection(userDocRef, "recipes");
    const recipeDocRef = doc(recipeCollectionRef, "last");
    const recipeDoc = await getDoc(recipeDocRef);
    if (recipeDoc.exists()) {
      return recipeDoc.data();
    } else {
      return null;
    }
  } catch (error) {
    console.error("Error getting last recipe:", error);
  }
}
export {
  firestore,
  auth,
  userExists,
  registerNewUser,
  getUserInfo,
  storage,
  submitItem,
  deleteItem,
  incrementItemQuantity,
  decreaseItemQuantity,
  itemAlreadyRegistered,
  getRecipeLast,
};
