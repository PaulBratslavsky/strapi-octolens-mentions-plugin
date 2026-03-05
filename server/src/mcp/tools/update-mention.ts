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
