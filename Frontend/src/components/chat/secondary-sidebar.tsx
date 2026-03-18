"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Hash, Plus, Settings, Trash2, UserPlus } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

type ChannelItem = {
  id: string;
  name: string;
  unreadCount?: number;
};

type ServerItem = {
  id: string;
  name: string;
};

type ConversationItem = {
  id: string;
  name: string;
  unreadCount?: number;
  isOnline?: boolean;
};

type SecondarySidebarProps = {
  mode: "global" | "personal";
  username: string;
  avatarUrl?: string;
  servers: ServerItem[];
  activeServerId: string | null;
  onSelectServer: (serverId: string) => void;
  onSearchServer: (query: string) => Promise<ServerItem | null>;
  onJoinServer: (serverId: string) => Promise<void>;
  channels: ChannelItem[];
  activeChannelId: string | null;
  onSelectChannel: (channelId: string) => void;
  conversations: ConversationItem[];
  activeConversationId: string | null;
  onSelectConversation: (conversationId: string) => void;
  onCreateConversation: () => Promise<void>;
  onCreateConversationByUsername: (username: string) => Promise<void>;
  onCreateChannel: (name: string) => Promise<void>;
  onDeleteChannel: (channelId: string) => Promise<void>;
};

export function SecondarySidebar({
  mode,
  username,
  avatarUrl,
  servers,
  activeServerId,
  onSelectServer,
  onSearchServer,
  onJoinServer,
  channels,
  activeChannelId,
  onSelectChannel,
  conversations,
  activeConversationId,
  onSelectConversation,
  onCreateConversation,
  onCreateConversationByUsername,
  onCreateChannel,
  onDeleteChannel
}: SecondarySidebarProps) {
  const [view, setView] = useState<"server" | "dm">("server");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResult, setSearchResult] = useState<ServerItem | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [dmSearchUsername, setDmSearchUsername] = useState("");
  const [dmSearchError, setDmSearchError] = useState<string | null>(null);
  const [isCreatingDm, setIsCreatingDm] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [isCreateChannelOpen, setIsCreateChannelOpen] = useState(false);
  const [newChannelName, setNewChannelName] = useState("");
  const router = useRouter();
  const [createChannelError, setCreateChannelError] = useState<string | null>(null);
  const [isCreatingChannel, setIsCreatingChannel] = useState(false);
  const [deletingChannelId, setDeletingChannelId] = useState<string | null>(null);
  const [pendingDeleteChannel, setPendingDeleteChannel] = useState<ChannelItem | null>(null);
  const [deleteChannelError, setDeleteChannelError] = useState<string | null>(null);
  const isGlobalMode = mode === "global";
  const activeServer = servers.find((server) => server.id === activeServerId) || null;

  const initials = useMemo(() => username.slice(0, 2).toUpperCase(), [username]);

  function normalizeChannelName(name: string) {
    return name.replace(/^#+\s*/, "").trim();
  }

  async function handleSearchServer() {
    const query = searchQuery.trim();
    if (!query) {
      setSearchError("Enter a server id.");
      setSearchResult(null);
      return;
    }

    setIsSearching(true);
    setSearchError(null);

    try {
      const result = await onSearchServer(query);
      if (!result) {
        setSearchResult(null);
        setSearchError("Server not found.");
        return;
      }

      setSearchResult(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Search failed.";
      setSearchResult(null);
      setSearchError(message);
    } finally {
      setIsSearching(false);
    }
  }

  async function handleJoinServer() {
    if (!searchResult) {
      return;
    }

    setIsJoining(true);
    setSearchError(null);

    try {
      await onJoinServer(searchResult.id);
      setSearchError(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Join failed.";
      setSearchError(message);
    } finally {
      setIsJoining(false);
    }
  }

  async function handleCreateChannelSubmit() {
    const name = newChannelName.trim().replace(/^#+\s*/, "");
    if (!name) {
      setCreateChannelError("Enter a channel name.");
      return;
    }

    if (!activeServerId) {
      setCreateChannelError("Select a server first.");
      return;
    }

    setIsCreatingChannel(true);
    setCreateChannelError(null);

    try {
      await onCreateChannel(name);
      setNewChannelName("");
      setIsCreateChannelOpen(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to create channel.";
      setCreateChannelError(message);
    } finally {
      setIsCreatingChannel(false);
    }
  }

  async function handleCreateDmByUsername() {
    const query = dmSearchUsername.trim();
    if (!query) {
      setDmSearchError("Enter a username.");
      return;
    }

    setDmSearchError(null);
    setIsCreatingDm(true);

    try {
      await onCreateConversationByUsername(query);
      setDmSearchUsername("");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to start DM.";
      setDmSearchError(message);
    } finally {
      setIsCreatingDm(false);
    }
  }

  async function handleDeleteChannel(channelId: string) {
    setDeletingChannelId(channelId);

    try {
      await onDeleteChannel(channelId);
    } finally {
      setDeletingChannelId(null);
    }
  }

  async function handleConfirmDeleteChannel() {
    if (!pendingDeleteChannel) {
      return;
    }

    setDeleteChannelError(null);

    try {
      await handleDeleteChannel(pendingDeleteChannel.id);
      setPendingDeleteChannel(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to delete channel.";
      setDeleteChannelError(message);
    }
  }

  return (
    <aside className="hidden w-64 flex-col border-r border-white/10 bg-black/45 backdrop-blur-md lg:flex">
      {isGlobalMode ? (
        <div className="border-b border-white/10 px-3 py-3">
          <div className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2">
            <span className="font-tektur text-sm text-white">Global</span>
          </div>
        </div>
      ) : (
        <>
          <div className="border-b border-white/10 p-3">
            <div className="grid grid-cols-2 gap-2 rounded-xl border border-white/10 bg-black/45 p-1">
              <Button
                variant="ghost"
                onClick={() => setView("server")}
                className={`h-8 rounded-lg font-montserrat text-xs transition-all duration-300 ease-in-out ${
                  view === "server" ? "bg-white/10 text-white" : "text-zinc-300 hover:bg-white/5"
                }`}
              >
                Server
              </Button>
              <Button
                variant="ghost"
                onClick={() => setView("dm")}
                className={`h-8 rounded-lg font-montserrat text-xs transition-all duration-300 ease-in-out ${
                  view === "dm" ? "bg-white/10 text-white" : "text-zinc-300 hover:bg-white/5"
                }`}
              >
                DMs
              </Button>
            </div>
          </div>

          <div className="border-b border-white/10 px-3 py-3">
            {view === "server" ? (
              <button className="flex w-full items-center justify-between rounded-lg bg-white/5 px-3 py-2 text-left transition-all duration-300 ease-in-out hover:bg-white/10">
                <span className="font-tektur text-sm text-white">{activeServer?.name || "No server selected"}</span>
                <ChevronDown className="size-4 text-zinc-300" />
              </button>
            ) : (
              <div className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2">
                <span className="font-tektur text-sm text-white">Direct Messages</span>
              </div>
            )}
          </div>
        </>
      )}

      <ScrollArea className="h-[calc(100svh-13.5rem)] px-2 py-3">
        {isGlobalMode ? (
          <div className="space-y-2 px-2">
            <p className="font-montserrat text-xs tracking-wide text-zinc-400">GLOBAL</p>
            <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 font-poppins text-sm text-zinc-100">
              Global
            </div>
          </div>
        ) : view === "server" ? (
          <div>
            <div className="mb-3 flex items-center justify-between px-2">
              <span className="font-montserrat text-xs tracking-wide text-zinc-400">MY SERVERS</span>
            </div>
            <ul className="space-y-1.5 pb-4">
              {servers.map((server) => (
                <li
                  key={server.id}
                  onClick={() => onSelectServer(server.id)}
                  className={`cursor-pointer rounded-lg px-3 py-2 font-poppins text-sm transition-all duration-300 ease-in-out ${
                    server.id === activeServerId
                      ? "border border-indigo-300/40 bg-indigo-500/15 text-indigo-100 shadow-[0_0_16px_rgba(99,102,241,0.35)]"
                      : "border border-transparent text-zinc-300 hover:border-white/10 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  {server.name}
                </li>
              ))}
            </ul>

            <div className="mb-3 mt-4 flex items-center justify-between px-2">
              <span className="font-montserrat text-xs tracking-wide text-zinc-400">TEXT CHANNELS</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setIsCreateChannelOpen((prev) => !prev);
                  setCreateChannelError(null);
                }}
                disabled={!activeServerId}
                className="size-6 rounded-md text-zinc-400 transition-all duration-300 ease-in-out hover:bg-white/10 hover:text-white"
                aria-label="Create Channel"
              >
                <Plus className="size-3.5" />
              </Button>
            </div>

            {isCreateChannelOpen ? (
              <div className="mb-3 rounded-lg border border-white/10 bg-black/45 p-2">
                <input
                  type="text"
                  value={newChannelName}
                  onChange={(event) => setNewChannelName(event.target.value)}
                  placeholder="New channel name"
                  className="h-8 w-full rounded-md border border-white/10 bg-black/40 px-2 font-poppins text-xs text-zinc-200 outline-none placeholder:text-zinc-500 focus:border-indigo-300/70"
                />
                <div className="mt-2 flex items-center justify-end gap-2">
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setIsCreateChannelOpen(false);
                      setNewChannelName("");
                      setCreateChannelError(null);
                    }}
                    className="h-7 rounded-md border border-white/10 px-2 font-montserrat text-xs text-zinc-300 hover:bg-white/10"
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={handleCreateChannelSubmit}
                    disabled={isCreatingChannel}
                    className="h-7 rounded-md border border-indigo-300/40 bg-indigo-500/15 px-2 font-montserrat text-xs text-indigo-100 hover:bg-indigo-500/25"
                  >
                    {isCreatingChannel ? "Creating..." : "Create"}
                  </Button>
                </div>
                {createChannelError ? (
                  <p className="mt-2 font-montserrat text-[11px] text-red-300">{createChannelError}</p>
                ) : null}
              </div>
            ) : null}

            <ul className="space-y-1.5">
              {channels.map((channel) => {
                const normalizedChannelName = normalizeChannelName(channel.name) || "channel";

                return (
                  <li
                    key={channel.id}
                    onClick={() => onSelectChannel(channel.id)}
                    className={`group cursor-pointer flex items-center gap-2 rounded-lg px-3 py-2 font-poppins text-sm transition-all duration-300 ease-in-out ${
                      channel.id === activeChannelId
                        ? "border border-cyan-300/40 bg-cyan-500/12 text-cyan-100 shadow-[0_0_16px_rgba(34,211,238,0.3)]"
                        : "border border-transparent text-zinc-300 hover:border-white/10 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    <Hash className="size-4" />
                    <span className="min-w-0 flex-1 truncate">#{normalizedChannelName}</span>
                    {channel.unreadCount && channel.unreadCount > 0 ? (
                      <span className="ml-1 shrink-0 rounded-full bg-red-500/80 px-1.5 py-0.5 text-[10px] font-bold text-white">
                        {channel.unreadCount}
                      </span>
                    ) : null}
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={(event) => {
                        event.stopPropagation();
                        setDeleteChannelError(null);
                        setPendingDeleteChannel({
                          id: channel.id,
                          name: normalizedChannelName
                        });
                      }}
                      disabled={deletingChannelId === channel.id}
                      className="size-6 rounded-md text-zinc-400 opacity-0 transition-all duration-300 ease-in-out hover:bg-red-500/15 hover:text-red-300 group-hover:opacity-100 disabled:cursor-not-allowed disabled:opacity-60"
                      aria-label={`Delete ${normalizedChannelName} channel`}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </li>
                );
              })}
            </ul>
          </div>
        ) : (
          <div>
            <div className="mb-3 rounded-lg border border-white/10 bg-black/45 p-2">
              <p className="px-1 pb-2 font-montserrat text-xs tracking-wide text-zinc-400">START DM</p>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={dmSearchUsername}
                  onChange={(event) => setDmSearchUsername(event.target.value)}
                  placeholder="Search by username"
                  className="h-8 w-full rounded-lg border border-white/10 bg-black/45 px-2 font-poppins text-xs text-zinc-200 outline-none placeholder:text-zinc-500 focus:border-indigo-300/70"
                />
                <Button
                  variant="ghost"
                  onClick={handleCreateDmByUsername}
                  disabled={isCreatingDm}
                  className="h-8 rounded-lg border border-white/10 bg-black/45 px-2 font-montserrat text-xs text-zinc-200 hover:bg-white/10"
                >
                  {isCreatingDm ? "..." : "Start"}
                </Button>
              </div>
              {dmSearchError ? (
                <p className="mt-2 font-montserrat text-[11px] text-red-300">{dmSearchError}</p>
              ) : null}
            </div>

            <div className="mb-2 flex items-center justify-between px-2">
              <span className="font-montserrat text-xs tracking-wide text-zinc-400">RECENT</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  void onCreateConversation();
                }}
                className="size-6 rounded-md text-zinc-400 transition-all duration-300 ease-in-out hover:bg-white/10 hover:text-white"
                aria-label="Start New DM"
              >
                <UserPlus className="size-3.5" />
              </Button>
            </div>
            <ul className="space-y-1">
              {conversations.map((dm) => (
                <li
                  key={dm.id}
                  onClick={() => onSelectConversation(dm.id)}
                  className={`flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 transition-all duration-300 ease-in-out ${
                    dm.id === activeConversationId
                      ? "border border-cyan-300/40 bg-cyan-500/12"
                      : "hover:bg-white/5"
                  }`}
                >
                  <div className="relative">
                    <Avatar className="size-8 border border-white/10">
                      <AvatarImage src="" alt={dm.name} />
                      <AvatarFallback className="font-montserrat bg-white/10 text-[11px] text-zinc-200">
                        {dm.name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span
                      className={`absolute right-0 bottom-0 h-2.5 w-2.5 rounded-full border border-black/80 ${
                        dm.isOnline ? "bg-emerald-400" : "bg-zinc-500"
                      }`}
                      title={dm.isOnline ? "Online" : "Offline"}
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-poppins text-sm text-zinc-100">{dm.name}</p>
                    <div className="flex items-center gap-2">
                      <p className="font-montserrat text-[11px] text-zinc-400">
                        {dm.unreadCount && dm.unreadCount > 0 ? `${dm.unreadCount} unread` : "Open"}
                      </p>
                      <span className="font-montserrat text-[11px] text-zinc-500">
                        {dm.isOnline ? "Online" : "Offline"}
                      </span>
                    </div>
                  </div>
                </li>
              ))}
              {conversations.length === 0 ? (
                <li className="rounded-lg px-3 py-2 font-montserrat text-xs text-zinc-500">No conversations yet.</li>
              ) : null}
            </ul>
          </div>
        )}
      </ScrollArea>

      {!isGlobalMode && view === "server" ? (
        <div className="border-t border-white/10 bg-black/40 p-3">
          <div className="rounded-xl border border-white/10 bg-white/5 p-2">
            <p className="px-1 pb-2 font-montserrat text-xs tracking-wide text-zinc-400">FIND SERVER</p>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search by server id"
                className="h-8 w-full rounded-lg border border-white/10 bg-black/45 px-2 font-poppins text-xs text-zinc-200 outline-none placeholder:text-zinc-500 focus:border-indigo-300/70"
              />
              <Button
                variant="ghost"
                onClick={handleSearchServer}
                disabled={isSearching}
                className="h-8 rounded-lg border border-white/10 bg-black/45 px-2 font-montserrat text-xs text-zinc-200 hover:bg-white/10"
              >
                {isSearching ? "..." : "Find"}
              </Button>
            </div>

            {searchResult ? (
              <div className="mt-2 rounded-lg border border-white/10 bg-black/45 p-2">
                <p className="font-poppins text-sm text-zinc-100">{searchResult.name}</p>
                <p className="font-montserrat text-[11px] text-zinc-500">ID: {searchResult.id}</p>
                <Button
                  variant="ghost"
                  onClick={handleJoinServer}
                  disabled={isJoining}
                  className="mt-2 h-8 rounded-lg border border-indigo-300/40 bg-indigo-500/15 px-2 font-montserrat text-xs text-indigo-100 hover:bg-indigo-500/25"
                >
                  {servers.some((server) => server.id === searchResult.id)
                    ? "Already Joined"
                    : isJoining
                      ? "Joining..."
                      : "Join Server"}
                </Button>
              </div>
            ) : null}

            {searchError ? (
              <p className="mt-2 font-montserrat text-[11px] text-red-300">{searchError}</p>
            ) : null}
          </div>
        </div>
      ) : null}

      <div className="mt-auto border-t border-white/10 bg-black/50 px-3 py-2">
       <div className="flex items-center justify-between gap-2">
          <div 
            className="flex min-w-0 items-center gap-2 cursor-pointer hover:bg-white/5 p-1 -ml-1 rounded-md transition-colors"
            onClick={() => router.push('/profile/me')}
          >
            <Avatar className="size-9 border border-white/15">
              <AvatarImage src={avatarUrl} alt={username} />
              <AvatarFallback className="font-montserrat bg-white/10 text-zinc-100">{initials}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="truncate font-poppins text-sm text-zinc-100">{username}</p>
              <p className="font-montserrat text-[11px] text-zinc-400">Connected</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="size-8 rounded-lg text-zinc-300 transition-all duration-300 ease-in-out hover:bg-white/10 hover:text-white"
              aria-label="User settings"
            >
              <Settings className="size-4" />
            </Button>
          </div>
        </div>
      </div>

      {pendingDeleteChannel ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-sm rounded-xl border border-white/15 bg-[#111214] p-4 shadow-2xl">
            <h3 className="font-tektur text-base text-white">Delete channel?</h3>
            <p className="mt-2 font-poppins text-sm text-zinc-300">
              This will delete #{pendingDeleteChannel.name} for everyone in this server.
            </p>
            {deleteChannelError ? (
              <p className="mt-2 font-montserrat text-[11px] text-red-300">{deleteChannelError}</p>
            ) : null}
            <div className="mt-4 flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  if (deletingChannelId !== pendingDeleteChannel.id) {
                    setPendingDeleteChannel(null);
                    setDeleteChannelError(null);
                  }
                }}
                className="h-8 rounded-md border border-white/10 px-3 font-montserrat text-xs text-zinc-300 hover:bg-white/10"
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  void handleConfirmDeleteChannel();
                }}
                disabled={deletingChannelId === pendingDeleteChannel.id}
                className="h-8 rounded-md border border-red-300/40 bg-red-500/15 px-3 font-montserrat text-xs text-red-100 hover:bg-red-500/25"
              >
                {deletingChannelId === pendingDeleteChannel.id ? "Deleting..." : "Delete"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </aside>
  );
}
