import { GoogleGenerativeAI } from "@google/generative-ai";

async function listModels() {
  const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
  try {
    const result = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GOOGLE_API_KEY}`);
    const data = await result.json();
    console.log("Detailed models info:", JSON.stringify(data.models.filter(m => m.name.includes("flash")), null, 2));
  } catch (err) {
    console.error("List models failed:", err);
  }
}

listModels();
