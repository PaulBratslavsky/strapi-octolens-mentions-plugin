import type { Core } from '@strapi/strapi';
import { getMentionTool } from '../../tools';

export { getMentionTool };

// MCP tool definition (JSON Schema format for MCP protocol)
export const getMentionToolMcp = {
  name: 'get_mention',
  description: getMentionTool.description,
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

/**
 * MCP handler -- delegates to canonical tool and wraps result in MCP envelope
 */
export async function handleGetMention(strapi: Core.Strapi, args: unknown) {
  const result = await getMentionTool.execute(args, strapi);

  return {
    content: [
      {
        type: 'text' as const,
        text: JSON.stringify(result, null, 2),
      },
    ],
  };
}
