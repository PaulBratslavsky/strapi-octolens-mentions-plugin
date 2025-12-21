import type { Core } from '@strapi/strapi';
import { validateToolInput } from '../schemas';
import { sanitizeOutput, sanitizeInput } from '../utils/sanitize';

const MENTION_UID = 'plugin::octalens-mentions.mention';

export const updateMentionTool = {
  name: 'update_mention',
  description:
    'Update a mention by its document ID. Use this to bookmark mentions or update their action status (e.g., mark as "answered", "pending", "ignored").',
  inputSchema: {
    type: 'object' as const,
    properties: {
      documentId: {
        type: 'string',
        description: 'The document ID of the mention to update',
      },
      data: {
        type: 'object',
        description: 'Fields to update on the mention',
        properties: {
          bookmarked: {
            type: 'boolean',
            description: 'Whether the mention is bookmarked',
          },
          action: {
            type: 'string',
            description: 'Action status (e.g., "answered", "pending", "ignored")',
          },
        },
      },
    },
    required: ['documentId', 'data'],
  },
};

export async function handleUpdateMention(strapi: Core.Strapi, args: unknown) {
  const validatedArgs = validateToolInput('update_mention', args);
  const { documentId, data } = validatedArgs;

  try {
    // Check if mention exists first
    const existing = await strapi.documents(MENTION_UID as any).findOne({
      documentId,
    });

    if (!existing) {
      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(
              {
                error: true,
                message: `Mention with document ID "${documentId}" not found`,
              },
              null,
              2
            ),
          },
        ],
      };
    }

    // Sanitize input
    const sanitizedData = await sanitizeInput(strapi, data);

    // Update the mention
    const result = await strapi.documents(MENTION_UID as any).update({
      documentId,
      data: sanitizedData,
    });

    // Sanitize output
    const sanitizedResult = await sanitizeOutput(strapi, result);

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify(
            {
              success: true,
              data: sanitizedResult,
              message: `Mention "${documentId}" updated successfully`,
            },
            null,
            2
          ),
        },
      ],
    };
  } catch (error) {
    strapi.log.error('[octalens-mentions] Update mention failed', {
      error: error instanceof Error ? error.message : String(error),
      documentId,
    });
    throw error;
  }
}
