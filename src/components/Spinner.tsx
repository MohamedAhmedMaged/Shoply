import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

function Spinner({
  className,
  size = 24,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { size?: number }) {
  return (
    <div className={cn("flex items-center justify-center", className)} {...props}>
      <Loader2 className="animate-spin text-primary" size={size} />
    </div>
  );
}

export { Spinner };
