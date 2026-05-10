import { processAndIndexDocument } from "./src/lib/rag.js";
import dotenv from "dotenv";
dotenv.config();

async function test() {
  try {
    console.log("Starting test...");
    const count = await processAndIndexDocument("Hello world", "test.txt");
    console.log("Success! Chunks indexed:", count);
  } catch (err) {
    console.error("Test failed:", err);
  }
}

test();
