/**
 * Centralized API response messages.
 * Edit this file to change any user-facing message without touching controller logic.
 */
export const messages = {
  common: {
    validationFailed: 'validation failed',
    notFound: 'not found',
    forbidden: 'forbidden',
    internalError: 'internal server error',
  },
  auth: {
    registered: 'Registration successful',
    loggedIn: 'Login successful',
    emailInUse: 'email already in use',
    invalidCredentials: 'invalid credentials',
  },
  project: {
    listed: 'Projects retrieved successfully',
    created: 'Project created successfully',
    fetched: 'Project retrieved successfully',
    updated: 'Project updated successfully',
    deleted: 'Project deleted successfully',
    statsRetrieved: 'Project statistics retrieved successfully',
  },
  task: {
    listed: 'Tasks retrieved successfully',
    fetched: 'Task retrieved successfully',
    created: 'Task created successfully',
    updated: 'Task updated successfully',
    deleted: 'Task deleted successfully',
  },
} as const
