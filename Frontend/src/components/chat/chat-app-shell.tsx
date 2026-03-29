"use client";

import { useEffect, useRef, useState } from "react";
import { Globe2, Lock, Plus, Shield, Unlock, Check, Pencil, Send, Smile, Trash2, X, Search, Menu } from "lucide-react";
import { SecondarySidebar } from "@/components/chat/secondary-sidebar";
import { ServerSidebar } from "@/components/chat/server-sidebar";
import ServerBar from "./lovable/ServerBar";
import ChannelSidebar from "./lovable/ChannelSidebar";
import ConversationSidebar from "./lovable/ConversationSidebar";
import MessageRow from "./lovable/MessageRow";
import MessageComposer from "./lovable/MessageComposer";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { getMyProfile, getProfileByUserId, searchProfilesByUsername } from "@/lib/auth-client";
import { useAuth } from "@/contexts/auth-context";
import { useSocket } from "@/hooks/use-socket";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
  return (
    <div className="flex h-full w-full flex-col md:flex-row">
      {/* Mobile top bar */}
      <div className="md:hidden sticky top-0 z-30 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border min-h-[56px]">
        <ChatTopBar />
      </div>
      {/* Sidebars and main chat area */}
      <div className="flex flex-1 h-full w-full overflow-hidden">
        {/* Server sidebar (mobile drawer) */}
        <ServerSidebar />
        {/* Conversation sidebar (mobile drawer) */}
        <ConversationSidebar />
        {/* Main chat area */}
        <main className="flex-1 flex flex-col h-full w-full overflow-hidden gap-2 md:gap-4 pt-2 md:pt-0 pb-2 md:pb-0">
          {children}
        </main>
      </div>
    </div>
  getConversationMessages,
  getConversationReadReceipts,
  getConversationReactions,
  getConversationUnreadCount,
  getChannelReactions,
  getConversations,
  getChannelMessages,
  markMessageRead,
  getServerById,
  getMyServers,
  joinServer,
  removeChannelReaction,
  removeConversationReaction,
  getServerChannels,
  getChannelUnreadCount,
  sendChannelMessage,
  sendConversationMessage,
} from "@/lib/chat-client";
import { toast } from "sonner";

type ProfileState = {
  username: string;
  avatarUrl?: string;
};

type ActiveRoom =
  | { roomType: "channel"; roomId: string }
  | { roomType: "conversation"; roomId: string }
  | null;

export function ChatAppShell() {
  const router = useRouter();
  const { token, user, logout } = useAuth();
  const [profile, setProfile] = useState<ProfileState>({
    username: user?.username || "User"
  });
  const [servers, setServers] = useState<ChatServer[]>([]);
  const [channels, setChannels] = useState<(ChatChannel & { unreadCount?: number })[]>([]);
  const [conversations, setConversations] = useState<(ChatConversation & { unreadCount?: number })[]>([]);
  const [conversationTitles, setConversationTitles] = useState<Record<string, string>>({});
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [channelReactions, setChannelReactions] = useState<Record<string, MessageReaction[]>>({});
  const [conversationMessages, setConversationMessages] = useState<ConversationMessage[]>([]);
  const [conversationReactions, setConversationReactions] = useState<Record<string, MessageReaction[]>>({});
  const [conversationReadReceipts, setConversationReadReceipts] = useState<Record<string, MessageReadReceipt[]>>({});
  const [activeSection, setActiveSection] = useState<"global" | "personal">("personal");
  const [activeServerId, setActiveServerId] = useState<string | null>(null);
  const [activeChannelId, setActiveChannelId] = useState<string | null>(null);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [composer, setComposer] = useState("");
  const [isLoadingServers, setIsLoadingServers] = useState(false);
  const [isLoadingChannels, setIsLoadingChannels] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [uiError, setUiError] = useState<string | null>(null);
  const [senderNames, setSenderNames] = useState<Record<string, string>>({});
  const [presenceByUser, setPresenceByUser] = useState<Record<string, boolean>>({});
  const [typingNotice, setTypingNotice] = useState<string | null>(null);
  const [mobilePanel, setMobilePanel] = useState<"servers" | "rooms" | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");
  const [pendingDeleteMessageId, setPendingDeleteMessageId] = useState<string | null>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typingStartTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTypingRef = useRef(false);
  const tokenRef = useRef<string | null>(token);
  const userIdRef = useRef<string | null>(user?.id ? String(user.id) : null);
  const socketStatusRef = useRef<string>("disconnected");
  const messagesBottomRef = useRef<HTMLDivElement>(null);

  const { socket, status: socketStatus, lastError } = useSocket(token);

  const activeServer = servers.find((server) => server.id === activeServerId) || null;
  const activeChannel = channels.find((channel) => channel.id === activeChannelId) || null;
  const activeConversation = conversations.find((conversation) => conversation.id === activeConversationId) || null;
  const activeRoom: ActiveRoom = activeChannelId
    ? { roomType: "channel", roomId: activeChannelId }
    : activeConversationId
      ? { roomType: "conversation", roomId: activeConversationId }
      : null;

  useEffect(() => {
    tokenRef.current = token;
  }, [token]);

  useEffect(() => {
    userIdRef.current = user?.id ? String(user.id) : null;
  }, [user?.id]);

  useEffect(() => {
    socketStatusRef.current = socketStatus;
  }, [socketStatus]);

  useEffect(() => {
    if (!token) {
      return;
    }

    const authToken: string = token;

    let cancelled = false;

    async function loadProfile() {
      try {
        const data = await getMyProfile(authToken);
        if (!cancelled) {
          setProfile({
            username: data.username || user?.username || "User",
            avatarUrl: data.avatarUrl
          });
        }
      } catch {
        if (!cancelled) {
          setProfile({
            username: user?.username || "User"
          });
        }
      }
    }

    loadProfile();

    return () => {
      cancelled = true;
    };
  }, [token, user?.username]);

  useEffect(() => {
    if (!token) {
      return;
    }

    const authToken: string = token;

    let cancelled = false;

    async function loadServers() {
      setIsLoadingServers(true);
      setUiError(null);

      try {
        const list = await getMyServers(authToken);
        if (cancelled) {
          return;
        }

        setServers(list);
        if (list.length > 0) {
          setActiveServerId((prev) => prev || list[0].id);
        }
      } catch (error) {
        if (!cancelled) {
          const message = error instanceof Error ? error.message : "Failed to load servers.";
          setUiError(message);
        }
      } finally {
        if (!cancelled) {
          setIsLoadingServers(false);
        }
      }
    }

    loadServers();

    return () => {
      cancelled = true;
    };
  }, [token]);

  useEffect(() => {
    if (!token) {
      setConversations([]);
      setActiveConversationId(null);
      setConversationTitles({});
      return;
    }

    let cancelled = false;

    async function loadConversations() {
      try {
        const list = await getConversations(token as string);
        if (cancelled) {
          return;
        }

        const unreadCounts = await Promise.all(
          list.map((conversation) => getConversationUnreadCount(token as string, conversation.id).catch(() => 0))
        );

        const nextConversations = list.map((conversation, index) => ({
          ...conversation,
          unreadCount: unreadCounts[index]
        }));

        setConversations(nextConversations);

        const currentUserId = user?.id ? String(user.id) : "";
        const titleEntries = await Promise.all(
          nextConversations.map(async (conversation) => {
            if (conversation.name && conversation.name.trim().length > 0) {
              return [conversation.id, conversation.name] as const;
            }

            const otherMemberId = (conversation.memberIds || []).find((memberId) => memberId !== currentUserId);
            if (!otherMemberId || !token) {
              return [conversation.id, `Conversation ${conversation.id}`] as const;
            }

            try {
              const profile = await getProfileByUserId(token, otherMemberId);
              const dmTitle = profile.username?.trim() || `User ${otherMemberId}`;
              return [conversation.id, dmTitle] as const;
            } catch {
              return [conversation.id, `User ${otherMemberId}`] as const;
            }
          })
        );

        if (!cancelled) {
          setConversationTitles(Object.fromEntries(titleEntries));
        }
      } catch (error) {
        if (!cancelled) {
          const message = error instanceof Error ? error.message : "Failed to load conversations.";
          setUiError(message);
        }
      }
    }

    void loadConversations();

    return () => {
      cancelled = true;
    };
  }, [token, user?.id]);

  useEffect(() => {
    if (!token || !activeServerId || activeSection !== "personal") {
      setChannels([]);
      setActiveChannelId(null);
      return;
    }

    const authToken: string = token;
    const currentServerId: string = activeServerId;

    let cancelled = false;

    async function loadChannels() {
      setIsLoadingChannels(true);
      setUiError(null);

      try {
        const list = await getServerChannels(authToken, currentServerId);
        if (cancelled) {
          return;
        }

        const unreadCounts = await Promise.all(
          list.map((channel) => getChannelUnreadCount(authToken, channel.id).catch(() => 0))
        );
        const channelsWithUnread = list.map((channel, idx) => ({
          ...channel,
          unreadCount: unreadCounts[idx]
        }));

        setChannels(channelsWithUnread);
        setActiveChannelId((prev) => {
          if (prev && channelsWithUnread.some((channel) => channel.id === prev)) {
            return prev;
          }
          return channelsWithUnread.length > 0 ? channelsWithUnread[0].id : null;
        });
      } catch (error) {
        if (!cancelled) {
          const message = error instanceof Error ? error.message : "Failed to load channels.";
          setUiError(message);
        }
      } finally {
        if (!cancelled) {
          setIsLoadingChannels(false);
        }
      }
    }

    loadChannels();

    return () => {
      cancelled = true;
    };
  }, [activeSection, activeServerId, token]);

  useEffect(() => {
    if (!token || !activeChannelId || activeSection !== "personal") {
      setMessages([]);
      setChannelReactions({});
      return;
    }

    const authToken: string = token;
    const currentChannelId: string = activeChannelId;

    let cancelled = false;

    async function loadMessages() {
      setIsLoadingMessages(true);
      setUiError(null);

      try {
        const list = await getChannelMessages(authToken, currentChannelId, 100);
        if (!cancelled) {
          setMessages(list);

          const reactionEntries = await Promise.all(
            list.map(async (message) => {
              try {
                const reactions = await getChannelReactions(authToken, currentChannelId, message.id);
                return [message.id, reactions] as const;
              } catch {
                return [message.id, []] as const;
              }
            })
          );

          if (!cancelled) {
            setChannelReactions(Object.fromEntries(reactionEntries));
          }

          const latest = list.at(-1);
          if (latest) {
            void markMessageRead(authToken, {
              messageId: latest.id,
              roomType: "channel"
            });
            if (socket && socketStatus === "connected") {
              socket.emit("mark-channel-message-read", {
                channelId: currentChannelId,
                messageId: latest.id
              });
            }
          }

          setChannels((prev) =>
            prev.map((ch) =>
              ch.id === currentChannelId ? { ...ch, unreadCount: 0 } : ch
            )
          );
        }
      } catch (error) {
        if (!cancelled) {
          const message = error instanceof Error ? error.message : "Failed to load messages.";
          setUiError(message);
        }
      } finally {
        if (!cancelled) {
          setIsLoadingMessages(false);
        }
      }
    }

    loadMessages();

    return () => {
      cancelled = true;
    };
  }, [activeChannelId, activeSection, token]);

  useEffect(() => {
    if (!token || !activeConversationId || activeSection !== "personal") {
      setConversationMessages([]);
      setConversationReadReceipts({});
      return;
    }

    let cancelled = false;

    async function loadConversationMessages() {
      setIsLoadingMessages(true);
      setUiError(null);

      try {
        const list = await getConversationMessages(token as string, activeConversationId as string, 100);
        if (!cancelled) {
          setConversationMessages(list);

          const currentUserId = user?.id ? String(user.id) : "";
          const ownMessageIds = list
            .filter((message) => message.senderId === currentUserId)
            .map((message) => message.id)
            .slice(-10);

          if (ownMessageIds.length > 0) {
            const receiptEntries = await Promise.all(
              ownMessageIds.map(async (messageId) => {
                try {
                  const receipts = await getConversationReadReceipts(token as string, activeConversationId as string, messageId);
                  return [messageId, receipts] as const;
                } catch {
                  return [messageId, []] as const;
                }
              })
            );

            if (!cancelled) {
              setConversationReadReceipts(Object.fromEntries(receiptEntries));
            }
          } else {
            setConversationReadReceipts({});
          }

          const latest = list.at(-1);

          // Build reaction map
          const reactionEntries = await Promise.all(
            list.map(async (message) => {
              try {
                const reactions = await getConversationReactions(token as string, activeConversationId as string, message.id);
                return [message.id, reactions] as const;
              } catch {
                return [message.id, []] as const;
              }
            })
          );

          if (!cancelled) {
            setConversationReactions(Object.fromEntries(reactionEntries));
          }

          if (latest) {
            void markMessageRead(token as string, {
              messageId: latest.id,
              roomType: "conversation"
            });
            if (socket && socketStatus === "connected") {
              socket.emit("mark-conversation-message-read", {
                conversationId: activeConversationId,
                messageId: latest.id
              });
            }
          }
          setConversations((prev) =>
            prev.map((conversation) =>
              conversation.id === activeConversationId ? { ...conversation, unreadCount: 0 } : conversation
            )
          );
        }
      } catch (error) {
        if (!cancelled) {
          const message = error instanceof Error ? error.message : "Failed to load conversation messages.";
          setUiError(message);
        }
      } finally {
        if (!cancelled) {
          setIsLoadingMessages(false);
        }
      }
    }

    void loadConversationMessages();

    return () => {
      cancelled = true;
    };
  }, [activeConversationId, activeSection, token, user?.id]);

  useEffect(() => {
    if (!socket || !activeChannelId || activeSection !== "personal") {
      return;
    }

    socket.emit("join-channel", { channelId: activeChannelId });

    const onNewChannelMessage = (payload: {
      id: string | number;
      channelId: string | number;
      senderId: string | number;
      content: string;
      createdAt: string;
    }) => {
      const nextMessage: ChatMessage = {
        id: String(payload.id),
        channelId: String(payload.channelId),
        senderId: String(payload.senderId),
        content: payload.content,
        createdAt: payload.createdAt
      };

      if (nextMessage.channelId !== activeChannelId) {
        // Increment unread count for the channel if it's not the active one
        setChannels((prev) =>
          prev.map((ch) =>
            ch.id === nextMessage.channelId && nextMessage.senderId !== currentUserId
              ? { ...ch, unreadCount: (ch.unreadCount || 0) + 1 }
              : ch
          )
        );
        return;
      }

      const currentUserId = user?.id ? String(user.id) : "";
      if (nextMessage.senderId !== currentUserId) {
        // Automatically mark as read if we are viewing the active channel
        if (socket.connected) {
          socket.emit("mark-channel-message-read", {
            channelId: nextMessage.channelId,
            messageId: nextMessage.id
          });
        }
      }

      setMessages((prev) => {
        if (prev.some((message) => message.id === nextMessage.id)) {
          return prev;
        }
        return [...prev, nextMessage];
      });

      setChannelReactions((prev) => {
        if (prev[nextMessage.id]) {
          return prev;
        }
        return {
          ...prev,
          [nextMessage.id]: []
        };
      });
    };

    socket.on("new-channel-message", onNewChannelMessage);

    const onEditedChannelMessage = (payload: {
      id: string | number;
      channelId: string | number;
      newContent: string;
    }) => {
      if (String(payload.channelId) !== activeChannelId) {
        return;
      }

      setMessages((prev) =>
        prev.map((message) =>
          message.id === String(payload.id)
            ? {
                ...message,
                content: payload.newContent
              }
            : message
        )
      );
    };

    const onDeletedChannelMessage = (payload: {
      id: string | number;
      channelId: string | number;
    }) => {
      if (String(payload.channelId) !== activeChannelId) {
        return;
      }

      setMessages((prev) => prev.filter((message) => message.id !== String(payload.id)));
      setChannelReactions((prev) => {
        const next = { ...prev };
        delete next[String(payload.id)];
        return next;
      });
    };

    socket.on("edited-channel-message", onEditedChannelMessage);
    socket.on("deleted-channel-message", onDeletedChannelMessage);

    return () => {
      socket.emit("leave-channel", { channelId: activeChannelId });
      socket.off("new-channel-message", onNewChannelMessage);
      socket.off("edited-channel-message", onEditedChannelMessage);
      socket.off("deleted-channel-message", onDeletedChannelMessage);
    };
  }, [activeChannelId, activeSection, socket]);

  useEffect(() => {
    if (!socket || !activeConversationId || activeSection !== "personal") {
      return;
    }

    socket.emit("join-conversation", { conversationId: activeConversationId });

    const onNewConversationMessage = (payload: {
      id: string | number;
      conversationId: string | number;
      senderId: string | number;
      content: string;
      createdAt: string;
    }) => {
      // Process message
      (async () => {
        const nextMessage: ConversationMessage = {
          id: String(payload.id),
          conversationId: String(payload.conversationId),
          senderId: String(payload.senderId),
          content: payload.content,
          createdAt: payload.createdAt
        };

        if (nextMessage.conversationId !== activeConversationId) {
        const currentUserId = user?.id ? String(user.id) : "";
        if (nextMessage.senderId !== currentUserId) {
            setConversations((prev) =>
              prev.map((conv) =>
                conv.id === nextMessage.conversationId
                  ? { ...conv, unreadCount: (conv.unreadCount || 0) + 1 }
                  : conv
              )
            );
          }
          return;
        }

        const currentUserIdActive = user?.id ? String(user.id) : "";
        if (nextMessage.senderId !== currentUserIdActive) {
          // Automatically mark as read if we are viewing the active conversation
          if (socket.connected) {
            socket.emit("mark-conversation-message-read", {
              conversationId: nextMessage.conversationId,
              messageId: nextMessage.id
            });
          }
        }

        setConversationMessages((prev) => {
          if (prev.some((message) => message.id === nextMessage.id)) {
            return prev;
          }
          return [...prev, nextMessage];
        });

        setConversationReactions((prev) => ({
          ...prev,
          [nextMessage.id]: []
        }));

        const currentUserId = userIdRef.current || "";
        const authToken = tokenRef.current;
        if (currentUserId && nextMessage.senderId !== currentUserId && authToken) {
          void markMessageRead(authToken, {
            messageId: nextMessage.id,
            roomType: "conversation"
          });
          if (socketStatusRef.current === "connected") {
            socket.emit("mark-conversation-message-read", {
              conversationId: activeConversationId,
              messageId: nextMessage.id
            });
          }
        }

        setConversations((prev) =>
          prev.map((conversation) =>
            conversation.id === activeConversationId ? { ...conversation, unreadCount: 0 } : conversation
          )
        );
      })();
    };

    socket.on("new-conversation-message", onNewConversationMessage);

    const onEditedConversationMessage = (payload: {
      id: string | number;
      conversationId: string | number;
      newContent: string;
    }) => {
      if (String(payload.conversationId) !== activeConversationId) {
        return;
      }

      setConversationMessages((prev) =>
        prev.map((message) =>
          message.id === String(payload.id)
            ? {
                ...message,
                content: payload.newContent
              }
            : message
        )
      );
    };

    const onDeletedConversationMessage = (payload: {
      id: string | number;
      conversationId: string | number;
    }) => {
      if (String(payload.conversationId) !== activeConversationId) {
        return;
      }

      setConversationMessages((prev) => prev.filter((message) => message.id !== String(payload.id)));
      setConversationReadReceipts((prev) => {
        const next = { ...prev };
        delete next[String(payload.id)];
        return next;
      });
    };

    const onConversationMessageRead = (payload: {
      messageId?: string | number;
      conversationId?: string | number;
      userId?: string | number;
      readAt?: string;
    }) => {
      if (!payload.messageId || !payload.conversationId || !payload.userId || !payload.readAt) {
        return;
      }

      if (String(payload.conversationId) !== activeConversationId) {
        return;
      }

      const messageId = String(payload.messageId);
      const nextReceipt: MessageReadReceipt = {
        userId: String(payload.userId),
        messageId,
        readAt: payload.readAt
      };

      setConversationReadReceipts((prev) => {
        const existing = prev[messageId] || [];
        const withoutSameUser = existing.filter((receipt) => receipt.userId !== nextReceipt.userId);
        return {
          ...prev,
          [messageId]: [...withoutSameUser, nextReceipt]
        };
      });
    };

    const onConversationReactionAdded = (payload: {
      messageId: string | number;
      conversationId: string | number;
      userId: string | number;
      emoji: string;
    }) => {
      if (String(payload.conversationId) !== activeConversationId) return;

      const messageId = String(payload.messageId);
      const nextReaction: MessageReaction = {
        id: `socket-${Date.now()}`,
        userId: String(payload.userId),
        emoji: payload.emoji
      };

      setConversationReactions(prev => {
        const existing = prev[messageId] || [];
        if (existing.some(r => r.userId === nextReaction.userId && r.emoji === nextReaction.emoji)) return prev;
        return { ...prev, [messageId]: [...existing, nextReaction] };
      });
    };

    const onConversationReactionRemoved = (payload: {
      messageId: string | number;
      conversationId: string | number;
      userId: string | number;
      emoji: string;
    }) => {
      if (String(payload.conversationId) !== activeConversationId) return;

      const messageId = String(payload.messageId);
      const userId = String(payload.userId);
      const emoji = payload.emoji;

      setConversationReactions(prev => {
        const existing = prev[messageId] || [];
        return { ...prev, [messageId]: existing.filter(r => !(r.userId === userId && r.emoji === emoji)) };
      });
    };

    const onChannelReactionAdded = (payload: {
      messageId: string | number;
      channelId: string | number;
      userId: string | number;
      emoji: string;
    }) => {
      if (!activeChannelId || String(payload.channelId) !== activeChannelId) return;

      const messageId = String(payload.messageId);
      const nextReaction: MessageReaction = {
        id: `socket-${Date.now()}`,
        userId: String(payload.userId),
        emoji: payload.emoji
      };

      setChannelReactions(prev => {
        const existing = prev[messageId] || [];
        if (existing.some(r => r.userId === nextReaction.userId && r.emoji === nextReaction.emoji)) return prev;
        return { ...prev, [messageId]: [...existing, nextReaction] };
      });
    };

    const onChannelReactionRemoved = (payload: {
      messageId: string | number;
      channelId: string | number;
      userId: string | number;
      emoji: string;
    }) => {
      if (!activeChannelId || String(payload.channelId) !== activeChannelId) return;

      const messageId = String(payload.messageId);
      const userId = String(payload.userId);
      const emoji = payload.emoji;

      setChannelReactions(prev => {
        const existing = prev[messageId] || [];
        return { ...prev, [messageId]: existing.filter(r => !(r.userId === userId && r.emoji === emoji)) };
      });
    };

    socket.on("edited-conversation-message", onEditedConversationMessage);
    socket.on("deleted-conversation-message", onDeletedConversationMessage);
    socket.on("conversation-message-read", onConversationMessageRead);
    socket.on("conversation-reaction-added", onConversationReactionAdded);
    socket.on("conversation-reaction-removed", onConversationReactionRemoved);
    socket.on("channel-reaction-added", onChannelReactionAdded);
    socket.on("channel-reaction-removed", onChannelReactionRemoved);

    return () => {
      socket.emit("leave-conversation", { conversationId: activeConversationId });
      socket.off("new-conversation-message", onNewConversationMessage);
      socket.off("edited-conversation-message", onEditedConversationMessage);
      socket.off("deleted-conversation-message", onDeletedConversationMessage);
      socket.off("conversation-message-read", onConversationMessageRead);
      socket.off("conversation-reaction-added", onConversationReactionAdded);
      socket.off("conversation-reaction-removed", onConversationReactionRemoved);
      socket.off("channel-reaction-added", onChannelReactionAdded);
      socket.off("channel-reaction-removed", onChannelReactionRemoved);
    };
  }, [activeConversationId, activeSection, socket]);

  useEffect(() => {
    if (!socket || activeSection !== "personal") {
      return;
    }

    const currentUserId = user?.id ? String(user.id) : "";

    const onTyping = (payload: {
      userId?: string | number;
      roomType?: "channel" | "conversation";
      roomId?: string | number;
      isTyping?: boolean;
    }) => {
      const senderId = payload.userId ? String(payload.userId) : "";
      if (!payload.roomType || !payload.roomId || !senderId || senderId === currentUserId) {
        return;
      }

      const isSameRoom =
        (payload.roomType === "channel" && String(payload.roomId) === activeChannelId) ||
        (payload.roomType === "conversation" && String(payload.roomId) === activeConversationId);

      if (!isSameRoom) {
        return;
      }

      if (payload.isTyping) {
        const name = senderNames[senderId] || `User ${senderId}`;
        setTypingNotice(`${name} is typing...`);
      } else {
        setTypingNotice(null);
      }
    };

    socket.on("typing", onTyping);

    return () => {
      socket.off("typing", onTyping);
    };
  }, [activeChannelId, activeConversationId, activeSection, senderNames, socket, user?.id]);

  useEffect(() => {
    const roomMessages: Array<ChatMessage | ConversationMessage> = activeConversationId
      ? conversationMessages
      : messages;

    if (!token || activeSection !== "personal" || roomMessages.length === 0) {
      return;
    }

    const authToken: string = token;

    const currentUserId = user?.id ? String(user.id) : null;

    const missingSenderIds = Array.from(
      new Set(
        roomMessages
          .map((message) => message.senderId)
          .filter((senderId) => senderId !== currentUserId)
          .filter((senderId) => !senderNames[senderId])
      )
    );

    if (missingSenderIds.length === 0) {
      return;
    }

    let cancelled = false;

    async function resolveUsernames() {
      const results = await Promise.all(
        missingSenderIds.map(async (senderId) => {
          try {
            const profile = await getProfileByUserId(authToken, senderId);
            const resolvedUserId = profile.userId ? String(profile.userId) : "";
            if (resolvedUserId && resolvedUserId !== senderId) {
              return { senderId, username: `User ${senderId}` };
            }
            return { senderId, username: profile.username || `User ${senderId}` };
          } catch {
            return { senderId, username: `User ${senderId}` };
          }
        })
      );

      if (cancelled) {
        return;
      }

      setSenderNames((prev) => {
        const next = { ...prev };
        results.forEach(({ senderId, username }) => {
          next[senderId] = username;
        });
        return next;
      });
    }

    resolveUsernames();

    return () => {
      cancelled = true;
    };
  }, [messages, conversationMessages, activeConversationId, senderNames, token, activeSection, user?.id]);

  async function handleCreateServer(name: string) {
    if (!token) {
      return;
    }

    if (!name || name.trim().length < 2) {
      return;
    }

    const toastId = toast.loading("Creating server...");

    try {
      const created = await createServer(token, {
        name: name.trim()
      });
      setServers((prev) => [...prev, created]);
      setActiveServerId(created.id);
      setUiError(null);
      toast.success("Server created successfully", { id: toastId });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to create server.";
      setUiError(message);
      toast.error(message, { id: toastId });
    }
  }

  async function handleCreateChannel(name: string) {
    if (!token || !activeServerId) {
      return;
    }

    const normalizedName = name.trim();
    if (normalizedName.length < 2) {
      toast.error("Channel name must be at least 2 characters.");
      throw new Error("Channel name must be at least 2 characters.");
    }

    const toastId = toast.loading("Creating channel...");

    try {
      const created = await createChannel(token, activeServerId, {
        name: normalizedName
      });
      setChannels((prev) => [...prev, created]);
      setActiveChannelId(created.id);
      setUiError(null);
      toast.success("Channel created", { id: toastId });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to create channel.";
      setUiError(message);
      toast.error(message, { id: toastId });
      throw new Error(message);
    }
  }

  async function handleDeleteChannel(channelId: string): Promise<void> {
    if (!token) {
      return;
    }

    const toastId = toast.loading("Deleting channel...");
    try {
      await deleteChannel(token, channelId);

      setChannels((prev) => {
        const updated = prev.filter((channel) => channel.id !== channelId);

        setActiveChannelId((currentActive) => {
          if (currentActive !== channelId) {
            return currentActive;
          }
          return updated.length > 0 ? updated[0].id : null;
        });

        return updated;
      });

      setUiError(null);
      toast.success("Channel deleted", { id: toastId });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to delete channel.";
      setUiError(message);
      toast.error(message, { id: toastId });
    }
  }

  async function handleSearchServer(query: string): Promise<ChatServer | null> {
    if (!token) {
      return null;
    }

    return getServerById(token, query);
  }

  async function handleJoinServer(serverId: string): Promise<void> {
    if (!token) {
      return;
    }

    const toastId = toast.loading("Joining server...");
    try {
      await joinServer(token, serverId);

      const joinedServer = await getServerById(token, serverId);

      setServers((prev) => {
        if (prev.some((server) => server.id === joinedServer.id)) {
          return prev;
        }
        return [...prev, joinedServer];
      });

      setActiveSection("personal");
      setActiveServerId(serverId);
      setUiError(null);
      toast.success("Joined server successfully", { id: toastId });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to join server.";
      setUiError(message);
      toast.error(message, { id: toastId });
    }
  }

  async function handleCreateConversation() {
    if (!token) {
      return;
    }

    const userIdsInput = window.prompt("Enter user IDs (comma separated)");
    if (!userIdsInput) {
      return;
    }

    const userIds = userIdsInput
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    if (userIds.length === 0) {
      return;
    }

    const toastId = toast.loading("Creating conversation...");
    try {
      const created = await createConversation(token, { userIds });
      setConversations((prev) => {
        if (prev.some((item) => item.id === created.id)) {
          return prev;
        }
        return [...prev, created];
      });
      setConversationTitles((prev) => ({
        ...prev,
        [created.id]: created.name?.trim() || `Conversation ${created.id}`
      }));
      setActiveConversationId(created.id);
      setActiveChannelId(null);
      setUiError(null);
      toast.success("Conversation created", { id: toastId });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to create conversation.";
      setUiError(message);
      toast.error(message, { id: toastId });
    }
  }

  async function handleCreateConversationByUsername(usernameQuery: string) {
    if (!token || !user?.id) {
      return;
    }

    const profiles = await searchProfilesByUsername(token, usernameQuery);
    const query = usernameQuery.trim().toLowerCase();

    const exactMatch = profiles.find(
      (profile) => profile.username?.toLowerCase() === query && String(profile.userId) !== String(user.id)
    );
    const firstOther = profiles.find((profile) => String(profile.userId) !== String(user.id));
    const target = exactMatch || firstOther;

    if (!target) {
      throw new Error("User not found.");
    }

    const created = await createConversation(token, {
      userIds: [String(target.userId)]
    });

    setConversations((prev) => {
      if (prev.some((item) => item.id === created.id)) {
        return prev;
      }
      return [...prev, created];
    });
    setConversationTitles((prev) => ({
      ...prev,
      [created.id]: target.username || `User ${target.userId}`
    }));

    setActiveSection("personal");
    setActiveChannelId(null);
    setActiveConversationId(created.id);
    setUiError(null);
  }

  function emitTyping(isTyping: boolean) {
    if (!socket || activeSection !== "personal") {
      return;
    }

    if (!activeRoom) {
      return;
    }

    if (activeRoom.roomType === "channel") {
      socket.emit("typing", { channelId: activeRoom.roomId, isTyping });
    } else {
      socket.emit("typing", { conversationId: activeRoom.roomId, isTyping });
    }
  }

  function scheduleTypingStart() {
    if (isTypingRef.current) {
      return;
    }

    if (typingStartTimerRef.current) {
      clearTimeout(typingStartTimerRef.current);
    }

    typingStartTimerRef.current = setTimeout(() => {
      emitTyping(true);
      isTypingRef.current = true;
    }, 180);
  }

  function stopTypingNow() {
    if (typingStartTimerRef.current) {
      clearTimeout(typingStartTimerRef.current);
      typingStartTimerRef.current = null;
    }

    if (typingTimerRef.current) {
      clearTimeout(typingTimerRef.current);
      typingTimerRef.current = null;
    }

    if (isTypingRef.current) {
      emitTyping(false);
      isTypingRef.current = false;
    }
  }

  function scheduleTypingStop(delayMs = 1000) {
    if (typingTimerRef.current) {
      clearTimeout(typingTimerRef.current);
    }

    typingTimerRef.current = setTimeout(() => {
      if (isTypingRef.current) {
        emitTyping(false);
        isTypingRef.current = false;
      }
    }, delayMs);
  }

  function getLatestOutgoingConversationMessageId(currentUserId: string) {
    if (!activeConversationId || !currentUserId) {
      return null;
    }

    const latestMine = [...conversationMessages]
      .reverse()
      .find((message) => message.senderId === currentUserId);

    return latestMine ? latestMine.id : null;
  }

  async function handleSendMessage(overrideContent?: string) {
    if (!token || activeSection !== "personal" || !activeRoom) {
      return;
    }

    const content = (overrideContent || composer).trim();
    if (!content) return;

    try {
      if (socket && socketStatus === "connected") {
        if (activeRoom.roomType === "channel") {
          socket.emit("send-channel-message", {
            channelId: activeRoom.roomId,
            content
          });
        } else {
          socket.emit("send-conversation-message", {
            conversationId: activeRoom.roomId,
            content
          });
        }
      } else if (activeRoom.roomType === "channel") {
        const created = await sendChannelMessage(token, activeRoom.roomId, {
          content
        });

        setMessages((prev) => {
          if (prev.some((message) => message.id === created.id)) {
            return prev;
          }
          return [...prev, created];
        });
      } else {
        const created = await sendConversationMessage(token, activeRoom.roomId, {
          content
        });

        setConversationMessages((prev) => {
          if (prev.some((message) => message.id === created.id)) {
            return prev;
          }
          return [...prev, created];
        });
      }

      stopTypingNow();
      setComposer("");
      setUiError(null);
    } catch (error) {
      const message = error instanceof Error
        ? error.message
        : "Failed to send message. Check recipient key status and try again.";
      setUiError(message);
    }
  }

  function handleStartEditMessage(messageId: string, existingContent: string) {
    setEditingMessageId(messageId);
    setEditingText(existingContent);
  }

  function handleCancelEditMessage() {
    setEditingMessageId(null);
    setEditingText("");
  }

  async function handleEditMessage(messageId: string, newContent: string) {
    if (!token || !activeRoom || activeSection !== "personal") {
      return;
    }

    const nextContent = newContent.trim();
    if (!nextContent) {
      toast.error("Message cannot be empty.");
      setUiError("Message cannot be empty.");
      return;
    }

    const currentMessage = activeRoom.roomType === "channel"
      ? messages.find((message) => message.id === messageId)
      : conversationMessages.find((message) => message.id === messageId);

    if (currentMessage && currentMessage.content.trim() === nextContent) {
      handleCancelEditMessage();
      return;
    }

    const toastId = toast.loading("Saving edit...");

    try {
      if (socket && socketStatus === "connected") {
        if (activeRoom.roomType === "channel") {
          socket.emit("edit-channel-message", {
            channelId: activeRoom.roomId,
            messageId,
            newContent: nextContent
          });
        } else {
          socket.emit("edit-conversation-message", {
            conversationId: activeRoom.roomId,
            messageId,
            newContent: nextContent
          });
        }
      } else if (activeRoom.roomType === "channel") {
        const updated = await editChannelMessage(token, activeRoom.roomId, messageId, nextContent);
        setMessages((prev) => prev.map((message) => (message.id === updated.id ? updated : message)));
      } else {
        const updated = await editConversationMessage(token, activeRoom.roomId, messageId, nextContent);
        setConversationMessages((prev) => prev.map((message) => (message.id === updated.id ? updated : message)));
      }

      handleCancelEditMessage();
      setUiError(null);
      toast.success("Message edited", { id: toastId });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to edit message.";
      setUiError(message);
      toast.error(message, { id: toastId });
    }
  }

  async function handleDeleteMessage(messageId: string) {
    if (!token || !activeRoom || !user?.id || activeSection !== "personal") {
      return;
    }

    const toastId = toast.loading("Deleting message...");

    try {
      if (socket && socketStatus === "connected") {
        if (activeRoom.roomType === "channel") {
          socket.emit("delete-channel-message", {
            channelId: activeRoom.roomId,
            messageId
          });
        } else {
          socket.emit("delete-conversation-message", {
            conversationId: activeRoom.roomId,
            messageId
          });
        }
      } else if (activeRoom.roomType === "channel") {
        await deleteChannelMessage(token, activeRoom.roomId, messageId);
        setMessages((prev) => prev.filter((message) => message.id !== messageId));
      } else {
        await deleteConversationMessage(token, activeRoom.roomId, messageId, String(user.id));
        setConversationMessages((prev) => prev.filter((message) => message.id !== messageId));
      }

      setPendingDeleteMessageId(null);
      setUiError(null);
      toast.success("Message deleted", { id: toastId });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to delete message.";
      setUiError(message);
      toast.error(message, { id: toastId });
    }
  }

  async function handleToggleReaction(messageId: string, emoji: string) {
    if (!token || !activeRoom || !currentUserId) {
      return;
    }

    const isChannel = activeRoom.roomType === "channel";
    const reactions = isChannel ? channelReactions : conversationReactions;
    const previous = reactions[messageId] || [];
    
    const alreadyReacted = previous.some(
      (r) => r.userId === currentUserId && r.emoji === emoji
    );

    // Optimistic update
    const optimistic = alreadyReacted
      ? previous.filter((r) => !(r.userId === currentUserId && r.emoji === emoji))
      : [
          ...previous,
          {
            id: `temp-${Date.now()}`,
            emoji,
            userId: currentUserId,
            createdAt: new Date().toISOString()
          }
        ];

    if (isChannel) {
      setChannelReactions(prev => ({ ...prev, [messageId]: optimistic }));
    } else {
      setConversationReactions(prev => ({ ...prev, [messageId]: optimistic }));
    }

    try {
      if (socket && socketStatus === "connected") {
        if (isChannel) {
          socket.emit(alreadyReacted ? "remove-channel-reaction" : "add-channel-reaction", {
            channelId: activeRoom.roomId,
            messageId,
            emoji
          });
        } else {
          socket.emit(alreadyReacted ? "remove-conversation-reaction" : "add-conversation-reaction", {
            conversationId: activeRoom.roomId,
            messageId,
            emoji
          });
        }
      } else {
        // Fallback to REST
        if (isChannel) {
          if (alreadyReacted) {
            await removeChannelReaction(token, activeRoom.roomId, messageId, emoji);
          } else {
            await addChannelReaction(token, activeRoom.roomId, messageId, emoji);
          }
          const refreshed = await getChannelReactions(token, activeRoom.roomId, messageId);
          setChannelReactions(prev => ({ ...prev, [messageId]: refreshed }));
        } else {
          if (alreadyReacted) {
            await removeConversationReaction(token, activeRoom.roomId, messageId, emoji);
          } else {
            await addConversationReaction(token, activeRoom.roomId, messageId, emoji);
          }
          const refreshed = await getConversationReactions(token, activeRoom.roomId, messageId);
          setConversationReactions(prev => ({ ...prev, [messageId]: refreshed }));
        }
      }
      setUiError(null);
    } catch (error) {
      // Revert optimistic update
      if (isChannel) {
        setChannelReactions(prev => ({ ...prev, [messageId]: previous }));
      } else {
        setConversationReactions(prev => ({ ...prev, [messageId]: previous }));
      }
      const message = error instanceof Error ? error.message : "Failed to toggle reaction.";
      setUiError(message);
    }
  }

  const activeMessages: Array<ChatMessage | ConversationMessage> = activeConversationId
    ? conversationMessages
    : messages;

  const currentUserId = user?.id ? String(user.id) : "";
  const activeConversationOtherMemberId = activeConversationId
    ? (activeConversation?.memberIds || []).find((memberId) => memberId !== currentUserId) || null
    : null;
  const activeConversationPresence = activeConversationOtherMemberId
    ? presenceByUser[activeConversationOtherMemberId]
    : undefined;
  const latestOutgoingConversationMessageId = getLatestOutgoingConversationMessageId(currentUserId);

  useEffect(() => {
    return () => {
      if (typingStartTimerRef.current) {
        clearTimeout(typingStartTimerRef.current);
      }
      if (typingTimerRef.current) {
        clearTimeout(typingTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (activeSection !== "personal") {
      stopTypingNow();
    }
  }, [activeSection]);

  useEffect(() => {
    stopTypingNow();
  }, [activeChannelId, activeConversationId]);

  useEffect(() => {
    if (!socket) {
      return;
    }

    const onOnlineUsersSnapshot = (payload: { userIds?: Array<string | number> }) => {
      if (!Array.isArray(payload.userIds)) {
        return;
      }

      setPresenceByUser((prev) => {
        const next = { ...prev };

        Object.keys(next).forEach((id) => {
          next[id] = false;
        });

        payload.userIds?.forEach((userId) => {
          next[String(userId)] = true;
        });

        return next;
      });
    };

    const onUserOnline = (payload: { userId?: string | number }) => {
      if (!payload.userId) {
        return;
      }

      const userId = String(payload.userId);
      setPresenceByUser((prev) => ({ ...prev, [userId]: true }));
    };

    const onUserOffline = (payload: { userId?: string | number }) => {
      if (!payload.userId) {
        return;
      }

      const userId = String(payload.userId);
      setPresenceByUser((prev) => ({ ...prev, [userId]: false }));
    };

    socket.on("online-users-snapshot", onOnlineUsersSnapshot);
    socket.on("user-online", onUserOnline);
    socket.on("user-offline", onUserOffline);

    return () => {
      socket.off("online-users-snapshot", onOnlineUsersSnapshot);
      socket.off("user-online", onUserOnline);
      socket.off("user-offline", onUserOffline);
    };
  }, [socket]);

  useEffect(() => {
    if (!token || !activeConversationId || activeSection !== "personal" || !currentUserId) {
      return;
    }

    const pollLatestSeen = async () => {
      const latestOutgoingId = getLatestOutgoingConversationMessageId(currentUserId);
      if (!latestOutgoingId) {
        return;
      }

      try {
        const receipts = await getConversationReadReceipts(token, activeConversationId, latestOutgoingId);
        setConversationReadReceipts((prev) => ({
          ...prev,
          [latestOutgoingId]: receipts
        }));
      } catch {
        // Polling is best-effort fallback when socket events are missed.
      }
    };

    void pollLatestSeen();
    const intervalId = setInterval(() => {
      void pollLatestSeen();
    }, 6000);

    return () => {
      clearInterval(intervalId);
    };
  }, [activeConversationId, activeSection, currentUserId, conversationMessages, token]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeMessages]);

  function resolveMessageAuthor(senderId: string) {
    const currentUserId = user?.id ? String(user.id) : null;
    if (currentUserId && senderId === currentUserId) {
      return "You";
    }
    return senderNames[senderId] || `User ${senderId}`;
  }

  function formatMessageTime(isoDate: string) {
    const date = new Date(isoDate);
    if (Number.isNaN(date.getTime())) {
      return "--/--/---- --:--";
    }

    return date.toLocaleString([], {
      month: "numeric",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true
    });
  }

  function normalizeChannelName(name: string) {
    return name.replace(/^#+\s*/, "").trim();
  }

  function getUserColor(senderId: string) {
    const palette = [
      "#60A5FA",
      "#34D399",
      "#FBBF24",
      "#F472B6",
      "#A78BFA",
      "#22D3EE",
      "#FB7185",
      "#4ADE80"
    ];

    let hash = 0;
    for (let index = 0; index < senderId.length; index += 1) {
      hash = (hash << 5) - hash + senderId.charCodeAt(index);
      hash |= 0;
    }

    const colorIndex = Math.abs(hash) % palette.length;
    return palette[colorIndex];
  }

  const roomSidebarContent = (
    <AnimatePresence mode="wait">
      {activeSection === "global" ? (
        <motion.div
          key="global-info"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex-1 p-4"
        >
          <h2 className="text-sm font-semibold mb-4">Discover</h2>
          <p className="text-ui text-muted-foreground">Explore the global feed and connect with others.</p>
        </motion.div>
      ) : !activeServerId ? (
        <ConversationSidebar
          key="dms"
          conversations={conversations.map(c => ({
            ...c,
            name: conversationTitles[c.id] || c.name
          }))}
          activeId={activeConversationId}
          onSelect={(id) => {
            stopTypingNow();
            setActiveChannelId(null);
            setActiveConversationId(id);
            setMobilePanel(null);
          }}
          userId={user?.id ? String(user.id) : ""}
          presenceByUser={presenceByUser}
        />
      ) : activeServer ? (
        <ChannelSidebar
          key={activeServer.id}
          server={activeServer}
          channels={channels}
          activeChannelId={activeChannelId}
          onSelectChannel={(id) => {
            stopTypingNow();
            setActiveConversationId(null);
            setActiveChannelId(id);
            setMobilePanel(null);
          }}
          onCreateChannel={handleCreateChannel}
        />
      ) : (
        <div className="flex-1 flex items-center justify-center p-4">
          <p className="text-ui text-muted-foreground text-center">Loading...</p>
        </div>
      )}
    </AnimatePresence>
  );

  return (
    <main className="h-svh flex overflow-hidden bg-background text-foreground">
      {/* 1. Server List Rail */}
      <div className="hidden md:flex flex-col w-[72px] min-w-[72px] bg-card border-r border-border h-full">
        <ServerBar
          servers={servers}
          activeServerId={activeServerId}
          activeSection={activeSection}
          onSelectServer={(id) => {
            setActiveServerId(id);
            setMobilePanel(null);
          }}
          onGlobalSection={() => setActiveSection("global")}
          onPersonalSection={() => {
            setActiveSection("personal");
            setActiveServerId(null);
            setMobilePanel(null);
          }}
          onCreateServer={handleCreateServer}
          onFeed={() => router.push("/feed")}
          onConnections={() => router.push("/connections")}
          onSettings={() => router.push("/settings")}
          onLogout={() => {
            logout();
            router.replace("/");
          }}
          onSearch={() => toast.info("Global search coming soon!")}
          onProfile={() => router.push("/profile/me")}
          userProfile={{
            username: profile.username,
            avatarUrl: profile.avatarUrl
          }}
        />
      </div>

      {/* 2. Channel/Conversation Sidebar */}
      <div className="hidden md:flex flex-col w-60 min-w-[240px] bg-sidebar border-r border-sidebar-border">
        {roomSidebarContent}
      </div>

      {mobilePanel && (
        <div className="md:hidden fixed inset-0 z-40 bg-black/70" onClick={() => setMobilePanel(null)}>
          <div
            className={`absolute top-0 h-full bg-card border-r border-border transition-transform duration-200 ${mobilePanel === "servers" ? "left-0 w-[72px]" : "left-0 w-[280px] max-w-[85vw]"}`}
            onClick={(event) => event.stopPropagation()}
          >
            {mobilePanel === "servers" ? (
              <div className="flex h-full flex-col">
                <ServerBar
                  servers={servers}
                  activeServerId={activeServerId}
                  activeSection={activeSection}
                  onSelectServer={(id) => {
                    setActiveServerId(id);
                    setMobilePanel(null);
                  }}
                  onGlobalSection={() => {
                    setActiveSection("global");
                    setMobilePanel(null);
                  }}
                  onPersonalSection={() => {
                    setActiveSection("personal");
                    setActiveServerId(null);
                    setMobilePanel(null);
                  }}
                  onCreateServer={handleCreateServer}
                  onFeed={() => {
                    setMobilePanel(null);
                    router.push("/feed");
                  }}
                  onConnections={() => {
                    setMobilePanel(null);
                    router.push("/connections");
                  }}
                  onSettings={() => {
                    setMobilePanel(null);
                    router.push("/settings");
                  }}
                  onLogout={() => {
                    setMobilePanel(null);
                    logout();
                    router.replace("/");
                  }}
                  onSearch={() => toast.info("Global search coming soon!")}
                  onProfile={() => {
                    setMobilePanel(null);
                    router.push("/profile/me");
                  }}
                  userProfile={{
                    username: profile.username,
                    avatarUrl: profile.avatarUrl
                  }}
                />
              </div>
            ) : (
              <div className="h-full bg-sidebar border-r border-sidebar-border">
                {roomSidebarContent}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. Main Chat Panel */}
      <div className="flex-1 flex flex-col min-w-0 bg-background relative">
        {activeRoom ? (
          <div className="flex flex-col h-full">
            {/* Header */}
            {/* Header / Room Title */}
            <div className="h-12 sm:h-14 flex items-center justify-between gap-2 sm:gap-3 px-3 sm:px-6 border-b border-border shrink-0 bg-background/50 backdrop-blur-md sticky top-0 z-10">
               <div className="flex min-w-0 items-center gap-2 sm:gap-3">
                 <div className="flex items-center gap-1 md:hidden">
                   <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setMobilePanel("servers")}>
                     <Menu className="h-4 w-4" />
                   </Button>
                   <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setMobilePanel("rooms")}>
                     <Search className="h-4 w-4" />
                   </Button>
                 </div>
                 <div className="w-8 h-8 rounded-lg bg-surface flex items-center justify-center border border-border">
                   {activeChannelId ? <Globe2 className="h-4 w-4 text-primary" /> : <Lock className="h-4 w-4 text-accent" />}
                 </div>
                 <div className="min-w-0 flex flex-col">
                   <h2 className="text-sm font-bold tracking-tight truncate max-w-[42vw] sm:max-w-none">
                     {activeChannelId 
                       ? normalizeChannelName(activeChannel?.name || "channel") 
                       : conversationTitles[activeConversationId!] || "Direct Message"}
                   </h2>
                   {activeChannelId && (
                     <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold truncate">
                       Text Channel
                     </p>
                   )}
                 </div>
               </div>

               <div className="ml-auto flex items-center gap-2">
                 {activeChannelId && (
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => activeChannelId && handleDeleteChannel(activeChannelId)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                 )}
               </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto scrollbar-thin px-3 sm:px-4 py-4 space-y-1">
              {isLoadingMessages ? (
                <div className="flex items-center justify-center h-full text-ui text-muted-foreground">
                  <span className="animate-pulse">Loading messages...</span>
                </div>
              ) : activeMessages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center space-y-2 opacity-30">
                  <div className="w-12 h-12 rounded-full border-2 border-dashed border-current flex items-center justify-center">
                    {activeChannelId ? <Globe2 className="h-6 w-6" /> : <Lock className="h-6 w-6" />}
                  </div>
                  <p className="text-ui">No messages yet. Send a greeting!</p>
                </div>
              ) : (
                <>
                  {activeMessages.map((message) => {
                    const isMine = user?.id ? String(user.id) === message.senderId : false;
                    const reactions = activeConversationId ? (conversationReactions[message.id] || []) : (channelReactions[message.id] || []);
                    
                    return (
                      <MessageRow
                        key={message.id}
                        message={message}
                        isOwn={isMine}
                        senderName={resolveMessageAuthor(message.senderId)}
                        reactions={reactions}
                        readReceipts={activeConversationId ? (conversationReadReceipts[message.id] || []) : []}
                        onEdit={handleStartEditMessage}
                        onDelete={handleDeleteMessage}
                        onReact={handleToggleReaction}
                        currentUserId={user?.id ? String(user.id) : undefined}
                      />
                    );
                  })}
                  <div ref={messagesBottomRef} />
                </>
              )}
            </div>

            {/* Composer Section */}
            <div className="relative">
              {typingNotice && (
                <div className="absolute -top-6 left-3 sm:left-6 flex items-center gap-2">
                  <div className="flex gap-0.5">
                    <span className="w-1 h-1 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]" />
                    <span className="w-1 h-1 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]" />
                    <span className="w-1 h-1 bg-primary rounded-full animate-bounce" />
                  </div>
                  <span className="text-[11px] font-medium text-primary/80">
                    {typingNotice}
                  </span>
                </div>
              )}
              
              <MessageComposer
                onSend={async (content) => {
                  setComposer(content);
                  await handleSendMessage(content);
                }}
                onTyping={(isTyping) => {
                  if (isTyping) {
                    scheduleTypingStart();
                    scheduleTypingStop(2000);
                  } else {
                    stopTypingNow();
                  }
                }}
                isEditing={!!editingMessageId}
                initialValue={editingText}
                onCancel={handleCancelEditMessage}
                onEdit={async (content) => {
                  if (editingMessageId) {
                    await handleEditMessage(editingMessageId, content);
                  }
                }}
                roomName={activeChannelId ? `#${normalizeChannelName(activeChannel?.name || "channel")}` : (conversationTitles[activeConversationId!] || "Direct Message")}
              />
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center">
             <div className="text-center space-y-4 max-w-sm px-6">
               <div className="md:hidden flex items-center justify-center gap-2">
                <Button variant="outline" className="h-9" onClick={() => setMobilePanel("servers")}>Servers</Button>
                <Button variant="outline" className="h-9" onClick={() => setMobilePanel("rooms")}>Chats</Button>
               </div>
                <div className="w-16 h-16 bg-surface rounded-2xl flex items-center justify-center mx-auto mb-6">
                   <Globe2 className="h-8 w-8 text-primary" />
                </div>
                <h1 className="text-2xl font-bold tracking-tight">Welcome to ChatStack</h1>
                <p className="text-muted-foreground">
                  Select a server from the sidebar or start a new conversation to begin chatting with your community.
                </p>
             </div>
          </div>
        )}

        {/* Floating Errors */}
        <AnimatePresence>
          {(lastError || uiError) && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="absolute bottom-20 left-1/2 -translate-x-1/2 z-50"
            >
              <div className="bg-destructive text-destructive-foreground px-4 py-2 rounded-md shadow-lg text-xs font-medium">
                {lastError || uiError}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {/* 4. Context/Right Panel (Optional for future) */}
      {/* We can add a ContextPanel here like Lovable did */}
    </main>
  );
}
