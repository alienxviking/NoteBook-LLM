import { GoogleGenerativeAI } from "@google/generative-ai";

async function listModels() {
  const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
  try {
    const models = await genAI.getGenerativeModel({ model: "gemini-pro" }); // Just to get the client
    // Actually use the client to list
    const result = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GOOGLE_API_KEY}`);
    const data = await result.json();
    console.log("Available models:", JSON.stringify(data.models.map(m => m.name), null, 2));
  } catch (err) {
    console.error("List models failed:", err);
  }
}

listModels();
