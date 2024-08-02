import {
  Box,
  Button,
  Checkbox,
  Fade,
  IconButton,
  Modal,
  Slider,
  Stack,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { useItems } from "@/context/itemsContext";
import { useState } from "react";
import { firestore, auth } from "@/firebase"; // Ensure these are correctly imported
import { collection, doc, setDoc, writeBatch } from "firebase/firestore";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import { generateRecipe } from "@/utils/openai";
export function ModalRecipe({ open, handleClose }) {
  const { items } = useItems();
  const [selectedItems, setSelectedItems] = useState({});
  const [generationState, setGenerationState] = useState(0);
  const [loading, setLoading] = useState(false);

  const router = useRouter();
  const handleCheckboxChange = (itemName) => (event) => {
    setSelectedItems((prevState) => ({
      ...prevState,
      [itemName]: {
        ...prevState[itemName],
        selected: event.target.checked,
      },
    }));
  };

  const handleSliderChange = (itemName) => (event, newValue) => {
    setSelectedItems((prevState) => ({
      ...prevState,
      [itemName]: {
        ...prevState[itemName],
        quantity: newValue,
      },
    }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    const selected = Object.entries(selectedItems)
      .filter(([_, value]) => value.selected)
      .map(([key, value]) => ({
        name: key,
        quantity: value.quantity || 1,
      }));
    console.log(selected);

    //submit to firebase on user's collection as a recipe with the selected items
    const user = auth.currentUser;
    if (user) {
      try {
        // Reference to the user's recipes collection
        const userDocRef = doc(firestore, "users", user.uid);
        const recipesCollectionRef = collection(userDocRef, "recipes");

        // Create a batch
        const batch = writeBatch(firestore);

        // Add each item to the batch
        const newRecipeDocRef = doc(recipesCollectionRef, "last");

        //first, delete all the items in the last recipe
        //to avoid duplicates
        const lastRecipeDocRef = doc(recipesCollectionRef, "last");
        batch.delete(lastRecipeDocRef);

        //last will contain all the items selected
        batch.set(newRecipeDocRef, { items: selected });

        // Commit the batch
        await batch.commit();

        console.log("Recipes added to Firestore successfully!");
        setGenerationState(1);

        const gptRes = await generateRecipe(
          selected,
          process.env.NEXT_PUBLIC_OPENAI_API_KEY
        );

        if (gptRes?.error) {
          console.error("Error generating recipe: ", gptRes.error);
          toast.error("Error generating recipe");
          beforeClose();
        }

        // Post into lasts recipes the generated recipe without removing the current items

        const generatedCollectionRef = collection(
          lastRecipeDocRef,
          "generated"
        );
        const generatedDocRef = doc(generatedCollectionRef, "recipe");
        await setDoc(generatedDocRef, { recipe: gptRes.message });
        console.log("GPT Response: ", gptRes);
        setGenerationState(2);
        router.push("/recipe/" + user.uid);
      } catch (error) {
        console.error("Error adding recipes to Firestore: ", error);
        toast.error("Error adding recipes to Firestore");
        beforeClose();
      } finally {
        setLoading(false);
      }
    } else {
      console.error("No user is signed in");
      toast.error("No user is signed in");
      beforeClose();
    }
  };
  const beforeClose = () => {
    setSelectedItems({});
    setGenerationState(0);
    handleClose();
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
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            display: "flex",
            flexDirection: "column",
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
          <Typography
            variant={"h4"}
            color={"#333"}
            textAlign={"center"}
            fontWeight={"bold"}
            marginBottom={1}
          >
            Generate Recipe{" "}
          </Typography>{" "}
          <Typography
            variant={"h8"}
            color={"#333"}
            textAlign={"center"}
            fontWeight={"bold"}
            marginBottom={4}
          >
            Select the items and the quantity you want to use
          </Typography>
          <Stack
            spacing={1}
            sx={{ width: "100%" }}
            marginBottom={2}
            overflow={"auto"}
          >
            {items.map((item) => (
              <Box
                key={item.name}
                width="100%"
                height="100%"
                display={"flex"}
                justifyContent={"space-between"}
                alignItems={"center"}
                bgcolor={"#f0f0f0"}
                position={"relative"}
                paddingInline={2}
                marginBottom={2}
              >
                <Typography
                  variant={"h6"}
                  color={"#333"}
                  textAlign={"center"}
                  fontWeight={"bold"}
                  marginBottom={2}
                >
                  {item.name}
                </Typography>

                <Box
                  display="flex"
                  alignItems="center"
                  sx={{ width: 100 }}
                  height={85}
                  justifyContent="space-between"
                  gap={2}
                >
                  <Slider
                    getAriaLabel={() => "Choose amount"}
                    defaultValue={0}
                    step={1}
                    marks
                    min={1}
                    max={item.quantity}
                    valueLabelDisplay="auto"
                    color="primary"
                    onChange={handleSliderChange(item.name)}
                    disabled={loading}
                  />
                  <Checkbox
                    color="secondary"
                    inputProps={{ "aria-label": "secondary checkbox" }}
                    onChange={handleCheckboxChange(item.name)}
                    disabled={loading}
                  />
                </Box>
              </Box>
            ))}
          </Stack>
          {generationState !== 0 ? (
            <>
              {generationState === 1 ? (
                <div>Generating...</div>
              ) : (
                <div>Done! you will be redirected.</div>
              )}
            </>
          ) : (
            <Button
              variant="contained"
              color="primary"
              type="submit"
              disabled={
                Object.values(selectedItems).filter((item) => item.selected)
                  .length === 0
              }
            >
              Generate
            </Button>
          )}
        </Box>
      </Fade>
    </Modal>
  );
}
