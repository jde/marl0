// import { OpenAI } from 'openai'; // Wire in your preferred provider

// Placeholder extractor function
export async function extractEntities(text: string): Promise<any[]> {
  console.log(`🔍 Extracting entities from text: "${text.slice(0, 50)}..."`);

  // For now, mock result. Replace with real LLM call!
  return [
    { type: 'concept', value: 'Intelligence' },
    { type: 'species', value: 'Dolphins' },
    { type: 'species', value: 'Humans' }
  ];

  // Later: Wire your LLM
  /*
  const openai = new OpenAI({ apiKey: config.openAiApiKey });
  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [{ role: 'system', content: 'Extract named entities and topics from this text and return JSON.' },
               { role: 'user', content: text }]
  });
  return JSON.parse(response.choices[0].message.content);
  */
}
