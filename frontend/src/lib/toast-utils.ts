import axios from 'axios'

/**
 * Extracts the `message` field from a backend API error response.
 * Falls back to a generic message when the server is unreachable or the
 * response doesn't include a message.
 */
export function apiError(err: unknown, fallback = 'Something went wrong'): string {
  if (axios.isAxiosError(err)) {
    if (!err.response) return 'Cannot reach the server — is the backend running?'
    return (err.response.data as { message?: string })?.message ?? fallback
  }
  return fallback
}
