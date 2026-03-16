require('dotenv').config();
const mongoose = require('mongoose');
const Profile = require('./src/models/Profile.model.js');
async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  const profiles = await Profile.find({});
  console.log("Found profiles:", profiles.map(p => ({ _id: p._id, userId: p.userId, username: p.username, typeofUserId: typeof p.userId })));
  process.exit(0);
}
run();
