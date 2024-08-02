"use client";
import { useRef, useState } from "react";
import { Box, Button, Input, Typography } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import { Image } from "@mui/icons-material";
import {
  auth,
  decreaseItemQuantity,
  deleteItem,
  firestore,
  incrementItemQuantity,
  storage,
} from "@/firebase";
import { useItems } from "@/context/itemsContext";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"; // Import required methods
import { doc, collection, updateDoc } from "firebase/firestore";
import PendingIcon from "@mui/icons-material/Pending";
export default function Items() {
  const { setItems, filteredItems: items, fetching } = useItems();
  const [user, setUser] = useState(auth.currentUser);
  const [loading, setLoading] = useState(false);
  const fileInput = useRef(null);
  const [editImageLoading, setEditImageLoading] = useState(false);

  const handleAdd = async (item, index) => {
    try {
      setLoading(true);
      await incrementItemQuantity(user.uid, item.name);
      setItems((prevItems) => {
        const newItems = [...prevItems];
        newItems[index].quantity += 1; // Ensure single increment
        return newItems;
      });
    } catch (error) {
      console.error("Error updating quantity:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (item, index) => {
    if (await isQuantityZero(item)) return;
    setLoading(true);
    try {
      await decreaseItemQuantity(user.uid, item.name);
      setItems((prevItems) => {
        const newItems = [...prevItems];
        newItems[index].quantity -= 1; // Ensure single decrement
        return newItems;
      });
    } catch (error) {
      console.error("Error updating quantity:", error);
    } finally {
      setLoading(false);
    }
  };

  const isQuantityZero = async (item) => {
    if (item.quantity <= 1) {
      setLoading(true);
      try {
        await deleteItem(user.uid, item.name);
        setItems((prevItems) => {
          const newItems = prevItems.filter((i) => i.name !== item.name);
          return newItems;
        });
        return true;
      } catch (error) {
        console.error("Error deleting item:", error);
      } finally {
        setLoading(false);
      }
    }
    return false;
  };

  const editAddImage = (index) => {
    setItems((prevItems) => {
      const newItems = [...prevItems];
      newItems[index].isEditing = true;
      return newItems;
    });
  };

  const handleFileChange = async (e, item, index) => {
    const file = e.target.files[0];
    if (!file) return;

    setEditImageLoading(true);
    const storageRef = ref(storage, `images/${user.uid}/${item.name}`);
    try {
      const uploadTask = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);

      const userDocRef = doc(firestore, "users", user.uid);
      const itemsCollectionRef = collection(userDocRef, "items");
      const itemDocRef = doc(itemsCollectionRef, item.name);

      await updateDoc(itemDocRef, { image: downloadURL });
      setItems((prevItems) => {
        const newItems = [...prevItems];
        const itemIndex = newItems.findIndex((i) => i.name === item.name);
        if (itemIndex > -1) {
          newItems[itemIndex].image = downloadURL;
          newItems[itemIndex].isEditing = false;
        }
        return newItems;
      });
    } catch (error) {
      console.error("Error uploading image:", error);
    } finally {
      setEditImageLoading(false);
    }
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
        overflow={"auto"}
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
            key={item.name}
            width="100%"
            height="100px"
            display={"flex"}
            justifyContent={"space-between"}
            alignItems={"center"}
            bgcolor={"#f0f0f0"}
            position={"relative"}
            paddingInline={2}
            marginBottom={2}
          >
            <Typography
              variant={"h4"}
              color={"#333"}
              textAlign={"center"}
              fontWeight={"bold"}
            >
              {item.name}
            </Typography>
            {item.image ? (
              <img
                src={item.image}
                alt={item.name}
                width={100}
                height={100}
                style={{ objectFit: "cover", position: "relative", right: 120 }}
                onClick={() => {
                  window.open(item.image, "_blank");
                }}
              />
            ) : (
              <>
                {editImageLoading ? (
                  <>
                    <PendingIcon
                      sx={{
                        color: "orange",
                        width: 30,
                        height: 30,
                        position: "relative",
                        right: 120,
                      }}
                    />
                  </>
                ) : (
                  <>
                    {item.isEditing ? (
                      <Input
                        type="file"
                        ref={fileInput}
                        accept="image/png, image/jpeg, image/jpg"
                        onChange={(e) => handleFileChange(e, item, index)}
                      />
                    ) : (
                      <Image
                        style={{
                          position: "relative",
                          right: 120,
                          cursor: "pointer",
                          borderRadius: 50,
                          backgroundColor: "white",
                          padding: 5,
                        }}
                        sx={{
                          width: 25,
                          height: 25,
                          "&:hover": {
                            color: "darkgreen",
                            width: 45,
                            height: 45,
                          },
                          transition:
                            "color 0.3s ease, width 0.3s ease, height 0.3s ease",
                        }}
                        color="primary"
                        onClick={() => editAddImage(index)}
                        alt="Add Image"
                      />
                      // <Button
                      //   variant="contained"
                      //   color="primary"
                      //   style={{ position: "relative", right: 120 }}
                      //   endIcon={<Image />}
                      //   onClick={() => editAddImage(index)}
                      // ></Button>
                    )}
                  </>
                )}
              </>
            )}

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
                onClick={() => {
                  if (loading) return;
                  handleAdd(item, index);
                }}
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
                onClick={() => {
                  if (loading) return;
                  handleRemove(item, index);
                }}
              />
            </Box>
          </Box>
        ))
      )}
    </>
  );
}
