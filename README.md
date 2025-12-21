# Octolens Mentions

A Strapi v5 plugin that fetches social mentions from [Octolens](https://octolens.com) and exposes them via the [Model Context Protocol (MCP)](https://modelcontextprotocol.io/), enabling AI assistants like Claude to search, analyze, and help write responses to social media mentions.

## Features

- Ingest social mentions from Octolens webhooks
- Store and manage mentions in Strapi
- MCP integration for AI-powered mention analysis
- Search and filter mentions by source, author, sentiment, and more
- Bookmark and track action status on mentions

## Installation

```bash
npm install octalens-mentions
# or
yarn add octalens-mentions
```

Add the plugin to your Strapi configuration:

```javascript
// config/plugins.js or config/plugins.ts
module.exports = {
  'octalens-mentions': {
    enabled: true,
  },
};
```

## MCP Tools

This plugin exposes the following MCP tools for AI assistants:

### `search_mentions`

Search through social mentions with various filters.

**Parameters:**
- `query` (string, optional) - Search text in title/body
- `source` (string, optional) - Filter by source (reddit, twitter, hackernews, etc.)
- `author` (string, optional) - Filter by author name
- `keyword` (string, optional) - Filter by keyword
- `sentimentLabel` (string, optional) - Filter by sentiment (positive, negative, neutral)
- `bookmarked` (boolean, optional) - Filter by bookmarked status
- `viewName` (string, optional) - Filter by view name
- `subreddit` (string, optional) - Filter by subreddit
- `page` (number, optional) - Page number (default: 1)
- `pageSize` (number, optional) - Items per page (default: 25, max: 100)
- `sort` (string, optional) - Sort order (default: "createdAt:desc")

### `list_mentions`

List all mentions with pagination.

**Parameters:**
- `page` (number, optional) - Page number (default: 1)
- `pageSize` (number, optional) - Items per page (default: 25, max: 100)
- `sort` (string, optional) - Sort order (default: "createdAt:desc")

### `get_mention`

Get a single mention by document ID.

**Parameters:**
- `documentId` (string, required) - The document ID of the mention

### `update_mention`

Update a mention's status.

**Parameters:**
- `documentId` (string, required) - The document ID of the mention
- `data` (object, required) - Fields to update
  - `bookmarked` (boolean, optional) - Bookmark status
  - `action` (string, optional) - Action status (e.g., "answered", "pending", "ignored")

## Using with Claude Desktop

Add the MCP server to your Claude Desktop configuration:

```json
{
  "mcpServers": {
    "octalens-mentions": {
      "url": "http://localhost:1337/api/octalens-mentions/mcp"
    }
  }
}
```

## API Endpoints

### REST API

- `GET /api/octalens-mentions/mentions` - List all mentions
- `GET /api/octalens-mentions/mentions/:id` - Get a single mention
- `POST /api/octalens-mentions/mentions` - Create a mention
- `PUT /api/octalens-mentions/mentions/:id` - Update a mention
- `DELETE /api/octalens-mentions/mentions/:id` - Delete a mention
- `POST /api/octalens-mentions/ingest` - Ingest a mention from Octolens webhook

### MCP Endpoint

- `POST /api/octalens-mentions/mcp` - MCP protocol endpoint
- `GET /api/octalens-mentions/mcp` - MCP protocol endpoint
- `DELETE /api/octalens-mentions/mcp` - MCP protocol endpoint

## Mention Schema

Each mention contains the following fields:

| Field | Type | Description |
|-------|------|-------------|
| `title` | string | Mention title |
| `body` | text | Mention content |
| `url` | string | Source URL |
| `author` | string | Author name |
| `authorProfileLink` | string | Author profile URL |
| `source` | string | Platform source |
| `sourceId` | string | Platform-specific ID |
| `timestamp` | string | Original timestamp |
| `imageUrl` | string | Associated image |
| `relevanceScore` | string | Relevance score |
| `relevanceComment` | text | Relevance explanation |
| `keyword` | string | Matched keyword |
| `bookmarked` | boolean | Bookmark status |
| `language` | string | Content language |
| `sentimentLabel` | string | Sentiment analysis |
| `viewId` | integer | Octolens view ID |
| `viewName` | string | Octolens view name |
| `subreddit` | string | Reddit subreddit |
| `action` | string | Action status |

## Setting up Octolens Webhook

1. Go to your Octolens dashboard
2. Navigate to Settings > Webhooks
3. Add a new webhook with URL: `https://your-strapi-url/api/octalens-mentions/ingest`
4. Select the events you want to receive

## License

MIT License - see [LICENSE](LICENSE) for details.

## Author

Paul Bratslavsky ([@codingthirty](https://twitter.com/codingthirty))
