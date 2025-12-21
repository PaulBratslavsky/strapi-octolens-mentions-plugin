import type { Core } from '@strapi/strapi';

// Import tool definitions and handlers
import { searchMentionsTool, handleSearchMentions } from './search-mentions';
import { listMentionsTool, handleListMentions } from './list-mentions';
import { getMentionTool, handleGetMention } from './get-mention';
import { updateMentionTool, handleUpdateMention } from './update-mention';

// Export all tool definitions
export const tools = [searchMentionsTool, listMentionsTool, getMentionTool, updateMentionTool];

// Tool handler registry
const toolHandlers: Record<string, (strapi: Core.Strapi, args: unknown) => Promise<any>> = {
  search_mentions: handleSearchMentions,
  list_mentions: handleListMentions,
  get_mention: handleGetMention,
  update_mention: handleUpdateMention,
};

/**
 * Handle a tool call by delegating to the appropriate handler
 */
export async function handleToolCall(
  strapi: Core.Strapi,
  request: { params: { name: string; arguments?: Record<string, unknown> } }
) {
  const { name, arguments: args } = request.params;

  const handler = toolHandlers[name];
  if (!handler) {
    throw new Error(`Unknown tool: ${name}`);
  }

  const startTime = Date.now();
  try {
    const result = await handler(strapi, args || {});
    const duration = Date.now() - startTime;

    // Log successful execution
    strapi.log.debug(`[octalens-mentions] Tool ${name} executed successfully in ${duration}ms`);

    return result;
  } catch (error) {
    const duration = Date.now() - startTime;

    // Log failed execution
    strapi.log.error(`[octalens-mentions] Tool ${name} failed after ${duration}ms`, {
      error: error instanceof Error ? error.message : String(error),
    });

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify(
            {
              error: true,
              message: error instanceof Error ? error.message : String(error),
              tool: name,
            },
            null,
            2
          ),
        },
      ],
    };
  }
}
