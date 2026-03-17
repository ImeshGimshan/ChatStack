import { useState } from 'react';
import { motion } from 'framer-motion';
import { type ChatServer, type ChatChannel } from '@/lib/chat-client';
import { Hash, Plus, ChevronDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface Props {
  server: ChatServer;
  channels: (ChatChannel & { unreadCount?: number })[];
  activeChannelId?: string | null;
  onSelectChannel: (id: string) => void;
  onCreateChannel: (name: string) => Promise<void>;
}

export default function ChannelSidebar({ server, channels, activeChannelId, onSelectChannel, onCreateChannel }: Props) {
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');

  const handleCreate = async () => {
    if (!newName.trim() || newName.length < 3) return;
    await onCreateChannel(newName.trim().toLowerCase().replace(/\s+/g, '-'));
    setNewName('');
    setCreating(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -10 }}
      className="flex flex-col h-full"
    >
      {/* Server header */}
      <div className="h-12 flex items-center px-4 border-b border-sidebar-border">
        <h2 className="text-sm font-semibold text-foreground truncate flex-1">{server.name}</h2>
        <ChevronDown className="h-4 w-4 text-muted-foreground" />
      </div>

      {/* Channels */}
      <div className="flex-1 overflow-y-auto scrollbar-thin p-2 space-y-0.5">
        <div className="flex items-center justify-between px-2 py-1">
          <span className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">Channels</span>
          <button onClick={() => setCreating(true)} className="text-muted-foreground hover:text-foreground">
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>

        {creating && (
          <div className="px-2 py-1 flex gap-1">
            <Input
              value={newName}
              onChange={e => setNewName(e.target.value)}
              placeholder="channel-name"
              className="h-7 text-ui bg-surface border-border"
              onKeyDown={e => {
                if (e.key === 'Enter') handleCreate();
                if (e.key === 'Escape') setCreating(false);
              }}
              autoFocus
            />
            <Button onClick={handleCreate} size="sm" className="h-7 px-2 text-xs">Add</Button>
          </div>
        )}

        {channels.map(ch => (
          <button
            key={ch.id}
            onClick={() => onSelectChannel(ch.id)}
            className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-sm text-ui transition-colors relative group ${
              activeChannelId === ch.id
                ? 'bg-sidebar-accent text-foreground font-medium'
                : 'text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-foreground'
            }`}
          >
            <Hash className="h-4 w-4 shrink-0 opacity-60" />
            <span className="truncate flex-1 text-left">{ch.name}</span>
            {ch.unreadCount && ch.unreadCount > 0 ? (
              <span className="bg-primary text-primary-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[1.2rem] text-center">
                {ch.unreadCount}
              </span>
            ) : null}
          </button>
        ))}

        {channels.length === 0 && !creating && (
          <p className="text-center text-ui text-muted-foreground py-8">No channels yet</p>
        )}
      </div>
    </motion.div>
  );
}
