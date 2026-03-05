import type { Core } from '@strapi/strapi';
import { listMentionsTool } from '../../tools';

export { listMentionsTool };

// MCP tool definition (JSON Schema format for MCP protocol)
export const listMentionsToolMcp = {
  name: 'list_mentions',
  description: listMentionsTool.description,
  inputSchema: {
    type: 'object' as const,
    properties: {
      page: {
        type: 'number',
        description: 'Page number (starts at 1)',
      },
      pageSize: {
        type: 'number',
        description: 'Items per page (max 100)',
      },
      sort: {
        type: 'string',
        description: 'Sort order (e.g., "createdAt:desc", "createdAt:asc")',
      },
    },
    required: [],
  },
};

/**
 * MCP handler -- delegates to canonical tool and wraps result in MCP envelope
 */
export async function handleListMentions(strapi: Core.Strapi, args: unknown) {
  const result = await listMentionsTool.execute(args, strapi);

  return {
    content: [
      {
        type: 'text' as const,
        text: JSON.stringify(result, null, 2),
      },
    ],
  };
}
