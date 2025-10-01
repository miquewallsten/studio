
'use server';
/**
 * @fileOverview A conversational AI assistant for Super Admins.
 *
 * - chat - A function that handles the conversational chat with the assistant.
 * - ChatInput - The input type for the chat function.
 * - ChatOutput - The return type for the chat function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import {
  addDoc,
  collection,
  getDocs,
  serverTimestamp,
  getCountFromServer,
  where,
  query,
} from 'firebase/firestore';
import { getAdminDb, getAdminAuth } from '@/lib/firebase-admin';
import admin from 'firebase-admin';

// //////////////////////////////////////////////////////////////////
// Tools
// //////////////////////////////////////////////////////////////////

const createTenantTool = ai.defineTool(
  {
    name: 'createTenant',
    description: 'Creates a new client tenant in the system.',
    inputSchema: z.object({
      name: z.string().describe('The name of the new tenant.'),
    }),
    outputSchema: z.object({
      success: z.boolean(),
      tenantId: z.string().optional(),
      message: z.string(),
    }),
  },
  async ({ name }) => {
    try {
      const db = getAdminDb();
      const docRef = await db.collection('tenants').add({
        name: name,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      return {
        success: true,
        tenantId: docRef.id,
        message: `Successfully created tenant "${name}" with ID ${docRef.id}.`,
      };
    } catch (e: any) {
      return { success: false, message: `Failed to create tenant: ${e.message}` };
    }
  }
);

const createTicketTool = ai.defineTool(
  {
    name: 'createTicket',
    description: 'Creates a new ticket for an investigation.',
    inputSchema: z.object({
      subjectName: z
        .string()
        .describe('The name of the person or company to be investigated.'),
      subjectEmail: z
        .string()
        .describe("The subject's email address. The form will be sent here."),
      reportType: z
        .enum([
          'background-check',
          'tenant-screening',
          'employment-verification',
        ])
        .describe('The type of report to be generated.'),
      description: z
        .string()
        .optional()
        .describe('Any specific instructions or notes for the analyst.'),
    }),
    outputSchema: z.object({
      success: z.boolean(),
      ticketId: z.string().optional(),
      message: z.string(),
    }),
  },
  async ({ subjectName, subjectEmail, reportType, description }) => {
    try {
      const db = getAdminDb();
      // In a real scenario, we might want to associate this with a client,
      // but for a Super Admin assistant, creating it directly is fine.
      const docRef = await db.collection('tickets').add({
        subjectName,
        email: subjectEmail,
        reportType,
        description,
        status: 'New',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      return {
        success: true,
        ticketId: docRef.id,
        message: `Successfully created a new ${reportType} ticket for ${subjectName}.`,
      };
    } catch (e: any) {
      return { success: false, message: `Failed to create ticket: ${e.message}` };
    }
  }
);

const getPlatformMetricsTool = ai.defineTool(
  {
    name: 'getPlatformMetrics',
    description: 'Retrieves current platform metrics, including ticket counts by status and total number of users. Use this to answer questions about users or tickets.',
    inputSchema: z.object({}).optional(),
    outputSchema: z.object({
      totalUsers: z.number().describe('The total number of registered users.'),
      tickets: z.object({
        new: z.number(),
        inProgress: z.number(),
        pendingReview: z.number(),
        completed: z.number(),
        total: z.number(),
      }).describe('The breakdown of tickets by status.'),
    }),
  },
  async () => {
    const adminAuth = getAdminAuth();
    const adminDb = getAdminDb();

    // Get user count
    const listUsersResult = await adminAuth.listUsers();
    const totalUsers = listUsersResult.users.length;

    // Get ticket counts
    const statuses: Array<'New' | 'In Progress' | 'Pending Review' | 'Completed'> = ['New', 'In Progress', 'Pending Review', 'Completed'];
    const counts = {
      new: 0,
      inProgress: 0,
      pendingReview: 0,
      completed: 0,
      total: 0,
    };
    
    const ticketsCollection = adminDb.collection('tickets');
    const querySnapshot = await ticketsCollection.get();
    
    querySnapshot.forEach(doc => {
      const status = doc.data().status;
      if (status === 'New') counts.new++;
      else if (status === 'In Progress') counts.inProgress++;
      else if (status === 'Pending Review') counts.pendingReview++;
      else if (status === 'Completed') counts.completed++;
    });

    counts.total = querySnapshot.size;

    return {
      totalUsers: totalUsers,
      tickets: counts,
    };
  }
);

const impersonateUserTool = ai.defineTool(
    {
        name: 'impersonateUser',
        description: 'Generates a custom sign-in token to impersonate another user. This should only be used when the Super Admin explicitly asks to impersonate or "log in as" another user.',
        inputSchema: z.object({
            uid: z.string().describe("The UID of the user to impersonate."),
        }),
        outputSchema: z.object({
            customToken: z.string(),
        })
    },
    async ({ uid }) => {
        const adminAuth = getAdminAuth();
        const targetUser = await adminAuth.getUser(uid);
        const impersonationClaims = targetUser.customClaims || {};
        const customToken = await adminAuth.createCustomToken(uid, impersonationClaims);
        return { customToken };
    }
);


// //////////////////////////////////////////////////////////////////
// Flow Definition
// //////////////////////////////////////////////////////////////////
const systemPrompt = `You are a helpful AI assistant for a Super Admin of the TenantCheck platform.
Your purpose is to assist the admin with managing the application by answering questions about metrics and performing actions on their behalf.
Use the tools provided to you to answer questions and fulfill requests.
Be conversational and confirm when you have completed an action.
If you are asked to do something you don't have a tool for, clearly state that you do not have that capability.
You MUST respond in the user's language. The user's current language is: {{locale}}.
`;

const ChatInputSchema = z.object({
  history: z.array(z.any()).optional(),
  prompt: z.string(),
  locale: z.string().optional().default('en'),
});
export type ChatInput = z.infer<typeof ChatInputSchema>;

const ChatOutputSchema = z.string();
export type ChatOutput = z.infer<typeof ChatOutputSchema>;

export async function chat(input: ChatInput): Promise<ChatOutput> {
  return assistantFlow(input);
}

const assistantFlow = ai.defineFlow(
  {
    name: 'assistantFlow',
    inputSchema: ChatInputSchema,
    outputSchema: ChatOutputSchema,
  },
  async ({ history, prompt, locale }) => {
    const llmResponse = await ai.generate({
      model: 'googleai/gemini-2.5-flash-lite',
      prompt: {
        text: prompt,
        context: {
          locale,
        }
      },
      history: history,
      tools: [createTenantTool, createTicketTool, getPlatformMetricsTool, impersonateUserTool],
      system: systemPrompt,
    });

    return llmResponse.text;
  }
);
