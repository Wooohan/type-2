import { MongoClient } from 'mongodb';

// 1. Explicitly added /MessengerFlow to the URI to avoid defaulting to the 'local' database
const uri = "mongodb+srv://Zayn:Temp1122@cluster0.orvyxn0.mongodb.net/MessengerFlow?retryWrites=true&w=majority&appName=Cluster0";

// Global variables to cache the connection in Vercel's serverless environment
let cachedClient = null;
let cachedDb = null;

async function connectToDatabase() {
  // Return cached connection if available to prevent "too many connections" errors on M0 Free Tier
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  const client = new MongoClient(uri, {
    connectTimeoutMS: 15000, 
    socketTimeoutMS: 45000,
    maxPoolSize: 1, // Recommended for Free Tier clusters
  });

  try {
    await client.connect();
    // 2. Explicitly target 'MessengerFlow'. MongoDB will auto-create this on your first write.
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
  // Only allow POST requests for security and data handling
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { action, collection, filter, update, upsert, document } = req.body;
  
  try {
    const { db } = await connectToDatabase();
    
    // 3. Set a default collection name if none is provided
    const targetCollection = collection || 'messages';
    const col = db.collection(targetCollection);

    let result;
    switch (action) {
      case 'ping':
        // Verifies the cluster is reachable
        const pingResult = await db.command({ hello: 1 });
        res.status(200).json({ ok: true, database: 'MessengerFlow', version: pingResult.maxWireVersion });
        break;

      case 'insertOne':
        // Used to save a new message
        result = await col.insertOne(document || {});
        res.status(200).json({ ok: true, insertedId: result.insertedId });
        break;

      case 'find':
        // Used to load all messages
        result = await col.find(filter || {}).sort({ timestamp: -1 }).toArray();
        res.status(200).json({ documents: result || [] });
        break;
      
      case 'findOne':
        result = await col.findOne(filter || {});
        res.status(200).json({ document: result });
        break;

      case 'updateOne':
        // update should be in format: { $set: { key: value } }
        result = await col.updateOne(filter || {}, update || {}, { upsert: upsert ?? true });
        res.status(200).json({ ok: true, modifiedCount: result.modifiedCount, upsertedId: result.upsertedId });
        break;

      case 'deleteOne':
        result = await col.deleteOne(filter || {});
        res.status(200).json({ ok: true, deletedCount: result.deletedCount });
        break;

      default:
        res.status(400).json({ error: 'Invalid action: ' + action });
    }
  } catch (error) {
    console.error('Atlas Bridge Failure:', error.message);
    res.status(500).json({ 
      error: error.message,
      context: "Ensure you are not trying to write to the 'local' or 'admin' databases."
    });
  }
}
