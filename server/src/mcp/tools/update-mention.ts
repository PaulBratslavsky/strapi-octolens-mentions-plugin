import type { Core } from '@strapi/strapi';
import { updateMentionTool } from '../../tools';

export { updateMentionTool };

// MCP tool definition (JSON Schema format for MCP protocol)
export const updateMentionToolMcp = {
  name: 'update_mention',
  description: updateMentionTool.description,
  inputSchema: {
    type: 'object' as const,
    properties: {
      documentId: {
        type: 'string',
        description: 'The document ID of the mention to update',
      },
      bookmarked: {
        type: 'boolean',
        description: 'Set bookmark status',
      },
      action: {
        type: 'string',
        enum: ['answered', 'pending', 'ignored'],
        description: 'Set action status',
      },
    },
    required: ['documentId'],
  },
};

/**
 * MCP handler -- delegates to canonical tool and wraps result in MCP envelope
 */
export async function handleUpdateMention(strapi: Core.Strapi, args: unknown) {
  const result = await updateMentionTool.execute(args, strapi);

  return {
    content: [
      {
        type: 'text' as const,
        text: JSON.stringify(result, null, 2),
      },
    ],
  };
}
