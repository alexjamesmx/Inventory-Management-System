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
async function fetchItems() {
  const items = [];
  try {
    const querySnapshot = await getDocs(collection(firestore, "items"));
    querySnapshot.forEach((doc) => {
      items.push({ id: doc.id, ...doc.data() });
    });
  } catch (error) {
    console.error("Error fetching items:", error);
  }
  return items;
}

export default function Home() {
  const [items, setItems] = useState([]);
  const [message, setMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const openai = new OpenAI({
    apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
    dangerouslyAllowBrowser: true,
  });

  useEffect(() => {
    fetchItems().then((items) => setItems(items));
    // getMessage(process.env.NEXT_PUBLIC_OPENAI_API_KEY);
  }, []);

  async function getMessage() {
    const response = await openai.chat.completions.create({
      model: "gpt-4-vision-preview",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Describe this image",
            },
            {
              type: "iamge_url",
              image_url: {
                url: "https://th.bing.com/th/id/OIP.hF8_3tDhRrZvxm-j1kZwgwHaE9?rs=1&pid=ImgDetMain",
                detail: "low",
              },
            },
          ],
        },
      ],
    });
    return response.choices[0];
  }

  const filteredItems = items.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
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
          <Add items={items} />
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
            <Items items={filteredItems} setItems={setItems} />
          </Suspense>
        </Stack>
      </Box>
    </>
  );
}
