"use client";
import { Box, Grid, Typography, TextField, Button } from "@mui/material";
import { Add } from "@/components/Add";
import Items from "@/components/Items";
import { Suspense, useEffect, useState } from "react";
import Toast from "@/components/Toast";
import { NavbarCustom } from "@/components/Nav";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/firebase";
import { useItems } from "@/context/itemsContext";
import NotesIcon from "@mui/icons-material/Notes";
import { ModalRecipe } from "@/components/ModalRecipe";
export default function Home() {
  const [state, setState] = useState(0);
  const { setSearchQuery, searchQuery } = useItems();
  const [open, setOpen] = useState(false);
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);
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
          marginTop={4}
          paddingX={2}
        >
          <Grid
            container
            spacing={2}
            justifyContent="space-between"
            alignItems="center"
            sx={{ width: { xs: "100%", md: "800px" }, marginBottom: 2 }}
          >
            <Grid item xs={12} md="auto">
              <Add />
            </Grid>

            <Grid item xs={12} md="auto">
              <Button
                variant={"contained"}
                color={"secondary"}
                endIcon={<NotesIcon />}
                style={{ marginBottom: 20 }}
                onClick={handleOpen}
              >
                Generate Recipe
              </Button>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                type="search"
                placeholder="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                fullWidth
              />
            </Grid>
          </Grid>
          <Box
            width={{ md: "800px", xs: "100%" }}
            height="500px"
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
                Pantry Inventory
              </Typography>
            </Box>
            <Box
              overflow="auto"
              minWidth={500}
              sx={{
                height: "calc(100% - 3rem)",
              }}
            >
              <Suspense fallback={<div>Loading...</div>}>
                <Items />
              </Suspense>
            </Box>
          </Box>
        </Box>
        <ModalRecipe open={open} handleClose={handleClose} />;
      </>
    );
  }

  return null;
}
