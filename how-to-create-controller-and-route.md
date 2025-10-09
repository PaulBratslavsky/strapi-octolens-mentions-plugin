# How to Create Custom Controllers and Routes in a Strapi v5 Plugin

This guide walks through creating custom controllers and routes in a Strapi v5 plugin, based on building the `octalens-mentions` plugin.

## Overview

We built a plugin that:
1. Stores mention data from external sources (like Reddit)
2. Provides API endpoints to retrieve and create mentions
3. Uses both content-api routes (for CRUD operations) and custom routes (for data ingestion)

## Project Structure

```
plugins/octalens-mentions/
├── server/
│   └── src/
│       ├── content-types/
│       │   └── mention/
│       │       ├── index.ts
│       │       └── schema.json
│       ├── controllers/
│       │   ├── index.ts
│       │   ├── mention/
│       │   │   └── index.ts
│       │   └── ingest/
│       │       └── index.ts
│       ├── services/
│       │   ├── index.ts
│       │   └── mention.ts
│       └── routes/
│           ├── index.ts
│           └── content-api.ts
```

## Step 1: Define Your Content Type Schema

First, define the data structure for your content type in `server/src/content-types/mention/schema.json`:

```json
{
  "kind": "collectionType",
  "collectionName": "mention",
  "info": {
    "singularName": "mention",
    "pluralName": "mentions",
    "displayName": "Mention"
  },
  "options": {
    "draftAndPublish": false
  },
  "pluginOptions": {
    "content-manager": {
      "visible": true
    },
    "content-type-builder": {
      "visible": true
    }
  },
  "attributes": {
    "action": { "type": "string" },
    "title": { "type": "string" },
    "body": { "type": "text" },
    "url": { "type": "string" },
    "timestamp": { "type": "string" },
    "imageUrl": { "type": "string" },
    "author": { "type": "string" },
    "authorProfileLink": { "type": "string" },
    "source": { "type": "string" },
    "sourceId": { "type": "string" },
    "relevanceScore": { "type": "string" },
    "relevanceComment": { "type": "text" },
    "keyword": { "type": "string" },
    "bookmarked": { "type": "boolean", "default": false },
    "language": { "type": "string" },
    "sentimentLabel": { "type": "string" },
    "viewId": { "type": "integer" },
    "viewName": { "type": "string" },
    "subreddit": { "type": "string" }
  }
}
```

**Key Points:**
- `kind`: "collectionType" for multiple entries, "singleType" for single entry
- `collectionName`: Database table name
- `attributes`: Define all fields with their types (string, text, boolean, integer, etc.)
- Set `draftAndPublish: false` if you don't need draft/publish workflow

Export the schema in `server/src/content-types/mention/index.ts`:

```typescript
import schema from './schema.json';

export default {
  schema,
};
```

Then export from `server/src/content-types/index.ts`:

```typescript
import mention from './mention';

export default {
  mention,
};
```

## Step 2: Create the Service

Services contain the business logic. For basic CRUD operations, use Strapi's factory function.

Create `server/src/services/mention.ts`:

```typescript
'use strict';

const { createCoreService } = require('@strapi/strapi').factories;

export default createCoreService('plugin::octalens-mentions.mention');
```

**Important:** The UID format is `plugin::{plugin-name}.{content-type-name}`. Make sure the plugin name matches your `package.json`.

Export from `server/src/services/index.ts`:

```typescript
import mention from './mention';

export default {
  mention,
};
```

## Step 3: Create Controllers

### Standard CRUD Controller

For standard CRUD operations, use the factory function.

Create `server/src/controllers/mention/index.ts`:

```typescript
'use strict';

const { createCoreController } = require('@strapi/strapi').factories;

export default createCoreController('plugin::octalens-mentions.mention');
```

### Custom Controller

For custom logic (like data ingestion), create a custom controller.

Create `server/src/controllers/ingest/index.ts`:

```typescript
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
```

Export both controllers from `server/src/controllers/index.ts`:

```typescript
import mention from './mention';
import ingest from './ingest';

export default {
  mention,
  ingest
};
```

## Step 4: Define Routes

### Content API Routes

Content API routes are for standard CRUD operations on your content type.

Create `server/src/routes/content-api.ts`:

```typescript
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
    handler: 'ingest.ingest'
  }
];
```

### Main Routes Configuration

Create `server/src/routes/index.ts`:

```typescript
import contentApi from "./content-api";

export default {
  "content-api": {
    type: "content-api",
    routes: [...contentApi],
  },
};
```

**Route Types:**
- `content-api`: Routes accessible via `/api/{plugin-name}/{path}`
- `admin`: Routes only accessible in admin panel

## Step 5: Common Issues and Solutions

### Issue 1: "Cannot read properties of undefined (reading 'kind')"

**Problem:** Using `type: 'content-api'` without a proper content type or service.

**Solution:**
- Ensure your content type schema has a `kind` property
- Make sure your service is created and exported
- Verify the plugin name matches in all UIDs

### Issue 2: "Cannot read properties of undefined (reading 'find')"

**Problem:** Controller references a service that doesn't exist.

**Solution:** Create the matching service using `createCoreService`.

### Issue 3: Inconsistent handler names

**Problem:** Routes use different controller names (e.g., `mention.find` vs `mentions.find`).

**Solution:**
- Controller names should match the key in `controllers/index.ts`
- Use singular form consistently: `mention.find`, `mention.findOne`, etc.

### Issue 4: Plugin name mismatch

**Problem:** UID uses wrong plugin name (e.g., `plugin::octalens-mention.mention` when plugin is `octalens-mentions`).

**Solution:**
- Check `package.json` for the correct plugin name under `strapi.name`
- Update all UIDs to use the correct plugin name

## API Usage

Once set up, your endpoints will be available at:

```
GET    /api/octalens-mentions/mentions          # List all mentions
GET    /api/octalens-mentions/mentions/:id      # Get single mention
POST   /api/octalens-mentions/mentions          # Create mention
PUT    /api/octalens-mentions/mentions/:id      # Update mention
DELETE /api/octalens-mentions/mentions/:id      # Delete mention
POST   /api/octalens-mentions/ingest            # Custom ingest endpoint
```

### Example Request to Ingest Endpoint:

```json
POST /api/octalens-mentions/ingest

{
  "action": "mention_created",
  "data": {
    "title": "Great Strapi Plugin",
    "body": "This is a detailed post about Strapi...",
    "url": "https://example.com/post",
    "author": "username",
    "source": "reddit",
    "sourceId": "abc123",
    "timestamp": "2025-10-08 12:00:00",
    "relevanceScore": "high",
    "keyword": "strapi",
    "subreddit": "r/Strapi"
  }
}
```

## Best Practices

1. **Use Factory Functions:** For standard CRUD, always use `createCoreController` and `createCoreService`
2. **Consistent Naming:** Keep controller, service, and route names consistent
3. **Error Handling:** Always wrap service calls in try-catch blocks
4. **Validation:** Validate incoming data before processing
5. **Optional Chaining:** Use `?.` for safer property access
6. **Type Safety:** Use TypeScript types from `@strapi/strapi`

## Troubleshooting Checklist

- [ ] Content type schema has `kind` property
- [ ] Service exists and is exported
- [ ] Controller exists and is exported
- [ ] Route handlers match controller method names
- [ ] Plugin name in UIDs matches `package.json`
- [ ] All imports/exports are correct
- [ ] Strapi server restarted after changes

## Additional Resources

- [Strapi Plugin Development Docs](https://docs.strapi.io/dev-docs/plugins-development)
- [Server API Reference](https://docs.strapi.io/dev-docs/api/plugins/server-api)
- [Content Type Schema](https://docs.strapi.io/dev-docs/backend-customization/models)
