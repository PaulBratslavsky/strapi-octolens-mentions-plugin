import type { Core } from '@strapi/strapi';

export default (config, { strapi }: { strapi: Core.Strapi }) => {
  return async (ctx, next) => {
    // Only log for ingest endpoint
    if (ctx.path === '/api/octalens-mentions/ingest' && ctx.method === 'POST') {
      const chunks: Buffer[] = [];

      ctx.req.on('data', (chunk: Buffer) => {
        chunks.push(chunk);
      });

      ctx.req.on('end', () => {
        const rawBody = Buffer.concat(chunks).toString('utf8');
        console.log('=== RAW REQUEST BODY ===');
        console.log(rawBody);
        console.log('=== END RAW REQUEST BODY ===');
      });
    }

    await next();
  };
};
