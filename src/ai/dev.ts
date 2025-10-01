import { config } from 'dotenv';
config();

import '@/ai/flows/compliance-question-suggestions.ts';
import '@/ai/flows/summarize-report-requests.ts';
import '@/ai/flows/assistant-flow.ts';
import '@/ai/flows/send-email-flow.ts';

