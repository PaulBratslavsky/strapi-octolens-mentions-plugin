export default [
  {
    method: 'GET',
    path: '/mentions',
    handler: 'mention.find',
    config: {
      policies: ['admin::isAuthenticatedAdmin'],
    },
  },
];
