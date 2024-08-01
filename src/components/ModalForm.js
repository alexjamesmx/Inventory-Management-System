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
import { auth } from "@/firebase";
import { doc } from "firebase/firestore";
import { FineTuningJobCheckpointsPage } from "openai/resources/fine-tuning/jobs/checkpoints";

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

export function ModalForm({ open, handleClose, items, setRefresh }) {
  const [itemName, setItemName] = useState("");
  const [value, setValue] = useState(0);
  const [image, setImage] = useState(null);
  const [cameraError, setCameraError] = useState(null);
  const camera = useRef(null);
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
        // Correct structure: Collection -> Document -> Sub-collection
        const userDocRef = doc(firestore, "users", user.uid);
        const itemsCollectionRef = collection(userDocRef, "items");
        await addDoc(itemsCollectionRef, {
          name: itemName,
          quantity: 1,
        });
        setItemName("");
        items.push({ name: itemName, quantity: 1 });
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
      // Check if camera is accessibl, use promise to handle async
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
  useEffect(() => {
    if (image) {
      // pass image to openai api
      console.log("image", image);
    }
  }, [image]);

  const handleSubmitPhotoTaken = (dataUri) => {
    //get image data, create the url and upload it to storage, also set the url on the item object
    console.log("dataUri", dataUri);
  };

  const CameraComponent = () => {
    if (isCameraAccessible === 0) {
      // loading
      return <Typography variant="body1">Loading...</Typography>;
    } else if (isCameraAccessible === 1) {
      // accessible
      return (
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
            unknown: "An unknown error occurred while accessing the camera.",
          }}
          onTakePhoto={(dataUri) => {
            handleSubmitPhotoTaken(dataUri);
          }}
        />
      );
    } else {
      // not accessible
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
