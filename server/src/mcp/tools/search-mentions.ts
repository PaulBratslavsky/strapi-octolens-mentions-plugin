import type { Core } from '@strapi/strapi';
import { validateToolInput } from '../schemas';
import { sanitizeOutput } from '../utils/sanitize';

const MENTION_UID = 'plugin::octalens-mentions.mention';

export const searchMentionsTool = {
  name: 'search_mentions',
  description:
    'Search through social mentions with various filters. Use this to find mentions by content, source, author, sentiment, and more. Returns paginated results with full mention details.',
  inputSchema: {
    type: 'object' as const,
    properties: {
      query: {
        type: 'string',
        description: 'Search query to filter mentions by title or body content',
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

export async function handleSearchMentions(strapi: Core.Strapi, args: unknown) {
  const validatedArgs = validateToolInput('search_mentions', args);
  const { query, source, author, keyword, sentimentLabel, bookmarked, viewName, subreddit, page, pageSize, sort } =
    validatedArgs;

  // Build filters
  const filters: Record<string, any> = {};

  if (query) {
    filters.$or = [{ title: { $containsi: query } }, { body: { $containsi: query } }];
  }

  if (source) {
    filters.source = { $eqi: source };
  }

  if (author) {
    filters.author = { $containsi: author };
  }

  if (keyword) {
    filters.keyword = { $containsi: keyword };
  }

  if (sentimentLabel) {
    filters.sentimentLabel = { $eqi: sentimentLabel };
  }

  if (bookmarked !== undefined) {
    filters.bookmarked = bookmarked;
  }

  if (viewName) {
    filters.viewName = { $containsi: viewName };
  }

  if (subreddit) {
    filters.subreddit = { $containsi: subreddit };
  }

  try {
    const results = await strapi.documents(MENTION_UID as any).findMany({
      filters,
      sort: sort ? [sort] : ['createdAt:desc'],
      limit: pageSize,
      start: (page - 1) * pageSize,
    });

    // Get total count for pagination info
    const total = await strapi.documents(MENTION_UID as any).count({ filters });

    // Sanitize output
    const sanitizedResults = await sanitizeOutput(strapi, results);

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify(
            {
              data: sanitizedResults,
              pagination: {
                page,
                pageSize,
                total,
                pageCount: Math.ceil(total / pageSize),
              },
              filters: {
                query,
                source,
                author,
                keyword,
                sentimentLabel,
                bookmarked,
                viewName,
                subreddit,
              },
            },
            null,
            2
          ),
        },
      ],
    };
  } catch (error) {
    strapi.log.error('[octalens-mentions] Search mentions failed', {
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}
