import { motion } from 'framer-motion';
import { type ChatConversation } from '@/lib/chat-client';
import { MessageCircle } from 'lucide-react';

interface Props {
  conversations: (ChatConversation & { unreadCount?: number })[];
  activeId?: string | null;
  onSelect: (id: string) => void;
  userId: string;
  presenceByUser?: Record<string, boolean>;
}

export default function ConversationSidebar({ conversations, activeId, onSelect, userId, presenceByUser = {} }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -10 }}
      className="flex flex-col h-full"
    >
      <div className="h-12 flex items-center px-4 border-b border-sidebar-border">
        <h2 className="text-sm font-semibold text-foreground">Direct Messages</h2>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin p-2 space-y-0.5">
        {conversations.map(c => {
          const otherMemberId = (c.memberIds || []).find(id => id !== userId);
          const isOnline = otherMemberId ? presenceByUser[otherMemberId] : false;

          return (
            <button
              key={c.id}
              onClick={() => onSelect(c.id)}
              className={`w-full flex items-center gap-2 px-2 py-2 rounded-sm text-ui transition-colors group relative ${
                activeId === c.id
                  ? 'bg-sidebar-accent text-foreground'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-foreground'
              }`}
            >
              <div className="relative shrink-0">
                <div className="w-8 h-8 rounded-md bg-surface flex items-center justify-center border border-border">
                  <MessageCircle className="h-4 w-4 text-muted-foreground" />
                </div>
                {/* Status Dot */}
                <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-background ${
                  isOnline ? 'bg-online' : 'bg-muted-foreground/30'
                }`} />
              </div>
              <div className="flex-1 min-w-0 text-left">
                <p className="truncate font-medium">{c.name || 'Direct Message'}</p>
                {c.unreadCount && c.unreadCount > 0 ? (
                  <div className="absolute right-2 top-1/2 -translate-y-1/2">
                    <span className="bg-primary text-primary-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[1.2rem] text-center">
                      {c.unreadCount}
                    </span>
                  </div>
                ) : null}
              </div>
            </button>
          );
        })}

        {conversations.length === 0 && (
          <p className="text-center text-ui text-muted-foreground py-8">No conversations yet</p>
        )}
      </div>
    </motion.div>
  );
}
