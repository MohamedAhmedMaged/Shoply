import connectDB from "@/lib/db";
import { Product, Review } from "@/models";
import { ReviewInput } from "@/lib/validators";

export async function getProductReviews(productId: string, page = 1, limit = 20) {
  await connectDB();
  const skip = (page - 1) * limit;
  const [reviews, total] = await Promise.all([
    Review.find({ productId })
      .populate("userId", "id name avatar")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Review.countDocuments({ productId }),
  ]);
  return {
    data: reviews,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function createReview(
  userId: string,
  productId: string,
  input: ReviewInput,
) {
  await connectDB();
  const existing = await Review.findOne({ userId, productId });
  if (existing) throw new Error("You have already reviewed this product");

  const product = await Product.findById(productId);
  if (!product) throw new Error("Product not found");

  const review = await Review.create({
    userId,
    productId,
    rating: input.rating,
    comment: input.comment,
  });
  await review.populate("userId", "id name avatar");
  return review;
}

export async function deleteReview(userId: string, reviewId: string) {
  await connectDB();
  const review = await Review.findOne({ _id: reviewId, userId });
  if (!review) throw new Error("Review not found");
  await Review.deleteOne({ _id: reviewId });
  return { success: true };
}
