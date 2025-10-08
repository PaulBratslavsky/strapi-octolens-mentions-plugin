export default [
  {
    method: 'GET',
    path: '/mentions',
    handler: 'mention.find',
    config: {
      policies: [],
    },
  },
  {
    method: 'GET',
    path: '/mentions/:id',
    handler: 'mention.findOne',
    config: {
      policies: [],
    },
  },
  {
    method: 'DELETE',
    path: '/mentions/:id',
    handler: 'mention.delete',
    config: {
      policies: [],
    },
  },
  {
    method: 'PUT',
    path: '/mentions/:id',
    handler: 'mention.update',
    config: {
      policies: [],
    },
  },
  {
    method: 'POST',
    path: '/mentions',
    handler: 'mention.create',
    config: {
      policies: [],
    },
  },
];
