import { motion } from "framer-motion";

const techStack = ["React", "Next.js", "Redis", "PostgreSQL", "MongoDB", "RabbitMQ"];

function StackLogo({ name }: { name: string }) {
  return (
    <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium uppercase tracking-[0.18em] text-white/40">
      <svg
        viewBox="0 0 24 24"
        className="h-4 w-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="9" />
        <path d="M5 12h14M12 5v14" />
      </svg>
      <span>{name}</span>
    </div>
  );
}

export function HeroTechMarquee() {
  return (
    <motion.div
      className="absolute bottom-6 left-0 right-0 z-10 overflow-hidden"
      animate={{ x: ["0%", "-4%", "0%"] }}
      transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
    >
      <div className="mx-auto flex w-max items-center gap-3 px-6">
        {[...techStack, ...techStack].map((name, index) => (
          <StackLogo key={`${name}-${index}`} name={name} />
        ))}
      </div>
    </motion.div>
  );
}