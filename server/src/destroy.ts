import type { Core } from '@strapi/strapi';

const destroy = async ({ strapi }: { strapi: Core.Strapi }) => {
  try {
    const plugin = strapi.plugin('octalens-mentions') as any;

    // Close all active sessions
    if (plugin.sessions) {
      for (const [sessionId, session] of plugin.sessions) {
        try {
          if (session.server) await session.server.close();
          if (session.transport) await session.transport.close();
        } catch (e) {
          strapi.log.warn(`[octalens-mentions] Error closing session ${sessionId}`);
        }
      }
      plugin.sessions.clear();
      strapi.log.info('[octalens-mentions] All MCP sessions closed');
    }

    // Clear references
    plugin.createMcpServer = null;
    plugin.sessions = null;
  } catch (error) {
    strapi.log.error('[octalens-mentions] Error during cleanup', {
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

export default destroy;
