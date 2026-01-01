
import { MongoClient } from 'mongodb';

// Ensure special characters are encoded: @ -> %40
const uri = "mongodb+srv://Zayn:Temp%401122@cluster0.orvyxn0.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

let cachedClient = null;
let cachedDb = null;

async function connectToDatabase() {
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  // Optimized settings for serverless environments
  const client = new MongoClient(uri, {
    connectTimeoutMS: 15000, // 15s to handle cluster wakeup
    socketTimeoutMS: 45000,
    maxPoolSize: 1, // Minimize connections for M0 free tier
  });

  try {
    await client.connect();
    const db = client.db('MessengerFlow');
    cachedClient = client;
    cachedDb = db;
    return { client, db };
  } catch (err) {
    console.error("MongoDB Connection Failed:", err.message);
    throw err;
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { action, collection, filter, update, upsert } = req.body;
  
  try {
    const { db } = await connectToDatabase();
    
    // Default to 'logs' if no collection specified to ensure the operation has a target
    const targetCollection = collection || 'system_logs';
    const col = db.collection(targetCollection);

    let result;
    switch (action) {
      case 'ping':
        // Minimal probe to verify cluster health
        const pingResult = await db.command({ hello: 1 });
        res.status(200).json({ ok: true, version: pingResult.maxWireVersion });
        break;

      case 'find':
        result = await col.find(filter || {}).toArray();
        res.status(200).json({ documents: result || [] });
        break;
      
      case 'findOne':
        result = await col.findOne(filter || {});
        res.status(200).json({ document: result });
        break;

      case 'updateOne':
        result = await col.updateOne(filter, update, { upsert: upsert ?? true });
        res.status(200).json({ ok: true, modifiedCount: result.modifiedCount });
        break;

      case 'deleteOne':
        result = await col.deleteOne(filter);
        res.status(200).json({ ok: true, deletedCount: result.deletedCount });
        break;

      case 'deleteMany':
        result = await col.deleteMany(filter || {});
        res.status(200).json({ ok: true, deletedCount: result.deletedCount });
        break;

      default:
        res.status(400).json({ error: 'Invalid action: ' + action });
    }
  } catch (error) {
    console.error('Atlas Bridge Failure:', error.message);
    res.status(500).json({ 
      error: error.message,
      suggestion: "If 'movement' is seen in Atlas but app shows error, check if the DB name 'MessengerFlow' matches your created database."
    });
  }
}
