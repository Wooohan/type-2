
import { User, FacebookPage, Conversation, Message, ApprovedLink, ApprovedMedia } from '../types';

/**
 * API Service
 * Now routes through internal /api/db serverless bridge 
 * using the official MongoDB Node.js Driver.
 */

class APIService {
  private apiPath: string = '/api/db';

  /**
   * Performs a request to the internal backend bridge.
   */
  private async atlasRequest(action: string, collection: string, body: any) {
    const response = await fetch(this.apiPath, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action,
        collection,
        ...body
      })
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error || `Internal DB Error: ${response.statusText}`);
    }
    return result;
  }

  async ping(): Promise<boolean> {
    try {
      const res = await this.atlasRequest('ping', 'agents', {});
      return res.ok === true;
    } catch (e) {
      console.error("Atlas Driver Connection Failed:", e);
      return false;
    }
  }

  async getAll<T>(collection: string, filter: any = {}): Promise<T[]> {
    const result = await this.atlasRequest('find', collection, { filter });
    return result.documents || [];
  }

  async put<T>(collection: string, item: T): Promise<void> {
    const id = (item as any).id;
    await this.atlasRequest('updateOne', collection, {
      filter: { id: id },
      update: { $set: item },
      upsert: true
    });
  }

  async delete(collection: string, id: string): Promise<void> {
    await this.atlasRequest('deleteOne', collection, { filter: { id: id } });
  }

  async clearStore(collection: string): Promise<void> {
    await this.atlasRequest('deleteMany', collection, { filter: {} });
  }

  // Fix for error in AppContext.tsx: Added setCredentials method for interface compatibility
  setCredentials(endpoint: string, key: string): void {
    // In this implementation, the bridge endpoint is static (/api/db) 
    // and credentials are securely managed server-side.
    console.debug('Cloud configuration requested, using internal driver bridge.');
  }

  // Not strictly needed for logic, but keeping for compatibility
  isConfigured(): boolean {
    return true; 
  }
}

export const apiService = new APIService();
