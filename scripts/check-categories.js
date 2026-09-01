const mongoose = require("mongoose");
require("dotenv").config({ path: ".env" });

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  slug: { type: String, required: true, unique: true },
  description: String,
  image: String,
  parentId: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
}, { timestamps: true });

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  comparePrice: Number,
  images: [{ type: String }],
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: true },
  sellerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  stock: { type: Number, default: 0 },
  sku: String,
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

const Category = mongoose.models.Category || mongoose.model("Category", categorySchema);
const Product = mongoose.models.Product || mongoose.model("Product", productSchema);

async function check() {
  try {
    await mongoose.connect(process.env.DATABASE_URL);
    console.log("Connected to MongoDB");

    const categories = await Category.find().sort({ name: 1 }).lean();
    console.log(`\nCategories (${categories.length}):`);
    categories.forEach(cat => {
      console.log(`  ${cat._id} - ${cat.name} (${cat.slug})`);
    });

    const products = await Product.find().populate("categoryId", "name slug").lean();
    console.log(`\nProducts (${products.length}):`);
    products.forEach(p => {
      console.log(`  ${p.name} - categoryId: ${p.categoryId ? JSON.stringify(p.categoryId) : 'NULL'} - isActive: ${p.isActive}`);
    });

    process.exit(0);
  } catch (error) {
    console.error("Failed:", error);
    process.exit(1);
  }
}

check();
