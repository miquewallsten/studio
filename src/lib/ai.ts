export const MODEL = process.env.AI_MODEL || 'stub-model';

export function getAiClient() {
  return {
    name: 'stub-ai',
    async ping() { return 'pong'; },
  };
}

export async function generateText(prompt: any) {
  const text = `This is a stub response for the prompt: ${JSON.stringify(prompt)}`;
  return { text };
}
