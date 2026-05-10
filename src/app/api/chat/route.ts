import { NextRequest, NextResponse } from "next/server";
import { getVectorStore } from "@/lib/rag";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { PromptTemplate } from "@langchain/core/prompts";

export async function POST(req: NextRequest) {
  try {
    const { query } = await req.json();

    if (!query) {
      return NextResponse.json({ error: "No query provided" }, { status: 400 });
    }

    const vectorStore = await getVectorStore();
    const retriever = vectorStore.asRetriever({ k: 4 });
    const relevantDocs = await retriever.invoke(query);

    const context = relevantDocs.map(doc => doc.pageContent).join("\n\n");

    const model = new ChatGoogleGenerativeAI({
      model: "gemini-flash-latest",
      apiKey: process.env.GOOGLE_API_KEY,
      temperature: 0,
    });

    const prompt = PromptTemplate.fromTemplate(`
      You are a highly capable AI assistant powered by Google NotebookLM technology. 
      Your goal is to answer the user's question based ONLY on the provided context.
      
      Rules:
      1. Use ONLY the provided context to answer. 
      2. If the answer is not in the context, say "I'm sorry, but I couldn't find information about that in the uploaded documents."
      3. Be concise and professional.
      4. Use markdown for formatting.

      Context:
      {context}

      User Question: {query}

      Answer:
    `);

    const chain = prompt.pipe(model);
    const response = await chain.invoke({
      context: context,
      query: query,
    });

    return NextResponse.json({ 
      answer: response.content,
      sources: relevantDocs.map(doc => doc.metadata.source)
    });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to generate answer";
    console.error("Chat error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
