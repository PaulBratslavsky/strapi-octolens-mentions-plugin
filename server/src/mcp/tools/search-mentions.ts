import type { Core } from '@strapi/strapi';
import { validateToolInput } from '../schemas';
import { sanitizeOutput } from '../utils/sanitize';

const MENTION_UID = 'plugin::octalens-mentions.mention';

// ============================================================================
// BM25 Search Algorithm Implementation
// ============================================================================

interface MentionDocument {
  documentId: string;
  title: string;
  body: string;
  [key: string]: any;
}

interface ScoredMention extends MentionDocument {
  bm25Score: number;
}

/**
 * Tokenize text into lowercase words, removing punctuation and short words
 */
function tokenize(text: string): string[] {
  if (!text) return [];
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter((word) => word.length > 1);
}

/**
 * Calculate IDF (Inverse Document Frequency) for each term
 * Uses BM25 IDF formula: log((N - n + 0.5) / (n + 0.5) + 1)
 */
function calculateIDF(
  mentions: MentionDocument[],
  vocabulary: Set<string>,
  titleWeight: number = 2
): Map<string, number> {
  const idf = new Map<string, number>();
  const N = mentions.length;

  for (const term of vocabulary) {
    // Count documents containing this term (in title or body)
    const docsWithTerm = mentions.filter((mention) => {
      const titleTokens = tokenize(mention.title || '');
      const bodyTokens = tokenize(mention.body || '');
      return titleTokens.includes(term) || bodyTokens.includes(term);
    }).length;

    // BM25 IDF formula
    idf.set(term, Math.log((N - docsWithTerm + 0.5) / (docsWithTerm + 0.5) + 1));
  }

  return idf;
}

/**
 * Calculate BM25 score for a mention against a query
 * Supports field weighting (title weighted higher than body)
 */
function bm25Score(
  mention: MentionDocument,
  queryTokens: string[],
  idf: Map<string, number>,
  avgDocLength: number,
  titleWeight: number = 2,
  k1: number = 1.5,
  b: number = 0.75
): number {
  const titleTokens = tokenize(mention.title || '');
  const bodyTokens = tokenize(mention.body || '');

  // Combined document length (weighted)
  const docLength = titleTokens.length * titleWeight + bodyTokens.length;

  // Count term frequencies with title weighting
  const tf = new Map<string, number>();

  // Title terms count more (weighted by titleWeight)
  for (const token of titleTokens) {
    tf.set(token, (tf.get(token) || 0) + titleWeight);
  }

  // Body terms count normally
  for (const token of bodyTokens) {
    tf.set(token, (tf.get(token) || 0) + 1);
  }

  let score = 0;

  for (const term of queryTokens) {
    const termFreq = tf.get(term) || 0;
    const termIdf = idf.get(term) || 0;

    if (termFreq > 0) {
      // BM25 scoring formula
      const numerator = termFreq * (k1 + 1);
      const denominator = termFreq + k1 * (1 - b + b * (docLength / avgDocLength));
      score += termIdf * (numerator / denominator);
    }
  }

  return score;
}

/**
 * Calculate average document length across all mentions (with title weighting)
 */
function calculateAvgDocLength(mentions: MentionDocument[], titleWeight: number = 2): number {
  if (mentions.length === 0) return 1;

  const totalLength = mentions.reduce((sum, mention) => {
    const titleLen = tokenize(mention.title || '').length;
    const bodyLen = tokenize(mention.body || '').length;
    return sum + titleLen * titleWeight + bodyLen;
  }, 0);

  return totalLength / mentions.length;
}

// ============================================================================
// Tool Definition
// ============================================================================

export const searchMentionsTool = {
  name: 'search_mentions',
  description:
    'Search through social mentions using BM25 relevance scoring. Returns results ranked by relevance when a query is provided. Supports filtering by source, author, sentiment, and more. Title matches are weighted higher than body matches for better relevance.',
  inputSchema: {
    type: 'object' as const,
    properties: {
      query: {
        type: 'string',
        description:
          'Search query - uses BM25 algorithm to find and rank relevant mentions by title and body content. More specific queries yield better results.',
      },
      source: {
        type: 'string',
        description: 'Filter by source (e.g., "reddit", "twitter", "hackernews")',
      },
      author: {
        type: 'string',
        description: 'Filter by author name',
      },
      keyword: {
        type: 'string',
        description: 'Filter by keyword',
      },
      sentimentLabel: {
        type: 'string',
        description: 'Filter by sentiment (e.g., "positive", "negative", "neutral")',
      },
      bookmarked: {
        type: 'boolean',
        description: 'Filter by bookmarked status',
      },
      viewName: {
        type: 'string',
        description: 'Filter by view name',
      },
      subreddit: {
        type: 'string',
        description: 'Filter by subreddit (for Reddit mentions)',
      },
      page: {
        type: 'number',
        description: 'Page number (starts at 1)',
      },
      pageSize: {
        type: 'number',
        description: 'Items per page (max 100)',
      },
      sort: {
        type: 'string',
        description: 'Sort order (e.g., "createdAt:desc", "relevanceScore:desc")',
      },
    },
    required: [],
  },
};

export async function handleSearchMentions(strapi: Core.Strapi, args: unknown) {
  const validatedArgs = validateToolInput('search_mentions', args);
  const { query, source, author, keyword, sentimentLabel, bookmarked, viewName, subreddit, page, pageSize, sort } =
    validatedArgs;

  // BM25 configuration
  const TITLE_WEIGHT = 2; // Title matches count 2x more than body matches

  // Build filters for non-text fields
  const filters: Record<string, any> = {};

  if (source) {
    filters.source = { $eqi: source };
  }

  if (author) {
    filters.author = { $containsi: author };
  }

  if (keyword) {
    filters.keyword = { $containsi: keyword };
  }

  if (sentimentLabel) {
    filters.sentimentLabel = { $eqi: sentimentLabel };
  }

  if (bookmarked !== undefined) {
    filters.bookmarked = bookmarked;
  }

  if (viewName) {
    filters.viewName = { $containsi: viewName };
  }

  if (subreddit) {
    filters.subreddit = { $containsi: subreddit };
  }

  try {
    // If query is provided, use BM25 ranking
    if (query) {
      const queryTokens = tokenize(query);

      if (queryTokens.length === 0) {
        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify(
                {
                  error: true,
                  message: 'Query is empty or contains only single-character words.',
                  query,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      // Fetch all mentions matching other filters (we need full corpus for BM25)
      // We use a higher limit to ensure we have enough data for good BM25 scoring
      const allMentions = await strapi.documents(MENTION_UID as any).findMany({
        filters,
        limit: 1000, // Get up to 1000 mentions for BM25 corpus
      });

      if (allMentions.length === 0) {
        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify(
                {
                  data: [],
                  pagination: {
                    page,
                    pageSize,
                    total: 0,
                    pageCount: 0,
                  },
                  searchInfo: {
                    query,
                    algorithm: 'BM25',
                    matchingResults: 0,
                  },
                  filters: {
                    source,
                    author,
                    keyword,
                    sentimentLabel,
                    bookmarked,
                    viewName,
                    subreddit,
                  },
                },
                null,
                2
              ),
            },
          ],
        };
      }

      // Build vocabulary from query terms
      const vocabulary = new Set(queryTokens);

      // Cast mentions to our interface (Strapi returns generic type)
      const mentionDocs = allMentions as unknown as MentionDocument[];

      // Calculate IDF across all documents
      const idf = calculateIDF(mentionDocs, vocabulary, TITLE_WEIGHT);

      // Calculate average document length
      const avgDocLength = calculateAvgDocLength(mentionDocs, TITLE_WEIGHT);

      // Score all mentions using BM25
      const scoredMentions: ScoredMention[] = allMentions.map((mention: any) => ({
        ...mention,
        bm25Score: bm25Score(mention as MentionDocument, queryTokens, idf, avgDocLength, TITLE_WEIGHT),
      }));

      // Filter out zero-score results and sort by BM25 score (descending)
      const rankedMentions = scoredMentions
        .filter((m) => m.bm25Score > 0)
        .sort((a, b) => b.bm25Score - a.bm25Score);

      // Apply pagination to ranked results
      const total = rankedMentions.length;
      const startIndex = (page - 1) * pageSize;
      const paginatedResults = rankedMentions.slice(startIndex, startIndex + pageSize);

      // Sanitize output and format scores
      const sanitizedResults = await sanitizeOutput(strapi, paginatedResults);
      const resultsWithScores = sanitizedResults.map((mention: any, index: number) => ({
        ...mention,
        bm25Score: Math.round(paginatedResults[index].bm25Score * 100) / 100,
      }));

      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(
              {
                data: resultsWithScores,
                pagination: {
                  page,
                  pageSize,
                  total,
                  pageCount: Math.ceil(total / pageSize),
                },
                searchInfo: {
                  query,
                  algorithm: 'BM25',
                  titleWeight: TITLE_WEIGHT,
                  matchingResults: total,
                  corpusSize: allMentions.length,
                  hint:
                    total > 0
                      ? 'Results are ranked by relevance. Higher bm25Score indicates better match. Title matches are weighted higher than body matches.'
                      : 'No matches found. Try different or fewer keywords.',
                },
                filters: {
                  source,
                  author,
                  keyword,
                  sentimentLabel,
                  bookmarked,
                  viewName,
                  subreddit,
                },
              },
              null,
              2
            ),
          },
        ],
      };
    }

    // No query provided - use standard database query with sort
    const results = await strapi.documents(MENTION_UID as any).findMany({
      filters,
      sort: sort ? [sort] : ['createdAt:desc'],
      limit: pageSize,
      start: (page - 1) * pageSize,
    });

    // Get total count for pagination info
    const total = await strapi.documents(MENTION_UID as any).count({ filters });

    // Sanitize output
    const sanitizedResults = await sanitizeOutput(strapi, results);

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify(
            {
              data: sanitizedResults,
              pagination: {
                page,
                pageSize,
                total,
                pageCount: Math.ceil(total / pageSize),
              },
              filters: {
                source,
                author,
                keyword,
                sentimentLabel,
                bookmarked,
                viewName,
                subreddit,
              },
            },
            null,
            2
          ),
        },
      ],
    };
  } catch (error) {
    strapi.log.error('[octalens-mentions] Search mentions failed', {
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}
