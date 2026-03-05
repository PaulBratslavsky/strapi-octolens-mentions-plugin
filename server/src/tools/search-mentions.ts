import type { Core } from '@strapi/strapi';
import { SearchMentionsSchema } from '../mcp/schemas';
import { sanitizeOutput } from '../mcp/utils/sanitize';
import type { ToolDefinition } from './index';

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
    const docsWithTerm = mentions.filter((mention) => {
      const titleTokens = tokenize(mention.title || '');
      const bodyTokens = tokenize(mention.body || '');
      return titleTokens.includes(term) || bodyTokens.includes(term);
    }).length;

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

  const docLength = titleTokens.length * titleWeight + bodyTokens.length;

  const tf = new Map<string, number>();

  for (const token of titleTokens) {
    tf.set(token, (tf.get(token) || 0) + titleWeight);
  }

  for (const token of bodyTokens) {
    tf.set(token, (tf.get(token) || 0) + 1);
  }

  let score = 0;

  for (const term of queryTokens) {
    const termFreq = tf.get(term) || 0;
    const termIdf = idf.get(term) || 0;

    if (termFreq > 0) {
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
// Canonical Tool Definition
// ============================================================================

async function execute(args: unknown, strapi: Core.Strapi): Promise<unknown> {
  const validatedArgs = SearchMentionsSchema.parse(args);
  const { query, source, author, keyword, sentimentLabel, bookmarked, viewName, subreddit, page, pageSize, sort } =
    validatedArgs;

  const TITLE_WEIGHT = 2;

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

  // If query is provided, use BM25 ranking
  if (query) {
    const queryTokens = tokenize(query);

    if (queryTokens.length === 0) {
      return {
        error: true,
        message: 'Query is empty or contains only single-character words.',
        query,
      };
    }

    // Fetch all mentions matching other filters (we need full corpus for BM25)
    const allMentions = await strapi.documents(MENTION_UID as any).findMany({
      filters,
      limit: 1000,
    });

    if (allMentions.length === 0) {
      return {
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
        filters: { source, author, keyword, sentimentLabel, bookmarked, viewName, subreddit },
      };
    }

    const vocabulary = new Set(queryTokens);
    const mentionDocs = allMentions as unknown as MentionDocument[];

    const idf = calculateIDF(mentionDocs, vocabulary, TITLE_WEIGHT);
    const avgDocLength = calculateAvgDocLength(mentionDocs, TITLE_WEIGHT);

    const scoredMentions: ScoredMention[] = allMentions.map((mention: any) => ({
      ...mention,
      bm25Score: bm25Score(mention as MentionDocument, queryTokens, idf, avgDocLength, TITLE_WEIGHT),
    }));

    const rankedMentions = scoredMentions
      .filter((m) => m.bm25Score > 0)
      .sort((a, b) => b.bm25Score - a.bm25Score);

    const total = rankedMentions.length;
    const startIndex = (page - 1) * pageSize;
    const paginatedResults = rankedMentions.slice(startIndex, startIndex + pageSize);

    const sanitizedResults = await sanitizeOutput(strapi, paginatedResults);
    const resultsWithScores = sanitizedResults.map((mention: any, index: number) => ({
      ...mention,
      bm25Score: Math.round(paginatedResults[index].bm25Score * 100) / 100,
    }));

    return {
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
      filters: { source, author, keyword, sentimentLabel, bookmarked, viewName, subreddit },
    };
  }

  // No query provided - use standard database query with sort
  const results = await strapi.documents(MENTION_UID as any).findMany({
    filters,
    sort: sort ? [sort] : ['createdAt:desc'],
    limit: pageSize,
    start: (page - 1) * pageSize,
  });

  const total = await strapi.documents(MENTION_UID as any).count({ filters });
  const sanitizedResults = await sanitizeOutput(strapi, results);

  return {
    data: sanitizedResults,
    pagination: {
      page,
      pageSize,
      total,
      pageCount: Math.ceil(total / pageSize),
    },
    filters: { source, author, keyword, sentimentLabel, bookmarked, viewName, subreddit },
  };
}

export const searchMentionsTool: ToolDefinition = {
  name: 'searchMentions',
  description:
    'Search social mentions using BM25 relevance scoring. ' +
    'Title matches are weighted 2x higher than body. ' +
    'Supports filtering by source, author, keyword, sentiment, bookmark status, view, and subreddit.',
  schema: SearchMentionsSchema,
  execute,
  publicSafe: true,
};
