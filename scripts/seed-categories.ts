import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config({ path: ".env" });

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  slug: { type: String, required: true, unique: true },
  description: String,
  image: String,
  parentId: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
}, { timestamps: true });

const Category = mongoose.models.Category || mongoose.model("Category", categorySchema);

const categories = [
  { name: "Electronics", slug: "electronics", description: "Phones, laptops, gadgets" },
  { name: "Fashion", slug: "fashion", description: "Clothing, shoes, accessories" },
  { name: "Home & Garden", slug: "home", description: "Furniture, decor, garden" },
  { name: "Sports", slug: "sports", description: "Fitness, outdoor, equipment" },
  { name: "Books", slug: "books", description: "Fiction, non-fiction, textbooks" },
  { name: "Automotive", slug: "automotive", description: "Car parts, accessories" },
  { name: "Baby & Kids", slug: "baby", description: "Toys, clothing, gear" },
  { name: "Accessories", slug: "accessories", description: "Jewelry, watches, bags" },
];

async function seed() {
  try {
    await mongoose.connect(process.env.DATABASE_URL!);
    console.log("Connected to MongoDB");

    const existing = await Category.countDocuments();
    if (existing > 0) {
      console.log("Categories already exist, skipping...");
      process.exit(0);
    }

    const created = await Category.insertMany(categories);
    console.log(`Created ${created.length} categories`);

    console.log("Seed complete!");
    process.exit(0);
  } catch (error) {
    console.error("Seed failed:", error);
    process.exit(1);
  }
}

seed();
