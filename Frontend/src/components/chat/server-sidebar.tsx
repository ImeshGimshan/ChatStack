import { Globe2, Plus, Shield } from "lucide-react";

import { Button } from "@/components/ui/button";

type ServerSidebarProps = {
  activeSection: "global" | "personal";
  onSelectSection: (section: "global" | "personal") => void;
  onCreateServer: () => void;
};

export function ServerSidebar({ activeSection, onSelectSection, onCreateServer }: ServerSidebarProps) {
  const isGlobalActive = activeSection === "global";
  const isPersonalActive = activeSection === "personal";

  return (
    <aside className="hidden w-16 flex-col border-r border-white/10 bg-[#060607] py-3 md:flex">
      <div className="flex justify-center px-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onSelectSection("global")}
          className={`size-11 border transition-all duration-300 ease-in-out ${
            isGlobalActive
              ? "rounded-xl border-indigo-300/60 bg-indigo-500/20 text-indigo-100 shadow-[0_0_15px_rgba(79,70,229,0.3)]"
              : "rounded-2xl border-white/15 bg-black/45 text-zinc-100 hover:rounded-xl hover:bg-white/10 hover:text-white"
          }`}
          aria-label="Global"
          title="Global"
        >
          <Globe2 className="size-5" />
        </Button>
      </div>

      <div className="mx-3 my-3 h-px bg-white/10" />

      <div className="flex justify-center px-2 pb-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onSelectSection("personal")}
          className={`size-11 border transition-all duration-300 ease-in-out ${
            isPersonalActive
              ? "rounded-xl border-indigo-300/60 bg-indigo-500/20 text-indigo-100 shadow-[0_0_15px_rgba(79,70,229,0.3)]"
              : "rounded-2xl border-white/10 bg-black/45 text-zinc-200 hover:rounded-xl hover:bg-white/10 hover:text-white hover:shadow-[0_0_15px_rgba(79,70,229,0.25)]"
          }`}
          aria-label="My Space"
          title="My Space"
        >
          <Shield className="size-5" />
        </Button>
      </div>

      <div className="flex-1" />

      <div className="relative flex justify-center px-2 pt-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={onCreateServer}
          title="Create Server"
          className="group size-11 rounded-2xl border border-white/15 bg-black/45 text-zinc-200 transition-all duration-300 ease-in-out hover:rounded-xl hover:bg-white/10 hover:text-white"
          aria-label="Create Server"
        >
          <Plus className="size-5" />
        </Button>
      </div>
    </aside>
  );
}
