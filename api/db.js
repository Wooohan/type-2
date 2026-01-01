
import { MongoClient } from 'mongodb';

const uri = "mongodb+srv://Zayn:Temp@1122@cluster0.orvyxn0.mongodb.net/?appName=Cluster0";
let client;
let clientPromise;

if (!clientPromise) {
  client = new MongoClient(uri);
  clientPromise = client.connect();
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { action, collection, filter, update, upsert, dataSource, database } = req.body;
  
  try {
    const connectedClient = await clientPromise;
    const db = connectedClient.db(database || 'MessengerFlow');
    const col = db.collection(collection);

    let result;
    switch (action) {
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

      case 'ping':
        await db.command({ ping: 1 });
        res.status(200).json({ ok: true });
        break;

      default:
        res.status(400).json({ error: 'Invalid action' });
    }
  } catch (error) {
    console.error('Database Error:', error);
    res.status(500).json({ error: error.message });
  }
}
