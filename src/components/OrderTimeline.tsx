"use client";

import { Check, Clock, X, Package, Truck, RefreshCw } from "lucide-react";

type TimelineEntry = {
    status: string;
    createdAt: string | null;
};

interface OrderTimelineProps {
    currentStatus: string;
    history?: TimelineEntry[];
}

const STATUS_STEPS = [
    "PENDING",
    "CONFIRMED",
    "PROCESSING",
    "SHIPPED",
    "DELIVERED",
] as const;

const TERMINAL_STATUSES = ["CANCELLED", "REFUNDED"] as const;

const STATUS_ICONS: Record<string, React.ReactNode> = {
    PENDING: <Clock className="h-4 w-4" />,
    CONFIRMED: <Check className="h-4 w-4" />,
    PROCESSING: <Package className="h-4 w-4" />,
    SHIPPED: <Truck className="h-4 w-4" />,
    DELIVERED: <Check className="h-4 w-4" />,
    CANCELLED: <X className="h-4 w-4" />,
    REFUNDED: <RefreshCw className="h-4 w-4" />,
};

const STATUS_COLORS: Record<string, string> = {
    PENDING: "border-amber-500 text-amber-400 bg-amber-500/10",
    CONFIRMED: "border-blue-500 text-blue-400 bg-blue-500/10",
    PROCESSING: "border-violet-500 text-violet-400 bg-violet-500/10",
    SHIPPED: "border-cyan-500 text-cyan-400 bg-cyan-500/10",
    DELIVERED: "border-emerald-500 text-emerald-400 bg-emerald-500/10",
    CANCELLED: "border-destructive text-destructive bg-destructive/10",
    REFUNDED: "border-muted-foreground text-muted-foreground bg-muted/20",
};

const STATUS_LABELS: Record<string, string> = {
    PENDING: "Order Placed",
    CONFIRMED: "Confirmed",
    PROCESSING: "Processing",
    SHIPPED: "Shipped",
    DELIVERED: "Delivered",
    CANCELLED: "Cancelled",
    REFUNDED: "Refunded",
};

function formatDate(dateStr: string | null): string {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

function getStatusDate(
    status: string,
    history?: TimelineEntry[],
): string | null {
    if (!history) return null;
    const entry = history.find((h) => h.status === status);
    return entry?.createdAt || null;
}

export default function OrderTimeline({
    currentStatus,
    history,
}: OrderTimelineProps) {
    const isTerminal = TERMINAL_STATUSES.includes(
        currentStatus as typeof TERMINAL_STATUSES[number],
    );
    const currentStepIndex = STATUS_STEPS.indexOf(
        currentStatus as typeof STATUS_STEPS[number],
    );

    // Terminal state (cancelled/refunded)
    if (isTerminal) {
        return (
            <div className="space-y-3">
                <div className="flex items-center gap-3">
                    <div
                        className={`flex h-10 w-10 items-center justify-center rounded-full border-2 ${STATUS_COLORS[currentStatus] || "border-muted bg-muted/20 text-muted-foreground"}`}
                    >
                        {STATUS_ICONS[currentStatus]}
                    </div>
                    <div>
                        <p className="text-sm font-medium text-foreground">
                            {STATUS_LABELS[currentStatus] || currentStatus}
                        </p>
                        <p className="text-xs text-muted-foreground">
                            {formatDate(getStatusDate(currentStatus, history))}
                        </p>
                    </div>
                </div>
                {/* Show progress up to the cancellation point */}
                {history && history.length > 1 && (
                    <div className="ml-5 border-l border-border/50 pl-6 space-y-3">
                        {history
                            .filter((h) => !TERMINAL_STATUSES.includes(h.status as typeof TERMINAL_STATUSES[number]))
                            .map((entry) => (
                                <div key={entry.status} className="flex items-center gap-3">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-full border border-muted bg-muted/20 text-muted-foreground">
                                        {STATUS_ICONS[entry.status] || <Clock className="h-3.5 w-3.5" />}
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">
                                            {STATUS_LABELS[entry.status] || entry.status}
                                        </p>
                                        <p className="text-xs text-muted-foreground/60">
                                            {formatDate(entry.createdAt)}
                                        </p>
                                    </div>
                                </div>
                            ))}
                    </div>
                )}
            </div>
        );
    }

    // Normal progress timeline
    return (
        <div className="space-y-0">
            {STATUS_STEPS.map((step, index) => {
                const isCompleted = currentStepIndex >= index;
                const isCurrent = currentStepIndex === index;
                const date = getStatusDate(step, history);

                return (
                    <div key={step} className="flex gap-3">
                        {/* Connector line + dot */}
                        <div className="flex flex-col items-center">
                            <div
                                className={`flex h-8 w-8 items-center justify-center rounded-full border-2 transition-colors ${isCompleted
                                        ? `${STATUS_COLORS[step]}`
                                        : "border-muted bg-muted/10 text-muted-foreground/40"
                                    } ${isCurrent ? "ring-2 ring-primary/20" : ""}`}
                            >
                                {isCompleted ? (
                                    STATUS_ICONS[step]
                                ) : (
                                    <div className="h-2 w-2 rounded-full bg-muted" />
                                )}
                            </div>
                            {index < STATUS_STEPS.length - 1 && (
                                <div
                                    className={`h-8 w-0.5 transition-colors ${isCompleted && !isCurrent
                                            ? "bg-primary/30"
                                            : "bg-border/50"
                                        }`}
                                />
                            )}
                        </div>

                        {/* Content */}
                        <div className={`pb-6 ${index === STATUS_STEPS.length - 1 ? "pb-0" : ""}`}>
                            <p
                                className={`text-sm font-medium ${isCompleted ? "text-foreground" : "text-muted-foreground/50"
                                    }`}
                            >
                                {STATUS_LABELS[step]}
                            </p>
                            {date && (
                                <p className="text-xs text-muted-foreground">{formatDate(date)}</p>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
