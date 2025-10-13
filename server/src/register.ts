import type { Core } from '@strapi/strapi';

const register = ({ strapi }: { strapi: Core.Strapi }) => {
  // Register middleware to log raw request bodies for debugging
  strapi.server.use(async (ctx, next) => {
    if (ctx.path === '/api/octalens-mentions/ingest' && ctx.method === 'POST') {
      console.log('=== INGEST REQUEST RECEIVED ===');
      console.log('Path:', ctx.path);
      console.log('Method:', ctx.method);
      console.log('Content-Type:', ctx.request.headers['content-type']);

      // Log raw body if available
      if (ctx.request.body) {
        console.log('Parsed Body:', JSON.stringify(ctx.request.body, null, 2));
      }
      console.log('=================================');
    }

    await next();
  });
};

export default register;
