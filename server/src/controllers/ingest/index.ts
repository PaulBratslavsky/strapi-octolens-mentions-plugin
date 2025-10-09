import type { Core } from '@strapi/strapi';

const controller = ({ strapi }: { strapi: Core.Strapi }) => ({
  async ingest(ctx) {
    const requestBody = ctx.request.body;

    if (!requestBody?.data) return ctx.badRequest('Missing data in request body');

    const mentionData = {
      action: requestBody.action,
      title: requestBody.data?.title || '',
      body: requestBody.data?.body || '',
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
      viewId: requestBody.data?.viewId || null,
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
