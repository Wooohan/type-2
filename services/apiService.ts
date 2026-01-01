
import { User, FacebookPage, Conversation, Message, ApprovedLink, ApprovedMedia } from '../types';

/**
 * MongoDB Atlas Data API Client
 * This service communicates directly with the Atlas Cloud.
 * To use this, you must enable the "Data API" in your MongoDB Atlas Dashboard.
 */

class APIService {
  private endpoint: string = '';
  private apiKey: string = '';
  private cluster: string = 'Cluster0';
  private database: string = 'MessengerFlow';

  constructor() {
    // Load credentials from storage if they were previously saved in the Settings UI
    this.endpoint = localStorage.getItem('atlas_endpoint') || '';
    this.apiKey = localStorage.getItem('atlas_api_key') || '';
  }

  setCredentials(endpoint: string, apiKey: string) {
    this.endpoint = endpoint.replace(/\/$/, ""); // Remove trailing slash
    this.apiKey = apiKey;
    localStorage.setItem('atlas_endpoint', this.endpoint);
    localStorage.setItem('atlas_api_key', this.apiKey);
  }

  isConfigured(): boolean {
    return this.endpoint !== '' && this.apiKey !== '';
  }

  /**
   * Performs a real HTTPS request to the MongoDB Atlas Data API.
   */
  private async atlasRequest(action: string, collection: string, body: any) {
    if (!this.isConfigured()) {
      throw new Error("Atlas Data API not configured. Please visit Settings.");
    }

    const url = `${this.endpoint}/action/${action}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': this.apiKey,
      },
      body: JSON.stringify({
        dataSource: this.cluster,
        database: this.database,
        collection: collection,
        ...body
      })
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error || `Atlas Error: ${response.statusText}`);
    }
    return result;
  }

  async ping(): Promise<boolean> {
    try {
      // Try to find one agent to verify connection
      await this.atlasRequest('findOne', 'agents', { filter: {} });
      return true;
    } catch (e) {
      console.error("Atlas Ping Failed:", e);
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
}

export const apiService = new APIService();
