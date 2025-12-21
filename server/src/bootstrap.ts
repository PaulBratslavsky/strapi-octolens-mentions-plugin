import type { Core } from '@strapi/strapi';
import { createMcpServer } from './mcp/server';

const bootstrap = async ({ strapi }: { strapi: Core.Strapi }) => {
  const config = strapi.config.get('plugin.octalens-mentions', { enabled: true });

  if (!config.enabled) {
    strapi.log.info('[octalens-mentions] Plugin disabled by configuration');
    return;
  }

  // Store the server factory function - we'll create server+transport per session
  const plugin = strapi.plugin('octalens-mentions') as any;
  plugin.createMcpServer = () => createMcpServer(strapi);
  plugin.sessions = new Map(); // Track active sessions

  strapi.log.info('[octalens-mentions] MCP plugin initialized');
  strapi.log.info('[octalens-mentions] MCP endpoint available at: /api/octalens-mentions/mcp');
};

export default bootstrap;
