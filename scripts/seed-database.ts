import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import path from "path";
import dns from "node:dns";

try {
  dns.setServers(["8.8.8.8", "1.1.1.1"]);
} catch {}

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const MONGODB_URI = process.env.DATABASE_URL || process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("❌ Error: Please provide DATABASE_URL or MONGODB_URI in .env or as an environment variable.");
  process.exit(1);
}

// Schemas
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["CUSTOMER", "SELLER", "ADMIN"], default: "CUSTOMER" },
  emailVerified: { type: Date, default: null },
  avatar: String,
}, { timestamps: true });

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  slug: { type: String, required: true, unique: true },
  description: String,
  image: String,
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
  hasVariants: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  deletedAt: { type: Date, default: null },
}, { timestamps: true });

const couponSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, uppercase: true },
  type: { type: String, enum: ["PERCENTAGE", "FIXED"], required: true },
  value: { type: Number, required: true },
  minOrderAmount: { type: Number, default: 0 },
  maxDiscount: Number,
  usageLimit: { type: Number, default: 0 },
  usedCount: { type: Number, default: 0 },
  perUserLimit: { type: Number, default: 1 },
  expiresAt: { type: Date, required: true },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

const bannerSchema = new mongoose.Schema({
  title: { type: String, required: true },
  subtitle: String,
  image: { type: String, required: true },
  link: String,
  isActive: { type: Boolean, default: true },
  order: { type: Number, default: 0 },
}, { timestamps: true });

const reviewSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: String,
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model("User", userSchema);
const Category = mongoose.models.Category || mongoose.model("Category", categorySchema);
const Product = mongoose.models.Product || mongoose.model("Product", productSchema);
const Coupon = mongoose.models.Coupon || mongoose.model("Coupon", couponSchema);
const Banner = mongoose.models.Banner || mongoose.model("Banner", bannerSchema);
const Review = mongoose.models.Review || mongoose.model("Review", reviewSchema);

async function seed() {
  try {
    const isCloud = MONGODB_URI?.includes("@");
    console.log("Connecting to MongoDB:", isCloud ? `MongoDB Atlas Cluster` : "Local DB");
    await mongoose.connect(MONGODB_URI!);
    console.log("Connected successfully!\n");

    // 1. Seed Users
    console.log("👤 Seeding Users...");
    const adminPassword = await bcrypt.hash("Admin1234!", 10);
    const sellerPassword = await bcrypt.hash("Seller1234!", 10);
    const customerPassword = await bcrypt.hash("Customer1234!", 10);

    await User.findOneAndUpdate(
      { email: "admin@shoply.com" },
      {
        name: "Admin Mohamed",
        email: "admin@shoply.com",
        password: adminPassword,
        role: "ADMIN",
        emailVerified: new Date(),
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop",
      },
      { upsert: true, new: true }
    );

    const seller = await User.findOneAndUpdate(
      { email: "seller@shoply.com" },
      {
        name: "Apex Goods & Tech",
        email: "seller@shoply.com",
        password: sellerPassword,
        role: "SELLER",
        emailVerified: new Date(),
        avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop",
      },
      { upsert: true, new: true }
    );

    const customer = await User.findOneAndUpdate(
      { email: "customer@shoply.com" },
      {
        name: "Sarah Jenkins",
        email: "customer@shoply.com",
        password: customerPassword,
        role: "CUSTOMER",
        emailVerified: new Date(),
        avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop",
      },
      { upsert: true, new: true }
    );

    console.log("✅ Users seeded (admin@shoply.com, seller@shoply.com, customer@shoply.com)");

    // 2. Seed Categories
    console.log("\n📁 Seeding Categories...");
    const categoriesData = [
      { name: "Electronics", slug: "electronics", description: "Phones, laptops, headphones & gadgets" },
      { name: "Fashion", slug: "fashion", description: "Clothing, luxury footwear & designer apparel" },
      { name: "Home & Living", slug: "home", description: "Modern furniture, lighting & kitchenware" },
      { name: "Sports & Outdoors", slug: "sports", description: "Fitness, adventure equipment & gym gear" },
      { name: "Books", slug: "books", description: "Bestsellers, tech literature & fiction" },
      { name: "Automotive", slug: "automotive", description: "Dashcams, accessories & vehicle essentials" },
      { name: "Baby & Kids", slug: "baby", description: "Toys, baby gear & educational sets" },
      { name: "Accessories", slug: "accessories", description: "Watches, jewelry, sunglasses & leather goods" },
    ];

    const categoryMap = new Map<string, any>();
    for (const cat of categoriesData) {
      const saved = await Category.findOneAndUpdate(
        { slug: cat.slug },
        cat,
        { upsert: true, new: true }
      );
      categoryMap.set(cat.slug, saved._id);
    }
    console.log(`✅ ${categoriesData.length} Categories seeded`);

    // 3. Seed Products
    console.log("\n🛍️ Seeding Products...");
    const productsData = [
      {
        name: "Apple iPhone 15 Pro Max (256GB Titanium)",
        slug: "apple-iphone-15-pro-max",
        description: "Forged in aerospace-grade titanium with the groundbreaking A17 Pro chip, customizable Action button, and the most powerful iPhone camera system ever.",
        price: 1199.99,
        comparePrice: 1299.99,
        images: [
          "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800&h=600&fit=crop",
          "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=800&h=600&fit=crop"
        ],
        categoryId: categoryMap.get("electronics"),
        sellerId: seller._id,
        stock: 35,
        sku: "IPHONE-15-PRO",
      },
      {
        name: "Sony WH-1000XM5 Wireless Noise-Cancelling Headphones",
        slug: "sony-wh-1000xm5-headphones",
        description: "Two processors and eight microphones for unprecedented noise cancellation. Exceptional sound quality with Hi-Res Audio and up to 30-hour battery life.",
        price: 349.99,
        comparePrice: 399.99,
        images: [
          "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&h=600&fit=crop",
          "https://images.unsplash.com/photo-1484704849700-f032a568e944?w=800&h=600&fit=crop"
        ],
        categoryId: categoryMap.get("electronics"),
        sellerId: seller._id,
        stock: 50,
        sku: "SONY-WH-1000XM5",
      },
      {
        name: "Apple Watch Ultra 2 (GPS + Cellular, 49mm)",
        slug: "apple-watch-ultra-2",
        description: "The most rugged and capable Apple Watch. Designed for outdoor endurance, ocean sports, and athletes with a corrosion-resistant titanium case and dual-frequency GPS.",
        price: 749.99,
        comparePrice: 799.99,
        images: [
          "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&h=600&fit=crop",
          "https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=800&h=600&fit=crop"
        ],
        categoryId: categoryMap.get("electronics"),
        sellerId: seller._id,
        stock: 24,
        sku: "AW-ULTRA-2",
      },
      {
        name: "Keychron Q1 Pro Wireless Custom Mechanical Keyboard",
        slug: "keychron-q1-pro-keyboard",
        description: "A fully customizable 75% layout mechanical keyboard with full CNC aluminum body, double-gasket design, hot-swappable switches, and programmable QMK/VIA support.",
        price: 199.99,
        comparePrice: 229.99,
        images: [
          "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&h=600&fit=crop",
          "https://images.unsplash.com/photo-1595225476474-87563907a212?w=800&h=600&fit=crop"
        ],
        categoryId: categoryMap.get("electronics"),
        sellerId: seller._id,
        stock: 40,
        sku: "KEYCHRON-Q1-PRO",
      },
      {
        name: "Handcrafted Italian Leather Chelsea Boots",
        slug: "italian-leather-chelsea-boots",
        description: "Timeless Chelsea silhouette crafted from supple full-grain Italian calfskin leather with a durable Goodyear-welted rubber sole for all-weather comfort.",
        price: 189.99,
        comparePrice: 249.99,
        images: [
          "https://images.unsplash.com/photo-1638247025907-17a5e0a2b8c5?w=800&h=600&fit=crop",
          "https://images.unsplash.com/photo-1608256246200-53e635b5b65f?w=800&h=600&fit=crop"
        ],
        categoryId: categoryMap.get("fashion"),
        sellerId: seller._id,
        stock: 28,
        sku: "CHELSEA-BOOTS-01",
      },
      {
        name: "Water-Resistant City Commuter Backpack (22L)",
        slug: "water-resistant-city-commuter-backpack",
        description: "Minimalist, aerodynamic daypack crafted from recycled 900D waterproof fabric. Features dedicated padded 16\" laptop compartment and quick-access magnetic pockets.",
        price: 89.99,
        comparePrice: 120.00,
        images: [
          "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&h=600&fit=crop",
          "https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?w=800&h=600&fit=crop"
        ],
        categoryId: categoryMap.get("accessories"),
        sellerId: seller._id,
        stock: 65,
        sku: "BACKPACK-CITY-22L",
      },
      {
        name: "Australian Merino Wool Crewneck Sweater",
        slug: "merino-wool-crewneck-sweater",
        description: "Pure extra-fine 19.5-micron Australian merino wool. Naturally odor-resistant, breathable, and temperature-regulating for luxurious all-season layering.",
        price: 119.99,
        comparePrice: 159.99,
        images: [
          "https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=800&h=600&fit=crop",
          "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=800&h=600&fit=crop"
        ],
        categoryId: categoryMap.get("fashion"),
        sellerId: seller._id,
        stock: 45,
        sku: "MERINO-SWEATER-01",
      },
      {
        name: "Classic Aviator Polarized Sunglasses",
        slug: "classic-aviator-polarized-sunglasses",
        description: "Heritage military aviator frames crafted from lightweight monel alloy with scratch-resistant polarized crystal lenses providing 100% UV400 protection.",
        price: 69.99,
        comparePrice: 99.99,
        images: [
          "https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=800&h=600&fit=crop",
          "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=800&h=600&fit=crop"
        ],
        categoryId: categoryMap.get("accessories"),
        sellerId: seller._id,
        stock: 75,
        sku: "AVIATOR-SUNGLASSES",
      },
      {
        name: "Nordic Minimalist Warm Floor Lamp",
        slug: "nordic-minimalist-floor-lamp",
        description: "Architectural floor lamp featuring a solid FSC-certified natural oak tripod base, brushed brass accents, and an organic linen shade for gentle diffused ambient light.",
        price: 139.99,
        comparePrice: 179.99,
        images: [
          "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800&h=600&fit=crop",
          "https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?w=800&h=600&fit=crop"
        ],
        categoryId: categoryMap.get("home"),
        sellerId: seller._id,
        stock: 18,
        sku: "NORDIC-LAMP-01",
      },
      {
        name: "Organic Bamboo Cutting Board & Prep Station",
        slug: "organic-bamboo-cutting-board-set",
        description: "Extra-thick sustainably harvested organic bamboo cutting board with integrated juice grooves, sorting trays, and non-slip silicone feet.",
        price: 44.99,
        comparePrice: 59.99,
        images: [
          "https://images.unsplash.com/photo-1594385208974-2e75f8d2bb48?w=800&h=600&fit=crop",
          "https://images.unsplash.com/photo-1606760227489-36a1c091ed44?w=800&h=600&fit=crop"
        ],
        categoryId: categoryMap.get("home"),
        sellerId: seller._id,
        stock: 90,
        sku: "BAMBOO-BOARD-SET",
      },
      {
        name: "Smart Gooseneck Pour-Over Electric Kettle (0.9L)",
        slug: "smart-gooseneck-electric-kettle",
        description: "Barista-grade precision pour kettle with 1-degree temperature control, rapid boil heating element, and 60-minute temperature hold mode.",
        price: 99.99,
        comparePrice: 129.99,
        images: [
          "https://images.unsplash.com/photo-1517256064527-09c73fc73e38?w=800&h=600&fit=crop",
          "https://images.unsplash.com/photo-1570968915860-54d5c301fa9f?w=800&h=600&fit=crop"
        ],
        categoryId: categoryMap.get("home"),
        sellerId: seller._id,
        stock: 32,
        sku: "SMART-KETTLE-01",
      },
      {
        name: "Ceramic Ultrasonic Essential Oil Aromatherapy Diffuser",
        slug: "ceramic-ultrasonic-essential-oil-diffuser",
        description: "Artisan matte ceramic casing with whisper-quiet ultrasonic atomization technology. Features gentle warm-white ambient lighting and automatic shut-off.",
        price: 49.99,
        comparePrice: 69.99,
        images: [
          "https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=800&h=600&fit=crop",
          "https://images.unsplash.com/photo-1602928321679-560bb453f190?w=800&h=600&fit=crop"
        ],
        categoryId: categoryMap.get("home"),
        sellerId: seller._id,
        stock: 60,
        sku: "CERAMIC-DIFFUSER",
      },
      {
        name: "Pro Grip Non-Slip Alignment Yoga Mat (6mm)",
        slug: "pro-grip-non-slip-yoga-mat",
        description: "Dual-layer eco-conscious natural tree rubber with etched body-alignment guidelines. Maximum joint cushioning and sweat-resistant grip.",
        price: 59.99,
        comparePrice: 79.99,
        images: [
          "https://images.unsplash.com/photo-1592432678016-e910b452f9a2?w=800&h=600&fit=crop",
          "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800&h=600&fit=crop"
        ],
        categoryId: categoryMap.get("sports"),
        sellerId: seller._id,
        stock: 55,
        sku: "PRO-YOGA-MAT",
      },
      {
        name: "Double-Wall Insulated Stainless Steel Flask (32oz)",
        slug: "insulated-stainless-steel-flask-32oz",
        description: "Keeps beverages cold for up to 24 hours or steaming hot for 12 hours. BPA-free 18/8 food-grade stainless steel with leak-proof straw lid.",
        price: 34.99,
        comparePrice: 45.00,
        images: [
          "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=800&h=600&fit=crop",
          "https://images.unsplash.com/photo-1544816155-12df9643f363?w=800&h=600&fit=crop"
        ],
        categoryId: categoryMap.get("sports"),
        sellerId: seller._id,
        stock: 120,
        sku: "HYDRO-FLASK-32",
      },
      {
        name: "Quick-Select Adjustable Dumbbell Pair (5-52.5 lbs)",
        slug: "quick-select-adjustable-dumbbells",
        description: "Replace 15 sets of weights with a single dial turn. Smooth selector system smoothly shifts from 5 to 52.5 lbs for full-body progressive overload.",
        price: 299.99,
        comparePrice: 379.99,
        images: [
          "https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?w=800&h=600&fit=crop",
          "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&h=600&fit=crop"
        ],
        categoryId: categoryMap.get("sports"),
        sellerId: seller._id,
        stock: 20,
        sku: "ADJUSTABLE-DB-PAIR",
      },
      {
        name: "Ultra HD 4K Night Vision Dash Cam",
        slug: "ultra-hd-4k-night-vision-dash-cam",
        description: "Sony STARVIS 2 sensor captures crystal-clear 4K HDR road footage day and night. Includes 24/7 G-sensor parking monitoring and smartphone Wi-Fi app sync.",
        price: 119.99,
        comparePrice: 159.99,
        images: [
          "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop",
          "https://images.unsplash.com/photo-1616422285623-13ff0162193c?w=800&h=600&fit=crop"
        ],
        categoryId: categoryMap.get("automotive"),
        sellerId: seller._id,
        stock: 45,
        sku: "DASH-CAM-4K",
      },
    ];

    const savedProducts: any[] = [];
    for (const prod of productsData) {
      const saved = await Product.findOneAndUpdate(
        { slug: prod.slug },
        prod,
        { upsert: true, new: true }
      );
      savedProducts.push(saved);
    }
    console.log(`✅ ${savedProducts.length} Products seeded`);

    // 4. Seed Coupons
    console.log("\n🎟️ Seeding Coupons...");
    const couponsData = [
      {
        code: "WELCOME10",
        type: "PERCENTAGE",
        value: 10,
        minOrderAmount: 30,
        maxDiscount: 50,
        usageLimit: 1000,
        usedCount: 12,
        perUserLimit: 1,
        expiresAt: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
        isActive: true,
      },
      {
        code: "SAVE20",
        type: "PERCENTAGE",
        value: 20,
        minOrderAmount: 100,
        maxDiscount: 100,
        usageLimit: 500,
        usedCount: 25,
        perUserLimit: 1,
        expiresAt: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
        isActive: true,
      },
      {
        code: "FREESHIP",
        type: "FIXED",
        value: 10,
        minOrderAmount: 50,
        usageLimit: 500,
        usedCount: 8,
        perUserLimit: 2,
        expiresAt: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
        isActive: true,
      },
      {
        code: "SUMMER30",
        type: "PERCENTAGE",
        value: 30,
        minOrderAmount: 150,
        maxDiscount: 150,
        usageLimit: 200,
        usedCount: 4,
        perUserLimit: 1,
        expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        isActive: true,
      },
    ];

    for (const coup of couponsData) {
      await Coupon.findOneAndUpdate({ code: coup.code }, coup, { upsert: true });
    }
    console.log(`✅ ${couponsData.length} Coupons seeded (WELCOME10, SAVE20, FREESHIP, SUMMER30)`);

    // 5. Seed Reviews
    console.log("\n⭐ Seeding Reviews...");
    const reviewComments = [
      { rating: 5, comment: "Exceptional build quality. Exceeded all my expectations!" },
      { rating: 5, comment: "Fast delivery, works flawlessly out of the box. Highly recommend." },
      { rating: 4, comment: "Great value for the price. Sturdy, well-designed and looks amazing." },
      { rating: 5, comment: "One of the best purchases I have made this year. Premium materials!" },
    ];

    for (let i = 0; i < Math.min(savedProducts.length, 8); i++) {
      const p = savedProducts[i];
      const r = reviewComments[i % reviewComments.length];
      await Review.findOneAndUpdate(
        { userId: customer._id, productId: p._id },
        {
          userId: customer._id,
          productId: p._id,
          rating: r.rating,
          comment: r.comment,
        },
        { upsert: true }
      );
    }
    console.log("✅ Customer reviews seeded");

    // 6. Seed Hero Banners
    console.log("\n🖼️ Seeding Hero Banners...");
    const bannersData = [
      {
        title: "Summer Tech Showcase 2026",
        subtitle: "Upgrade your gear with up to 40% off premium audio & electronics",
        image: "https://images.unsplash.com/photo-1468495244123-6c6c332eeece?w=1200&h=500&fit=crop",
        link: "/products?category=electronics",
        order: 1,
        isActive: true,
      },
      {
        title: "Curated Luxury Fashion",
        subtitle: "Handcrafted leather footwear, merino knitwear & timeless accessories",
        image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&h=500&fit=crop",
        link: "/products?category=fashion",
        order: 2,
        isActive: true,
      },
    ];

    for (const b of bannersData) {
      await Banner.findOneAndUpdate({ title: b.title }, b, { upsert: true });
    }
    console.log("✅ Hero banners seeded");

    console.log("\n🎉 ALL SEEDING COMPLETED SUCCESSFULLY!");
    console.log("--------------------------------------------------");
    console.log("DEMO ACCOUNTS READY TO TEST:");
    console.log("  Admin:    admin@shoply.com    / Admin1234!");
    console.log("  Seller:   seller@shoply.com   / Seller1234!");
    console.log("  Customer: customer@shoply.com / Customer1234!");
    console.log("--------------------------------------------------");

    process.exit(0);
  } catch (error) {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  }
}

seed();
