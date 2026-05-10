import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

async function test() {
  try {
    const model = new ChatGoogleGenerativeAI({
      model: "gemini-flash-latest",
      apiKey: process.env.GOOGLE_API_KEY,
      temperature: 0,
    });
    const res = await model.invoke("Say hello");
    console.log("Chat success! Response:", res.content);
  } catch (err) {
    console.error("Chat failed:", err);
  }
}

test();
