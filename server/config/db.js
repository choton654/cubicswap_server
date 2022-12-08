const mongoose = require("mongoose");
const connection = {};
// const connectDB = async () => {
//   try {
//     const conn = await mongoose.connect(process.env.MONGO_URI, {
//       useNewUrlParser: true,
//       useUnifiedTopology: true,
//       useFindAndModify: false,
//       useCreateIndex: false,
//     });
//     console.log(`Mongoodb connected: ${conn.connection.host}`);
//   } catch (error) {
//     console.log(error);
//     process.exit(1);
//   }
// };

async function connectDB() {
  if (connection.isConnected) {
    // Use existing database connection
    console.log("Using existing connection");
    return;
  }
  // Use new database connection
  const db = await mongoose.connect(process.env.MONGO_URI, {
    useCreateIndex: true,
    useFindAndModify: false,
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  console.log(`Mongoodb connected: ${db.connection.host}`);
  connection.isConnected = db.connections[0].readyState;
}

module.exports = { connectDB };
