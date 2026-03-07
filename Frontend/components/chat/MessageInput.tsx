'use client';
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send } from "lucide-react";

interface MessageInputProps {
    onSend: (text: string) => void;
    disabled?: boolean;
    placeholder?: string;
}

export default function MessageInput({ onSend, disabled = false, placeholder = "Message #general" }: MessageInputProps) {
    const [input, setInput] = useState('');
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const handleSend = () => {
        const text = input.trim();
        if (!text || disabled) return;
        onSend(text);
        setInput('');
        textareaRef.current?.focus();
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="flex items-end gap-2 px-4 py-3 border-t bg-background/80 backdrop-blur-sm">
            <Textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                disabled={disabled}
                rows={1}
                className="flex-1 min-h-[44px] max-h-[140px] resize-none rounded-xl bg-muted border-0 focus-visible:ring-1 focus-visible:ring-primary py-2.5 px-4 text-sm"
            />
            <Button
                type="button"
                size="icon"
                onClick={handleSend}
                disabled={!input.trim() || disabled}
                className="h-11 w-11 rounded-xl flex-shrink-0"
            >
                <Send className="h-4 w-4" />
            </Button>
        </div>
    );
}
