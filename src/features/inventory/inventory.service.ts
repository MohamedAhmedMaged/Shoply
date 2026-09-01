import mongoose from "mongoose";
import connectDB from "@/lib/db";
import { Product } from "@/models";

export class InsufficientStockError extends Error {
  public readonly productId: string;
  public readonly requested: number;
  public readonly available: number;
  constructor(productId: string, requested: number, available: number) {
    super(
      `Insufficient stock for product ${productId}: requested ${requested}, only ${available} available`,
    );
    this.name = "InsufficientStockError";
    this.productId = productId;
    this.requested = requested;
    this.available = available;
  }
}

export class InactiveProductError extends Error {
  constructor(productId: string) {
    super(`Product ${productId} is not available for purchase`);
    this.name = "InactiveProductError";
  }
}

export interface StockRequirement {
  productId: string;
  quantity: number;
}

/**
 * Atomically decrement stock for all products in a single bulkWrite.
 * Uses conditional updateOne (stock >= qty, isActive: true) so MongoDB
 * serializes concurrent decrements at the document level.
 * Falls back to a single diagnostic query for any failures.
 */
export async function decrementStock(
  requirements: StockRequirement[],
  session?: mongoose.ClientSession
): Promise<void> {
  if (requirements.length === 0) return;
  await connectDB();

  // Validate before attempting decrement
  await validateStock(requirements);

  const ops = requirements.map((req) => ({
    updateOne: {
      filter: {
        _id: new mongoose.Types.ObjectId(req.productId),
        isActive: true,
        stock: { $gte: req.quantity },
      },
      update: { $inc: { stock: -req.quantity } },
    },
  }));

  const result = await Product.bulkWrite(ops, session ? { session } : {});

  // All succeeded — fast path
  if (result.matchedCount === requirements.length) return;

  // If a MongoDB session is active, the transaction abort will roll back automatically.
  // Do NOT manually restore stock here if session is present to prevent double-restoration.
  if (session) {
    throw new Error("Concurrent stock modification detected during transaction");
  }

  // Standalone fallback: diagnose which product failed
  const objectIds = requirements.map((r) => new mongoose.Types.ObjectId(r.productId));
  const allProducts = await Product.find({ _id: { $in: objectIds } })
    .select("_id stock isActive")
    .lean<any[]>();
  const productMap = new Map(allProducts.map((p: any) => [p._id.toString(), p]));

  // Find failing item
  let failingError: Error | null = null;
  const successfullyDecremented: StockRequirement[] = [];

  for (const req of requirements) {
    const p = productMap.get(req.productId);
    if (!p) {
      failingError = new Error(`Product ${req.productId} not found`);
    } else if (!p.isActive) {
      failingError = new InactiveProductError(req.productId);
    } else if (p.stock < 0) {
      failingError = new InsufficientStockError(req.productId, req.quantity, p.stock);
    } else {
      // This product had sufficient stock and was decremented
      successfullyDecremented.push(req);
    }
  }

  // Only restore the items that were actually decremented, avoiding stock inflation!
  if (successfullyDecremented.length > 0) {
    await restoreStock(successfullyDecremented).catch(() => {});
  }

  throw failingError || new Error("Failed to reserve inventory for all items");
}

export async function restoreStock(
  requirements: StockRequirement[],
  session?: mongoose.ClientSession
): Promise<void> {
  if (requirements.length === 0) return;
  await connectDB();
  const ops = requirements.map((req) => ({
    updateOne: {
      filter: { _id: new mongoose.Types.ObjectId(req.productId) },
      update: { $inc: { stock: req.quantity } },
    },
  }));
  await Product.bulkWrite(ops, session ? { session } : {});
}

/**
 * Re-validate the live stock of every line item against the cart snapshot.
 * Throws `InsufficientStockError` on the first failure (caller is expected to
 * restore any stock already decremented).
 */
export async function validateStock(
  requirements: StockRequirement[],
): Promise<void> {
  if (requirements.length === 0) return;
  await connectDB();
  const ids = requirements
    .filter((r) => mongoose.isValidObjectId(r.productId))
    .map((r) => new mongoose.Types.ObjectId(r.productId));
  const products = await Product.find({ _id: { $in: ids } })
    .select("_id stock isActive")
    .lean<any[]>();
  const byId = new Map(products.map((p: any) => [p._id.toString(), p]));
  for (const req of requirements) {
    const p = byId.get(req.productId);
    if (!p) throw new Error(`Product ${req.productId} not found`);
    if (!p.isActive) throw new InactiveProductError(req.productId);
    if (p.stock < req.quantity) {
      throw new InsufficientStockError(req.productId, req.quantity, p.stock);
    }
  }
}
