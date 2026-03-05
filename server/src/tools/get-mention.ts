import type { Core } from '@strapi/strapi';
import { GetMentionSchema } from '../mcp/schemas';
import { sanitizeOutput } from '../mcp/utils/sanitize';
import type { ToolDefinition } from './index';

const MENTION_UID = 'plugin::octalens-mentions.mention';

async function execute(args: unknown, strapi: Core.Strapi): Promise<unknown> {
  const validatedArgs = GetMentionSchema.parse(args);
  const { documentId } = validatedArgs;

  const result = await strapi.documents(MENTION_UID as any).findOne({
    documentId,
  });

  if (!result) {
    return {
      error: true,
      message: `Mention with document ID "${documentId}" not found`,
    };
  }

  const sanitizedResult = await sanitizeOutput(strapi, result);

  return {
    data: sanitizedResult,
  };
}

export const getMentionTool: ToolDefinition = {
  name: 'getMention',
  description:
    'Get full details of a single social mention by document ID. ' +
    'Returns title, body, source, author, sentiment, and all metadata.',
  schema: GetMentionSchema,
  execute,
  publicSafe: true,
};
