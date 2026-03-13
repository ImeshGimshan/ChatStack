import { motion } from "framer-motion";

import { Button } from "@/components/ui/button";

export function HeroActions() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 pt-1 sm:flex-row">
      <motion.div
        animate={{
          boxShadow: [
            "0 0 8px rgba(255,255,255,0.16), 0 0 16px rgba(79,70,229,0.3)",
            "0 0 14px rgba(255,255,255,0.24), 0 0 26px rgba(79,70,229,0.48)",
            "0 0 8px rgba(255,255,255,0.16), 0 0 16px rgba(79,70,229,0.3)"
          ]
        }}
        transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
        className="rounded-full"
      >
        <Button className="h-12 rounded-full border border-indigo-300/35 bg-linear-to-r from-indigo-500 via-indigo-600 to-blue-500 px-9 text-base font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.18)] transition-all duration-300 hover:from-indigo-400 hover:via-indigo-500 hover:to-blue-400 hover:shadow-[0_0_16px_rgba(99,102,241,0.5)]">
          Deploy Your Stack
        </Button>
      </motion.div>

      <Button
        variant="outline"
        className="h-12 border-white/60 bg-white/5 px-8 text-base text-white backdrop-blur-md hover:bg-white/10 hover:text-white"
      >
        View System Architecture
      </Button>
    </div>
  );
}