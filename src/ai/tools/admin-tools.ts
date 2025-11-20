'use server';

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { fetchUsers, fetchAuditLogs, createBroadcast, fetchPreVerifiedPayments, updateUserRole, suspendUser, activateLicenseForUser } from '@/services/firestore-service';

// Tool to get all users
export const getAllUsers = ai.defineTool(
  {
    name: 'getAllUsers',
    description: 'Fetches a list of all users from the database. Can filter for new users created in the last N hours. Returns data in a markdown table.',
    inputSchema: z.object({
      newSinceHours: z.number().optional().describe('If provided, returns only users created in the last specified number of hours.'),
    }),
    outputSchema: z.string().describe('A markdown table of users with columns: Email, Role, Created At.'),
  },
  async (input) => {
    return fetchUsers(input);
  }
);

// Tool to get audit logs
export const getAuditLogs = ai.defineTool(
  {
    name: 'getAuditLogs',
    description: 'Searches audit logs for specific actions. Used to identify suspicious activity or potential fraud. Returns data in a markdown table.',
    inputSchema: z.object({
      action: z.enum(['prediction_request', 'bypass_attempt', 'license_expired', 'payment_verified', 'payment_rejected']).describe('The type of action to search for.'),
      limit: z.number().optional().default(10).describe('The maximum number of log entries to return.'),
    }),
    outputSchema: z.string().describe('A markdown table of logs with columns: UserID, Action, Details, Timestamp.'),
  },
  async (input) => {
    return fetchAuditLogs(input);
  }
);

// Tool to get pre-verified payments
export const getPreVerifiedPayments = ai.defineTool(
  {
    name: 'getPreVerifiedPayments',
    description: 'Fetches a list of all available (unclaimed) pre-verified payment credits. Returns data in a markdown table.',
    inputSchema: z.object({}),
    outputSchema: z.string().describe('A markdown table of available credits with columns: Transaction ID, Amount, Currency, Date Added.'),
  },
  async () => {
    return fetchPreVerifiedPayments();
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

// Tool to update a user's role
export const changeUserRole = ai.defineTool(
  {
    name: 'changeUserRole',
    description: "Updates a user's role. Requires the user's email and the new role.",
    inputSchema: z.object({
      email: z.string().email().describe("The email address of the user to update."),
      newRole: z.enum(['User', 'Assistant', 'Admin', 'SuperAdmin']).describe("The new role to assign."),
    }),
    outputSchema: z.object({
      success: z.boolean(),
      message: z.string(),
    }),
  },
  async (input) => {
    return updateUserRole(input);
  }
);

// Tool to suspend a user
export const suspendUserAccount = ai.defineTool(
    {
        name: 'suspendUserAccount',
        description: 'Suspends or re-activates a user account. Requires the user email and the suspension status.',
        inputSchema: z.object({
            email: z.string().email().describe('The email address of the user to update.'),
            suspend: z.boolean().describe('Set to true to suspend, false to re-activate.'),
        }),
        outputSchema: z.object({
            success: z.boolean(),
            message: z.string(),
        }),
    },
    async (input) => {
        return suspendUser(input);
    }
);

// Tool to activate a license
export const activateLicense = ai.defineTool(
    {
        name: 'activateLicense',
        description: 'Manually activates a game license for a specific user. Grants 100 rounds.',
        inputSchema: z.object({
            email: z.string().email().describe('The email address of the user.'),
            gameId: z.enum(['vip-slip', 'aviator', 'crash', 'mines-gems']).describe('The ID of the game to activate.'),
        }),
        outputSchema: z.object({
            success: z.boolean(),
            message: z.string(),
        }),
    },
    async (input) => {
        return activateLicenseForUser(input);
    }
);
