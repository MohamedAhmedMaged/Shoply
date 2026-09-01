import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const MONGODB_URI = process.env.DATABASE_URL || 'mongodb://localhost:27017/ecommerce';

const productSchema = new mongoose.Schema({
  name: String,
  slug: String,
  images: [String],
}, { strict: false });

const Product = mongoose.models.Product || mongoose.model('Product', productSchema);

// Real working Unsplash images for each product
const imageUpdates: Record<string, string[]> = {
  'Dash Cam 4K': [
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1616422285623-13ff0162193c?w=800&h=600&fit=crop',
  ],
  'Car Phone Mount Pro': [
    'https://images.unsplash.com/photo-1593995863951-57c30994b633?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1611532736597-de2d42659f31?w=800&h=600&fit=crop',
  ],
  'Leather Chelsea Boots': [
    'https://images.unsplash.com/photo-1638247025907-17a5e0a2b8c5?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1608256246200-53e635b5b65f?w=800&h=600&fit=crop',
  ],
  'Bamboo Cutting Board': [
    'https://images.unsplash.com/photo-1594385208974-2e75f8d2bb48?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1606760227489-36a1c091ed44?w=800&h=600&fit=crop',
  ],
  'Scandinavian Floor Lamp': [
    'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?w=800&h=600&fit=crop',
  ],
  'iPhone 15 Pro Max': [
    'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=800&h=600&fit=crop',
  ],
};

async function updateProductImages() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(MONGODB_URI);
  console.log('Connected!\n');

  for (const [productName, images] of Object.entries(imageUpdates)) {
    const result = await Product.updateOne(
      { name: { $regex: new RegExp(`^${productName}$`, 'i') } },
      { $set: { images } }
    );

    if (result.modifiedCount > 0) {
      console.log(`✅ Updated: ${productName}`);
    } else {
      console.log(`⚠️  Not found: ${productName}`);
    }
  }

  await mongoose.disconnect();
  console.log('\nDone! Disconnected from MongoDB.');
}

updateProductImages().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
