import { ContentRegistryItem } from './types';

/**
 * Retrieves contextually relevant quick replies based on the matched emotion content.
 * @param content The matched content registry item
 * @returns An array of string chips for quick replies
 */
export function getQuickReplies(content?: ContentRegistryItem): string[] {
  if (content && content.quickReplies && content.quickReplies.length > 0) {
    return content.quickReplies;
  }
  
  // Safe default fallback replies if nothing is matched
  return ['I need more time to think', 'Alhamdulillah', 'Thank you'];
}
