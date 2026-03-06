import { z } from 'zod';

// Schema for search_mentions tool
export const SearchMentionsSchema = z.object({
  query: z.string().optional().describe('Search query to filter mentions by title or body content'),
  source: z.string().optional().describe('Filter by source (e.g., "reddit", "twitter", "hackernews")'),
  author: z.string().optional().describe('Filter by author name'),
  keyword: z.string().optional().describe('Filter by keyword'),
  sentimentLabel: z.string().optional().describe('Filter by sentiment (e.g., "positive", "negative", "neutral")'),
  bookmarked: z.boolean().optional().describe('Filter by bookmarked status'),
  viewName: z.string().optional().describe('Filter by view name'),
  subreddit: z.string().optional().describe('Filter by subreddit'),
  page: z.number().int().min(1).optional().default(1).describe('Page number (starts at 1)'),
  pageSize: z.number().int().min(1).max(100).optional().default(25).describe('Items per page'),
  sort: z.string().optional().default('createdAt:desc').describe('Sort order (e.g., "createdAt:desc", "relevanceScore:desc")'),
});

// Schema for list_mentions tool
export const ListMentionsSchema = z.object({
  page: z.number().int().min(1).optional().default(1),
  pageSize: z.number().int().min(1).max(100).optional().default(25),
  sort: z.string().optional().default('createdAt:desc'),
});

// Schema for get_mention tool
export const GetMentionSchema = z.object({
  documentId: z.string().min(1, 'Document ID is required'),
});

// Schema for update_mention tool
export const UpdateMentionSchema = z.object({
  documentId: z.string().min(1).describe('The documentId of the mention to update'),
  bookmarked: z.boolean().optional().describe('Set bookmark status'),
  action: z.enum(['answered', 'pending', 'ignored']).optional().describe('Set action status'),
});

// Schema for record_response tool
export const RecordResponseSchema = z.object({
  mentionDocumentId: z.string().min(1, 'Mention document ID is required'),
  responseText: z.string().min(1, 'Response text is required'),
  platform: z.string().optional().describe('Platform where response was posted'),
  responseUrl: z.string().optional().describe('URL to the posted response'),
  status: z.enum(['draft', 'posted']).optional().default('draft'),
  notes: z.string().optional().describe('Internal notes'),
});

// Schema for list_responses tool
export const ListResponsesSchema = z.object({
  page: z.number().int().min(1).optional().default(1),
  pageSize: z.number().int().min(1).max(100).optional().default(25),
  status: z.enum(['draft', 'posted', 'failed']).optional(),
  platform: z.string().optional(),
  sort: z.string().optional().default('createdAt:desc'),
});

// Schema for get_response tool
export const GetResponseSchema = z.object({
  documentId: z.string().min(1, 'Document ID is required'),
});

// Type exports
export type SearchMentionsInput = z.infer<typeof SearchMentionsSchema>;
export type ListMentionsInput = z.infer<typeof ListMentionsSchema>;
export type GetMentionInput = z.infer<typeof GetMentionSchema>;
export type UpdateMentionInput = z.infer<typeof UpdateMentionSchema>;
export type RecordResponseInput = z.infer<typeof RecordResponseSchema>;
export type ListResponsesInput = z.infer<typeof ListResponsesSchema>;
export type GetResponseInput = z.infer<typeof GetResponseSchema>;

// All schemas for easy lookup
export const ToolSchemas = {
  search_mentions: SearchMentionsSchema,
  list_mentions: ListMentionsSchema,
  get_mention: GetMentionSchema,
  update_mention: UpdateMentionSchema,
  record_response: RecordResponseSchema,
  list_responses: ListResponsesSchema,
  get_response: GetResponseSchema,
} as const;

type ToolName = keyof typeof ToolSchemas;

// Validation helper function
export function validateToolInput<T extends ToolName>(
  toolName: T,
  input: unknown
): z.infer<(typeof ToolSchemas)[T]> {
  const schema = ToolSchemas[toolName];
  const result = schema.safeParse(input);

  if (!result.success) {
    const errorMessages = result.error.issues.map((err) => {
      const path = err.path.length > 0 ? `${err.path.join('.')}: ` : '';
      return `${path}${err.message}`;
    });
    throw new Error(`Validation failed for ${toolName}:\n${errorMessages.join('\n')}`);
  }

  return result.data as z.infer<(typeof ToolSchemas)[T]>;
}
