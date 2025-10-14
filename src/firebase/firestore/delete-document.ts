'use client';

import { deleteDoc, DocumentReference, FirestoreError } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

/**
 * Deletes a Firestore document without blocking the UI. It includes optimistic UI updates
 * and handles permission errors by emitting a global event.
 *
 * @param docRef The DocumentReference of the document to delete.
 */
export function deleteDocumentNonBlocking(docRef: DocumentReference): void {
  deleteDoc(docRef)
    .catch(async (serverError: FirestoreError) => {
      // Create a rich, contextual error for better debugging.
      const permissionError = new FirestorePermissionError({
        path: docRef.path,
        operation: 'delete',
      });

      // Emit the error to a global listener (e.g., to be caught by a root error boundary).
      errorEmitter.emit('permission-error', permissionError);
    });
}
