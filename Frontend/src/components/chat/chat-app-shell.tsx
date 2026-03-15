"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Pencil, Plus, Send, Smile, Trash2, X } from "lucide-react";

import { ChatTopBar } from "@/components/chat/chat-top-bar";
import { SecondarySidebar } from "@/components/chat/secondary-sidebar";
import { ServerSidebar } from "@/components/chat/server-sidebar";
import { getMyProfile, getProfileByUserId, searchProfilesByUsername } from "@/lib/auth-client";
import { useAuth } from "@/contexts/auth-context";
import { useSocket } from "@/hooks/use-socket";
import { Button } from "@/components/ui/button";
import {
  ChatChannel,
  ChatConversation,
  ChatMessage,
  MessageReaction,
  MessageReadReceipt,
  ChatServer,
  ConversationMessage,
  addChannelReaction,
  createChannel,
  createConversation,
  createServer,
  deleteChannel,
  deleteChannelMessage,
  deleteConversationMessage,
  editChannelMessage,
  editConversationMessage,
  getConversationMessages,
  getConversationReadReceipts,
  getConversationUnreadCount,
  getChannelReactions,
  getConversations,
  getChannelMessages,
  markMessageRead,
  getServerById,
  getMyServers,
  joinServer,
  removeChannelReaction,
  getServerChannels,
  getChannelUnreadCount,
  sendChannelMessage,
  sendConversationMessage,
} from "@/lib/chat-client";

type ProfileState = {
  username: string;
  avatarUrl?: string;
};

type ActiveRoom =
  | { roomType: "channel"; roomId: string }
  | { roomType: "conversation"; roomId: string }
  | null;

export function ChatAppShell() {
  const { token, user } = useAuth();
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
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");
  const [pendingDeleteMessageId, setPendingDeleteMessageId] = useState<string | null>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typingStartTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTypingRef = useRef(false);
  const tokenRef = useRef<string | null>(token);
  const userIdRef = useRef<string | null>(user?.id ? String(user.id) : null);
  const socketStatusRef = useRef<string>("disconnected");

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
        const list = await getConversations(token);
        if (cancelled) {
          return;
        }

        const unreadCounts = await Promise.all(
          list.map((conversation) => getConversationUnreadCount(token, conversation.id).catch(() => 0))
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
        const list = await getConversationMessages(token, activeConversationId, 100);
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
                  const receipts = await getConversationReadReceipts(token, activeConversationId, messageId);
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
          if (latest) {
            void markMessageRead(token, {
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
      isEncrypted: boolean;
      createdAt: string;
    }) => {
      const nextMessage: ChatMessage = {
        id: String(payload.id),
        channelId: String(payload.channelId),
        senderId: String(payload.senderId),
        content: payload.content,
        isEncrypted: payload.isEncrypted,
        createdAt: payload.createdAt
      };

      if (nextMessage.channelId !== activeChannelId) {
        return;
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
      isEncrypted: boolean;
      createdAt: string;
    }) => {
      const nextMessage: ConversationMessage = {
        id: String(payload.id),
        conversationId: String(payload.conversationId),
        senderId: String(payload.senderId),
        content: payload.content,
        isEncrypted: payload.isEncrypted,
        createdAt: payload.createdAt
      };

      if (nextMessage.conversationId !== activeConversationId) {
        return;
      }

      setConversationMessages((prev) => {
        if (prev.some((message) => message.id === nextMessage.id)) {
          return prev;
        }
        return [...prev, nextMessage];
      });

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

    socket.on("edited-conversation-message", onEditedConversationMessage);
    socket.on("deleted-conversation-message", onDeletedConversationMessage);
    socket.on("conversation-message-read", onConversationMessageRead);

    return () => {
      socket.emit("leave-conversation", { conversationId: activeConversationId });
      socket.off("new-conversation-message", onNewConversationMessage);
      socket.off("edited-conversation-message", onEditedConversationMessage);
      socket.off("deleted-conversation-message", onDeletedConversationMessage);
      socket.off("conversation-message-read", onConversationMessageRead);
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

  async function handleCreateServer() {
    if (!token) {
      return;
    }

    const name = window.prompt("Server name");
    if (!name || name.trim().length < 2) {
      return;
    }

    try {
      const created = await createServer(token, {
        name: name.trim()
      });
      setServers((prev) => [...prev, created]);
      setActiveServerId(created.id);
      setUiError(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to create server.";
      setUiError(message);
    }
  }

  async function handleCreateChannel(name: string) {
    if (!token || !activeServerId) {
      return;
    }

    const normalizedName = name.trim();
    if (normalizedName.length < 2) {
      throw new Error("Channel name must be at least 2 characters.");
    }

    try {
      const created = await createChannel(token, activeServerId, {
        name: normalizedName
      });
      setChannels((prev) => [...prev, created]);
      setActiveChannelId(created.id);
      setUiError(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to create channel.";
      setUiError(message);
      throw new Error(message);
    }
  }

  async function handleDeleteChannel(channelId: string): Promise<void> {
    if (!token) {
      return;
    }

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
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to create conversation.";
      setUiError(message);
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

  async function handleSendMessage() {
    if (!token || !composer.trim() || activeSection !== "personal" || !activeRoom) {
      return;
    }

    const content = composer.trim();

    try {
      if (socket && socketStatus === "connected") {
        if (activeRoom.roomType === "channel") {
          socket.emit("send-channel-message", {
            channelId: activeRoom.roomId,
            content,
            isEncrypted: false
          });
        } else {
          socket.emit("send-conversation-message", {
            conversationId: activeRoom.roomId,
            content,
            isEncrypted: false
          });
        }
      } else if (activeRoom.roomType === "channel") {
        const created = await sendChannelMessage(token, activeRoom.roomId, {
          content,
          isEncrypted: false
        });

        setMessages((prev) => {
          if (prev.some((message) => message.id === created.id)) {
            return prev;
          }
          return [...prev, created];
        });
      } else {
        const created = await sendConversationMessage(token, activeRoom.roomId, {
          content,
          isEncrypted: false
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

  async function handleEditMessage(messageId: string) {
    if (!token || !activeRoom || activeSection !== "personal") {
      return;
    }

    const nextContent = editingText.trim();
    if (!nextContent) {
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
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to edit message.";
      setUiError(message);
    }
  }

  async function handleDeleteMessage(messageId: string) {
    if (!token || !activeRoom || !user?.id || activeSection !== "personal") {
      return;
    }

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
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to delete message.";
      setUiError(message);
    }
  }

  async function handleToggleChannelReaction(messageId: string, emoji: string) {
    if (!token || !activeChannelId || !currentUserId) {
      return;
    }

    const previous = channelReactions[messageId] || [];
    const alreadyReacted = previous.some(
      (reaction) => reaction.userId === currentUserId && reaction.emoji === emoji
    );

    const optimistic = alreadyReacted
      ? previous.filter((reaction) => !(reaction.userId === currentUserId && reaction.emoji === emoji))
      : [
          ...previous,
          {
            id: `temp-${Date.now()}`,
            emoji,
            userId: currentUserId,
            createdAt: new Date().toISOString()
          }
        ];

    setChannelReactions((prev) => ({
      ...prev,
      [messageId]: optimistic
    }));

    try {
      if (alreadyReacted) {
        await removeChannelReaction(token, activeChannelId, messageId, emoji);
      } else {
        await addChannelReaction(token, activeChannelId, messageId, emoji);
      }

      const refreshed = await getChannelReactions(token, activeChannelId, messageId);
      setChannelReactions((prev) => ({
        ...prev,
        [messageId]: refreshed
      }));
      setUiError(null);
    } catch (error) {
      setChannelReactions((prev) => ({
        ...prev,
        [messageId]: previous
      }));
      const message = error instanceof Error ? error.message : "Failed to update reaction.";
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

        payload.userIds.forEach((userId) => {
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

  return (
    <main className="flex h-svh overflow-hidden bg-[#0A0A0B] text-white">
      <ServerSidebar
        activeSection={activeSection}
        onSelectSection={setActiveSection}
        onCreateServer={handleCreateServer}
      />
      <SecondarySidebar
        mode={activeSection}
        username={profile.username}
        avatarUrl={profile.avatarUrl}
        servers={servers}
        activeServerId={activeServerId}
        onSelectServer={setActiveServerId}
        onSearchServer={handleSearchServer}
        onJoinServer={handleJoinServer}
        channels={channels}
        activeChannelId={activeChannelId}
        onSelectChannel={(channelId) => {
          stopTypingNow();
          setActiveConversationId(null);
          setActiveChannelId(channelId);
        }}
        conversations={conversations.map((conversation) => {
          const otherMemberId = (conversation.memberIds || []).find((memberId) => memberId !== currentUserId);

          return {
            id: conversation.id,
            name: conversationTitles[conversation.id] || conversation.name || `Conversation ${conversation.id}`,
            unreadCount: conversation.unreadCount,
            isOnline: otherMemberId ? presenceByUser[otherMemberId] : undefined
          };
        })}
        activeConversationId={activeConversationId}
        onSelectConversation={(conversationId) => {
          stopTypingNow();
          setActiveChannelId(null);
          setActiveConversationId(conversationId);
        }}
        onCreateConversation={handleCreateConversation}
        onCreateConversationByUsername={handleCreateConversationByUsername}
        onCreateChannel={handleCreateChannel}
        onDeleteChannel={handleDeleteChannel}
      />

      <section className="relative flex min-h-svh flex-1 flex-col overflow-hidden">
        <ChatTopBar
          channelName={
            activeSection === "global"
              ? "Global"
              : activeConversationId
                ? conversationTitles[activeConversationId] || activeConversation?.name || "dm"
                : normalizeChannelName(activeChannel?.name || "channel") || "channel"
          }
          description={
            activeSection === "global"
              ? `Global feed • socket ${socketStatus}`
              : activeConversationId
                ? `DM • ${activeConversationPresence === undefined ? "Status unknown" : activeConversationPresence ? "Online" : "Offline"} • socket ${socketStatus}`
                : `${activeServer?.name || "Workspace"} • socket ${socketStatus}`
          }
        />

        <div className="flex-1 overflow-y-auto px-3 py-4 md:px-6 md:py-5">
          <div className="w-full space-y-2 pb-28">
            {isLoadingServers || isLoadingChannels || isLoadingMessages ? (
              <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 font-montserrat text-xs text-zinc-300">
                Loading chat data...
              </div>
            ) : null}

            {!isLoadingMessages && activeSection === "personal" && activeChannelId && messages.length === 0 ? (
              <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 font-montserrat text-xs text-zinc-300">
                No messages yet in #{normalizeChannelName(activeChannel?.name || "channel") || "channel"}. Start the conversation.
              </div>
            ) : null}

            {!isLoadingMessages && activeSection === "personal" && activeConversationId && conversationMessages.length === 0 ? (
              <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 font-montserrat text-xs text-zinc-300">
                No messages yet in this conversation. Start the conversation.
              </div>
            ) : null}

            {activeSection === "personal" && !activeServerId ? (
              <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 font-montserrat text-xs text-zinc-300">
                No server found. Use the plus button in the left rail to create your first server.
              </div>
            ) : null}

            {activeSection === "global" ? (
              <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 font-montserrat text-xs text-zinc-300">
                Global
              </div>
            ) : null}

            {activeSection === "personal" && activeMessages.map((message) => {
              const isMine = user?.id ? String(user.id) === message.senderId : false;
              const author = resolveMessageAuthor(message.senderId);
              const usernameColor = isMine ? "#C4B5FD" : getUserColor(message.senderId);
              const messageChannelReactions = activeChannelId ? (channelReactions[message.id] || []) : [];
              const groupedChannelReactions = Object.entries(
                messageChannelReactions.reduce<Record<string, MessageReaction[]>>((acc, reaction) => {
                  if (!acc[reaction.emoji]) {
                    acc[reaction.emoji] = [];
                  }
                  acc[reaction.emoji].push(reaction);
                  return acc;
                }, {})
              );
              const messageReceipts = activeConversationId ? (conversationReadReceipts[message.id] || []) : [];
              const receiptsFromOthers = messageReceipts.filter((receipt) => receipt.userId !== currentUserId);
              const latestSeenAt = receiptsFromOthers
                .map((receipt) => new Date(receipt.readAt))
                .filter((date) => !Number.isNaN(date.getTime()))
                .sort((a, b) => b.getTime() - a.getTime())[0];

              return (
                <article
                  key={message.id}
                  className="group w-full rounded-xl border border-transparent px-2 py-2 transition-all duration-200 ease-in-out hover:border-white/10 hover:bg-white/3"
                >
                  <div className="flex w-full items-start gap-3">
                    <div
                      className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-full border bg-black/55 font-montserrat text-xs text-zinc-100"
                      style={{ borderColor: `${usernameColor}66` }}
                    >
                      {author.slice(0, 2).toUpperCase()}
                    </div>

                    <div className="min-w-0 flex-1 text-left">
                      <div className="mb-1.5 flex items-center gap-2">
                        <span className="truncate font-poppins text-sm font-semibold" style={{ color: usernameColor }}>
                          {author}
                        </span>
                        <span className="shrink-0 font-montserrat text-[11px] text-zinc-500">
                          {formatMessageTime(message.createdAt)}
                        </span>
                        {isMine ? (
                          <div className="ml-auto flex items-center gap-1 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                handleStartEditMessage(message.id, message.content);
                              }}
                              className="size-7 rounded-md text-zinc-400 hover:bg-white/10 hover:text-white"
                              aria-label="Edit message"
                            >
                              <Pencil className="size-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setPendingDeleteMessageId(message.id);
                              }}
                              className="size-7 rounded-md text-zinc-400 hover:bg-red-500/15 hover:text-red-300"
                              aria-label="Delete message"
                            >
                              <Trash2 className="size-3.5" />
                            </Button>
                          </div>
                        ) : null}
                      </div>

                      {isMine && editingMessageId === message.id ? (
                        <div className="max-w-[min(78ch,100%)] space-y-2 rounded-xl border border-indigo-300/35 bg-indigo-500/10 p-2">
                          <input
                            type="text"
                            value={editingText}
                            onChange={(event) => setEditingText(event.target.value)}
                            onKeyDown={(event) => {
                              if (event.key === "Enter") {
                                event.preventDefault();
                                void handleEditMessage(message.id);
                              }
                              if (event.key === "Escape") {
                                event.preventDefault();
                                handleCancelEditMessage();
                              }
                            }}
                            className="h-9 w-full rounded-md border border-white/15 bg-black/30 px-2 font-poppins text-sm text-zinc-100 outline-none focus:border-indigo-300/70"
                            autoFocus
                          />
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                void handleEditMessage(message.id);
                              }}
                              className="size-7 rounded-md text-emerald-200 hover:bg-emerald-500/20 hover:text-emerald-100"
                              aria-label="Save edited message"
                            >
                              <Check className="size-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={handleCancelEditMessage}
                              className="size-7 rounded-md text-zinc-300 hover:bg-white/10 hover:text-white"
                              aria-label="Cancel editing message"
                            >
                              <X className="size-3.5" />
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <p
                            className={`inline-block max-w-[min(78ch,100%)] wrap-break-word rounded-xl border px-3 py-2 font-poppins text-[15px] leading-6 ${
                              isMine
                                ? "border-indigo-300/35 bg-indigo-500/18 text-indigo-50"
                                : "border-white/12 bg-[#171A22] text-zinc-100"
                            }`}
                          >
                            {message.content}
                          </p>
                          {isMine && activeConversationId && latestOutgoingConversationMessageId === message.id && receiptsFromOthers.length > 0 ? (
                            <p className="font-montserrat text-[11px] text-zinc-400">
                              Seen{latestSeenAt
                                ? ` at ${latestSeenAt.toLocaleTimeString([], { hour: "numeric", minute: "2-digit", hour12: true })}`
                                : ""}
                            </p>
                          ) : null}

                          {activeChannelId ? (
                            <div className="flex flex-wrap items-center gap-1.5 pt-1 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                              {groupedChannelReactions.map(([emoji, reactions]) => {
                                const reactedByMe = reactions.some((reaction) => reaction.userId === currentUserId);

                                return (
                                  <button
                                    key={`${message.id}-${emoji}`}
                                    type="button"
                                    onClick={() => {
                                      void handleToggleChannelReaction(message.id, emoji);
                                    }}
                                    className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-montserrat text-[11px] transition-all duration-200 ${
                                      reactedByMe
                                        ? "border-cyan-300/45 bg-cyan-500/15 text-cyan-100"
                                        : "border-white/15 bg-white/5 text-zinc-300 hover:bg-white/10"
                                    }`}
                                    aria-label={`Toggle reaction ${emoji}`}
                                  >
                                    <span>{emoji}</span>
                                    <span>{reactions.length}</span>
                                  </button>
                                );
                              })}

                              {[
                                "👍",
                                "❤️",
                                "😂",
                                "🔥"
                              ].map((emoji) => (
                                <button
                                  key={`${message.id}-picker-${emoji}`}
                                  type="button"
                                  onClick={() => {
                                    void handleToggleChannelReaction(message.id, emoji);
                                  }}
                                  className="inline-flex size-6 items-center justify-center rounded-full border border-white/15 bg-white/5 text-xs text-zinc-300 transition-all duration-200 hover:bg-white/10 hover:text-white"
                                  aria-label={`React with ${emoji}`}
                                >
                                  {emoji}
                                </button>
                              ))}

                              <span className="inline-flex size-6 items-center justify-center rounded-full border border-white/15 bg-white/5 text-zinc-400">
                                <Smile className="size-3.5" />
                              </span>
                            </div>
                          ) : null}
                        </div>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}

            {typingNotice ? (
              <div className="mx-3 rounded-lg border border-indigo-300/20 bg-indigo-500/10 px-3 py-2 font-montserrat text-xs text-indigo-100">
                {typingNotice}
              </div>
            ) : null}

            {lastError ? (
              <div className="mx-3 rounded-lg border border-red-300/30 bg-red-500/10 px-3 py-2 font-montserrat text-xs text-red-100">
                {lastError}
              </div>
            ) : null}

            {uiError ? (
              <div className="mx-3 rounded-lg border border-red-300/30 bg-red-500/10 px-3 py-2 font-montserrat text-xs text-red-100">
                {uiError}
              </div>
            ) : null}
          </div>
        </div>

        <div className="absolute right-0 bottom-0 left-0 border-t border-white/10 bg-black/45 p-3 backdrop-blur-xl md:p-4">
          <div>
            <div className="flex w-full items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-2 py-2 focus-within:border-indigo-300/70 focus-within:shadow-[0_0_15px_rgba(79,70,229,0.3)]">
              <Button
                variant="ghost"
                size="icon"
                className="size-9 rounded-lg text-zinc-300 transition-all duration-300 ease-in-out hover:bg-white/10 hover:text-white"
                aria-label="Attach file"
              >
                <Plus className="size-4" />
              </Button>

              <input
                type="text"
                value={composer}
                onChange={(event) => {
                  setComposer(event.target.value);
                  scheduleTypingStart();
                  scheduleTypingStop(1000);
                }}
                onBlur={() => {
                  stopTypingNow();
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    void handleSendMessage();
                  }
                }}
                placeholder={
                  activeSection === "global"
                    ? "Global"
                    : activeConversationId
                      ? "Message conversation"
                      : `Message #${normalizeChannelName(activeChannel?.name || "channel") || "channel"}`
                }
                className="h-10 w-full bg-transparent px-1 font-poppins text-sm text-zinc-200 outline-none placeholder:text-zinc-500"
              />

              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  void handleSendMessage();
                }}
                disabled={
                  activeSection !== "personal" ||
                  (!activeChannelId && !activeConversationId) ||
                  !composer.trim()
                }
                className="size-9 rounded-lg text-indigo-200 transition-all duration-300 ease-in-out hover:bg-indigo-500/20 hover:text-white"
                aria-label="Send message"
              >
                <Send className="size-4" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {pendingDeleteMessageId ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-sm rounded-xl border border-white/15 bg-[#111214] p-4 shadow-2xl">
            <h3 className="font-tektur text-base text-white">Delete message?</h3>
            <p className="mt-2 font-poppins text-sm text-zinc-300">
              This action cannot be undone.
            </p>
            <div className="mt-4 flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setPendingDeleteMessageId(null)}
                className="h-8 rounded-md border border-white/10 px-3 font-montserrat text-xs text-zinc-300 hover:bg-white/10"
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  void handleDeleteMessage(pendingDeleteMessageId);
                }}
                className="h-8 rounded-md border border-red-300/40 bg-red-500/15 px-3 font-montserrat text-xs text-red-100 hover:bg-red-500/25"
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
