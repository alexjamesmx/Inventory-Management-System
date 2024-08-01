"use client";
import React, { useState, useRef, use, useEffect } from "react";
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
import { addDoc, collection } from "firebase/firestore";
import { firestore } from "@/firebase";
import { toast } from "react-toastify";
import { Camera } from "react-camera-pro";

// Custom TabPanel Component
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

export function ModalForm({ open, handleClose, items }) {
  const [itemName, setItemName] = useState("");
  const [value, setValue] = useState(0);
  const [image, setImage] = useState(null);
  const [cameraError, setCameraError] = useState(null);
  const camera = useRef(null);
  const [isCameraAccessible, setIsCameraAccessible] = useState(false);

  const handleChange = (event, newValue) => {
    setValue(newValue);
    if (newValue === 1) {
      setCameraError(null); // Reset camera error when switching tabs
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      await addDoc(collection(firestore, "items"), {
        name: itemName,
        quantity: 1,
      });
      setItemName("");
      handleClose();
      items.push({ name: itemName, quantity: 1 });
      toast.success("Item added successfully");
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
      // Check if camera is accessible
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        setIsCameraAccessible(true);
      } else {
        setIsCameraAccessible(false);
      }
    }
  }, []);

  useEffect(() => {
    if (image) {
      // pass image to openai api
      console.log("image", image);
    }
  }, [image]);

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
            {!isCameraAccessible ? (
              <Typography color="error" variant="body1">
                No camera device accessible. Please connect your camera.
              </Typography>
            ) : (
              <>
                <Camera
                  ref={camera}
                  onError={handleCameraError}
                  errorMessages={{
                    noCameraAccessible:
                      "No camera device accessible. Please connect your camera or try a different browser.",
                    permissionDenied:
                      "Permission denied. Please refresh and give camera permission.",
                    switchCamera:
                      "It is not possible to switch the camera to a different one because there is only one video device accessible.",
                    canvas: "Canvas is not supported.",
                    unknown:
                      "An unknown error occurred while accessing the camera.",
                  }}
                />
                <Button
                  variant="contained"
                  color="primary"
                  style={{ marginBottom: 20 }}
                  onClick={() => {
                    try {
                      if (camera.current) {
                        const image = camera.current.takePhoto();
                        setImage(image);
                      }
                    } catch (error) {
                      handleCameraError(error);
                    }
                  }}
                >
                  Take Photo
                </Button>
              </>
            )}
          </TabPanel>
        </Box>
      </Fade>
    </Modal>
  );
}
