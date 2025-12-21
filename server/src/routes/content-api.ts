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
  {
    method: 'POST',
    path: '/ingest',
    handler: 'ingest.ingest',
  },
  // MCP routes
  {
    method: 'POST',
    path: '/mcp',
    handler: 'mcp.handle',
    config: {
      policies: [],
      auth: false,
    },
  },
  {
    method: 'GET',
    path: '/mcp',
    handler: 'mcp.handle',
    config: {
      policies: [],
      auth: false,
    },
  },
  {
    method: 'DELETE',
    path: '/mcp',
    handler: 'mcp.handle',
    config: {
      policies: [],
      auth: false,
    },
  },
];
