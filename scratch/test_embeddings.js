import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";

async function test() {
  try {
    const embeddings = new GoogleGenerativeAIEmbeddings({
      model: "gemini-embedding-001",
      apiKey: process.env.GOOGLE_API_KEY,
    });
    const res = await embeddings.embedQuery("Hello world");
    console.log("Embeddings success! Vector length:", res.length);
  } catch (err) {
    console.error("Embeddings failed:", err);
  }
}

test();
