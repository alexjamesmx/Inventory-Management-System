"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Box, Typography } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import { auth, firestore } from "@/firebase";
import {
  doc,
  updateDoc,
  increment,
  deleteDoc,
  collection,
} from "firebase/firestore";

export default function Items({ items, setItems, fetching }) {
  const router = useRouter();
  const [user, setUser] = useState(auth.currentUser);

  const handleAdd = async (item, index) => {
    try {
      console.log("user", user);
      const docRef = doc(firestore, "users", user.uid);
      const itemsRef = collection(docRef, "items");
      const itemRef = doc(itemsRef, item.id);
      await updateDoc(itemRef, { quantity: increment(1) });

      setItems((prevItems) => {
        const newItems = [...prevItems];
        newItems[index].quantity += 1; // Ensure single increment
        return newItems;
      });
    } catch (error) {
      console.error("Error updating quantity:", error);
    }
  };

  const handleRemove = async (item, index) => {
    if (await isQuantityZero(item)) return;

    try {
      const docRef = doc(firestore, "users", user.uid);
      const itemsRef = collection(docRef, "items");
      const itemRef = doc(itemsRef, item.id);
      await updateDoc(itemRef, { quantity: increment(-1) });

      setItems((prevItems) => {
        const newItems = [...prevItems];
        newItems[index].quantity -= 1; // Ensure single decrement
        return newItems;
      });
    } catch (error) {
      console.error("Error updating quantity:", error);
    }
  };

  const isQuantityZero = async (item) => {
    if (item.quantity === 1) {
      try {
        await deleteDoc(doc(firestore, "items", item.id));
        setItems((prevItems) =>
          prevItems.filter((prevItem) => prevItem.id !== item.id)
        );
        return true;
      } catch (error) {
        console.error("Error deleting item:", error);
      }
    }
    return false;
  };

  if (fetching) {
    return (
      <Box
        width="100%"
        height="100px"
        display={"flex"}
        justifyContent={"center"}
        alignItems={"center"}
        bgcolor={"#f0f0f0"}
        position={"relative"}
      >
        <Typography
          variant={"h4"}
          color={"#333"}
          textAlign={"center"}
          fontWeight={"bold"}
        >
          Loading
        </Typography>
      </Box>
    );
  }

  return (
    <>
      {items.length === 0 ? (
        <Box
          width="100%"
          height="100px"
          display={"flex"}
          justifyContent={"center"}
          alignItems={"center"}
          bgcolor={"#f0f0f0"}
          position={"relative"}
        >
          <Typography
            variant={"h4"}
            color={"#333"}
            textAlign={"center"}
            fontWeight={"bold"}
          >
            No items found
          </Typography>
        </Box>
      ) : (
        items.map((item, index) => (
          <Box
            key={item.id}
            width="100%"
            height="100px"
            display={"flex"}
            justifyContent={"center"}
            alignItems={"center"}
            bgcolor={"#f0f0f0"}
            position={"relative"}
          >
            <Typography
              variant={"h4"}
              color={"#333"}
              textAlign={"center"}
              fontWeight={"bold"}
            >
              {item.name}
            </Typography>
            <Box
              display={"flex"}
              justifyContent={"end"}
              alignItems={"center"}
              bgcolor={"#f0f0f0"}
              position={"absolute"}
              right={20}
            >
              <AddIcon
                sx={{
                  color: "green",
                  cursor: "pointer",
                  width: 30,
                  height: 30,
                  transition:
                    "color 0.3s ease, width 0.3s ease, height 0.3s ease",
                  "&:hover": {
                    color: "darkgreen",
                    width: 35,
                    height: 35,
                  },
                }}
                onClick={() => handleAdd(item, index)}
              />
              <Typography
                variant={"h6"}
                color={"#333"}
                textAlign={"center"}
                fontWeight={"bold"}
              >
                {item.quantity}
              </Typography>
              <RemoveIcon
                sx={{
                  color: "red",
                  cursor: "pointer",
                  width: 30,
                  height: 30,
                  transition:
                    "color 0.3s ease, width 0.3s ease, height 0.3s ease",
                  "&:hover": {
                    color: "darkred",
                    width: 35,
                    height: 35,
                  },
                }}
                onClick={() => handleRemove(item, index)}
              />
            </Box>
          </Box>
        ))
      )}
    </>
  );
}
