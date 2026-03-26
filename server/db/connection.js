const mongoose = require('mongoose');

async function connectMongo() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/arcanaforge';
  await mongoose.connect(uri);
  console.log(`[mongo] Connected to ${uri}`);
}

module.exports = { connectMongo };
