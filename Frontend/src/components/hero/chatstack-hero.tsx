"use client";

import { motion } from "framer-motion";

import DarkVeil from "@/components/DarkVeil";
import { HeroActions } from "@/components/hero/hero-actions";
import { HeroBadges } from "@/components/hero/hero-badges";
import { HeroNavbar } from "@/components/hero/hero-navbar";
import { HeroTechMarquee } from "@/components/hero/hero-tech-marquee";

const staggerContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.16,
      delayChildren: 0.22
    }
  }
};

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.62
    }
  }
};

export function ChatStackHero() {
  return (
    <section className="relative h-screen w-full overflow-hidden bg-[#0A0A0B] text-white">
      <div className="pointer-events-none absolute inset-0 z-0">
        <DarkVeil
          hueShift={0}
          noiseIntensity={0.03}
          scanlineIntensity={0.02}
          scanlineFrequency={1.8}
          speed={0.4}
          warpAmount={0.08}
          resolutionScale={1}
        />
      </div>

      <div className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(circle_at_20%_15%,rgba(79,70,229,0.2),transparent_42%),radial-gradient(circle_at_80%_85%,rgba(255,255,255,0.1),transparent_35%)]" />

      <HeroNavbar />

      <div className="relative z-10 mx-auto flex h-full w-full max-w-6xl flex-col items-center justify-center px-6 pt-24 text-center">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="show"
          className="space-y-8"
        >
          <motion.div variants={fadeInUp}>
            <HeroBadges />
          </motion.div>

          <motion.h1
            variants={fadeInUp}
            className="font-special mx-auto max-w-5xl text-5xl font-semibold tracking-[-0.04em] text-white sm:text-6xl lg:text-[80px] lg:leading-[1.02]"
          >
            Enterprise-Grade Chat, Built for the Edge.
          </motion.h1>

          <motion.p variants={fadeInUp} className="mx-auto max-w-2xl text-base leading-relaxed text-zinc-300 sm:text-lg">
            A highly scalable, 6-service architecture delivering instant messaging, social
            connections, and real-time presence. Built for developers who demand performance.
          </motion.p>

          <motion.div variants={fadeInUp}>
            <HeroActions />
          </motion.div>
        </motion.div>
      </div>

      <HeroTechMarquee />
    </section>
  );
}