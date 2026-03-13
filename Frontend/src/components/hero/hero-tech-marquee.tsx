import { motion } from "framer-motion";

const techStack = ["React", "Next.js", "Redis", "PostgreSQL", "MongoDB", "RabbitMQ"];

function StackLogo({ name }: { name: string }) {
  return (
    <div className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[10px] font-medium uppercase tracking-[0.14em] text-white/40 sm:gap-2 sm:px-4 sm:py-2 sm:text-xs sm:tracking-[0.18em]">
      <svg
        viewBox="0 0 24 24"
        className="h-3.5 w-3.5 sm:h-4 sm:w-4"
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
      className="absolute bottom-4 left-0 right-0 z-10 hidden overflow-hidden sm:block md:bottom-6"
      animate={{ x: ["0%", "-4%", "0%"] }}
      transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
    >
      <div className="mx-auto flex w-max items-center gap-2 px-4 sm:gap-3 sm:px-6">
        {[...techStack, ...techStack].map((name, index) => (
          <StackLogo key={`${name}-${index}`} name={name} />
        ))}
      </div>
    </motion.div>
  );
}