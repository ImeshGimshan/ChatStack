'use client';
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Message } from "@/lib/types";

interface MessageBubbleProps {
    message: Message;
    isCurrentUser: boolean;
    showAvatar?: boolean;
}

const getInitials = (name: string) =>
    name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

const formatMessageTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    if (date.toDateString() === now.toDateString()) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return (
        date.toLocaleDateString([], { month: 'short', day: 'numeric' }) +
        ' ' +
        date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    );
};

// Generate a consistent color per sender
const senderColors = [
    'bg-violet-600', 'bg-blue-600', 'bg-green-600', 'bg-orange-500',
    'bg-pink-600', 'bg-teal-600', 'bg-red-600', 'bg-indigo-600',
];
const getSenderColor = (name: string) => {
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return senderColors[Math.abs(hash) % senderColors.length];
};

export default function MessageBubble({ message, isCurrentUser, showAvatar = true }: MessageBubbleProps) {
    return (
        <div className={`flex gap-2.5 group ${isCurrentUser ? 'flex-row-reverse' : 'flex-row'}`}>
            {/* Avatar placeholder space - keeps alignment even when avatar hidden */}
            <div className="w-8 flex-shrink-0 flex items-end">
                {!isCurrentUser && showAvatar && (
                    <Avatar className={`h-8 w-8 ${getSenderColor(message.sender)}`}>
                        <AvatarFallback className={`text-xs font-semibold text-white ${getSenderColor(message.sender)}`}>
                            {getInitials(message.sender)}
                        </AvatarFallback>
                    </Avatar>
                )}
            </div>

            <div className={`flex flex-col space-y-0.5 max-w-[72%] ${isCurrentUser ? 'items-end' : 'items-start'}`}>
                {showAvatar && (
                    <div className={`flex items-baseline gap-2 px-1 ${isCurrentUser ? 'flex-row-reverse' : ''}`}>
                        <span className="text-xs font-semibold text-foreground">
                            {isCurrentUser ? 'You' : message.sender}
                        </span>
                        <span className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                            {formatMessageTime(message.timestamp)}
                        </span>
                    </div>
                )}
                <div
                    className={`rounded-2xl px-3.5 py-2 text-sm leading-relaxed break-words shadow-sm ${isCurrentUser
                            ? 'bg-primary text-primary-foreground rounded-tr-sm'
                            : 'bg-muted text-foreground rounded-tl-sm'
                        }`}
                >
                    {message.text}
                </div>
            </div>
        </div>
    );
}
