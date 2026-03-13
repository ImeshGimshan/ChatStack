"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

const navLinks = ["Home", "Features", "About", "Contact"];

export function HeroNavbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <nav className="fixed inset-x-0 top-3 z-30 px-3 sm:top-5 sm:px-6">
      <div className="mx-auto flex h-14 w-full max-w-4xl items-center justify-between rounded-full border border-white/15 bg-black/45 px-2.5 shadow-[0_14px_36px_rgba(79,70,229,0.28)] backdrop-blur-xl sm:h-16 sm:px-3">
        <div className="flex items-center">
          <Link
            href="/"
            className="font-special rounded-full px-3 py-2 text-base font-semibold tracking-tight text-white [text-shadow:0_0_10px_rgba(99,102,241,0.55)] sm:px-4 sm:text-lg"
          >
            ChatStack
          </Link>
        </div>

        <div className="mx-auto hidden items-center gap-1 md:flex">
          {navLinks.map((link) => (
            <a
              key={link}
              href="#"
              className="group relative rounded-full px-4 py-2 text-sm font-medium text-zinc-300 transition-all duration-300 hover:bg-white/12 hover:text-white hover:shadow-[0_0_14px_rgba(255,255,255,0.18)]"
            >
              {link}
              <span className="absolute inset-x-3 -bottom-0.5 h-px origin-center scale-x-0 bg-white/95 shadow-[0_0_10px_rgba(255,255,255,0.85)] transition-transform duration-300 group-hover:scale-x-100" />
            </a>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMobileMenuOpen((open) => !open)}
            aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={isMobileMenuOpen}
            className="size-9 rounded-full border border-white/20 bg-white/5 text-white hover:bg-white/12 md:hidden"
          >
            {isMobileMenuOpen ? <X className="size-4" /> : <Menu className="size-4" />}
          </Button>

          <Button
            variant="ghost"
            className="hidden rounded-full border border-white/20 bg-white/5 px-4 text-white transition-all duration-300 hover:border-indigo-300/70 hover:bg-indigo-500/20 hover:text-white hover:shadow-[0_0_16px_rgba(99,102,241,0.45)] md:inline-flex"
            asChild
          >
            <Link href="/login">Login</Link>
          </Button>
          <Button
            asChild
            className="hidden h-9 rounded-full bg-white px-4 text-xs font-semibold text-black hover:bg-zinc-100 md:inline-flex md:h-10 md:px-5 md:text-sm"
          >
            <Link href="/register">Sign up</Link>
          </Button>
        </div>
      </div>

      {isMobileMenuOpen ? (
        <div className="mx-auto mt-3 w-full max-w-4xl rounded-3xl border border-white/15 bg-black/55 p-3 shadow-[0_14px_36px_rgba(79,70,229,0.24)] backdrop-blur-xl md:hidden">
          <div className="flex flex-col gap-1">
            {navLinks.map((link) => (
              <a
                key={link}
                href="#"
                onClick={() => setIsMobileMenuOpen(false)}
                className="rounded-2xl px-4 py-3 text-sm font-medium text-zinc-200 transition-colors hover:bg-white/10 hover:text-white"
              >
                {link}
              </a>
            ))}
          </div>

          <div className="mt-3 flex items-center gap-2 border-t border-white/10 pt-3">
            <Button
              variant="ghost"
              className="h-10 flex-1 rounded-full border border-white/20 bg-white/5 text-white hover:bg-white/10"
              asChild
            >
              <Link href="/login" onClick={() => setIsMobileMenuOpen(false)}>Login</Link>
            </Button>
            <Button
              asChild
              className="h-10 flex-1 rounded-full bg-white text-sm font-semibold text-black hover:bg-zinc-100"
            >
              <Link href="/register" onClick={() => setIsMobileMenuOpen(false)}>
                Sign up
              </Link>
            </Button>
          </div>
        </div>
      ) : null}
    </nav>
  );
}