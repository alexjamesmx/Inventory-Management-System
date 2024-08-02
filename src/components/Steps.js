import { Box, Stack, Typography } from "@mui/material";
import { useEffect, useState } from "react";

export function RecipeSteps({ items, generated }) {
  const recipeDataConverter = (text) => {
    const lines = text.split("\n").map((line) => line.trim());

    const recipeNameIndex = lines.findIndex((line) =>
      line.toLowerCase().includes("Recipe Name:")
    );

    const ingredientsIndex = lines.findIndex((line) =>
      line.toLowerCase().includes("ingredients:")
    );
    const instructionsIndex = lines.findIndex((line) =>
      line.toLowerCase().includes("instructions:")
    );

    const ingredients = [];
    const instructions = [];

    if (ingredientsIndex !== -1 && instructionsIndex !== -1) {
      for (let i = ingredientsIndex + 1; i < instructionsIndex; i++) {
        if (lines[i].startsWith("-")) {
          ingredients.push(lines[i].substring(2));
        }
      }
      for (let i = instructionsIndex + 1; i < lines.length; i++) {
        if (lines[i].match(/^\d+\./)) {
          instructions.push(lines[i]);
        }
      }
    }
    let recipeName;

    if (recipeNameIndex !== -1) {
      recipeName = lines[recipeNameIndex].split(":")[1].trim();
      ingredients.unshift(recipeName);
    }

    return { ingredients, instructions, recipeName };
  };

  if (!items) {
    return <div>Loading...</div>;
  }

  if (items.length === 0 || generated === "") {
    return <div>First Generate a recipe!.</div>;
  }

  const parsedData = recipeDataConverter(generated);

  return (
    <>
      <Typography variant="h4">For</Typography>
      <Stack spacing={2}>
        {items.map((item, index) => (
          <Box key={index} display="flex" alignItems="center" gap={1}>
            <Typography variant="h6">- {item.quantity}</Typography>
            <Typography variant="h6">{item.name}</Typography>
          </Box>
        ))}
      </Stack>

      <Typography variant="h4" mt={4}>
        Ingredients
      </Typography>
      <Stack spacing={1}>
        {parsedData.ingredients.map((ingredient, index) => (
          <Typography key={index} variant="body1">
            {ingredient}
          </Typography>
        ))}
      </Stack>

      <Typography variant="h4" mt={4}>
        Instructions
      </Typography>
      <Stack spacing={1}>
        {parsedData.instructions.map((instruction, index) => (
          <Typography key={index} variant="body1">
            {instruction}
          </Typography>
        ))}
      </Stack>
    </>
  );
}
