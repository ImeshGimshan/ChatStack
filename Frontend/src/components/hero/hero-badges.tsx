import { Badge } from "@/components/ui/badge";

const badges = [
  "Instant Message Delivery",
  "Live Social Presence",
  "Stateless Microservices"
];

export function HeroBadges() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4">
      {badges.map((label) => (
        <Badge
          key={label}
          className="rounded-full border border-white/30 bg-white/10 px-3 py-1.5 text-center text-xs font-medium tracking-wide text-zinc-100 shadow-[0_0_18px_rgba(255,255,255,0.08)] backdrop-blur-md sm:px-5 sm:py-2.5 sm:text-sm"
        >
          {label}
        </Badge>
      ))}
    </div>
  );
}