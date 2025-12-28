import { FirebaseError } from 'firebase/app';

// Error message mapping for user-friendly feedback
export const getFirestoreErrorMessage = (error: unknown): string => {
  if (error instanceof FirebaseError) {
    switch (error.code) {
      case 'permission-denied':
        return 'You do not have permission to perform this action';
      case 'unavailable':
        return 'Network error. Please check your connection';
      case 'not-found':
        return 'The requested item was not found';
      case 'deadline-exceeded':
        return 'Request timed out. Please try again';
      case 'resource-exhausted':
        return 'Too many requests. Please wait a moment';
      case 'invalid-argument':
        return 'Unable to save. Please try again';
      case 'unauthenticated':
        return 'Please sign in to continue';
      default:
        return 'Something went wrong. Please try again';
    }
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unexpected error occurred';
};
