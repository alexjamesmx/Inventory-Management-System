import { OpenAI } from "openai";
import * as mobilenet from "@tensorflow-models/mobilenet";
import "@tensorflow/tfjs";

const openai = new OpenAI({
  apiKey:
    "sk-PNBzOqNrHtcqKs2ucg81LUvD0N2louy2IslYQjdTU9T3BlbkFJGiyR09XCqfG6jYzjOKIoDDTGDiu37AVZruDI-9OXkA",
  dangerouslyAllowBrowser: true,
});

async function analyzeImageDescription(full_url, items) {
  //define a string with all the items on the list
  let items_string = items.map((item) => item.name).join(", ");

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text:
                "Respond with the name of the item/product/pantry in the image, the most visible and exposed. Respond only with the item name. In case that the item's name is equal or similar to any of the following items: " +
                items_string +
                ", respond with the name of the item written the same as the reference word. If you can't identify it, respond with 'not found'. Remember just give me the word",
            },
            {
              type: "image_url",
              image_url: {
                url: full_url,
                detail: "low",
              },
            },
          ],
        },
      ],
      max_tokens: 300,
    });

    //if its not found, return not found
    if (
      response.choices[0].message.content.toLowerCase().includes("not found")
    ) {
      return { message: "not found" };
    }

    return { message: response.choices[0].message.content };
  } catch (error) {
    return { error: error };
  }
}

async function generateRecipe(items) {
  const pantry = items
    .map((item) => item.name + ", " + item.quantity)
    .join(", ");

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text:
                "Generate a recipe with the following items: " +
                pantry +
                ". Make sure to repond with the following structure: recipe name, ingredients and instructions.",
            },
          ],
        },
      ],
      max_tokens: 300,
    });

    return { message: response.choices[0].message.content };
  } catch (error) {
    return { error: error };
  }
}

export { analyzeImageDescription, generateRecipe };
