import type { Core } from '@strapi/strapi';
import type { z } from 'zod';

export interface ToolDefinition {
  name: string;
  description: string;
  schema: z.ZodObject<any>;
  execute: (args: unknown, strapi: Core.Strapi, context?: { adminUserId?: number }) => Promise<unknown>;
  internal?: boolean;
  publicSafe?: boolean;
}

import { searchMentionsTool } from './search-mentions';
import { listMentionsTool } from './list-mentions';
import { getMentionTool } from './get-mention';
import { updateMentionTool } from './update-mention';

export const tools: ToolDefinition[] = [
  searchMentionsTool,
  listMentionsTool,
  getMentionTool,
  updateMentionTool,
];

export { searchMentionsTool, listMentionsTool, getMentionTool, updateMentionTool };
