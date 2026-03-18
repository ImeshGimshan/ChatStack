import { type ChatMessage, type ConversationMessage, type MessageReaction, type MessageReadReceipt } from '@/lib/chat-client';
import { formatDistanceToNow } from 'date-fns';
import { Pencil, Trash2, Smile, Check, CheckCheck } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface Props {
  message: ChatMessage | ConversationMessage;
  isOwn: boolean;
  senderName: string;
  reactions?: MessageReaction[];
  readReceipts?: MessageReadReceipt[];
  onEdit?: (id: string, content: string) => void;
  onDelete?: (id: string) => void;
  onReact?: (id: string, emoji: string) => void;
  currentUserId?: string;
}

export default function MessageRow({ 
  message, 
  isOwn, 
  senderName, 
  reactions, 
  readReceipts,
  onEdit,
  onDelete,
  onReact,
  currentUserId
}: Props) {
  const time = formatDistanceToNow(new Date(message.createdAt), { addSuffix: true });
  const hasReadReceipts = readReceipts && readReceipts.length > 0;
  const isReadByOther = hasReadReceipts && readReceipts.some(r => r.userId !== currentUserId);

  // Generate a consistent random color based on senderName
  const colors = [
    'text-red-400',
    'text-orange-400',
    'text-amber-400',
    'text-yellow-400',
    'text-lime-400',
    'text-green-400',
    'text-emerald-400',
    'text-teal-400',
    'text-cyan-400',
    'text-sky-400',
    'text-blue-400',
    'text-violet-400',
    'text-fuchsia-400',
    'text-pink-400',
    'text-rose-400'
  ];
  
  const getColorForName = (name: string) => {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % colors.length;
    return colors[index];
  };

  const senderColor = isOwn ? 'text-primary' : getColorForName(senderName);

  // Group reactions by emoji and check if current user reacted
  const reactionsByEmoji = reactions?.reduce((acc, r) => {
    if (!acc[r.emoji]) acc[r.emoji] = { count: 0, me: false };
    acc[r.emoji].count++;
    if (r.userId === currentUserId) acc[r.emoji].me = true;
    return acc;
  }, {} as Record<string, { count: number; me: boolean }>);

  return (
    <div className="group relative flex items-start gap-3 px-2 py-1.5 rounded-sm hover:bg-surface-hover/50 transition-colors">
      {/* Avatar */}
      <div className="w-9 h-9 rounded-md bg-surface flex items-center justify-center text-ui font-semibold text-muted-foreground shrink-0 mt-0.5 border border-border">
        {senderName.charAt(0).toUpperCase()}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={`text-[13px] font-semibold ${senderColor}`}>
            {senderName}
          </span>
          <span className="text-[11px] text-muted-foreground/50 font-mono">{time}</span>
          
          {/* Read Receipts */}
          {isOwn && (
            <div className="ml-auto">
              {isReadByOther ? (
                <CheckCheck className="h-3 w-3 text-primary" />
              ) : (
                <Check className="h-3 w-3 text-muted-foreground/50" />
              )}
            </div>
          )}
        </div>
        <p className="text-body text-foreground/90 wrap-break-word whitespace-pre-wrap">{message.content}</p>

        {/* Reactions */}
        {reactionsByEmoji && Object.keys(reactionsByEmoji).length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {Object.entries(reactionsByEmoji).map(([emoji, data]) => (
              <button 
                key={emoji} 
                onClick={() => onReact?.(message.id, emoji)}
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] border transition-colors ${
                  data.me 
                    ? 'bg-primary/10 border-primary/30 text-primary' 
                    : 'bg-surface-hover border-border text-foreground hover:border-muted-foreground/50'
                }`}
              >
                {emoji} <span className="text-[10px] opacity-70">{data.count}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Message Action Bar */}
      <div className="absolute top-0 right-2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center bg-surface border border-border rounded-md shadow-sm overflow-hidden z-10">
        <TooltipProvider>
          <div className="flex items-center">
            {['👍', '❤️', '🔥', '😂', '😮', '😢'].map(emoji => (
              <button 
                key={emoji}
                onClick={() => onReact?.(message.id, emoji)}
                className="p-1.5 hover:bg-surface-hover text-muted-foreground hover:text-foreground transition-colors text-[14px]"
              >
                {emoji}
              </button>
            ))}
          </div>

          {isOwn && (
            <>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button 
                    onClick={() => onEdit?.(message.id, message.content)}
                    className="p-1.5 hover:bg-surface-hover text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>Edit Message</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <button 
                    onClick={() => onDelete?.(message.id)}
                    className="p-1.5 hover:bg-surface-hover text-red-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>Delete Message</TooltipContent>
              </Tooltip>
            </>
          )}
        </TooltipProvider>
      </div>
    </div>
  );
}
