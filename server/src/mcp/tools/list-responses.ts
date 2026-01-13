import type { Core } from '@strapi/strapi';
import { validateToolInput } from '../schemas';
import { sanitizeOutput } from '../utils/sanitize';

const RESPONSE_UID = 'plugin::octalens-mentions.response';

export const listResponsesTool = {
  name: 'list_responses',
  description:
    'List all recorded responses with pagination. Returns responses sorted by creation date (newest first). Can filter by status or platform.',
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
      status: {
        type: 'string',
        enum: ['draft', 'posted', 'failed'],
        description: 'Filter by response status',
      },
      platform: {
        type: 'string',
        description: 'Filter by platform (e.g., "reddit", "twitter")',
      },
      sort: {
        type: 'string',
        description: 'Sort order (e.g., "createdAt:desc", "respondedAt:desc")',
      },
    },
    required: [],
  },
};

export async function handleListResponses(strapi: Core.Strapi, args: unknown) {
  const validatedArgs = validateToolInput('list_responses', args);
  const { page, pageSize, status, platform, sort } = validatedArgs;

  try {
    // Build filters
    const filters: Record<string, any> = {};
    if (status) {
      filters.status = status;
    }
    if (platform) {
      filters.platform = { $containsi: platform };
    }

    const results = await strapi.documents(RESPONSE_UID as any).findMany({
      filters,
      sort: sort ? [sort] : ['createdAt:desc'],
      limit: pageSize,
      start: (page - 1) * pageSize,
      populate: ['mention'],
    });

    // Get total count for pagination
    const total = await strapi.documents(RESPONSE_UID as any).count({ filters });

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
    strapi.log.error('[octalens-mentions] List responses failed', {
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}
