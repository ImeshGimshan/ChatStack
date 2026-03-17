import { useState } from "react";
import { Globe2, Plus, Shield } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type ServerSidebarProps = {
  activeSection: "global" | "personal";
  onSelectSection: (section: "global" | "personal") => void;
  onCreateServer: (name: string) => void;
};

export function ServerSidebar({ activeSection, onSelectSection, onCreateServer }: ServerSidebarProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [serverName, setServerName] = useState("");

  const isGlobalActive = activeSection === "global";
  const isPersonalActive = activeSection === "personal";

  const handleSubmit = () => {
    if (serverName.trim()) {
      onCreateServer(serverName.trim());
      setServerName("");
      setIsDialogOpen(false);
    }
  };

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
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              title="Create Server"
              className="group size-11 rounded-2xl border border-white/15 bg-black/45 text-zinc-200 transition-all duration-300 ease-in-out hover:rounded-xl hover:bg-white/10 hover:text-white"
              aria-label="Create Server"
            >
              <Plus className="size-5" />
            </Button>
          </DialogTrigger>
          <DialogContent className="border-white/10 bg-[#111214] text-white sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="font-special text-xl">Create a Server</DialogTitle>
              <DialogDescription className="text-zinc-400">
                Give your new server a personality with a name. You can always change it later.
              </DialogDescription>
            </DialogHeader>
            <div className="flex items-center space-x-2 py-4">
              <div className="grid flex-1 gap-2">
                <Label htmlFor="server-name" className="text-xs font-semibold uppercase text-zinc-300">
                  Server Name
                </Label>
                <Input
                  id="server-name"
                  value={serverName}
                  onChange={(e) => setServerName(e.target.value)}
                  placeholder="e.g. My Awesome Server"
                  className="border-white/10 bg-black/50 text-white focus-visible:ring-indigo-500"
                  autoComplete="off"
                />
              </div>
            </div>
            <DialogFooter className="sm:justify-between">
              <DialogClose asChild>
                <Button type="button" variant="ghost" className="text-zinc-400 hover:bg-white/5 hover:text-white">
                  Cancel
                </Button>
              </DialogClose>
              <Button 
                type="button" 
                onClick={handleSubmit} 
                disabled={!serverName.trim()}
                className="bg-indigo-600 text-white hover:bg-indigo-500"
              >
                Create
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </aside>
  );
}
