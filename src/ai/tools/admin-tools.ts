'use server';

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { fetchUsers, fetchAuditLogs, createBroadcast } from '@/services/firestore-service';

// Tool to get all users
export const getAllUsers = ai.defineTool(
  {
    name: 'getAllUsers',
    description: 'Fetches a list of all users from the database. Can filter for new users created in the last N hours.',
    inputSchema: z.object({
      newSinceHours: z.number().optional().describe('If provided, returns only users created in the last specified number of hours.'),
    }),
    outputSchema: z.object({
      users: z.array(z.object({
        email: z.string(),
        role: z.string(),
        createdAt: z.string(),
      })),
    }),
  },
  async (input) => {
    return fetchUsers(input);
  }
);

// Tool to get audit logs
export const getAuditLogs = ai.defineTool(
  {
    name: 'getAuditLogs',
    description: 'Searches audit logs for specific actions. Used to identify suspicious activity or potential fraud.',
    inputSchema: z.object({
      action: z.enum(['prediction_request', 'bypass_attempt', 'license_expired', 'payment_verified', 'payment_rejected']).describe('The type of action to search for.'),
      limit: z.number().optional().default(10).describe('The maximum number of log entries to return.'),
    }),
    outputSchema: z.object({
      logs: z.array(z.object({
        userId: z.string(),
        action: z.string(),
        details: z.string(),
        timestamp: z.string(),
      })),
    }),
  },
  async (input) => {
    return fetchAuditLogs(input);
  }
);

// Tool to send a broadcast message
export const sendBroadcastMessage = ai.defineTool(
  {
    name: 'sendBroadcastMessage',
    description: 'Sends a broadcast message to a specified group of users.',
    inputSchema: z.object({
      message: z.string().describe('The content of the message to be sent.'),
      audience: z.enum(['all', 'premium', 'staff']).describe('The target audience for the broadcast.'),
    }),
    outputSchema: z.object({
      success: z.boolean(),
      messageId: z.string().optional(),
    }),
  },
  async ({ message, audience }) => {
    return createBroadcast({ message, audience });
  }
);
