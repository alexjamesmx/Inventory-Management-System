import { OpenAI } from "openai";
import * as mobilenet from "@tensorflow-models/mobilenet";
import "@tensorflow/tfjs";

async function analyzeImageDescription(full_url, items, key) {
  const openai = new OpenAI({
    apiKey: key,
    dangerouslyAllowBrowser: true,
  });
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
              text: "Respond with the name of the item/product/pantry in the image, choose the most visible and exposed item from the photo. Respond only with the item name. If you can't identify it, respond with 'not found'. Remember just give me the word.",
            },
            {
              type: "image_url",
              image_url: {
                url: full_url,
                detail: "high",
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

async function generateRecipe(items, key) {
  const openai = new OpenAI({
    apiKey: key,
    dangerouslyAllowBrowser: true,
  });
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
