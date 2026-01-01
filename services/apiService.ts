
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
          dbName: this.dbName,
          ...body
        })
      });

      const result = await response.json();
      
      if (!response.ok) {
        // Pass the detailed error from the backend up to the UI
        throw new Error(result.error || `DB Connection Error (${response.status})`);
      }
      return result;
    } catch (e) {
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

  async manualWriteToTest(): Promise<boolean> {
    try {
      // Force write to the collection 'Test' shown in user screenshot
      const result = await this.atlasRequest('updateOne', 'Test', {
        filter: { id: 'verification_test' },
        update: { 
          $set: { 
            id: 'verification_test',
            timestamp: new Date().toISOString(),
            portal_status: 'ACTIVE',
            message: 'Write successful from MessengerFlow Portal'
          } 
        },
        upsert: true
      });
      return result.ok === true;
    } catch (e) {
      throw e;
    }
  }

  async testWrite(): Promise<boolean> {
    try {
      const result = await this.atlasRequest('updateOne', 'provisioning_logs', {
        filter: { id: 'heartbeat' },
        update: { 
          $set: { 
            id: 'heartbeat', 
            timestamp: new Date().toISOString(), 
            status: 'SUCCESS'
          } 
        },
        upsert: true
      });
      return result.ok === true;
    } catch (e) {
      throw e;
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
