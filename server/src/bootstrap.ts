import type { Core } from '@strapi/strapi';
import { createMcpServer } from './mcp/server';

const bootstrap = async ({ strapi }: { strapi: Core.Strapi }) => {
  try {
    // Store the server factory function - we'll create server+transport per session
    const plugin = strapi.plugin('octalens-mentions') as any;

    if (!plugin) {
      strapi.log.error('[octalens-mentions] Plugin not found - check strapi.name in package.json');
      return;
    }

    plugin.createMcpServer = () => createMcpServer(strapi);
    plugin.sessions = new Map(); // Track active sessions

    strapi.log.info('[octalens-mentions] MCP plugin initialized');
    strapi.log.info('[octalens-mentions] MCP endpoint available at: /api/octalens-mentions/mcp');
  } catch (error) {
    strapi.log.error('[octalens-mentions] Bootstrap failed:', {
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

export default bootstrap;
