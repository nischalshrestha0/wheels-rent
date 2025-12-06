import mongoose from 'mongoose';

const sleep = ms => new Promise(res => setTimeout(res, ms));

const connectDB = async (retries = 5, delay = 5000) => {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    throw new Error('MONGO_URI is not defined in environment');
  }

  let attempt = 0;
  while (attempt < retries) {
    try {
      await mongoose.connect(uri);
      console.log('MongoDB connected');
      return;
    } catch (err) {
      attempt += 1;
      console.error(`MongoDB connection attempt ${attempt} failed: ${err.message}`);
      if (attempt >= retries) {
        console.error('All MongoDB connection attempts failed.');
        console.error('Possible causes: MongoDB server is not running, wrong MONGO_URI, Docker port not exposed, or firewall blocking the port.');
        console.error('On Windows: start the MongoDB service via Services (services.msc) or run "mongod --dbpath <your-db-path>" in a terminal.');
        console.error('If using Docker: run "docker run -d -p 27017:27017 --name mongodb mongo" and retry.');
        console.error('To verify, try connecting with MongoDB Compass using the same connection string:', uri);
        throw err;
      }
      console.log(`Retrying in ${delay / 1000}s...`);
      await sleep(delay);
    }
  }
};

export default connectDB;
