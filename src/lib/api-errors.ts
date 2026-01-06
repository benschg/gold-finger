/**
 * Sanitize database errors to prevent information leakage.
 * Logs the actual error server-side but returns a generic message to clients.
 */
export function sanitizeDbError(error: unknown, context?: string): string {
  // Log the full error server-side for debugging
  if (context) {
    console.error(`Database error in ${context}:`, error);
  } else {
    console.error("Database error:", error);
  }

  // Return generic message to client
  return "An error occurred while processing your request";
}
