require('dotenv').config();
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const Category = require('../src/database/models/Category');
const Crop = require('../src/database/models/Crop');
const Product = require('../src/database/models/Product');
const User = require('../src/database/models/User');

const categorySeeds = [
  { slug: 'seeds', name: 'Seeds', description: 'Crop seed and planting material.' },
  { slug: 'fertilizers', name: 'Fertilizers', description: 'Plant and soil nutrient products.' },
  { slug: 'pesticides', name: 'Pesticides', description: 'Products for managing insect pests.' },
  { slug: 'herbicides', name: 'Herbicides', description: 'Products for weed management.' },
  { slug: 'fungicides', name: 'Fungicides', description: 'Products for fungal disease management.' },
  { slug: 'organic-products', name: 'Organic Products', description: 'Organic soil and crop inputs.' },
  { slug: 'farming-equipment', name: 'Farming Equipment', description: 'Equipment for crop production.' },
  { slug: 'plant-growth-products', name: 'Plant Growth Products', description: 'Products supporting plant growth and development.' }
];

const productSeeds = [
  { sku: 'WHT-HERB-001', name: 'FieldClear Wheat Herbicide', crop: 'wheat', category: 'herbicides', description: 'Selective weed control for wheat during early crop establishment.', usage: 'Apply for annual weed control around sowing and early growth.', benefits: ['Supports cleaner field establishment', 'Suitable for wheat crop use'], brand: 'FieldClear', price: 640, stock: 42, unit: 'Litre', tags: ['wheat', 'weeds', 'weed control'], recommendationTags: ['weeds', 'sowing', 'weed control'], image: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=900&q=80' },
  { sku: 'WHT-ORG-002', name: 'SoilStart Organic Compost', crop: 'wheat', category: 'organic-products', description: 'Organic soil conditioner for improving soil structure and nutrient availability.', usage: 'Incorporate into prepared soil before sowing.', benefits: ['Adds organic matter', 'Supports soil structure'], brand: 'SoilStart', price: 390, stock: 95, unit: 'Bag', tags: ['wheat', 'soil', 'organic'], recommendationTags: ['soil', 'nutrient deficiency', 'low fertility'], image: 'https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?auto=format&fit=crop&w=900&q=80' },
  { sku: 'WHT-HERB-003', name: 'WeedGuard Wheat Granules', crop: 'wheat', category: 'herbicides', description: 'Granular weed management product for wheat fields.', usage: 'Use for weed pressure according to the product label.', benefits: ['Targets common field weeds'], brand: 'WeedGuard', price: 280, stock: 0, unit: 'Pack', tags: ['wheat', 'weeds', 'weed management'], recommendationTags: ['weeds', 'weed control'], image: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=900&q=80' },
  { sku: 'WHT-FUNG-004', name: 'RustShield Wheat Fungicide', crop: 'wheat', category: 'fungicides', description: 'Fungicide for managing common wheat leaf diseases.', usage: 'Apply when wheat leaf disease symptoms are identified.', benefits: ['Supports leaf disease management'], brand: 'RustShield', price: 725, stock: 24, unit: 'Bottle', active: false, tags: ['wheat', 'leaf disease', 'rust'], recommendationTags: ['leaf disease', 'fungal disease'], image: 'https://images.unsplash.com/photo-1536304993881-ff6e9eefa2a6?auto=format&fit=crop&w=900&q=80' },
  { sku: 'RIC-FERT-001', name: 'PaddyBalance NPK Fertilizer', crop: 'rice', category: 'fertilizers', description: 'Balanced nutrient blend for rice at key growth stages.', usage: 'Apply to rice according to soil test and label directions.', benefits: ['Supports balanced crop nutrition'], brand: 'PaddyBalance', price: 890, stock: 58, unit: 'Bag', tags: ['rice', 'nutrient deficiency', 'fertilizer'], recommendationTags: ['nutrient deficiency', 'transplanting', 'tillering'], image: 'https://images.unsplash.com/photo-1536304993881-ff6e9eefa2a6?auto=format&fit=crop&w=900&q=80' },
  { sku: 'RIC-HERB-002', name: 'PaddyWeed Selective Control', crop: 'rice', category: 'herbicides', description: 'Selective weed control for transplanted rice fields.', usage: 'Apply for weed management at the label-recommended rice stage.', benefits: ['Designed for paddy weed pressure'], brand: 'PaddyWeed', price: 510, stock: 31, unit: 'Bottle', tags: ['rice', 'weeds', 'paddy'], recommendationTags: ['weeds', 'transplanting', 'weed control'], image: 'https://images.unsplash.com/photo-1536304993881-ff6e9eefa2a6?auto=format&fit=crop&w=900&q=80' },
  { sku: 'COT-PEST-001', name: 'Cotton Sucking Pest Guard', crop: 'cotton', category: 'pesticides', description: 'Crop protection product for common cotton sucking pests.', usage: 'Use for sucking pest management as directed on the product label.', benefits: ['Supports cotton pest management'], brand: 'CottonGuard', price: 575, stock: 36, unit: 'Bottle', tags: ['cotton', 'sucking pests', 'pest damage'], recommendationTags: ['sucking pests', 'pest damage', 'pest attack'], image: 'https://images.unsplash.com/photo-1595872018818-97555653a011?auto=format&fit=crop&w=900&q=80' },
  { sku: 'MAI-SEED-001', name: 'Monsoon Maize Hybrid Seed', crop: 'maize', category: 'seeds', description: 'Hybrid maize seed for suitable Kharif growing conditions.', usage: 'Sow at the locally recommended spacing and planting window.', benefits: ['Hybrid seed lot', 'Suitable for maize'], brand: 'Monsoon Gold', price: 1180, stock: 67, unit: 'Pack', tags: ['maize', 'seed', 'emergence'], recommendationTags: ['emergence', 'planting', 'seed'], image: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=900&q=80' },
  { sku: 'SOY-FUNG-001', name: 'Soybean Leaf Health Fungicide', crop: 'soybean', category: 'fungicides', description: 'Fungicide for soybean leaf spot management.', usage: 'Apply when leaf spot symptoms appear and follow the label.', benefits: ['Supports leaf health management'], brand: 'LeafHealth', price: 680, stock: 27, unit: 'Bottle', tags: ['soybean', 'leaf spots', 'disease'], recommendationTags: ['leaf spots', 'leaf disease', 'disease'], image: 'https://images.unsplash.com/photo-1599940824399-b87987ceb72a?auto=format&fit=crop&w=900&q=80' },
  { sku: 'TOM-PEST-001', name: 'Tomato Fruit Protection', crop: 'tomato', category: 'pesticides', description: 'Crop protection product for tomato fruit borer pressure.', usage: 'Use for fruit borer management following label instructions.', benefits: ['Supports fruit protection'], brand: 'TomatoCare', price: 445, stock: 19, unit: 'Bottle', tags: ['tomato', 'fruit borer', 'pest'], recommendationTags: ['fruit borer', 'pest damage', 'pest attack'], image: 'https://images.unsplash.com/photo-1546094096-0df4bcaaa337?auto=format&fit=crop&w=900&q=80' },
  { sku: 'POT-FUNG-001', name: 'Potato Blight Protection', crop: 'potato', category: 'fungicides', description: 'Fungicide for potato late blight risk management.', usage: 'Apply for late blight management according to the label.', benefits: ['Supports potato disease management'], brand: 'TuberShield', price: 520, stock: 33, unit: 'Bottle', tags: ['potato', 'late blight', 'leaf disease'], recommendationTags: ['late blight', 'leaf disease', 'fungal disease'], image: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=900&q=80' },
  { sku: 'ONI-PEST-001', name: 'Onion Thrips Management', crop: 'onion', category: 'pesticides', description: 'Crop protection product for onion thrips management.', usage: 'Use when thrips are identified and follow label directions.', benefits: ['Supports onion pest management'], brand: 'BulbCare', price: 460, stock: 21, unit: 'Bottle', tags: ['onion', 'thrips', 'pest'], recommendationTags: ['thrips', 'pest damage', 'pest attack'], image: 'https://images.unsplash.com/photo-1508747703725-719777637510?auto=format&fit=crop&w=900&q=80' }
];

const seed = async () => {
  if (!process.env.MONGO_URI) throw new Error('MONGO_URI is required. Set it in backend/.env before seeding.');
  await mongoose.connect(process.env.MONGO_URI);

  const categories = new Map();
  for (const item of categorySeeds) {
    const category = await Category.findOneAndUpdate(
      { slug: item.slug },
      { $set: { ...item, active: true } },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );
    categories.set(item.slug, category._id);
  }

  const retailer = await User.findOneAndUpdate(
    { email: 'demo-retailer@kisanmitra.local' },
    {
      $setOnInsert: {
        name: 'Green Field Supplies',
        email: 'demo-retailer@kisanmitra.local',
        mobile: '9000000100',
        password: await bcrypt.hash(crypto.randomBytes(32).toString('hex'), 12),
        role: 'retailer',
        status: 'VERIFIED',
        accountStatus: 'VERIFIED',
        businessName: 'Green Field Supplies',
        businessCategory: 'Agricultural inputs',
        city: 'Nagpur',
        state: 'Maharashtra'
      }
    },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
  );

  const crops = await Crop.find({ slug: { $in: [...new Set(productSeeds.map((item) => item.crop))] }, active: true }).select('_id slug').lean();
  const cropIds = new Map(crops.map((crop) => [crop.slug, crop._id]));
  if (cropIds.size !== new Set(productSeeds.map((item) => item.crop)).size) {
    throw new Error('Seed crops first. One or more product crops are missing or inactive.');
  }

  for (const item of productSeeds) {
    const { sku, crop, category, image, ...fields } = item;
    await Product.findOneAndUpdate(
      { sku: item.sku },
      {
        $set: {
          ...fields,
          images: [image],
          categoryId: categories.get(category),
          applicableCrops: [cropIds.get(crop)],
          retailerId: retailer._id,
          active: item.active !== false,
          deleted: false
        },
        $setOnInsert: { sku }
      },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );
  }

  console.log(`Seeded ${categorySeeds.length} categories and ${productSeeds.length} products.`);
};

seed()
  .catch((error) => {
    console.error('Product seed failed:', error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });