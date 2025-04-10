// import { OpenAI } from 'openai'; // Wire in your preferred provider

import { runLLM } from "./prompter";

// Placeholder extractor function
export async function extractEntities(text: string): Promise<any[]> {
  console.log(`🔍 Extracting entities from text: "${text.slice(0, 50)}..."`);

  const prompt = `
  You are an expert at extracting entities from text.
  Extract the entities from the text and return them as an array of strings.
  `;

  const entities = await runLLM(prompt);
  console.log(`🔍 Extracted entities: ${entities}`);
  return JSON.parse(entities);
}
