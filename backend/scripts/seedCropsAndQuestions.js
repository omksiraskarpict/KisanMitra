require('dotenv').config();
const mongoose = require('mongoose');
const Crop = require('../src/database/models/Crop');
const Question = require('../src/database/models/Question');

const cropSeeds = [
  { slug: 'wheat', name: 'Wheat', category: 'Cereal', season: 'Rabi', description: 'A staple cereal crop grown in cool, dry conditions.', image: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=900&q=80' },
  { slug: 'rice', name: 'Rice', category: 'Cereal', season: 'Kharif', description: 'A cereal crop commonly grown in irrigated or high-rainfall fields.', image: 'https://images.unsplash.com/photo-1536304993881-ff6e9eefa2a6?auto=format&fit=crop&w=900&q=80' },
  { slug: 'maize', name: 'Maize', category: 'Cereal', season: 'Kharif', description: 'A versatile cereal crop used for food, feed, and silage.', image: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=900&q=80' },
  { slug: 'cotton', name: 'Cotton', category: 'Cash crop', season: 'Kharif', description: 'A warm-season fibre crop requiring a long frost-free period.', image: 'https://images.unsplash.com/photo-1595872018818-97555653a011?auto=format&fit=crop&w=900&q=80' },
  { slug: 'sugarcane', name: 'Sugarcane', category: 'Cash crop', season: 'Annual', description: 'A long-duration crop that performs best with reliable moisture.', image: 'https://images.unsplash.com/photo-1589923188900-85dae523342b?auto=format&fit=crop&w=900&q=80' },
  { slug: 'soybean', name: 'Soybean', category: 'Oilseed', season: 'Kharif', description: 'A legume and oilseed crop suited to warm, well-drained fields.', image: 'https://images.unsplash.com/photo-1599940824399-b87987ceb72a?auto=format&fit=crop&w=900&q=80' },
  { slug: 'tomato', name: 'Tomato', category: 'Vegetable', season: 'Year-round', description: 'A widely grown vegetable crop sensitive to water and disease stress.', image: 'https://images.unsplash.com/photo-1546094096-0df4bcaaa337?auto=format&fit=crop&w=900&q=80' },
  { slug: 'potato', name: 'Potato', category: 'Vegetable', season: 'Rabi', description: 'A cool-season tuber crop requiring loose soil and even moisture.', image: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=900&q=80' },
  { slug: 'onion', name: 'Onion', category: 'Vegetable', season: 'Rabi', description: 'A bulb crop that needs good drainage and careful water management.', image: 'https://images.unsplash.com/photo-1508747703725-719777637510?auto=format&fit=crop&w=900&q=80' }
];

const questionDefinitions = {
  wheat: [
    ['stage', 'What is the current growth stage of your wheat crop?', 'select', ['Sowing', 'Tillering', 'Flowering', 'Grain filling', 'Maturity'], 'crop stage'],
    ['water', 'How would you describe water availability in the field?', 'radio', ['Limited', 'Adequate', 'Excess'], 'water'],
    ['problem', 'What is the main issue you are observing?', 'checkbox', ['Weeds', 'Pest damage', 'Leaf disease', 'Nutrient deficiency', 'No major issue'], 'problem'],
    ['soil', 'How would you describe the soil condition?', 'text', [], 'soil']
  ],
  rice: [
    ['stage', 'Which stage has your rice crop reached?', 'select', ['Nursery', 'Transplanting', 'Tillering', 'Flowering', 'Harvest'], 'crop stage'],
    ['water', 'What is the current standing-water condition?', 'radio', ['No standing water', 'Shallow water', 'Deep water'], 'water'],
    ['problem', 'Which issue needs attention?', 'checkbox', ['Weeds', 'Insect damage', 'Leaf disease', 'Nutrient deficiency', 'No major issue'], 'problem'],
    ['rain', 'Has the field experienced flooding this season?', 'yes/no', [], 'weather']
  ],
  maize: [
    ['stage', 'What is the current maize growth stage?', 'select', ['Emergence', 'Vegetative', 'Tasseling', 'Grain filling', 'Maturity'], 'crop stage'],
    ['water', 'How is water availability?', 'radio', ['Limited', 'Adequate', 'Excess'], 'water'],
    ['problem', 'What symptoms or pressures are present?', 'checkbox', ['Fall armyworm', 'Weeds', 'Leaf discoloration', 'Lodging', 'No major issue'], 'problem'],
    ['area', 'What is the planted area in acres?', 'number', [], 'farm scale']
  ],
  cotton: [
    ['stage', 'Which stage is your cotton crop in?', 'select', ['Sowing', 'Vegetative', 'Squaring', 'Flowering', 'Boll development'], 'crop stage'],
    ['water', 'How would you rate soil moisture?', 'radio', ['Low', 'Suitable', 'High'], 'water'],
    ['problem', 'Which crop concern have you noticed?', 'checkbox', ['Sucking pests', 'Bollworm', 'Leaf curl', 'Nutrient stress', 'No major issue'], 'problem'],
    ['rain', 'Has there been prolonged rainfall recently?', 'yes/no', [], 'weather']
  ],
  sugarcane: [
    ['stage', 'What is the current sugarcane stage?', 'select', ['Planting', 'Germination', 'Tillering', 'Grand growth', 'Maturity'], 'crop stage'],
    ['water', 'How is irrigation availability?', 'radio', ['Limited', 'Adequate', 'Unreliable'], 'water'],
    ['problem', 'What is the main field concern?', 'checkbox', ['Borer damage', 'Weeds', 'Red rot symptoms', 'Poor germination', 'No major issue'], 'problem'],
    ['area', 'What is the planted area in acres?', 'number', [], 'farm scale']
  ],
  soybean: [
    ['stage', 'What is the current soybean stage?', 'select', ['Emergence', 'Vegetative', 'Flowering', 'Pod filling', 'Maturity'], 'crop stage'],
    ['water', 'How is soil moisture in the field?', 'radio', ['Dry', 'Suitable', 'Waterlogged'], 'water'],
    ['problem', 'What issue have you observed?', 'checkbox', ['Defoliators', 'Stem fly', 'Leaf spots', 'Weeds', 'No major issue'], 'problem'],
    ['rain', 'Has water remained standing in your field?', 'yes/no', [], 'water']
  ],
  tomato: [
    ['stage', 'What is the current tomato crop stage?', 'select', ['Nursery', 'Vegetative', 'Flowering', 'Fruit setting', 'Harvest'], 'crop stage'],
    ['water', 'How consistent is water availability?', 'radio', ['Irregular', 'Consistent', 'Excessive'], 'water'],
    ['problem', 'Which symptoms or pests are present?', 'checkbox', ['Fruit borer', 'Leaf curl', 'Early blight', 'Wilting', 'No major issue'], 'problem'],
    ['area', 'What is the cultivated area in acres?', 'number', [], 'farm scale']
  ],
  potato: [
    ['stage', 'Which stage is your potato crop in?', 'select', ['Planting', 'Emergence', 'Vegetative', 'Tuber bulking', 'Harvest'], 'crop stage'],
    ['water', 'How would you describe soil moisture?', 'radio', ['Dry', 'Suitable', 'Waterlogged'], 'water'],
    ['problem', 'What is the main crop concern?', 'checkbox', ['Late blight', 'Cutworms', 'Poor tuber growth', 'Nutrient stress', 'No major issue'], 'problem'],
    ['rain', 'Has the crop had extended wet weather recently?', 'yes/no', [], 'weather']
  ],
  onion: [
    ['stage', 'What is the current onion growth stage?', 'select', ['Nursery', 'Transplanting', 'Leaf growth', 'Bulb formation', 'Maturity'], 'crop stage'],
    ['water', 'How is water availability?', 'radio', ['Limited', 'Adequate', 'Excess'], 'water'],
    ['problem', 'Which issue have you noticed?', 'checkbox', ['Thrips', 'Purple blotch', 'Bulb rot', 'Poor bulb size', 'No major issue'], 'problem'],
    ['soil', 'How would you describe your soil drainage?', 'text', [], 'soil']
  ]
};

const seed = async () => {
  if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI is required. Set it in backend/.env before seeding.');
  }

  await mongoose.connect(process.env.MONGO_URI);
  for (const cropSeed of cropSeeds) {
    const crop = await Crop.findOneAndUpdate(
      { slug: cropSeed.slug },
      { $set: { ...cropSeed, active: true } },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );

    for (const [index, [key, questionText, questionType, options, category]] of questionDefinitions[cropSeed.slug].entries()) {
      await Question.updateOne(
        { seedKey: `${cropSeed.slug}-${key}` },
        {
          $set: {
            cropId: crop._id,
            questionText,
            questionType,
            options,
            required: true,
            order: index + 1,
            active: true,
            category
          },
          $setOnInsert: { seedKey: `${cropSeed.slug}-${key}` }
        },
        { upsert: true, runValidators: true }
      );
    }
  }

  console.log(`Seeded ${cropSeeds.length} crops and crop-specific questions.`);
};

seed()
  .catch((error) => {
    console.error('Crop and question seed failed:', error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });