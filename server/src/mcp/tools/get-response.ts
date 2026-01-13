import type { Core } from '@strapi/strapi';
import { validateToolInput } from '../schemas';
import { sanitizeOutput } from '../utils/sanitize';

const RESPONSE_UID = 'plugin::octalens-mentions.response';

export const getResponseTool = {
  name: 'get_response',
  description:
    'Get a single response by its document ID. Returns full details of the response including the linked mention.',
  inputSchema: {
    type: 'object' as const,
    properties: {
      documentId: {
        type: 'string',
        description: 'The document ID of the response to retrieve',
      },
    },
    required: ['documentId'],
  },
};

export async function handleGetResponse(strapi: Core.Strapi, args: unknown) {
  const validatedArgs = validateToolInput('get_response', args);
  const { documentId } = validatedArgs;

  try {
    const result = await strapi.documents(RESPONSE_UID as any).findOne({
      documentId,
      populate: ['mention'],
    });

    if (!result) {
      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(
              {
                error: true,
                message: `Response with document ID "${documentId}" not found`,
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
    strapi.log.error('[octalens-mentions] Get response failed', {
      error: error instanceof Error ? error.message : String(error),
      documentId,
    });
    throw error;
  }
}
