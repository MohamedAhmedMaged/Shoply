import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const MONGODB_URI = process.env.DATABASE_URL || 'mongodb://localhost:27017/ecommerce';
const DAYS = Number(process.env.GUEST_CART_TTL_DAYS || 30);
const cutoff = new Date(Date.now() - DAYS * 24 * 60 * 60 * 1000);

const cartSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    guestId: { type: String, unique: true, sparse: true },
    items: [{ type: mongoose.Schema.Types.ObjectId, ref: 'CartItem' }],
  },
  { timestamps: true, strict: false },
);

const cartItemSchema = new mongoose.Schema(
  {
    cartId: { type: mongoose.Schema.Types.ObjectId, ref: 'Cart' },
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    quantity: Number,
  },
  { strict: false },
);

const Cart = mongoose.models.Cart || mongoose.model('Cart', cartSchema);
const CartItem = mongoose.models.CartItem || mongoose.model('CartItem', cartItemSchema);

async function main() {
  await mongoose.connect(MONGODB_URI);
  console.log(`[cleanup-guest-carts] Connected. TTL = ${DAYS} days (cutoff ${cutoff.toISOString()})`);

  const staleGuestCarts = await Cart.find({
    guestId: { $exists: true, $ne: null },
    updatedAt: { $lt: cutoff },
  }).select('_id items').lean<{ _id: any; items: any[] }[]>();

  if (staleGuestCarts.length === 0) {
    console.log('[cleanup-guest-carts] No stale guest carts found.');
    await mongoose.disconnect();
    return;
  }

  const cartIds = staleGuestCarts.map((c) => c._id);
  const itemIds = staleGuestCarts.flatMap((c) => c.items || []);

  const itemResult = await CartItem.deleteMany({ _id: { $in: itemIds } });
  const cartResult = await Cart.deleteMany({ _id: { $in: cartIds } });

  console.log(
    `[cleanup-guest-carts] Removed ${cartResult.deletedCount} guest carts and ${itemResult.deletedCount} cart items.`,
  );

  await mongoose.disconnect();
}

main().catch(async (err) => {
  console.error('[cleanup-guest-carts] Failed:', err);
  try {
    await mongoose.disconnect();
  } catch {}
  process.exit(1);
});
