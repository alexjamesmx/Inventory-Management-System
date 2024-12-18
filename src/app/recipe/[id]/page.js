"use client";
import { Box, Grid, Typography, TextField, Button } from "@mui/material";
import Toast from "@/components/Toast";
import { NavbarCustom } from "@/components/Nav";
import Link from "next/link";
import { ArrowBack } from "@mui/icons-material";
import { RecipeSteps } from "@/components/Steps";

import { useEffect, useState } from "react";
import { auth, firestore, getRecipeLast } from "@/firebase";
import { useItems } from "@/context/itemsContext";
import { onAuthStateChanged } from "firebase/auth";
import { collection, doc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";

//call to last recipe from firebase

export default function Home() {
  const router = useRouter();
  const [data, setData] = useState({});
  const [recipeName, setRecipeName] = useState("");

  useEffect(() => {
    const fetchData = async (user) => {
      console.log("sdfd", user);
      const userDocRef = doc(firestore, "users", user.uid);
      const recipeCollectionRef = collection(userDocRef, "recipes");
      const recipeDocRef = doc(recipeCollectionRef, "last");
      const recipeDoc = await getDoc(recipeDocRef);
      const recipeData = recipeDoc.data();
      // Fetch the generated data from the 'generated' subcollection
      const generatedDocRef = doc(recipeDocRef, "generated", "recipe");
      const generatedDoc = await getDoc(generatedDocRef);
      const generatedData = generatedDoc.data();
      console.log("generatedDoc", generatedData);
      console.log("recipeDoc", recipeData);
      setData({
        items: recipeData?.items || [],
        generated: generatedData?.recipe || "",
      });
      setRecipeName(recipeNameConverter(generatedData?.recipe || ""));
    };

    onAuthStateChanged(auth, (firebase_user) => {
      if (firebase_user) {
        console.log("User is signed in", firebase_user);
        fetchData(firebase_user);
      } else {
        router.push("/login");
      }
    });
  }, [router]);

  const recipeNameConverter = (text) => {
    const line = text.split("\n").map((line) => line.trim())[0];
    const recipeNameIndex = line.toLowerCase().indexOf("recipe name:");
    let recipeName = line.substring(recipeNameIndex + 12).trim();
    return recipeName;
  };
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
        marginTop={4}
        paddingX={2}
      >
        <Grid
          container
          justifyContent="start"
          alignItems="center"
          sx={{ width: { xs: "100%", md: "800px" }, marginBottom: 2 }}
        >
          <Grid item xs={12} md="auto"></Grid>

          <Grid item xs={12} md="auto">
            <Link href="/">
              <Button
                variant="contained"
                color="primary"
                startIcon={<ArrowBack />}
                sx={{ width: "100%" }}
              >
                Go back
              </Button>
            </Link>
          </Grid>
        </Grid>
        <Box
          width={{ md: "800px", xs: "100%" }}
          height="60%"
          overflow="hidden"
          border="2px solid #000"
          borderRadius={2}
          sx={{
            overflowX: "auto",
          }}
        >
          <Box bgcolor="#1976d2" minWidth={500}>
            <Typography
              variant="h2"
              color="#fff"
              textAlign="center"
              fontWeight="bold"
              padding={2}
              sx={{ fontSize: { xs: "1.5rem", md: "2rem" } }}
            >
              {recipeName}
            </Typography>
          </Box>
          <Box
            overflow="auto"
            minWidth={500}
            sx={{
              height: "calc(100% - 4rem)",
            }}
            padding={2}
            backgroundColor="#f5f5f5"
          >
            <RecipeSteps items={data.items} generated={data.generated} />
          </Box>
        </Box>
      </Box>
    </>
  );
}
