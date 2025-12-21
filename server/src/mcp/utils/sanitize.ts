import type { Core } from '@strapi/strapi';

const MENTION_UID = 'plugin::octalens-mentions.mention';

/**
 * Sanitize output data using Strapi's content API sanitizer
 * This removes private fields, applies field-level permissions, and filters based on auth
 */
export async function sanitizeOutput(
  strapi: Core.Strapi,
  data: any,
  auth?: { credentials?: any; ability?: any }
): Promise<any> {
  if (!data) return data;

  const contentType = strapi.contentType(MENTION_UID as any);
  if (!contentType) {
    throw new Error(`Content type "${MENTION_UID}" not found. Cannot sanitize output.`);
  }

  try {
    const sanitized = await strapi.contentAPI.sanitize.output(data, contentType, { auth });
    return sanitized;
  } catch (error) {
    strapi.log.error('[octalens-mentions] Output sanitization failed', {
      error: error instanceof Error ? error.message : String(error),
    });
    throw new Error(`Failed to sanitize output. Data not returned for security.`);
  }
}

/**
 * Sanitize input data before writing to database
 */
export async function sanitizeInput(
  strapi: Core.Strapi,
  data: any,
  auth?: { credentials?: any; ability?: any }
): Promise<any> {
  if (!data) return data;

  const contentType = strapi.contentType(MENTION_UID as any);
  if (!contentType) {
    throw new Error(`Content type "${MENTION_UID}" not found. Cannot sanitize input.`);
  }

  try {
    const sanitized = await strapi.contentAPI.sanitize.input(data, contentType, { auth });
    return sanitized;
  } catch (error) {
    strapi.log.error('[octalens-mentions] Input sanitization failed', {
      error: error instanceof Error ? error.message : String(error),
    });
    throw new Error(`Failed to sanitize input. Write operation aborted for security.`);
  }
}
