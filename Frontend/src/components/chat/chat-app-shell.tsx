"use client";

import { useEffect, useState } from "react";
import { Plus, Send } from "lucide-react";

import { ChatTopBar } from "@/components/chat/chat-top-bar";
import { SecondarySidebar } from "@/components/chat/secondary-sidebar";
import { ServerSidebar } from "@/components/chat/server-sidebar";
import { getMyProfile, getProfileByUserId } from "@/lib/auth-client";
import { useAuth } from "@/contexts/auth-context";
import { useSocket } from "@/hooks/use-socket";
import { Button } from "@/components/ui/button";
import {
  ChatChannel,
  ChatMessage,
  ChatServer,
  createChannel,
  createServer,
  deleteChannel,
  getChannelMessages,
  getServerById,
  getMyServers,
  joinServer,
  getServerChannels
} from "@/lib/chat-client";

type ProfileState = {
  username: string;
  avatarUrl?: string;
};

export function ChatAppShell() {
  const { token, user } = useAuth();
  const [profile, setProfile] = useState<ProfileState>({
    username: user?.username || "User"
  });
  const [servers, setServers] = useState<ChatServer[]>([]);
  const [channels, setChannels] = useState<ChatChannel[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [activeSection, setActiveSection] = useState<"global" | "personal">("personal");
  const [activeServerId, setActiveServerId] = useState<string | null>(null);
  const [activeChannelId, setActiveChannelId] = useState<string | null>(null);
  const [composer, setComposer] = useState("");
  const [isLoadingServers, setIsLoadingServers] = useState(false);
  const [isLoadingChannels, setIsLoadingChannels] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [uiError, setUiError] = useState<string | null>(null);
  const [senderNames, setSenderNames] = useState<Record<string, string>>({});

  const { socket, status: socketStatus, lastError } = useSocket(token);

  const activeServer = servers.find((server) => server.id === activeServerId) || null;
  const activeChannel = channels.find((channel) => channel.id === activeChannelId) || null;

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

        setChannels(list);
        setActiveChannelId((prev) => {
          if (prev && list.some((channel) => channel.id === prev)) {
            return prev;
          }
          return list.length > 0 ? list[0].id : null;
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
    };

    socket.on("new-channel-message", onNewChannelMessage);

    return () => {
      socket.emit("leave-channel", { channelId: activeChannelId });
      socket.off("new-channel-message", onNewChannelMessage);
    };
  }, [activeChannelId, activeSection, socket]);

  useEffect(() => {
    if (!token || activeSection !== "personal" || messages.length === 0) {
      return;
    }

    const authToken: string = token;

    const currentUserId = user?.id ? String(user.id) : null;

    const missingSenderIds = Array.from(
      new Set(
        messages
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
  }, [messages, senderNames, token, activeSection, user?.id]);

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

  function handleSendMessage() {
    if (!socket || !activeChannelId || !composer.trim() || activeSection !== "personal") {
      return;
    }

    socket.emit("send-channel-message", {
      channelId: activeChannelId,
      content: composer.trim(),
      isEncrypted: false
    });

    setComposer("");
  }

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
        onSelectChannel={setActiveChannelId}
        onCreateChannel={handleCreateChannel}
        onDeleteChannel={handleDeleteChannel}
      />

      <section className="relative flex min-h-svh flex-1 flex-col overflow-hidden">
        <ChatTopBar
          channelName={
            activeSection === "global"
              ? "Global"
              : normalizeChannelName(activeChannel?.name || "channel") || "channel"
          }
          description={
            activeSection === "global"
              ? `Global feed • socket ${socketStatus}`
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

            {activeSection === "personal" && messages.map((message) => {
              const isMine = user?.id ? String(user.id) === message.senderId : false;
              const author = resolveMessageAuthor(message.senderId);
              const usernameColor = isMine ? "#C4B5FD" : getUserColor(message.senderId);

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
                      </div>

                      <p
                        className={`inline-block max-w-[min(78ch,100%)] wrap-break-word rounded-xl border px-3 py-2 font-poppins text-[15px] leading-6 ${
                          isMine
                            ? "border-indigo-300/35 bg-indigo-500/18 text-indigo-50"
                            : "border-white/12 bg-[#171A22] text-zinc-100"
                        }`}
                      >
                        {message.content}
                      </p>
                    </div>
                  </div>
                </article>
              );
            })}

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
                onChange={(event) => setComposer(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder={
                  activeSection === "global"
                    ? "Global"
                    : `Message #${normalizeChannelName(activeChannel?.name || "channel") || "channel"}`
                }
                className="h-10 w-full bg-transparent px-1 font-poppins text-sm text-zinc-200 outline-none placeholder:text-zinc-500"
              />

              <Button
                variant="ghost"
                size="icon"
                onClick={handleSendMessage}
                disabled={activeSection !== "personal" || !activeChannelId || !composer.trim()}
                className="size-9 rounded-lg text-indigo-200 transition-all duration-300 ease-in-out hover:bg-indigo-500/20 hover:text-white"
                aria-label="Send message"
              >
                <Send className="size-4" />
              </Button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
