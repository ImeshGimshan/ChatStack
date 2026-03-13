import { Badge } from "@/components/ui/badge";

const badges = [
  "Event-Driven via RabbitMQ",
  "Real-time via NestJS",
  "Secured by Spring Boot"
];

export function HeroBadges() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-4">
      {badges.map((label) => (
        <Badge
          key={label}
          className="rounded-full border border-white/30 bg-white/10 px-5 py-2.5 text-sm font-medium tracking-wide text-zinc-100 shadow-[0_0_18px_rgba(255,255,255,0.08)] backdrop-blur-md"
        >
          {label}
        </Badge>
      ))}
    </div>
  );
}