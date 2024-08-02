"use client";
import { Box, Stack, Typography, TextField } from "@mui/material";
import { Add } from "@/components/Add";
import Items from "@/components/Items";
import { Suspense, useEffect, useState } from "react";
import Toast from "@/components/Toast";
import { NavbarCustom } from "@/components/Nav";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/firebase";
import { useItems } from "@/context/itemsContext";

export default function Home() {
  const [state, setState] = useState(0);
  const { items, setItems, fetching, setSearchQuery, searchQuery } = useItems();

  const router = useRouter();
  useEffect(() => {
    onAuthStateChanged(auth, async (user) => {
      if (user) {
        setState(2);
      } else {
        setState(1);
        router.push("/login");
      }
    });
  }, [router]);

  if (state === 2) {
    return (
      <>
        <NavbarCustom />
        <Toast />
        <Box
          width="100vw"
          height="100vh"
          display={"flex"}
          alignItems={"center"}
          flexDirection={"column"}
          marginTop={8}
        >
          <Box
            display={"flex"}
            justifyContent={"space-between"}
            width="800px"
            flexDirection={"row"}
            marginBottom={2}
            gap={4}
          >
            <Add />
            <TextField
              type="search"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ marginBottom: 20, width: "300px" }}
            />{" "}
          </Box>
          <Box
            width="800px"
            height="500px"
            overflow={"hidden"}
            border={"2px solid #000"}
            borderRadius={2}
          >
            <Box bgcolor={"#1976d2"}>
              <Typography
                variant={"h2"}
                color={"#fff"}
                textAlign={"center"}
                fontWeight={"bold"}
                padding={2}
              >
                Pantry Inventory
              </Typography>
            </Box>
            <Box overflow={"auto"} height={"400px"}>
              <Stack spacing={2}>
                <Suspense fallback={<div>Loading...</div>}>
                  <Items />
                </Suspense>
              </Stack>
            </Box>
          </Box>
        </Box>
      </>
    );
  }
}
