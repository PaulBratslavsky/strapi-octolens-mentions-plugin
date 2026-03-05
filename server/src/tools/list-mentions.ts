import type { Core } from '@strapi/strapi';
import { ListMentionsSchema } from '../mcp/schemas';
import { sanitizeOutput } from '../mcp/utils/sanitize';
import type { ToolDefinition } from './index';

const MENTION_UID = 'plugin::octalens-mentions.mention';

async function execute(args: unknown, strapi: Core.Strapi): Promise<unknown> {
  const validatedArgs = ListMentionsSchema.parse(args);
  const { page, pageSize, sort } = validatedArgs;

  const results = await strapi.documents(MENTION_UID as any).findMany({
    sort: sort ? [sort] : ['createdAt:desc'],
    limit: pageSize,
    start: (page - 1) * pageSize,
  });

  const total = await strapi.documents(MENTION_UID as any).count({});
  const sanitizedResults = await sanitizeOutput(strapi, results);

  return {
    data: sanitizedResults,
    pagination: {
      page,
      pageSize,
      total,
      pageCount: Math.ceil(total / pageSize),
    },
  };
}

export const listMentionsTool: ToolDefinition = {
  name: 'listMentions',
  description:
    'List all social mentions with pagination. ' +
    'Returns newest first by default. Use searchMentions for filtering.',
  schema: ListMentionsSchema,
  execute,
  publicSafe: true,
};
