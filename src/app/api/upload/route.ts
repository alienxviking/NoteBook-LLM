import { NextRequest, NextResponse } from "next/server";
import { processAndIndexDocument } from "@/lib/rag";


// Polyfill for pdfjs-dist in Node.js environment
if (typeof (global as any).DOMMatrix === "undefined") {
  (global as any).DOMMatrix = class DOMMatrix {};
}
if (typeof (global as any).ImageData === "undefined") {
  (global as any).ImageData = class ImageData {};
}
if (typeof (global as any).Path2D === "undefined") {
  (global as any).Path2D = class Path2D {};
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    let text = "";
    if (file.type === "application/pdf") {
      const buffer = Buffer.from(await file.arrayBuffer());
      
      // Configure worker from local node_modules to satisfy Node.js ESM loader
      const path = await import("path");
      const { pathToFileURL } = await import("url");
      const { PDFParse } = await import("pdf-parse");
      const workerPath = path.join(process.cwd(), "node_modules", "pdf-parse", "node_modules", "pdfjs-dist", "legacy", "build", "pdf.worker.mjs");
      PDFParse.setWorker(pathToFileURL(workerPath).toString());
      
      const parser = new PDFParse({ data: buffer });
      const textResult = await parser.getText();
      text = textResult.text;
      await parser.destroy(); // Good practice
    } else {
      text = await file.text();
    }

    const chunkCount = await processAndIndexDocument(text, file.name);

    return NextResponse.json({ 
      success: true, 
      message: `File processed successfully into ${chunkCount} chunks.`,
      fileName: file.name
    });

  } catch (error: any) {
    console.error("Upload error details:", {
      message: error.message,
      stack: error.stack,
      response: error.response?.data,
      status: error.response?.status
    });
    const message = error.message || "Failed to process file";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
