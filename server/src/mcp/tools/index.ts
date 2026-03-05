import type { Core } from '@strapi/strapi';

// Import MCP tool definitions and handlers
import { searchMentionsToolMcp, handleSearchMentions } from './search-mentions';
import { listMentionsToolMcp, handleListMentions } from './list-mentions';
import { getMentionToolMcp, handleGetMention } from './get-mention';
import { updateMentionToolMcp, handleUpdateMention } from './update-mention';
import { recordResponseTool, handleRecordResponse } from './record-response';
import { listResponsesTool, handleListResponses } from './list-responses';
import { getResponseTool, handleGetResponse } from './get-response';

// Export all MCP tool definitions (JSON Schema format for MCP protocol)
export const tools = [
  searchMentionsToolMcp,
  listMentionsToolMcp,
  getMentionToolMcp,
  updateMentionToolMcp,
  recordResponseTool,
  listResponsesTool,
  getResponseTool,
];

// Tool handler registry
const toolHandlers: Record<string, (strapi: Core.Strapi, args: unknown) => Promise<any>> = {
  search_mentions: handleSearchMentions,
  list_mentions: handleListMentions,
  get_mention: handleGetMention,
  update_mention: handleUpdateMention,
  record_response: handleRecordResponse,
  list_responses: handleListResponses,
  get_response: handleGetResponse,
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

    strapi.log.debug(`[octalens-mentions] Tool ${name} executed successfully in ${duration}ms`);

    return result;
  } catch (error) {
    const duration = Date.now() - startTime;

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
