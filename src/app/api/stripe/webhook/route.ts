import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import connectDB from "@/lib/db";
import { Cart, CartItem, Order } from "@/models";
import { restoreStock } from "@/features/inventory/inventory.service";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2024-04-10",
});

export async function POST(request: NextRequest) {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature");

  if (!sig) {
    return new NextResponse("No signature", { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET || "",
    );
  } catch (err) {
    return new NextResponse(`Webhook Error: ${(err as Error).message}`, {
      status: 400,
    });
  }

  await connectDB();

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const orderId = session.metadata?.orderId;
        if (!orderId) break;

        const order = await Order.findByIdAndUpdate(
          orderId,
          {
            status: "PROCESSING",
            paymentStatus: "COMPLETED",
            stripePaymentId: (session.payment_intent as string) || undefined,
          },
          { new: true },
        );

        if (order) {
          const { OrderStatusHistory } = await import("@/models");
          await OrderStatusHistory.create({
            orderId: order._id,
            fromStatus: "PENDING",
            toStatus: "PROCESSING",
            changedBy: "stripe_webhook",
            note: `Payment completed via Stripe (PaymentIntent: ${session.payment_intent || "N/A"})`,
          }).catch(() => {});

          const cart = await Cart.findOneAndUpdate(
            { userId: order.userId },
            { items: [] },
            { new: true },
          );
          if (cart) {
            await CartItem.deleteMany({ cartId: cart._id });
            const { invalidateCache } = await import("@/lib/cache");
            invalidateCache(`cart:${order.userId}`);
          }

          // Send confirmation email
          const { sendOrderConfirmation } = await import("@/lib/email");
          const targetEmail = session.customer_details?.email;
          if (targetEmail) {
            await sendOrderConfirmation(targetEmail, order.orderNumber, order.total).catch(() => {});
          } else if (order.userId) {
            const { default: User } = await import("@/models/User");
            const u = await User.findById(order.userId).select("email").lean<any>();
            if (u?.email) {
              await sendOrderConfirmation(u.email, order.orderNumber, order.total).catch(() => {});
            }
          }
        }
        break;
      }
      case "checkout.session.expired": {
        const session = event.data.object as Stripe.Checkout.Session;
        const orderId = session.metadata?.orderId;
        if (!orderId) break;

        const order = await Order.findById(orderId);
        if (order && order.status === "PENDING" && order.paymentStatus === "PENDING") {
          const { OrderItem, OrderStatusHistory } = await import("@/models");
          const items = await OrderItem.find({ orderId: order._id })
            .select("productId quantity")
            .lean();
          await restoreStock(
            items.map((i: any) => ({
              productId: i.productId.toString(),
              quantity: i.quantity,
            })),
          );
          order.status = "CANCELLED";
          order.paymentStatus = "FAILED";
          await order.save();

          await OrderStatusHistory.create({
            orderId: order._id,
            fromStatus: "PENDING",
            toStatus: "CANCELLED",
            changedBy: "stripe_webhook",
            note: "Stripe checkout session expired",
          }).catch(() => {});
        }
        break;
      }
      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const order = await Order.findOne({ stripePaymentId: paymentIntent.id });
        if (order && order.paymentStatus !== "COMPLETED") {
          const { OrderItem, OrderStatusHistory } = await import("@/models");
          const items = await OrderItem.find({ orderId: order._id })
            .select("productId quantity")
            .lean();
          await restoreStock(
            items.map((i: any) => ({
              productId: i.productId.toString(),
              quantity: i.quantity,
            })),
          );
          const prevStatus = order.status;
          order.paymentStatus = "FAILED";
          order.status = "CANCELLED";
          await order.save();

          await OrderStatusHistory.create({
            orderId: order._id,
            fromStatus: prevStatus,
            toStatus: "CANCELLED",
            changedBy: "stripe_webhook",
            note: `Stripe payment failed: ${paymentIntent.last_payment_error?.message || "Unknown error"}`,
          }).catch(() => {});
        }
        break;
      }
      default:
        break;
    }
  } catch (err) {
    console.error("Webhook handler error:", err);
    return new NextResponse("Webhook handler error", { status: 500 });
  }

  return new NextResponse("OK", { status: 200 });
}
