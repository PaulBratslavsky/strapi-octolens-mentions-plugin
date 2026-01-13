import type { Core } from '@strapi/strapi';
import { validateToolInput } from '../schemas';
import { sanitizeOutput, sanitizeInput } from '../utils/sanitize';

const MENTION_UID = 'plugin::octalens-mentions.mention';
const RESPONSE_UID = 'plugin::octalens-mentions.response';

export const recordResponseTool = {
  name: 'record_response',
  description:
    'Record a response to a mention. Saves the response text and links it to the original mention. This also updates the mention action status to "responded".',
  inputSchema: {
    type: 'object' as const,
    properties: {
      mentionDocumentId: {
        type: 'string',
        description: 'The document ID of the mention being responded to',
      },
      responseText: {
        type: 'string',
        description: 'The full text of the response',
      },
      platform: {
        type: 'string',
        description: 'Where the response was/will be posted (reddit, twitter, etc.). Defaults to the mention source.',
      },
      responseUrl: {
        type: 'string',
        description: 'Optional URL to the posted response',
      },
      status: {
        type: 'string',
        enum: ['draft', 'posted'],
        description: 'Status of the response (draft = prepared but not posted, posted = already shared). Defaults to draft.',
      },
      notes: {
        type: 'string',
        description: 'Optional internal notes about this response',
      },
    },
    required: ['mentionDocumentId', 'responseText'],
  },
};

export async function handleRecordResponse(strapi: Core.Strapi, args: unknown) {
  const validatedArgs = validateToolInput('record_response', args);
  const { mentionDocumentId, responseText, platform, responseUrl, status, notes } = validatedArgs;

  try {
    // 1. Validate mention exists
    const mention = await strapi.documents(MENTION_UID as any).findOne({
      documentId: mentionDocumentId,
    });

    if (!mention) {
      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(
              {
                error: true,
                message: `Mention with document ID "${mentionDocumentId}" not found`,
              },
              null,
              2
            ),
          },
        ],
      };
    }

    // 2. Sanitize input data
    const responseData = await sanitizeInput(strapi, {
      responseText,
      platform: platform || mention.source,
      responseUrl,
      status: status || 'draft',
      respondedAt: new Date().toISOString(),
      notes,
    });

    // 3. Create response record linked to mention
    const response = await strapi.documents(RESPONSE_UID as any).create({
      data: {
        ...responseData,
        mention: mention.id,
      },
    });

    // 4. Update mention action status to "responded"
    const mentionUpdateData = await sanitizeInput(strapi, { action: 'responded' });
    await strapi.documents(MENTION_UID as any).update({
      documentId: mentionDocumentId,
      data: mentionUpdateData,
    });

    // 5. Sanitize output
    const sanitizedResponse = await sanitizeOutput(strapi, response);

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify(
            {
              success: true,
              data: sanitizedResponse,
              message: `Response recorded successfully for mention "${mentionDocumentId}"`,
            },
            null,
            2
          ),
        },
      ],
    };
  } catch (error) {
    strapi.log.error('[octalens-mentions] Record response failed', {
      error: error instanceof Error ? error.message : String(error),
      mentionDocumentId,
    });
    throw error;
  }
}
