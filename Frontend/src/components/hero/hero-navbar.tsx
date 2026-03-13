import { Button } from "@/components/ui/button";

const navLinks = ["Home", "Features", "About", "Contact"];

export function HeroNavbar() {
  return (
    <nav className="fixed inset-x-0 top-5 z-30 px-4 sm:px-6">
      <div className="mx-auto flex h-16 w-full max-w-4xl items-center justify-between rounded-full border border-white/15 bg-black/45 px-3 shadow-[0_14px_36px_rgba(79,70,229,0.28)] backdrop-blur-xl">
        <div className="hidden items-center sm:flex">
          <a
            href="#"
            className="font-special rounded-full px-4 py-2 text-lg font-semibold tracking-tight text-white [text-shadow:0_0_10px_rgba(99,102,241,0.55)]"
          >
            ChatStack
          </a>
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
            className="hidden rounded-full border border-white/20 bg-white/5 px-4 text-white transition-all duration-300 hover:border-indigo-300/70 hover:bg-indigo-500/20 hover:text-white hover:shadow-[0_0_16px_rgba(99,102,241,0.45)] sm:inline-flex"
          >
            Login
          </Button>
          <Button className="h-10 rounded-full bg-white px-5 text-sm font-semibold text-black hover:bg-zinc-100">
            Sign up
          </Button>
        </div>
      </div>
    </nav>
  );
}