
import { MongoClient } from 'mongodb';

/**
 * MongoDB Atlas Bridge v1.5
 * Direct Node.js Driver Integration
 */
const uri = "mongodb+srv://Zayn:Temp1122@cluster0.orvyxn0.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

let cachedClient = null;

async function getClient() {
  if (cachedClient) return cachedClient;
  const client = new MongoClient(uri, {
    connectTimeoutMS: 10000,
    serverSelectionTimeoutMS: 10000,
  });
  try {
    await client.connect();
    cachedClient = client;
    return client;
  } catch (err) {
    throw err;
  }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { action, collection, filter, update, upsert, dbName } = req.body;
  const targetDbName = dbName || 'MessengerFlow';
  
  try {
    const client = await getClient();
    const db = client.db(targetDbName);
    const colName = collection || 'Test'; // Default to user's shown collection
    const col = db.collection(colName);

    let result;
    switch (action) {
      case 'ping':
        await db.command({ ping: 1 });
        return res.status(200).json({ ok: true, database: targetDbName });

      case 'find':
        result = await col.find(filter || {}).toArray();
        return res.status(200).json({ documents: result });

      case 'updateOne':
        const finalFilter = filter || { id: update?.$set?.id };
        if (!finalFilter.id && !update?.$set?.id && !filter) {
            throw new Error("Atlas Write Error: Document must have a unique identifier.");
        }
        
        result = await col.updateOne(
          finalFilter,
          update,
          { upsert: upsert ?? true }
        );
        return res.status(200).json({ 
          ok: true, 
          modifiedCount: result.modifiedCount,
          upsertedId: result.upsertedId
        });

      case 'deleteMany':
        result = await col.deleteMany(filter || {});
        return res.status(200).json({ ok: true, deletedCount: result.deletedCount });

      default:
        return res.status(400).json({ error: 'Invalid operation' });
    }
  } catch (error) {
    console.error(`Atlas DB Error:`, error.message);
    // Return the actual driver error so the user knows if it's an IP whitelist issue
    return res.status(500).json({ 
      error: error.message,
      code: error.codeName || 'CONNECTION_FAILED',
      suggestion: "1. Whitelist 0.0.0.0/0 in Atlas. 2. Verify DB Name in Settings."
    });
  }
}
