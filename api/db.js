
import { MongoClient } from 'mongodb';

// Ensure special characters are encoded: @ -> %40
const uri = "mongodb+srv://Zayn:Temp%401122@cluster0.orvyxn0.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

let cachedClient = null;
let cachedDb = null;

async function connectToDatabase() {
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  const client = new MongoClient(uri, {
    connectTimeoutMS: 5000,
    socketTimeoutMS: 30000,
    maxPoolSize: 10,
  });

  await client.connect();
  const db = client.db('MessengerFlow');

  cachedClient = client;
  cachedDb = db;
  return { client, db };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { action, collection, filter, update, upsert } = req.body;
  
  try {
    const { db } = await connectToDatabase();
    const col = db.collection(collection || 'logs');

    let result;
    switch (action) {
      case 'ping':
        // 'hello' is the modern, most lightweight way to check connectivity in MongoDB
        await db.command({ hello: 1 });
        res.status(200).json({ ok: true });
        break;

      case 'find':
        result = await col.find(filter || {}).toArray();
        res.status(200).json({ documents: result });
        break;
      
      case 'findOne':
        result = await col.findOne(filter || {});
        res.status(200).json({ document: result });
        break;

      case 'updateOne':
        result = await col.updateOne(filter, update, { upsert: upsert ?? true });
        res.status(200).json(result);
        break;

      case 'deleteOne':
        result = await col.deleteOne(filter);
        res.status(200).json(result);
        break;

      case 'deleteMany':
        result = await col.deleteMany(filter || {});
        res.status(200).json(result);
        break;

      default:
        res.status(400).json({ error: 'Invalid action' });
    }
  } catch (error) {
    console.error('Atlas Backend Error:', error.message);
    res.status(500).json({ 
      error: error.message,
      suggestion: "Handshake failed. Ensure 0.0.0.0/0 is whitelisted in Atlas Network Access."
    });
  }
}
