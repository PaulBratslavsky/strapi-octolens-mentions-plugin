import type { Core } from '@strapi/strapi';
import { validateToolInput } from '../schemas';
import { sanitizeOutput } from '../utils/sanitize';

const MENTION_UID = 'plugin::octalens-mentions.mention';

export const getMentionTool = {
  name: 'get_mention',
  description:
    'Get a single mention by its document ID. Returns full details of the mention including title, body, author, source, sentiment, and all other metadata.',
  inputSchema: {
    type: 'object' as const,
    properties: {
      documentId: {
        type: 'string',
        description: 'The document ID of the mention to retrieve',
      },
    },
    required: ['documentId'],
  },
};

export async function handleGetMention(strapi: Core.Strapi, args: unknown) {
  const validatedArgs = validateToolInput('get_mention', args);
  const { documentId } = validatedArgs;

  try {
    const result = await strapi.documents(MENTION_UID as any).findOne({
      documentId,
    });

    if (!result) {
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

    // Sanitize output
    const sanitizedResult = await sanitizeOutput(strapi, result);

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify(
            {
              data: sanitizedResult,
            },
            null,
            2
          ),
        },
      ],
    };
  } catch (error) {
    strapi.log.error('[octalens-mentions] Get mention failed', {
      error: error instanceof Error ? error.message : String(error),
      documentId,
    });
    throw error;
  }
}
