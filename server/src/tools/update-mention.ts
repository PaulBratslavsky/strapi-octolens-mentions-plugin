import type { Core } from '@strapi/strapi';
import { UpdateMentionSchema } from '../mcp/schemas';
import { sanitizeOutput, sanitizeInput } from '../mcp/utils/sanitize';
import type { ToolDefinition } from './index';

const MENTION_UID = 'plugin::octalens-mentions.mention';

async function execute(args: unknown, strapi: Core.Strapi): Promise<unknown> {
  const validatedArgs = UpdateMentionSchema.parse(args);
  const { documentId, data } = validatedArgs;

  // Check if mention exists first
  const existing = await strapi.documents(MENTION_UID as any).findOne({
    documentId,
  });

  if (!existing) {
    return {
      error: true,
      message: `Mention with document ID "${documentId}" not found`,
    };
  }

  const sanitizedData = await sanitizeInput(strapi, data);

  const result = await strapi.documents(MENTION_UID as any).update({
    documentId,
    data: sanitizedData,
  });

  const sanitizedResult = await sanitizeOutput(strapi, result);

  return {
    success: true,
    data: sanitizedResult,
    message: `Mention "${documentId}" updated successfully`,
  };
}

export const updateMentionTool: ToolDefinition = {
  name: 'updateMention',
  description:
    'Update a social mention. Can set bookmark status (true/false) ' +
    'and action (answered, pending, ignored).',
  schema: UpdateMentionSchema,
  execute,
  publicSafe: false,
};
