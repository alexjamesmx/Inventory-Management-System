"use client";
import React, { useEffect, useState } from "react";
import {
  AppBar,
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
  Toolbar,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { auth } from "@/firebase";
import { onAuthStateChanged } from "firebase/auth";

export function NavbarCustom() {
  const router = useRouter();
  const [state, setState] = useState(0);

  useEffect(() => {
    onAuthStateChanged(auth, async (user) => {
      if (user) {
        setState(2);
      } else {
        setState(1);
      }
    });
  }, []);

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static">
        <Toolbar>
          <IconButton
            size="large"
            edge="start"
            color="inherit"
            aria-label="menu"
            sx={{ mr: 2 }}
          >
            {/* <MenuIcon /> */}
          </IconButton>

          <Typography
            variant="h6"
            component="div"
            sx={{ cursor: "pointer" }}
            onClick={() => {
              router.push("/");
            }}
          >
            Home
          </Typography>

          <Typography
            variant="h6"
            component="div"
            marginLeft={4}
            sx={{ flexGrow: 1, cursor: "pointer" }}
            onClick={() => {
              router.push("/recipe/" + auth.currentUser.uid);
            }}
          >
            Recipe
          </Typography>

          {state !== 0 && (
            <>
              {" "}
              {state === 2 ? (
                <Button
                  color="inherit"
                  onClick={() => {
                    localStorage.removeItem("user");
                    auth.signOut();
                  }}
                >
                  logout
                </Button>
              ) : (
                <Button
                  color="inherit"
                  onClick={() => {
                    router.push("/login");
                  }}
                >
                  Login
                </Button>
              )}
            </>
          )}
        </Toolbar>
      </AppBar>
    </Box>
  );
}
