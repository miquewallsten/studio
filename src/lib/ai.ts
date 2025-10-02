import 'server-only';
import { GoogleGenerativeAI } from '@google/generative-ai';

// This is NOT a recommended practice for production.
// We are hardcoding the key to debug the "API_KEY_INVALID" issue.
const API_KEY = "AIzaSyDBhw_Qx2UcHkrA610MWzpu_mgqquMN0B8";

if (!API_KEY) throw new Error('Missing GOOGLE_GENERATIVE_AI_API_KEY');

const genAI = new GoogleGenerativeAI(API_KEY);

// The single, concrete model we will use (v1, no "-latest")
export const MODEL = 'gemini-2.5-flash-lite';

// Back-compat shim so existing code like ai.generate({ prompt }) still works:
export const ai = {
  generate: async (args: any) => {
    const prompt = args?.prompt ?? args?.input ?? '';
    const model = genAI.getGenerativeModel({ model: MODEL });
    const res = await model.generateContent(prompt);
    return { text: () => res.response.text(), response: res.response };
  },
};

// Convenience helper for new code
export async function generateText(prompt: string) {
  const model = genAI.getGenerativeModel({ model: MODEL });
  const res = await model.generateContent(prompt);
  return res.response.text();
}
