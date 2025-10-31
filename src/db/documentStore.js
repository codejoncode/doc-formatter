import Dexie from 'dexie';

/**
 * DocumentStore - IndexedDB storage for offline document editing
 * Provides persistence, version control, and auto-save functionality
 */
class DocumentStore extends Dexie {
  constructor() {
    super('DocFormatterDB');
    
    this.version(1).stores({
      documents: '++id, name, created, updated, size, metadata',
      chunks: '++id, documentId, chunkIndex, type, content',
      changes: '++id, documentId, timestamp, change, synced',
      versions: '++id, documentId, name, content, timestamp'
    });

    this.documents = this.table('documents');
    this.chunks = this.table('chunks');
    this.changes = this.table('changes');
    this.versions = this.table('versions');
  }

  /**
   * Save a complete document with chunks
   */
  async saveDocument(documentName, chunks, metadata = {}) {
    try {
      // Save document metadata
      const documentId = await this.documents.add({
        name: documentName,
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
        size: JSON.stringify(chunks).length,
        metadata
      });

      // Save all chunks
      const chunkPromises = chunks.map((chunk, index) =>
        this.chunks.add({
          documentId,
          chunkIndex: index,
          type: chunk.type,
          content: chunk.content,
          metadata: chunk.metadata
        })
      );

      await Promise.all(chunkPromises);

      // Create initial version
      await this.createVersion(documentId, 'Initial version', chunks);

      return documentId;
    } catch (error) {
      console.error('Error saving document:', error);
      throw error;
    }
  }

  /**
   * Load a document by ID
   */
  async loadDocument(documentId) {
    try {
      const document = await this.documents.get(documentId);
      if (!document) throw new Error('Document not found');

      const chunks = await this.chunks
        .where('documentId')
        .equals(documentId)
        .sortBy('chunkIndex');

      return {
        document,
        chunks: chunks.map(chunk => ({
          id: chunk.id,
          type: chunk.type,
          content: chunk.content,
          metadata: chunk.metadata
        }))
      };
    } catch (error) {
      console.error('Error loading document:', error);
      throw error;
    }
  }

  /**
   * Update a specific chunk
   */
  async updateChunk(chunkId, newContent, metadata = {}) {
    try {
      const chunk = await this.chunks.get(chunkId);
      if (!chunk) throw new Error('Chunk not found');

      // Log the change
      await this.changes.add({
        documentId: chunk.documentId,
        timestamp: new Date().toISOString(),
        change: {
          chunkId,
          oldContent: chunk.content,
          newContent,
          type: 'update'
        },
        synced: false
      });

      // Update the chunk
      await this.chunks.update(chunkId, {
        content: newContent,
        metadata: { ...chunk.metadata, ...metadata }
      });

      // Update document timestamp
      await this.documents.update(chunk.documentId, {
        updated: new Date().toISOString()
      });

      return true;
    } catch (error) {
      console.error('Error updating chunk:', error);
      throw error;
    }
  }

  /**
   * Update entire document chunks
   */
  async updateDocument(documentId, chunks) {
    try {
      // Delete existing chunks
      await this.chunks.where('documentId').equals(documentId).delete();

      // Add new chunks
      const chunkPromises = chunks.map((chunk, index) =>
        this.chunks.add({
          documentId,
          chunkIndex: index,
          type: chunk.type,
          content: chunk.content,
          metadata: chunk.metadata
        })
      );

      await Promise.all(chunkPromises);

      // Update document metadata
      await this.documents.update(documentId, {
        updated: new Date().toISOString(),
        size: JSON.stringify(chunks).length
      });

      // Log the change
      await this.changes.add({
        documentId,
        timestamp: new Date().toISOString(),
        change: {
          type: 'bulk-update',
          chunkCount: chunks.length
        },
        synced: false
      });

      return true;
    } catch (error) {
      console.error('Error updating document:', error);
      throw error;
    }
  }

  /**
   * Create a version snapshot
   */
  async createVersion(documentId, versionName, chunks) {
    try {
      await this.versions.add({
        documentId,
        name: versionName,
        content: JSON.stringify(chunks),
        timestamp: new Date().toISOString()
      });

      return true;
    } catch (error) {
      console.error('Error creating version:', error);
      throw error;
    }
  }

  /**
   * Get all versions of a document
   */
  async getVersions(documentId) {
    try {
      const versions = await this.versions
        .where('documentId')
        .equals(documentId)
        .reverse()
        .sortBy('timestamp');

      return versions;
    } catch (error) {
      console.error('Error getting versions:', error);
      throw error;
    }
  }

  /**
   * Restore a specific version
   */
  async restoreVersion(versionId) {
    try {
      const version = await this.versions.get(versionId);
      if (!version) throw new Error('Version not found');

      const chunks = JSON.parse(version.content);
      await this.updateDocument(version.documentId, chunks);

      return chunks;
    } catch (error) {
      console.error('Error restoring version:', error);
      throw error;
    }
  }

  /**
   * Get all documents (for list view)
   */
  async getAllDocuments() {
    try {
      return await this.documents.reverse().sortBy('updated');
    } catch (error) {
      console.error('Error getting documents:', error);
      throw error;
    }
  }

  /**
   * Delete a document and all related data
   */
  async deleteDocument(documentId) {
    try {
      await this.documents.delete(documentId);
      await this.chunks.where('documentId').equals(documentId).delete();
      await this.changes.where('documentId').equals(documentId).delete();
      await this.versions.where('documentId').equals(documentId).delete();

      return true;
    } catch (error) {
      console.error('Error deleting document:', error);
      throw error;
    }
  }

  /**
   * Get unsaved changes count
   */
  async getUnsyncedChangesCount(documentId) {
    try {
      return await this.changes
        .where('[documentId+synced]')
        .equals([documentId, false])
        .count();
    } catch (error) {
      console.error('Error getting unsynced changes:', error);
      return 0;
    }
  }

  /**
   * Mark changes as synced
   */
  async markChangesSynced(documentId) {
    try {
      await this.changes
        .where('[documentId+synced]')
        .equals([documentId, false])
        .modify({ synced: true });

      return true;
    } catch (error) {
      console.error('Error marking changes as synced:', error);
      throw error;
    }
  }

  /**
   * Clear all data (for testing/reset)
   */
  async clearAll() {
    try {
      await this.documents.clear();
      await this.chunks.clear();
      await this.changes.clear();
      await this.versions.clear();

      return true;
    } catch (error) {
      console.error('Error clearing database:', error);
      throw error;
    }
  }

  /**
   * Get storage usage statistics
   */
  async getStorageStats() {
    try {
      const documentsCount = await this.documents.count();
      const chunksCount = await this.chunks.count();
      const versionsCount = await this.versions.count();
      const changesCount = await this.changes.count();

      // Estimate size (rough calculation)
      const allChunks = await this.chunks.toArray();
      const estimatedSize = allChunks.reduce((total, chunk) => 
        total + JSON.stringify(chunk).length, 0
      );

      return {
        documents: documentsCount,
        chunks: chunksCount,
        versions: versionsCount,
        unsyncedChanges: changesCount,
        estimatedSize: Math.round(estimatedSize / 1024), // KB
        maxSize: 50 * 1024 // 50MB typical limit
      };
    } catch (error) {
      console.error('Error getting storage stats:', error);
      return null;
    }
  }
}

// Create singleton instance
const documentStore = new DocumentStore();

// Helper hook for React components
export const useDocumentStore = () => {
  return documentStore;
};

export default documentStore;
