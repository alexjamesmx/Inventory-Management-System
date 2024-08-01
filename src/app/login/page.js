"use client";
import React, { useState, useEffect } from "react";
import { Box, Button } from "@mui/material";
import { GoogleAuthProvider } from "firebase/auth";
import { auth, userExists, registerNewUser, getUserInfo } from "@/firebase";
import { signInWithPopup } from "firebase/auth";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import GoogleIcon from "@mui/icons-material/Google";
export default function Login() {
  const router = useRouter();
  const [state, setState] = useState(0);

  async function handleOnClick() {
    const googleProvider = new GoogleAuthProvider();
    await signInWithGoogle(googleProvider);

    async function signInWithGoogle(googleProvider) {
      try {
        const res = await signInWithPopup(auth, googleProvider);
        console.log(res);
      } catch (error) {
        console.log(error);
      }
    }
  }

  useEffect(() => {
    onAuthStateChanged(auth, async (user) => {
      if (user) {
        console.log("on auth change: ", user);
        const isRegistered = await userExists(user.uid);

        if (isRegistered) {
          const userInfo = await getUserInfo(user.uid);
          //   if (userInfo.processCompleted) {
          //     localStorage.setItem("user", JSON.stringify(userInfo));
          //   }
        } else {
          //TODO: redirect choosename
          await registerNewUser({
            uid: user.uid,
            displayName: user.displayName,
            profilePicture: "",
            username: "",
            // processCompleted: false,
          });
        }
        setState(1);
        localStorage.setItem("user", JSON.stringify(user));
      } else {
        setState(2);
        console.log("no user");
      }
    });
  }, []);

  useEffect(() => {
    if (state === 1) {
      router.push("/");
    }
  }, [state, router]);

  if (state === 0) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        height="100vh"
      >
        Loading...
      </Box>
    );
  } else if (state == 2) {
    return (
      //login view
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        height="100vh"
      >
        <Button
          variant="contained"
          onClick={handleOnClick}
          style={{ backgroundColor: "#4285F4", color: "white", padding: 10 }}
          endIcon={<GoogleIcon />}
        >
          Login with Google
        </Button>
      </Box>
    );
  }
}
