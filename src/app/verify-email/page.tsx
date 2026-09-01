import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import VerifyEmailClient from "./VerifyEmailClient";

export const metadata = {
  title: "Verify your email - Shoply",
};

export default function VerifyEmailPage() {
  return (
    <div className="mx-auto flex min-h-[calc(100vh-8rem)] max-w-2xl items-center justify-center px-4 py-12">
      <Suspense
        fallback={
          <div className="flex h-48 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        }
      >
        <VerifyEmailClient />
      </Suspense>
    </div>
  );
}
