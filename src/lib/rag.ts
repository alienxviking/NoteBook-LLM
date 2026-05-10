import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { QdrantVectorStore } from "@langchain/qdrant";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { QdrantClient } from "@qdrant/js-client-rest";

const COLLECTION_NAME = "notebook-llm-docs";

function getQdrantClient() {
  const url = process.env.QDRANT_URL;
  
  if (!url) {
    throw new Error("QDRANT_URL is not defined in environment variables");
  }

  return new QdrantClient({
    url: url,
    apiKey: process.env.QDRANT_API_KEY,
    checkCompatibility: false,
  });
}

export async function getVectorStore() {
  const embeddings = new GoogleGenerativeAIEmbeddings({
    model: "gemini-embedding-001",
    apiKey: process.env.GOOGLE_API_KEY,
  });

  return await QdrantVectorStore.fromExistingCollection(embeddings, {
    url: process.env.QDRANT_URL,
    apiKey: process.env.QDRANT_API_KEY,
    collectionName: COLLECTION_NAME,
    client: getQdrantClient(),
  });
}

export async function processAndIndexDocument(text: string, fileName: string) {
  const embeddings = new GoogleGenerativeAIEmbeddings({
    model: "gemini-embedding-001",
    apiKey: process.env.GOOGLE_API_KEY,
  });

  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
  });

  const docs = await splitter.createDocuments([text], [{ source: fileName }]);

  const client = getQdrantClient();
  
  // Check if collection exists, if not create it
  try {
    const collections = await client.getCollections();
    const exists = collections.collections.some(c => c.name === COLLECTION_NAME);

    if (exists) {
      const info = await client.getCollection(COLLECTION_NAME);
      const config = info.config?.params?.vectors;
      // If it's a single vector config and dimension mismatch
      if (config && 'size' in config && config.size !== 3072) {
        await client.deleteCollection(COLLECTION_NAME);
        await client.createCollection(COLLECTION_NAME, {
          vectors: {
            size: 3072,
            distance: "Cosine",
          },
        });
      }
    } else {
      await client.createCollection(COLLECTION_NAME, {
        vectors: {
          size: 3072,
          distance: "Cosine",
        },
      });
    }
  } catch (error) {
    console.error("Qdrant collection check failed, attempting to recreate:", error);
    // If it fails (e.g. dimension mismatch), try deleting and recreating
    try {
      await client.deleteCollection(COLLECTION_NAME);
      await client.createCollection(COLLECTION_NAME, {
        vectors: {
          size: 3072,
          distance: "Cosine",
        },
      });
    } catch (innerError) {
      console.error("Failed to recreate collection:", innerError);
      throw innerError;
    }
  }

  await QdrantVectorStore.fromDocuments(docs, embeddings, {
    url: process.env.QDRANT_URL,
    apiKey: process.env.QDRANT_API_KEY,
    collectionName: COLLECTION_NAME,
    client: client,
  });

  return docs.length;
}
