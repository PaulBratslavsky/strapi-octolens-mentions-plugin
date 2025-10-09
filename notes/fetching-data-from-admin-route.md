# Fetching Data from Admin Routes in Strapi v5 Plugin

This guide demonstrates how to create admin-only API routes in your Strapi v5 plugin and fetch that data in your admin panel frontend components.

## Overview

We'll cover:
1. Creating admin-specific API routes (secured with authentication)
2. Setting up constants for API endpoints
3. Using Strapi's `useFetchClient` hook to fetch data
4. Displaying data in a React component

## Why Use Admin Routes?

Admin routes are different from content-api routes:

- **Admin routes** (`type: "admin"`):
  - Only accessible when authenticated as an admin user
  - Automatically protected by admin authentication
  - Typically used for dashboard widgets, analytics, or admin-only features
  - URL pattern: `/octalens-mentions/{path}` (no `/api/` prefix)

- **Content API routes** (`type: "content-api"`):
  - Publicly accessible (can be restricted with permissions)
  - Used for front-end applications and public APIs
  - URL pattern: `/api/octalens-mentions/{path}`

## Step 1: Create Admin API Routes

### Define the Routes

Create `server/src/routes/admin-api.ts`:

```typescript
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
```

**Key Points:**
- `method`: HTTP method (GET, POST, PUT, DELETE)
- `path`: Route path (will be prefixed with plugin name)
- `handler`: Controller method in format `{controller}.{method}`
- `policies`: Use `admin::isAuthenticatedAdmin` to ensure only logged-in admins can access

### Register Admin Routes

Update `server/src/routes/index.ts`:

```typescript
import adminApiRoutes from "./admin-api";
import contentApiRoutes from "./content-api";

export default {
  "admin-api": {
    type: "admin",
    routes: [...adminApiRoutes],
  },
  "content-api": {
    type: "content-api",
    routes: [...contentApiRoutes],
  },
};
```

**Structure:**
- Separate admin and content routes into different files
- Use `type: "admin"` for admin-only routes
- Spread the route arrays using `...`

## Step 2: Set Up Frontend Constants

Create a constants file to manage API endpoints centrally.

Create `admin/src/constants.ts`:

```typescript
const BASE_PATH = '/octalens-mentions';

export const CONSTANTS = {
  routes: {
    MENTIONS_URL: BASE_PATH + '/mentions',
  },
};
```

**Benefits:**
- Centralized endpoint management
- Easy to update if routes change
- Type-safe imports across components
- No hardcoded strings in components

**Note:** Admin routes don't use the `/api/` prefix. The path is `/octalens-mentions/mentions`, not `/api/octalens-mentions/mentions`.

## Step 3: Create the Widget Component

Create a component that fetches and displays data from your admin route.

Create `admin/src/components/MentionsWidget/index.tsx`:

```typescript
import { useEffect, useState } from 'react';
import { Box, Typography } from '@strapi/design-system';
import { useFetchClient } from '@strapi/strapi/admin';
import { CONSTANTS } from "../../constants";

interface IMention {
  documentId: string;
  title: string;
  author: string;
  source: string;
  timestamp: string;
  url: string;
}

export function MentionsWidget() {
  const { get } = useFetchClient();
  const [mentions, setMentions] = useState<IMention[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMentions = async () => {
      try {
        setLoading(true);
        const { data } = await get(CONSTANTS.routes.MENTIONS_URL);
        const mentions = data?.data;
        setMentions(mentions || []);
      } catch (error) {
        console.error('Error fetching mentions:', error);
        setError('Failed to load mentions');
      } finally {
        setLoading(false);
      }
    };

    fetchMentions();
  }, [get]);

  if (loading) {
    return (
      <Box padding={4}>
        <Typography>Loading mentions...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box padding={4}>
        <Typography textColor="danger600">{error}</Typography>
      </Box>
    );
  }

  return (
    <Box
      padding={4}
      margin={2}
      background="neutral0"
      shadow="filterShadow"
      hasRadius
    >
      <Typography variant="beta" marginBottom={2}>
        Recent Mentions ({mentions.length})
      </Typography>

      {mentions.length === 0 ? (
        <Typography textColor="neutral600">No mentions found</Typography>
      ) : (
        mentions.map((mention) => (
          <Box
            key={mention.documentId}
            padding={3}
            marginBottom={2}
            background="neutral100"
            hasRadius
          >
            <Typography fontWeight="bold">{mention.title || 'Untitled'}</Typography>
            <Typography variant="pi" textColor="neutral600">
              by {mention.author} on {mention.source}
            </Typography>
            <Typography variant="pi" textColor="neutral500">
              {new Date(mention.timestamp).toLocaleString()}
            </Typography>
            {mention.url && (
              <Typography>
                <a href={mention.url} target="_blank" rel="noopener noreferrer">
                  View original
                </a>
              </Typography>
            )}
          </Box>
        ))
      )}
    </Box>
  );
}
```

### Key Components Explained

#### 1. useFetchClient Hook

```typescript
const { get } = useFetchClient();
```

**What it does:**
- Provides authenticated HTTP client methods
- Automatically includes authentication headers
- Handles CSRF tokens
- Available methods: `get`, `post`, `put`, `delete`

**Why use it:**
- Built-in authentication handling
- Type-safe
- Consistent with Strapi's architecture
- Handles errors gracefully

#### 2. State Management

```typescript
const [mentions, setMentions] = useState<IMention[]>([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);
```

**Best practices:**
- Always track loading state
- Handle errors gracefully
- Use TypeScript interfaces for type safety

#### 3. Data Fetching with useEffect

```typescript
useEffect(() => {
  const fetchMentions = async () => {
    try {
      const { data } = await get(CONSTANTS.routes.MENTIONS_URL);
      setMentions(data?.data || []);
    } catch (error) {
      setError('Failed to load mentions');
    }
  };
  fetchMentions();
}, [get]);
```

**Important notes:**
- Include `get` in dependency array
- Use try-catch for error handling
- Set loading states appropriately
- API response structure: `{ data: { data: [...] } }`

#### 4. Strapi Design System Components

```typescript
import { Box, Typography } from '@strapi/design-system';
```

**Available components:**
- `Box`: Container with padding, margin, background
- `Typography`: Text with variants (beta, pi, etc.)
- `Button`, `Flex`, `Grid`: Layout components
- And many more...

## Step 4: Use the Widget in Your Plugin

### Option A: Add to Dashboard HomePage

Update `admin/src/pages/HomePage.tsx`:

```typescript
import { Main } from '@strapi/design-system';
import { useIntl } from 'react-intl';
import { MentionsWidget } from '../components/MentionsWidget';
import { getTranslation } from '../utils/getTranslation';

const HomePage = () => {
  const { formatMessage } = useIntl();

  return (
    <Main>
      <h1>Welcome to {formatMessage({ id: getTranslation('plugin.name') })}</h1>
      <MentionsWidget />
    </Main>
  );
};

export { HomePage };
```

### Option B: Add to Strapi Dashboard (Injection Zone)

Update `admin/src/index.ts`:

```typescript
export default {
  register(app) {
    // Register plugin...
  },

  bootstrap(app) {
    // Inject widget into dashboard
    app.injectComponent('dashboard', 'view', {
      name: 'mentions-widget',
      Component: () => import('./components/MentionsWidget'),
    });
  },
};
```

## Response Data Structure

When you make a GET request to `/octalens-mentions/mentions`, the response structure is:

```json
{
  "data": [
    {
      "id": 1,
      "documentId": "abc123",
      "title": "Great Strapi Plugin",
      "body": "Detailed content...",
      "author": "username",
      "source": "reddit",
      "timestamp": "2025-10-08T12:00:00.000Z",
      "url": "https://example.com/post",
      "createdAt": "2025-10-08T12:00:00.000Z",
      "updatedAt": "2025-10-08T12:00:00.000Z"
    }
  ],
  "meta": {
    "pagination": {
      "page": 1,
      "pageSize": 25,
      "pageCount": 1,
      "total": 1
    }
  }
}
```

**Access the data:**
```typescript
const { data } = await get(CONSTANTS.routes.MENTIONS_URL);
const mentions = data?.data; // Array of mentions
const pagination = data?.meta?.pagination; // Pagination info
```

## Common Patterns

### Pattern 1: Pagination

```typescript
const [page, setPage] = useState(1);
const [pageSize] = useState(10);

const fetchMentions = async () => {
  const { data } = await get(
    `${CONSTANTS.routes.MENTIONS_URL}?pagination[page]=${page}&pagination[pageSize]=${pageSize}`
  );
  // Handle data...
};
```

### Pattern 2: Filtering

```typescript
const fetchMentionsBySource = async (source: string) => {
  const { data } = await get(
    `${CONSTANTS.routes.MENTIONS_URL}?filters[source][$eq]=${source}`
  );
  // Handle data...
};
```

### Pattern 3: Sorting

```typescript
const fetchSortedMentions = async () => {
  const { data } = await get(
    `${CONSTANTS.routes.MENTIONS_URL}?sort[0]=timestamp:desc`
  );
  // Handle data...
};
```

### Pattern 4: Refresh Data

```typescript
const [refresh, setRefresh] = useState(0);

// Trigger refresh
const handleRefresh = () => setRefresh(prev => prev + 1);

useEffect(() => {
  fetchMentions();
}, [refresh]); // Re-fetch when refresh changes
```

## Troubleshooting

### Issue 1: 401 Unauthorized

**Problem:** Admin route returns 401 error.

**Solution:**
- Ensure you're logged into the admin panel
- Check that `admin::isAuthenticatedAdmin` policy is set
- Verify you're using `useFetchClient` (not regular fetch)

### Issue 2: 404 Not Found

**Problem:** Route not found.

**Solution:**
- Verify route is registered in `routes/index.ts`
- Check BASE_PATH doesn't include `/api/` for admin routes
- Ensure Strapi server was restarted after adding routes

### Issue 3: Data is Undefined

**Problem:** `data?.data` returns undefined.

**Solution:**
- Check API response structure in browser network tab
- Ensure controller is returning data correctly
- Verify content type has data to return

### Issue 4: CORS Errors

**Problem:** CORS policy blocking requests.

**Solution:**
- This shouldn't happen with admin routes
- If it does, check your `config/middlewares.ts`
- Ensure admin panel and API are on same origin

## Best Practices

1. **Error Handling:** Always wrap API calls in try-catch
2. **Loading States:** Show loading indicators for better UX
3. **Type Safety:** Define TypeScript interfaces for data
4. **Constants:** Centralize API endpoints in constants file
5. **Authentication:** Use admin routes for admin-only data
6. **Caching:** Consider implementing data caching for performance
7. **Cleanup:** Cancel requests in useEffect cleanup if needed

## Security Considerations

- **Admin routes** are protected by `admin::isAuthenticatedAdmin` policy
- **Never expose sensitive data** in content-api routes without proper permissions
- **Validate data** on both frontend and backend
- **Use HTTPS** in production
- **Sanitize user input** to prevent XSS attacks

## Testing Your Implementation

### 1. Test the API Route

```bash
# Use browser dev tools or Postman
# Must be logged into admin panel first
GET http://localhost:1337/octalens-mentions/mentions
```

### 2. Test in Browser Console

```javascript
// In admin panel browser console
fetch('/octalens-mentions/mentions', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('jwtToken')}`
  }
})
.then(res => res.json())
.then(console.log);
```

### 3. Check Component Rendering

- Open React DevTools
- Check component state
- Verify mentions array is populated
- Check for console errors

## Summary

Creating admin routes and fetching data in Strapi v5 plugins involves:

1. ✅ Define admin-api routes with `type: "admin"`
2. ✅ Secure routes with `admin::isAuthenticatedAdmin` policy
3. ✅ Create constants file for endpoint management
4. ✅ Use `useFetchClient` hook for authenticated requests
5. ✅ Implement proper loading and error states
6. ✅ Use Strapi Design System components for UI
7. ✅ Handle response data structure correctly

By following this pattern, you can create powerful admin widgets that display real-time data from your Strapi plugin's backend.
