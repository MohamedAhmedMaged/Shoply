import { notFound } from "next/navigation";
import { auth } from "@/auth";
import ProductDetailClient from "./ProductDetailClient";
import connectDB from "@/lib/db";
import { Product, Review } from "@/models";

async function getProductData(slug: string) {
  await connectDB();
  const product = await Product.findOne({ slug })
    .populate("categoryId", "id name slug")
    .populate("sellerId", "id name")
    .lean();
  if (!product) return null;

  const p = product as any;
  const reviews = await Review.find({ productId: p._id })
    .populate("userId", "id name avatar")
    .sort({ createdAt: -1 })
    .lean();

  return {
    id: p._id.toString(),
    name: p.name,
    slug: p.slug,
    description: p.description,
    price: p.price,
    comparePrice: p.comparePrice || null,
    images: p.images || [],
    stock: p.stock,
    sku: p.sku || null,
    isActive: p.isActive,
    category: p.categoryId
      ? {
        id: p.categoryId._id?.toString() || p.categoryId,
        name: p.categoryId.name,
        slug: p.categoryId.slug,
      }
      : { name: "Uncategorized" },
    seller: p.sellerId
      ? {
        id: p.sellerId._id?.toString() || p.sellerId,
        name: p.sellerId.name,
      }
      : { name: "Unknown" },
    reviews: (reviews || []).map((r: any) => ({
      id: r._id.toString(),
      rating: r.rating,
      comment: r.comment || null,
      user: r.userId
        ? {
          id: r.userId._id?.toString() || r.userId,
          name: r.userId.name,
          avatar: r.userId.avatar || null,
        }
        : { name: "Anonymous", avatar: null },
      createdAt: r.createdAt?.toString() || null,
    })),
    createdAt: p.createdAt?.toString() || null,
    updatedAt: p.updatedAt?.toString() || null,
  };
}

function jsonLd(product: any) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: product.images[0],
    sku: product.sku || product.id,
    offers: {
      "@type": "Offer",
      price: product.price,
      priceCurrency: "USD",
      availability: product.stock > 0
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
    },
    ...(product.category && {
      category: product.category.name,
    }),
    ...(product.reviews?.length > 0 && {
      review: product.reviews.map((r: any) => ({
        "@type": "Review",
        reviewRating: {
          "@type": "Rating",
          ratingValue: r.rating,
        },
        author: {
          "@type": "Person",
          name: r.user?.name || "Anonymous",
        },
      })),
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: (
          product.reviews.reduce((s: number, r: any) => s + r.rating, 0) /
          product.reviews.length
        ).toFixed(1),
        reviewCount: product.reviews.length,
      },
    }),
  };
}

export default async function ProductDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  try {
    const product = await getProductData(params.slug);
    if (!product) return notFound();

    const session = await auth();
    const currentUserId = session?.user?.id || null;

    return (
      <>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(jsonLd(product)),
          }}
        />
        <ProductDetailClient
          product={product}
          isOwner={product?.seller?.id === currentUserId}
        />
      </>
    );
  } catch {
    return notFound();
  }
}
