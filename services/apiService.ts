
import { User, FacebookPage, Conversation, Message, ApprovedLink, ApprovedMedia } from '../types';

class APIService {
  private apiPath: string = '/api/db';
  private dbName: string = localStorage.getItem('messengerflow_db_name') || 'MessengerFlow';

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
          dbName: this.dbName, // Always include the target database
          ...body
        })
      });

      let result;
      try {
        result = await response.json();
      } catch (parseErr) {
        throw new Error(`Cloud Error: ${response.status} (Handshake Failed)`);
      }
      
      if (!response.ok) {
        throw new Error(result.error || `DB Status ${response.status}`);
      }
      return result;
    } catch (e) {
      console.warn(`Atlas bridge request failed for ${action}:`, e.message);
      throw e;
    }
  }

  setDatabase(name: string) {
    this.dbName = name;
    localStorage.setItem('messengerflow_db_name', name);
  }

  getDatabaseName() {
    return this.dbName;
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

  setCredentials(endpoint: string, key: string): void {}
  isConfigured(): boolean { return true; }
}

export const apiService = new APIService();
