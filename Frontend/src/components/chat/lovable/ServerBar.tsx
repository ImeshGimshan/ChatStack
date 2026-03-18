import { useState } from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, Plus, Users, LayoutGrid, BookOpen, Settings, LogOut, Search } from 'lucide-react';
import { type ChatServer } from '@/lib/chat-client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface Props {
  servers: ChatServer[];
  activeServerId?: string | null;
  activeSection: 'global' | 'personal';
  onSelectServer: (id: string) => void;
  onGlobalSection: () => void;
  onPersonalSection: () => void;
  onCreateServer: (name: string) => Promise<void>;
  onFeed?: () => void;
  onConnections?: () => void;
  onSettings?: () => void;
  onLogout?: () => void;
  onSearch?: () => void;
  onProfile?: () => void;
  userProfile?: {
    username?: string;
    avatarUrl?: string;
  };
}

export default function ServerBar({ 
  servers, 
  activeServerId, 
  activeSection, 
  onSelectServer, 
  onGlobalSection,
  onPersonalSection,
  onCreateServer,
  onFeed,
  onConnections,
  onSettings,
  onLogout,
  onSearch,
  onProfile,
  userProfile
}: Props) {
  const [newName, setNewName] = useState('');
  const [open, setOpen] = useState(false);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    await onCreateServer(newName.trim());
    setNewName('');
    setOpen(false);
  };

  return (
    <TooltipProvider delayDuration={0}>
      <div className="flex flex-col items-center h-full py-4 gap-4 bg-card select-none">
        {/* Top Section: Discovery & DMs */}
        <div className="flex flex-col gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={onGlobalSection}
                className={`w-12 h-12 rounded-[16px] flex items-center justify-center transition-all duration-200 ${
                  activeSection === 'global' ? 'bg-primary text-primary-foreground rounded-[12px]' : 'bg-surface text-muted-foreground hover:bg-primary hover:text-primary-foreground hover:rounded-[12px]'
                }`}
              >
                <LayoutGrid className="h-5 w-5" />
              </motion.button>
            </TooltipTrigger>
            <TooltipContent side="right">Discover</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={onPersonalSection}
                className={`w-12 h-12 rounded-[16px] flex items-center justify-center transition-all duration-200 ${
                  activeSection === 'personal' && !activeServerId ? 'bg-primary text-primary-foreground rounded-[12px]' : 'bg-surface text-muted-foreground hover:bg-primary hover:text-primary-foreground hover:rounded-[12px]'
                }`}
              >
                <MessageSquare className="h-5 w-5" />
              </motion.button>
            </TooltipTrigger>
            <TooltipContent side="right">Direct Messages</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={onConnections}
                className={`w-12 h-12 rounded-[16px] flex items-center justify-center transition-all duration-200 bg-surface text-muted-foreground hover:bg-primary hover:text-primary-foreground hover:rounded-[12px]`}
              >
                <Users className="h-5 w-5" />
              </motion.button>
            </TooltipTrigger>
            <TooltipContent side="right">Connections</TooltipContent>
          </Tooltip>
        </div>

        <div className="w-8 h-[2px] bg-border/50 rounded-full" />

        {/* Middle Section: Servers (Scrollable) */}
        <div className="flex-1 w-full overflow-y-auto no-scrollbar flex flex-col items-center gap-2 px-2">
          {servers.map(s => (
            <Tooltip key={s.id}>
              <TooltipTrigger asChild>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => onSelectServer(s.id)}
                  className={`relative w-12 h-12 rounded-[16px] flex items-center justify-center text-sm font-bold transition-all duration-200 ${
                    activeServerId === s.id
                      ? 'bg-primary text-primary-foreground rounded-[12px]'
                      : 'bg-surface text-muted-foreground hover:bg-primary hover:text-primary-foreground hover:rounded-[12px]'
                  }`}
                >
                  {activeServerId === s.id && (
                    <motion.div
                      layoutId="server-indicator"
                      className="absolute left-[-12px] top-1/2 -translate-y-1/2 w-1.5 h-8 bg-foreground rounded-r-full"
                    />
                  )}
                  <Users className="h-5 w-5" />
                </motion.button>
              </TooltipTrigger>
              <TooltipContent side="right">{s.name}</TooltipContent>
            </Tooltip>
          ))}

          <Dialog open={open} onOpenChange={setOpen}>
            <Tooltip>
              <DialogTrigger asChild>
                <TooltipTrigger asChild>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    className="w-12 h-12 rounded-[16px] flex items-center justify-center bg-surface text-success hover:bg-success hover:text-success-foreground hover:rounded-[12px] transition-all duration-200"
                  >
                    <Plus className="h-5 w-5" />
                  </motion.button>
                </TooltipTrigger>
              </DialogTrigger>
              <TooltipContent side="right">Add a Server</TooltipContent>
            </Tooltip>
            <DialogContent className="bg-card border-border">
              <DialogHeader>
                <DialogTitle className="text-foreground">Create Server</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Input
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  placeholder="Server name"
                  className="bg-surface border-border"
                  onKeyDown={e => e.key === 'Enter' && handleCreate()}
                />
                <Button onClick={handleCreate} className="w-full">Create</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="w-8 h-[2px] bg-border/50 rounded-full shrink-0" />

        {/* Bottom Section: User Actions */}
        <div className="flex flex-col gap-3 pb-4 mt-auto shrink-0">
          <Tooltip>
            <TooltipTrigger asChild>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={onSearch}
                className="w-12 h-12 rounded-[16px] flex items-center justify-center bg-surface text-muted-foreground hover:bg-primary hover:text-primary-foreground hover:rounded-[12px] transition-all duration-200"
              >
                <Search className="h-5 w-5" />
              </motion.button>
            </TooltipTrigger>
            <TooltipContent side="right">Search</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={onFeed}
                className="w-12 h-12 rounded-[16px] flex items-center justify-center bg-surface text-muted-foreground hover:bg-indigo-500 hover:text-white hover:rounded-[12px] transition-all duration-200"
              >
                <BookOpen className="h-5 w-5" />
              </motion.button>
            </TooltipTrigger>
            <TooltipContent side="right">Feed</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={onSettings}
                className="w-12 h-12 rounded-[16px] flex items-center justify-center bg-surface text-muted-foreground hover:bg-zinc-600 hover:text-white hover:rounded-[12px] transition-all duration-200"
              >
                <Settings className="h-5 w-5" />
              </motion.button>
            </TooltipTrigger>
            <TooltipContent side="right">Settings</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={onLogout}
                className="w-12 h-12 rounded-[16px] flex items-center justify-center bg-surface text-destructive hover:bg-destructive hover:text-destructive-foreground hover:rounded-[12px] transition-all duration-200"
              >
                <LogOut className="h-5 w-5" />
              </motion.button>
            </TooltipTrigger>
            <TooltipContent side="right">Logout</TooltipContent>
          </Tooltip>

          <div className="mt-2 flex items-center justify-center">
            <Tooltip>
              <TooltipTrigger asChild>
                <div onClick={onProfile} className="p-0.5 cursor-pointer rounded-full hover:bg-primary/20 transition-colors">
                  <Avatar className="h-11 w-11 border-2 border-transparent hover:border-primary transition-all">
                    <AvatarImage src={userProfile?.avatarUrl} />
                    <AvatarFallback className="bg-surface text-sm font-bold text-foreground">
                      {userProfile?.username?.substring(0, 2).toUpperCase() || '??'}
                    </AvatarFallback>
                  </Avatar>
                </div>
              </TooltipTrigger>
              <TooltipContent side="right">Profile: {userProfile?.username}</TooltipContent>
            </Tooltip>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
