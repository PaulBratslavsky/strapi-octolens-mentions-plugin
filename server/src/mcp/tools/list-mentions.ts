import type { Core } from '@strapi/strapi';
import { validateToolInput } from '../schemas';
import { sanitizeOutput } from '../utils/sanitize';

const MENTION_UID = 'plugin::octalens-mentions.mention';

export const listMentionsTool = {
  name: 'list_mentions',
  description:
    'List all social mentions with pagination. Returns a paginated list of mentions sorted by creation date (newest first by default). Use search_mentions for filtering.',
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

export async function handleListMentions(strapi: Core.Strapi, args: unknown) {
  const validatedArgs = validateToolInput('list_mentions', args);
  const { page, pageSize, sort } = validatedArgs;

  try {
    const results = await strapi.documents(MENTION_UID as any).findMany({
      sort: sort ? [sort] : ['createdAt:desc'],
      limit: pageSize,
      start: (page - 1) * pageSize,
    });

    // Get total count for pagination info
    const total = await strapi.documents(MENTION_UID as any).count({});

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
            },
            null,
            2
          ),
        },
      ],
    };
  } catch (error) {
    strapi.log.error('[octalens-mentions] List mentions failed', {
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}
