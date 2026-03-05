import type { Core } from '@strapi/strapi';
import { searchMentionsTool } from '../../tools';

export { searchMentionsTool };

// MCP tool definition (JSON Schema format for MCP protocol)
export const searchMentionsToolMcp = {
  name: 'search_mentions',
  description: searchMentionsTool.description,
  inputSchema: {
    type: 'object' as const,
    properties: {
      query: {
        type: 'string',
        description:
          'Search query - uses BM25 algorithm to find and rank relevant mentions by title and body content. More specific queries yield better results.',
      },
      source: {
        type: 'string',
        description: 'Filter by source (e.g., "reddit", "twitter", "hackernews")',
      },
      author: {
        type: 'string',
        description: 'Filter by author name',
      },
      keyword: {
        type: 'string',
        description: 'Filter by keyword',
      },
      sentimentLabel: {
        type: 'string',
        description: 'Filter by sentiment (e.g., "positive", "negative", "neutral")',
      },
      bookmarked: {
        type: 'boolean',
        description: 'Filter by bookmarked status',
      },
      viewName: {
        type: 'string',
        description: 'Filter by view name',
      },
      subreddit: {
        type: 'string',
        description: 'Filter by subreddit (for Reddit mentions)',
      },
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
        description: 'Sort order (e.g., "createdAt:desc", "relevanceScore:desc")',
      },
    },
    required: [],
  },
};

/**
 * MCP handler -- delegates to canonical tool and wraps result in MCP envelope
 */
export async function handleSearchMentions(strapi: Core.Strapi, args: unknown) {
  const result = await searchMentionsTool.execute(args, strapi);

  return {
    content: [
      {
        type: 'text' as const,
        text: JSON.stringify(result, null, 2),
      },
    ],
  };
}
