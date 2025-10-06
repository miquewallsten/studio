export const MODEL = process.env.AI_MODEL || 'stub-model';

export function getAiClient() {
  return {
    name: 'stub-ai',
    async ping() { return 'pong'; },
  };
}

export async function generateText(_: { model: string; prompt: string }) {
  return { text: 'stub' };
}
