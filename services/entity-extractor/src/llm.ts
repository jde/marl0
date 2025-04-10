export async function runLLM(prompt: string, preferCloud = false): Promise<string> {
  if (preferCloud) {
    // Cloud inference (OpenAI / Claude)
    return await runCloudLLM(prompt);
  } else {
    // Local inference
    return await runLocalLLM(prompt);
  }
}

import axios from 'axios';

export async function runLocalLLM(prompt: string): Promise<string> {
  const localLlmUrl = process.env.LOCAL_LLM_URL;
  if (!localLlmUrl) {
    throw new Error('LOCAL_LLM_URL environment variable is not set');
  }

  console.log('running local llm', localLlmUrl);

  try {
    const response = await axios.post(localLlmUrl, {
      model: process.env.LOCAL_LLM_MODEL || 'tinyllama:latest',
      prompt,
      stream: false,
    });

    const output = response.data.response.trim();
    console.log(`🧠 Local LLM output: ${output}`);
    return output;
  } catch (error: any) {
    console.error('❌ Local LLM error:', error.message);
    throw error;
  }
}

export async function runCloudLLM(prompt: string): Promise<string> {
  const provider = process.env.CLOUD_LLM_PROVIDER;

  if (!provider) {
    throw new Error('CLOUD_LLM_PROVIDER environment variable is not set');
  }

  switch (provider.toLowerCase()) {
    case 'openai':
      return runOpenAI(prompt);
    case 'anthropic':
      return runAnthropic(prompt);
    default:
      throw new Error(`Unsupported cloud LLM provider: ${provider}`);
  }
}

async function runOpenAI(prompt: string): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL || 'gpt-3.5-turbo';

  if (!apiKey) throw new Error('OPENAI_API_KEY is not set');

  try {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
      }
    );

    const output = response.data.choices[0].message.content.trim();
    console.log(`☁️ OpenAI output: ${output}`);
    return output;
  } catch (error: any) {
    console.error('❌ OpenAI error:', error.message);
    throw error;
  }
}

async function runAnthropic(prompt: string): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  const model = process.env.ANTHROPIC_MODEL || 'claude-3-sonnet-20240229';

  if (!apiKey) throw new Error('ANTHROPIC_API_KEY is not set');

  try {
    const response = await axios.post(
      'https://api.anthropic.com/v1/messages',
      {
        model,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 1024,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
      }
    );

    const output = response.data.content[0].text.trim();
    console.log(`☁️ Anthropic output: ${output}`);
    return output;
  } catch (error: any) {
    console.error('❌ Anthropic error:', error.message);
    throw error;
  }
}
