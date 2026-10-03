require('dotenv').config();
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const User = require('../src/database/models/User');

const seedAdmin = async () => {
  const email = String(process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  const password = String(process.env.ADMIN_PASSWORD || '');
  if (!process.env.MONGO_URI || !email || password.length < 12) {
    throw new Error('Set MONGO_URI, ADMIN_EMAIL, and an ADMIN_PASSWORD of at least 12 characters in backend/.env.');
  }

  await mongoose.connect(process.env.MONGO_URI);
  const passwordHash = await bcrypt.hash(password, 12);
  const admin = await User.findOneAndUpdate(
    { email },
    { $set: { name: 'KisanMitra Administrator', email, role: 'admin', status: 'VERIFIED', accountStatus: 'VERIFIED' }, $setOnInsert: { mobile: '9000000999', password: passwordHash } },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
  ).select('_id email role accountStatus');
  console.log(`Admin account provisioned: ${admin.email} (${admin.accountStatus}).`);
};

seedAdmin()
  .catch((error) => {
    console.error('Admin seed failed:', error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });