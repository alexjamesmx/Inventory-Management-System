"use client";
import React, { useState, useRef, useEffect } from "react";
import {
  Box,
  Typography,
  Modal,
  Fade,
  TextField,
  Button,
  IconButton,
  FormControl,
  Tabs,
  Tab,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { addDoc, collection, doc } from "firebase/firestore";
import { firestore, auth } from "@/firebase";
import { toast } from "react-toastify";
import { Camera } from "react-camera-pro";

function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
      {...other}
    >
      {value === index && <Box p={3}>{children}</Box>}
    </div>
  );
}

export function ModalForm({ open, handleClose, items, setRefresh }) {
  const [itemName, setItemName] = useState("");
  const [value, setValue] = useState(0);
  const [image, setImage] = (useState < string) | (null > null);
  const [cameraError, setCameraError] = (useState < string) | (null > null);
  const camera = (useRef < Camera) | (null > null);
  const [isCameraAccessible, setIsCameraAccessible] = useState(0);
  const [user, setUser] = useState(auth.currentUser);

  const handleChange = (event, newValue) => {
    setValue(newValue);
    if (newValue === 1) {
      setCameraError(null); // Reset camera error when switching tabs
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      if (user) {
        const userDocRef = doc(firestore, "users", user.uid);
        const itemsCollectionRef = collection(userDocRef, "items");
        await addDoc(itemsCollectionRef, {
          name: itemName,
          quantity: 1,
          image: image, // Add the image URL to the document
        });
        setItemName("");
        items.push({ name: itemName, quantity: 1, image });
        handleClose();
        setRefresh((prev) => !prev);
        toast.success("Item added successfully");
      }
    } catch (error) {
      console.error("Error adding item:", error);
      toast.error("Failed to add item");
    }
  };

  const handleCameraError = (error) => {
    console.error("Camera error:", error);
    setCameraError(
      error.message || "An unexpected error occurred with the camera."
    );
  };

  useEffect(() => {
    if (open) {
      hasUserMedia().then((result) => {
        setIsCameraAccessible(result);
        console.log("result", result);
      });
    }
  }, [open]);

  async function hasUserMedia() {
    return navigator.mediaDevices
      .getUserMedia({ video: true })
      .then(() => {
        console.log("Webcam is accessible");
        return 1;
      })
      .catch(() => {
        console.log("Webcam is not accessible");
        return 2;
      });
  }

  const handlePhotoTaken = (photo) => {
    console.log("photo taken image", photo);
    setImage(photo);
  };

  const CameraComponent = () => {
    if (isCameraAccessible === 0) {
      return <Typography variant="body1">Loading...</Typography>;
    } else if (isCameraAccessible === 1) {
      return (
        <Box
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          width="100%"
          height="100%"
          bgcolor="background.paper"
          p={4}
          borderRadius={2}
          boxShadow={24}
        >
          <Camera
            ref={camera}
            aspectRatio="cover"
            onError={handleCameraError}
            errorMessages={{
              noCameraAccessible:
                "No camera device accessible. Please connect your camera or try a different browser.",
              permissionDenied:
                "Permission denied. Please refresh and give camera permission.",
              switchCamera:
                "It is not possible to switch the camera to a different one because there is only one video device accessible.",
              canvas: "Canvas is not supported.",
              unknown: "An unknown error occurred while accessing the camera.",
            }}
          />
          {cameraError && (
            <Typography color="error" variant="body1">
              {cameraError}
            </Typography>
          )}
          <Button
            variant="contained"
            color="primary"
            onClick={() => {
              if (camera.current) {
                const photo = camera.current.takePhoto();
                handlePhotoTaken(photo);
              }
            }}
            sx={{ marginTop: 2 }}
          >
            Take Photo
          </Button>
          {image && (
            <Box
              sx={{
                width: 120,
                height: 120,
                backgroundImage: `url(${image})`,
                backgroundSize: "contain",
                backgroundRepeat: "no-repeat",
                backgroundPosition: "center",
                marginTop: 2,
              }}
              onClick={() => setImage(null)}
            />
          )}
        </Box>
      );
    } else {
      return (
        <Box sx={{ textAlign: "center" }}>
          <Typography color="error" variant="body1">
            No camera device accessible. Please connect your camera.
          </Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={() => {
              setIsCameraAccessible(0);
              hasUserMedia().then((result) => {
                setIsCameraAccessible(result);
              });
            }}
            sx={{ marginTop: 2 }}
          >
            Retry
          </Button>
        </Box>
      );
    }
  };

  return (
    <Modal
      aria-labelledby="transition-modal-title"
      aria-describedby="transition-modal-description"
      open={open}
      onClose={handleClose}
      closeAfterTransition
    >
      <Fade in={open}>
        <Box
          component="form"
          onSubmit={handleSubmit}
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            bgcolor: "background.paper",
            width: 400,
            height: 500,
            borderRadius: 2,
            boxShadow: 24,
            p: 4,
          }}
        >
          <IconButton
            aria-label="close"
            onClick={handleClose}
            sx={{
              position: "absolute",
              top: 10,
              right: 10,
              color: "black",
            }}
          >
            <CloseIcon />
          </IconButton>

          <Box sx={{ borderBottom: 1, borderColor: "divider", width: "100%" }}>
            <Tabs
              value={value}
              onChange={handleChange}
              aria-label="basic tabs example"
              variant="fullWidth"
            >
              <Tab label="Add Item" />
              <Tab label="Camera" />
            </Tabs>
          </Box>

          <TabPanel value={value} index={0}>
            <Typography variant="h4" gutterBottom>
              Add Item
            </Typography>
            <FormControl fullWidth>
              <TextField
                id="item"
                label="Item"
                variant="outlined"
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                style={{ marginBottom: 20 }}
                required
              />
              <Button
                variant="contained"
                color="primary"
                type="submit"
                style={{ marginBottom: 20 }}
              >
                Add
              </Button>
            </FormControl>
          </TabPanel>

          <TabPanel value={value} index={1}>
            <Typography variant="h4" gutterBottom>
              Post an item with a photo
            </Typography>
            <CameraComponent />
          </TabPanel>
        </Box>
      </Fade>
    </Modal>
  );
}
