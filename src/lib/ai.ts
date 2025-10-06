
import { logger } from './logger';

export const MODEL = process.env.AI_MODEL || 'stub-model';

export function getAiClient() {
  if (process.env.AI_ENABLED !== 'true' && process.env.AI_ENABLED !== '1') {
    return null;
  }
  return {
    name: 'stub-ai',
    async ping() { return 'pong'; },
  };
}

export async function generateText(prompt: any) {
  const text = `This is a stub response for the prompt: ${JSON.stringify(prompt)}`;
  logger.info('[AI_STUB] Generating text for prompt.', { prompt: JSON.stringify(prompt) });
  return { text };
}
