"use client";
import {
  Box,
  ButtonBase,
  Stack,
  Typography,
  Button,
  Modal,
  Backdrop,
  Fade,
  TextField,
  IconButton,
  CloseIcon,
  Autocomplete,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import AddAPhotoIcon from "@mui/icons-material/AddAPhoto";
import RemoveIcon from "@mui/icons-material/Remove";
import { firestore } from "@/firebase";
import { collection, getDocs } from "firebase/firestore";
import { Add } from "@/components/Add";
import Items from "@/components/Items";
import { Suspense, useEffect, useState } from "react";
import Toast from "@/components/Toast";
// import { message } from "@/utils/openai.mjs";
import { OpenAI } from "openai";
import { NavbarCustom } from "@/components/Nav";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/firebase";
import { doc } from "firebase/firestore";
import { useItems } from "@/context/itemsContext";

export default function Home() {
  const [user, setUser] = useState(auth.currentUser);
  const [state, setState] = useState(0);
  const { items, setItems } = useItems();
  const [fetching, setFetching] = useState(true);
  const [message, setMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [refresh, setRefresh] = useState(false);

  const router = useRouter();
  const openai = new OpenAI({
    apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
    dangerouslyAllowBrowser: true,
  });

  useEffect(() => {
    onAuthStateChanged(auth, async (user) => {
      if (user) {
        setState(2);
        fetchItems(user).then((items) => setItems(items));
      } else {
        setState(1);
        router.push("/login");
      }
    });
  }, [router, refresh, setItems]);

  async function fetchItems(user) {
    const items = [];
    try {
      const uid = user.uid;
      console.log("uid", uid);

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
      setFetching(false);
    }
    return items;
  }

  const filteredItems = items.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (state === 2) {
    return (
      <>
        <NavbarCustom />
        <Toast />
        <Box
          width="100vw"
          height="100vh"
          display={"flex"}
          justifyContent={"center"}
          alignItems={"center"}
          flexDirection={"column"}
        >
          <Box
            display={"flex"}
            justifyContent={"end"}
            alignItems={"center"}
            width="800px"
            flexDirection={"row"}
            marginBottom={2}
            gap={4}
          >
            <TextField
              type="search"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ marginBottom: 20, width: "300px" }}
            />{" "}
            <Add items={items} setRefresh={setRefresh} />
          </Box>
          <Stack
            width="800px"
            height="500px"
            spacing={2}
            overflow={"auto"}
            border={"2px solid #000"}
            borderRadius={2}
          >
            <Box bgcolor={"#4dccd2"}>
              <Typography
                variant={"h2"}
                color={"#333"}
                textAlign={"center"}
                fontWeight={"bold"}
                padding={2}
              >
                Pantry Inventory
              </Typography>
            </Box>
            <Suspense fallback={<div>Loading...</div>}>
              <Items
                items={filteredItems}
                setItems={setItems}
                fetching={fetching}
              />
            </Suspense>
          </Stack>
        </Box>
      </>
    );
  }
}
