import { useState, useRef, useEffect } from 'react';
import { Send, Check } from 'lucide-react';

interface Props {
  onSend: (content: string) => Promise<void>;
  roomName: string;
  onTyping?: (isTyping: boolean) => void;
  isEditing?: boolean;
  initialValue?: string;
  onCancel?: () => void;
  onEdit?: (content: string) => Promise<void>;
}

export default function MessageComposer({ 
  onSend, 
  roomName, 
  onTyping,
  isEditing,
  initialValue = '',
  onCancel,
  onEdit
}: Props) {
  const [content, setContent] = useState(initialValue);
  const [sending, setSending] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isEditing) {
      setContent(initialValue);
      inputRef.current?.focus();
    }
  }, [isEditing, initialValue]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    if (!isEditing) {
      onTyping?.(true);
    }
  };

  const handleSubmit = async () => {
    if (!content.trim() || sending) return;
    setSending(true);
    try {
      if (isEditing && onEdit) {
        await onEdit(content.trim());
      } else {
        await onSend(content.trim());
        setContent('');
        onTyping?.(false);
      }
      inputRef.current?.focus();
    } catch {
      // toast error
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="px-4 pb-4 pt-2">
      {isEditing && (
        <div className="flex items-center justify-between px-2 py-1 mb-1 bg-primary/5 rounded-t-md border-x border-t border-primary/20">
          <span className="text-[10px] font-medium text-primary uppercase tracking-wider">Editing message</span>
          <button 
            onClick={onCancel}
            className="text-[10px] font-bold text-muted-foreground hover:text-foreground transition-colors"
          >
            Cancel
          </button>
        </div>
      )}
      <div className={`flex items-end gap-2 bg-surface border border-border p-2 ${isEditing ? 'rounded-b-md border-primary/20' : 'rounded-md'}`}>
        <textarea
          ref={inputRef}
          value={content}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={`Message ${roomName}`}
          rows={1}
          className="flex-1 bg-transparent text-body text-foreground placeholder:text-muted-foreground/50 resize-none outline-none min-h-[24px] max-h-[120px]"
          style={{ height: 'auto', overflowY: content.split('\n').length > 4 ? 'auto' : 'hidden' }}
        />
        <button
          onClick={handleSubmit}
          disabled={!content.trim() || sending}
          className="p-1.5 rounded-md text-primary hover:bg-primary/10 disabled:opacity-30 transition-colors"
        >
          {isEditing ? <Check className="h-4 w-4" /> : <Send className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}
