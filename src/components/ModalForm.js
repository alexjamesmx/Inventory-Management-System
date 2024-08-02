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
  Input,
  Tab,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import {
  auth,
  incrementItemQuantity,
  itemAlreadyRegistered,
  submitItem,
} from "@/firebase";
import { toast } from "react-toastify";
import { Camera } from "react-camera-pro";
import CameraIcon from "@mui/icons-material/Camera";
import CameraAltIcon from "@mui/icons-material/CameraAlt";
import { analyzeImageDescription } from "@/utils/openai";
import {
  ref,
  uploadString,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import { storage } from "@/firebase";
import { useItems } from "@/context/ItemsContext";
import { Delete } from "@mui/icons-material";
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && <Box p={3}>{children}</Box>}
    </div>
  );
}

export function ModalForm({ open, handleClose }) {
  /*
  status
  isCameraAccessible: 
  0 - loading
  1 - accessible
  photoStatus:
  0 - initial
  1 - photo taken
  2 - photo uploading
  3 - photo uploaded
  4 - photo analyzing
  5 - photo analyzed
  
  */
  const { items, setItems, setRefresh } = useItems();
  const [itemName, setItemName] = useState("");
  const [value, setValue] = useState(0);
  const [image, setImage] = useState(null);
  const [cameraError, setCameraError] = useState(null);
  const camera = useRef(null);
  const [isCameraAccessible, setIsCameraAccessible] = useState(0);
  const [photoStatus, setPhotoStatus] = useState(3);
  const [user, setUser] = useState(auth.currentUser);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [manualFile, setManualFile] = useState(null);

  const handleChange = (event, newValue) => {
    setValue(newValue);
    if (newValue === 1) {
      setCameraError(null); // Reset camera error when switching tabs
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      const alreadyExists = await itemAlreadyRegistered(user.uid, itemName);
      console.log("alreadyExists: ", alreadyExists);
      if (alreadyExists) {
        await incrementItemQuantity(user.uid, itemName);
        toast.success("Item quantity incremented successfully");
        setItems((prevItems) =>
          prevItems.map((item) =>
            item.name === itemName
              ? { ...item, quantity: item.quantity + 1 }
              : item
          )
        );
      } else {
        // Upload to Firebase Storage
        let imageUrl = "";
        if (manualFile) {
          const imageRef = ref(storage, `images/${user.uid}/${Date.now()}.png`);
          const uploadTask = await uploadString(
            imageRef,
            manualFile,
            "data_url"
          );
          console.log("Uploading image...: ", uploadTask);

          imageUrl = await getDownloadURL(imageRef);
        }

        await submitItem(user.uid, {
          name: itemName,
          quantity: 1,
          image: imageUrl,
        });
        setItems((prevItems) => [
          ...prevItems,
          { name: itemName, quantity: 1, image: imageUrl },
        ]);
      }
      setItemName("");
      beforeClose();
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
    setImage(photo);
    setPhotoStatus(1);
  };

  const handlePhotoSubmit = async () => {
    try {
      // Change format to PNG
      // const pngUrl = await convertToPng(image);
      // console.log("PNG URL: ", pngUrl);
      // setImage(pngUrl);
      setPhotoStatus(4);

      // Upload to Firebase Storage
      const imageRef = ref(storage, `images/${user.uid}/${Date.now()}.png`);
      const uploadTask = await uploadString(imageRef, image, "data_url");
      console.log("Uploading image...: ", uploadTask);

      const imageUrl = await getDownloadURL(imageRef);
      console.log("Image uploaded: ", imageUrl);

      // Analyze image description
      let res = await analyzeImageDescription(imageUrl, items);
      console.log("Image description analysis: ", res);

      if (res.error) {
        console.error("Error analyzing image description: ", res.error);
        //remove the image from storage
        await deleteObject(imageRef);
        resetValues();
        toast.error(
          "An error occurred while analyzing the image. Please try later."
        );
        return;
      }
      if (res.message === "not found") {
        console.warn("Item not found in image");
        await deleteObject(imageRef);
        resetValues();
        toast.error(
          "Could not identify the item in the image. Please make sure the item is clearly visible."
        );
        return;
      }

      console.log("Item found in image: ", res.message);
      // Add item to Firestore
      const item = {
        name: res.message,
        quantity: 1,
        image: imageUrl,
      };

      const alreadyExists = await itemAlreadyRegistered(user.uid, item.name);

      if (alreadyExists) {
        await incrementItemQuantity(user.uid, item.name);
        setItems((prevItems) =>
          prevItems.map((i) =>
            i.name === item.name ? { ...i, quantity: i.quantity + 1 } : i
          )
        );
        toast.success("Item quantity incremented successfully");
      } else {
        await submitItem(user.uid, item);
        setItems((prevItems) => [...prevItems, item]);
      }

      beforeClose();
      toast.success("Item added successfully");
    } catch (error) {
      console.error("Error handling photo submit: ", error);
    }
  };

  const resetValues = () => {
    setItemName("");
    setImage(null);
    setPhotoStatus(3);
    setCameraError(null);
    setIsVideoReady(false);
  };

  // const convertToPng = (dataUrl) => {
  //   return new Promise((resolve, reject) => {
  //     const canvas = document.createElement("canvas");
  //     const ctx = canvas.getContext("2d");
  //     const image = new Image();
  //     image.src = dataUrl;
  //     image.onload = () => {
  //       canvas.width = "474";
  //       canvas.height = "474";
  //       ctx.drawImage(image, 0, 0, image.width, image.height);
  //       const pngUrl = canvas.toDataURL("image/png");
  //       resolve(pngUrl);
  //     };
  //     image.onerror = (error) => {
  //       reject(error);
  //     };
  //   });
  // };
  useEffect(() => {
    if (value === 1 && isCameraAccessible === 0) {
      const checkCameraAccess = async () => {
        const result = await hasUserMedia();
        setIsCameraAccessible(result);
      };
      checkCameraAccess();
    }
  }, [value]);

  useEffect(() => {
    console.log("photo status", photoStatus);
    if (photoStatus !== 1) {
      setIsVideoReady(false);
    }
  }, [photoStatus]);

  console.log("a");
  const CameraComponent = () => {
    if (isCameraAccessible === 0) {
      //loading
      return <Typography variant="body1">Loading...</Typography>;
    } else if (isCameraAccessible === 1) {
      return (
        <>
          {photoStatus === 0 && (
            <Box
              display="flex"
              flexDirection="column"
              alignItems="center"
              justifyContent="center"
              width="100vw"
              height="100vh"
              bgcolor="background.paper"
              p={4}
              borderRadius={2}
              boxShadow={24}
              position={"relative"}
            >
              <Camera
                ref={camera}
                facingMode="environment"
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
                  unknown:
                    "An unknown error occurred while accessing the camera.",
                }}
                videoReadyCallback={() => {
                  console.log("Video is ready");
                  setIsVideoReady(true);
                }}
              />
              {cameraError && (
                <Typography color="error" variant="body1">
                  {cameraError}
                </Typography>
              )}
              {isVideoReady && (
                <Box position="absolute" bottom={40}>
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
                </Box>
              )}
            </Box>
          )}

          {photoStatus === 1 && (
            <Box display="flex" flexDirection="column" alignItems="center">
              {image && (
                <Box
                  sx={{
                    width: 220,
                    height: 220,
                    backgroundImage: `url(${image})`,
                    backgroundSize: "contain",
                    backgroundRepeat: "no-repeat",
                    backgroundPosition: "center",
                    marginTop: 2,
                  }}
                  onClick={() => setImage(null)}
                />
              )}
              <Box
                display="flex"
                flexDirection="row"
                justifyContent="center"
                mt={2}
              >
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => setPhotoStatus(0)}
                  sx={{ marginRight: 2 }}
                  endIcon={<CameraIcon />}
                >
                  Retake
                </Button>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => handlePhotoSubmit()}
                >
                  Continue
                </Button>
              </Box>
            </Box>
          )}
          {photoStatus === 3 && (
            <Box display="flex" flexDirection="column" alignItems="center">
              <Button
                variant="contained"
                color="primary"
                onClick={() => {
                  setPhotoStatus(0);
                  setImage(null);
                }}
              >
                <CameraAltIcon />
              </Button>
            </Box>
          )}
        </>
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

  const beforeClose = () => {
    resetValues();
    handleClose();
  };

  const handleManualFileUpload = (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = (e) => {
      setManualFile(e.target.result);
    };
    reader.readAsDataURL(file);
  };

  return (
    <Modal
      aria-labelledby="transition-modal-title"
      aria-describedby="transition-modal-description"
      open={open}
      onClose={beforeClose}
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
            onClick={beforeClose}
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
              <Box display={"flex"}>
                <Input
                  type="file"
                  accept="image/*"
                  id="photo"
                  label="Photo"
                  variant="outlined"
                  style={{ marginBottom: 20 }}
                  placeholder="Pantry photo"
                  onChange={handleManualFileUpload}
                />
                <Delete />
              </Box>
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
            {photoStatus === 3 ? (
              <Typography variant="h5" gutterBottom>
                Post an item with a photo
              </Typography>
            ) : (
              <></>
            )}
            <CameraComponent />

            {photoStatus === 4 && (
              //submitting the photo
              <Typography variant="h5" gutterBottom>
                Submitting the photo...
              </Typography>
            )}
          </TabPanel>
        </Box>
      </Fade>
    </Modal>
  );
}
