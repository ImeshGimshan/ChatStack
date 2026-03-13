import { LogOut, Search } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";

type ChatTopBarProps = {
  channelName: string;
  description: string;
};

export function ChatTopBar({ channelName, description }: ChatTopBarProps) {
  const router = useRouter();
  const { logout } = useAuth();

  function handleLogout() {
    logout();
    router.replace("/");
  }

  return (
    <header className="h-14 border-b border-white/10 bg-black/45 px-4 backdrop-blur-xl">
      <div className="flex h-full items-center justify-between gap-4">
        <div className="min-w-0">
          <h1 className="truncate font-tektur text-base text-white">#{channelName}</h1>
          <p className="truncate font-montserrat text-[11px] text-zinc-400">{description}</p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex w-full max-w-xs items-center rounded-lg border border-white/10 bg-white/5 px-2.5 sm:max-w-sm">
            <Search className="size-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Search in channel"
              className="h-9 w-full bg-transparent px-2 font-poppins text-sm text-zinc-200 outline-none placeholder:text-zinc-500"
            />
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            className="size-9 rounded-lg text-zinc-300 transition-all duration-300 ease-in-out hover:bg-red-500/20 hover:text-red-100"
            aria-label="Logout"
          >
            <LogOut className="size-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}
