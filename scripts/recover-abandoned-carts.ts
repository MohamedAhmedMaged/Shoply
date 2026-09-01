import connectDB from "../src/lib/db";
import { Cart, CartItem, Order } from "../src/models";
import { sendAbandonedCartEmail } from "../src/lib/email";
import { APP_URL } from "../src/lib/config";

const ABANDONMENT_HOURS = 24;

async function recoverAbandonedCarts() {
  console.log("Starting abandoned cart recovery...");

  await connectDB();

  const cutoff = new Date(Date.now() - ABANDONMENT_HOURS * 60 * 60 * 1000);

  // Find authenticated user carts that haven't been active since cutoff
  const abandonedCarts = await Cart.find({
    userId: { $exists: true },
    lastActiveAt: { $lt: cutoff },
  })
    .populate("userId", "email name")
    .lean();

  console.log(`Found ${abandonedCarts.length} potentially abandoned carts`);

  let recovered = 0;
  let skipped = 0;

  for (const cart of abandonedCarts as any[]) {
    try {
      if (!cart.userId?._id) {
        skipped++;
        continue;
      }

      // Check if user already has an order after the cart was last active
      const hasOrder = await Order.findOne({
        userId: cart.userId._id,
        createdAt: { $gt: cart.lastActiveAt },
      });

      if (hasOrder) {
        skipped++;
        continue;
      }

      // Get cart items
      const cartItems = await CartItem.find({
        cartId: cart._id,
      })
        .populate("productId", "name price images isActive")
        .lean();

      const validItems = cartItems.filter(
        (item: any) => item.productId && item.productId.isActive,
      );

      if (validItems.length === 0) {
        skipped++;
        continue;
      }

      const items = validItems.map((item: any) => ({
        name: item.productId.name,
        price: item.productId.price,
        quantity: item.quantity,
        image: item.productId.images?.[0] || "",
      }));

      const total = validItems.reduce(
        (sum: number, item: any) => sum + item.productId.price * item.quantity,
        0,
      );

      const user = cart.userId;
      const checkoutUrl = `${APP_URL}/checkout`;

      await sendAbandonedCartEmail(
        user.email,
        user.name || "there",
        items,
        total,
        checkoutUrl,
      );

      // Mark cart as non-abandoned by updating lastActiveAt so we don't re-send
      await Cart.findByIdAndUpdate(cart._id, { lastActiveAt: new Date() });

      recovered++;
      console.log(`Recovery email sent to ${user.email}`);
    } catch (err) {
      console.error(`Failed to process cart ${cart._id}:`, err);
    }
  }

  console.log(`Done. Sent: ${recovered}, Skipped: ${skipped}`);
}

recoverAbandonedCarts()
  .then(() => {
    console.log("Abandoned cart recovery complete");
    process.exit(0);
  })
  .catch((err) => {
    console.error("Abandoned cart recovery failed:", err);
    process.exit(1);
  });
