export type Role = "CUSTOMER" | "SELLER" | "ADMIN";
export type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "PROCESSING"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED"
  | "REFUNDED";
export type PaymentMethod = "STRIPE" | "COD";
export type PaymentStatus = "PENDING" | "COMPLETED" | "FAILED" | "REFUNDED";

export interface UserPayload {
  userId: string;
  email: string;
  role: Role;
}

export interface ProductWithCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  comparePrice: number | null;
  images: string[];
  stock: number;
  isActive: boolean;
  categoryId: string;
  sellerId: string;
  category: { id: string; name: string; slug: string };
  _count?: { reviews: number };
  avgRating?: number;
}

export interface CartWithItems {
  id: string;
  userId: string | null;
  guestId: string | null;
  items: CartItemWithProduct[];
}

export interface CartItemWithProduct {
  id: string;
  cartId: string;
  productId: string;
  quantity: number;
  product: {
    id: string;
    name: string;
    slug: string;
    price: number;
    images: string[];
    stock: number;
    isActive: boolean;
  };
}

export interface OrderWithItems {
  id: string;
  orderNumber: string;
  userId: string;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  subtotal: number;
  shippingCost: number;
  tax: number;
  discountAmount: number;
  total: number;
  couponCode: string | null;
  shippingAddress: Record<string, unknown>;
  items: OrderItemWithProduct[];
  createdAt: Date;
}

export interface OrderItemWithProduct {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  productId: string;
  variantId: string | null;
  variantName: string | null;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface DashboardStats {
  totalUsers: number;
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  recentOrders: OrderWithItems[];
}
