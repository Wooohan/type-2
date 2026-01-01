
import { MongoClient } from 'mongodb';

/**
 * MongoDB Atlas Bridge v1.4
 * Target: Cluster0
 */
const uri = "mongodb+srv://Zayn:Temp1122@cluster0.orvyxn0.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

let cachedClient = null;

async function getClient() {
  if (cachedClient) return cachedClient;
  const client = new MongoClient(uri, {
    connectTimeoutMS: 15000,
    serverSelectionTimeoutMS: 15000,
  });
  try {
    await client.connect();
    cachedClient = client;
    return client;
  } catch (err) {
    console.error("Connection Error:", err.message);
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
  
  // CRITICAL FIX: Explicitly default to 'MessengerFlow' to prevent 'local' DB permission errors
  const targetDbName = dbName || 'MessengerFlow';
  
  try {
    const client = await getClient();
    const db = client.db(targetDbName);
    const colName = collection || 'system_logs';
    const col = db.collection(colName);

    let result;
    switch (action) {
      case 'ping':
        await db.command({ ping: 1 });
        return res.status(200).json({ 
          ok: true, 
          database: targetDbName,
          cluster: "Cluster0", 
          status: "ONLINE" 
        });

      case 'find':
        result = await col.find(filter || {}).toArray();
        return res.status(200).json({ documents: result });
      
      case 'findOne':
        result = await col.findOne(filter || {});
        return res.status(200).json({ document: result });

      case 'updateOne':
        const finalFilter = filter || { id: update?.$set?.id };
        if (!finalFilter.id && !update?.$set?.id) {
            throw new Error("Persistence Denied: Missing Unique ID");
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

      case 'deleteOne':
        result = await col.deleteOne(filter);
        return res.status(200).json({ ok: true, deletedCount: result.deletedCount });

      case 'deleteMany':
        result = await col.deleteMany(filter || {});
        return res.status(200).json({ ok: true, deletedCount: result.deletedCount });

      default:
        return res.status(400).json({ error: 'Invalid action: ' + action });
    }
  } catch (error) {
    console.error(`Atlas Error [${targetDbName}]:`, error.message);
    return res.status(500).json({ 
      error: error.message,
      suggestion: "Check your database name and ensure IP 0.0.0.0/0 is whitelisted in Atlas."
    });
  }
}
