import dotenv from "dotenv";
dotenv.config();

import { PineconeStore } from "@langchain/pinecone";
import { Pinecone as PineconeClient } from "@pinecone-database/pinecone";

const pinecone = new PineconeClient({
  apiKey: process.env.PINECONE_API_KEY || "",
});

const pineconeIndex = pinecone.Index(process.env.PINECONE_INDEX_NAME || "user-resumes");

export function getPineconeStore(embeddings: any) {
  return new PineconeStore(embeddings, {
    pineconeIndex,
    maxConcurrency: 5,
  });
}

export { pinecone, pineconeIndex };

export function isPineconeAvailable(): boolean {
  return !!process.env.PINECONE_API_KEY && !!process.env.PINECONE_ENVIRONMENT && !!process.env.PINECONE_INDEX_NAME;
}