"use client";
import { auth, firestore } from "@/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, doc, getDocs } from "firebase/firestore";
import { createContext, useContext, useEffect, useState } from "react";

export const ItemsContext = createContext();

export const ItemsProvider = ({ children }) => {
  const [items, setItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [fetching, setFetching] = useState(true);
  const [refresh, setRefresh] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [user, setUser] = useState(auth.currentUser);

  async function fetchItems(user) {
    console.log("Fetching items...");
    const items = [];
    try {
      const uid = user.uid;

      // Reference to the items sub-collection within the user's document
      const userDocRef = doc(firestore, "users", uid);
      const itemsCollectionRef = collection(userDocRef, "items");

      // Fetching the documents in the items collection
      const querySnapshot = await getDocs(itemsCollectionRef);
      querySnapshot.forEach((doc) => {
        items.push({ id: doc.id, ...doc.data() });
      });
    } catch (error) {
      console.error("Error fetching items:", error);
    } finally {
      console.log("Done fetching items ", items);
      setFetching(false);
    }
    return items;
  }

  useEffect(() => {
    onAuthStateChanged(auth, async (user) => {
      if (user) {
        fetchItems(user).then((fetchedItems) => setItems(fetchedItems));
        setUser(user);
      }
    });
    // Fetch items whenever refresh is toggled or user changes
  }, [refresh]); // Only depend on refresh and user

  useEffect(() => {
    // Filter items whenever items or searchQuery changes

    if (searchQuery === "") return setFilteredItems(items);
    setFilteredItems(
      items.filter((item) =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    );
  }, [items, searchQuery]);

  console.log("Whats going ong ");

  return (
    <ItemsContext.Provider
      value={{
        fetching,
        items,
        setItems,
        refresh,
        setRefresh,
        filteredItems,
        searchQuery,
        setSearchQuery,
      }}
    >
      {children}
    </ItemsContext.Provider>
  );
};

export const useItems = () => {
  return useContext(ItemsContext);
};
