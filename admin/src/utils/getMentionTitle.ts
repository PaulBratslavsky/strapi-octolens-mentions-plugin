/**
 * Gets the display title for a mention.
 * If title is empty or "Untitled", uses the first 100 characters from body.
 *
 * @param title - The mention title
 * @param body - The mention body content
 * @returns The display title
 */
export function getMentionTitle(title: string, body: string): string {
  if (!title || title.trim() === '' || title.toLowerCase() === 'untitled') {
    if (!body) return 'Untitled';

    const excerpt = body.substring(0, 100).trim();
    return excerpt.length === 100 ? `${excerpt}...` : excerpt;
  }

  return title;
}
