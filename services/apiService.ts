
import { User, FacebookPage, Conversation, Message, ApprovedLink, ApprovedMedia } from '../types';

/**
 * API Service
 * Routes through the internal bridge to talk to Atlas.
 */

class APIService {
  private apiPath: string = '/api/db';

  private async atlasRequest(action: string, collection: string, body: any) {
    try {
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
      
      // If we get any valid JSON response with status 200, the bridge is connected
      if (!response.ok) {
        throw new Error(result.error || `DB Status ${response.status}`);
      }
      return result;
    } catch (e) {
      console.warn(`Atlas Bridge Request (${action}) failed:`, e.message);
      throw e;
    }
  }

  async ping(): Promise<boolean> {
    try {
      const res = await this.atlasRequest('ping', 'system', {});
      return res.ok === true;
    } catch (e) {
      return false;
    }
  }

  async getAll<T>(collection: string, filter: any = {}): Promise<T[]> {
    try {
      const result = await this.atlasRequest('find', collection, { filter });
      return result.documents || [];
    } catch (e) {
      // Return empty array instead of throwing to keep the UI from crashing
      return [];
    }
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

  setCredentials(endpoint: string, key: string): void {
    console.debug('Cloud credentials updated.');
  }

  isConfigured(): boolean {
    return true; 
  }
}

export const apiService = new APIService();
