import { Role } from "@/types";
import NextAuth from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: Role;
      image?: string | null;
      emailVerified?: Date | string | null;
    };
  }
  interface User {
    role?: Role;
    emailVerified?: Date | string | null;
  }
}
