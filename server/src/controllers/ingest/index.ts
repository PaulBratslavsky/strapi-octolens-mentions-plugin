import type { Core } from '@strapi/strapi';

/**
 * Gets the display title for a mention.
 * If title is empty or "Untitled", uses the first 100 characters from body.
 */
function getMentionTitle(title: string, body: string): string {
  if (!title || title.trim() === '' || title.toLowerCase() === 'untitled') {
    if (!body) return 'Untitled';

    const excerpt = body.substring(0, 100).trim();
    return excerpt.length === 100 ? `${excerpt}...` : excerpt;
  }

  return title;
}

const controller = ({ strapi }: { strapi: Core.Strapi }) => ({
  async ingest(ctx) {
    // Log raw request for debugging
    console.log('Raw request body:', JSON.stringify(ctx.request.body, null, 2));

    console.log('###############################');
    console.log('Raw mention data:', ctx.request.body);
    console.log('###############################');

    const requestBody = ctx.request.body;

    if (!requestBody?.data) return ctx.badRequest('Missing data in request body');

    ctx.body = { data: requestBody?.data };

    const rawTitle = requestBody.data?.title || '';
    const rawBody = requestBody.data?.body || '';
    const generatedTitle = getMentionTitle(rawTitle, rawBody);

    const mentionData = {
      action: requestBody.action,
      title: generatedTitle,
      body: rawBody,
      url: requestBody.data?.url || '',
      timestamp: requestBody.data?.timestamp || '',
      imageUrl: requestBody.data?.imageUrl || '',
      author: requestBody.data?.author || '',
      authorProfileLink: requestBody.data?.authorProfileLink || '',
      source: requestBody.data?.source || '',
      sourceId: requestBody.data?.sourceId || '',
      relevanceScore: requestBody.data?.relevanceScore || '',
      relevanceComment: requestBody.data?.relevanceComment || '',
      keyword: requestBody.data?.keyword || '',
      bookmarked: requestBody.data?.bookmarked || false,
      language: requestBody.data?.language || '',
      sentimentLabel: requestBody.data?.sentimentLabel || '',
      viewId: requestBody.data?.viewId ? String(requestBody.data.viewId) : '',
      viewName: requestBody.data?.viewName || '',
      subreddit: requestBody.data?.subreddit || '',
    };

    console.log('###############################');
    console.log('Parsed mention data:', mentionData);
    console.log('###############################');

    try {
      const mention = await strapi.service('plugin::octalens-mentions.mention').create({
        data: mentionData,
      });

      ctx.body = { data: mention };
    } catch (error) {
      console.error('Error creating mention:', error);
      ctx.throw(500, 'Failed to create mention');
    }
  },
});

export default controller;
