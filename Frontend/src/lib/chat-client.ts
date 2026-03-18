import { authJsonHeaders, jsonHeaders, parseApiError } from "@/lib/api-client";
import { getProfileByUserId } from "@/lib/auth-client";

export type ChatServer = {
  id: string;
  name: string;
  description?: string;
};

export type ChatChannel = {
  id: string;
  name: string;
  description?: string;
  serverId: string;
};

export type ChannelMember = {
  channelId: string;
  userId: string;
};

export type ChatMessage = {
  id: string;
  channelId: string;
  senderId: string;
  content: string;
  createdAt: string;
};

export type ChatConversation = {
  id: string;
  name?: string | null;
  isGroup?: boolean;
  memberIds?: string[];
};

export type ConversationMessage = {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  createdAt: string;
};

export type MessageReaction = {
  id: string;
  emoji: string;
  userId: string;
  createdAt?: string;
};

export type MessageReadReceipt = {
  id?: string;
  userId: string;
  messageId: string;
  readAt: string;
};

export type ChatUnreadSnapshot = {
  channels: unknown[];
  conversations: unknown[];
};



export type FeedPost = {
  id: string;
  serverId: string;
  authorId: string;
  content: string;
  imageId?: string | null;
  title: string;
  createdAt: string;
  updatedAt: string;
  likeCount?: number;
  hasLiked?: boolean;
  author?: {
    profile?: {
      displayName?: string;
    }
  } | null;
  comments?: FeedComment[];
};

export type FeedComment = {
  id: string;
  postId: string;
  authorId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  author?: {
    profile?: {
      displayName?: string;
    }
  } | null;
};

export type ConnectionStatus = "CONNECTED" | "OUTGOING_PENDING" | "INCOMING_PENDING" | "NONE";

export type ChatUser = {
  id: string;
  username: string;
  profile?: {
    displayName?: string;
    bio?: string;
    avatarUrl?: string;
  };
};

export type ConnectionRequest = {
  id: string;
  requesterId: string;
  receiverId: string;
  status: "PENDING" | "ACCEPTED" | "REJECTED";
  createdAt: string;
  requester?: ChatUser;
};

type RawServer = {
  id: string | number;
  name: string;
  description?: string;
};

type RawChannel = {
  id: string | number;
  name: string;
  description?: string;
  serverId: string | number;
};

type RawMessage = {
  id: string | number;
  channelId: string | number;
  senderId: string | number;
  content: string;
  createdAt: string;
};

type RawConversation = {
  id: string | number;
  name?: string | null;
  isGroup?: boolean;
  members?: Array<{
    userId: string | number;
  }>;
};

type RawConversationMessage = {
  id: string | number;
  conversationId: string | number;
  senderId: string | number;
  content: string;
  createdAt: string;
};

const CHAT_BASE_URL = process.env.NEXT_PUBLIC_CHAT_API || "http://localhost:3333";
const SOCIAL_BASE_URL = process.env.NEXT_PUBLIC_SOCIAL_API || "http://localhost:3334";

function normalizeServer(server: RawServer): ChatServer {
  return {
    id: String(server.id),
    name: server.name,
    description: server.description
  };
}

function normalizeChannel(channel: RawChannel): ChatChannel {
  return {
    id: String(channel.id),
    name: channel.name,
    description: channel.description,
    serverId: String(channel.serverId)
  };
}

function normalizeMessage(message: RawMessage): ChatMessage {
  return {
    id: String(message.id),
    channelId: String(message.channelId),
    senderId: String(message.senderId),
    content: message.content,
    createdAt: message.createdAt
  };
}

function normalizeConversation(conversation: RawConversation): ChatConversation {
  return {
    id: String(conversation.id),
    name: conversation.name,
    isGroup: conversation.isGroup,
    memberIds: Array.isArray(conversation.members)
      ? conversation.members.map((member) => String(member.userId))
      : []
  };
}

function normalizeConversationMessage(message: RawConversationMessage): ConversationMessage {
  return {
    id: String(message.id),
    conversationId: String(message.conversationId),
    senderId: String(message.senderId),
    content: message.content,
    createdAt: message.createdAt
  };
}

export async function getMyServers(token: string): Promise<ChatServer[]> {
  const [ownedResponse, memberResponse] = await Promise.all([
    fetch(`${CHAT_BASE_URL}/server/me`, {
      method: "GET",
      headers: authJsonHeaders(token)
    }),
    fetch(`${CHAT_BASE_URL}/server/mine`, {
      method: "GET",
      headers: authJsonHeaders(token)
    })
  ]);

  if (!ownedResponse.ok) {
    return parseApiError(ownedResponse, "Failed to fetch your servers.");
  }

  if (!memberResponse.ok) {
    return parseApiError(memberResponse, "Failed to fetch member servers.");
  }

  const owned = (await ownedResponse.json()) as RawServer[];
  const member = (await memberResponse.json()) as RawServer[];

  const mergedById = new Map<string, ChatServer>();
  [...owned, ...member].forEach((server) => {
    const normalized = normalizeServer(server);
    mergedById.set(normalized.id, normalized);
  });

  return Array.from(mergedById.values());
}

export async function createServer(
  token: string,
  payload: { name: string; description?: string }
): Promise<ChatServer> {
  const response = await fetch(`${CHAT_BASE_URL}/server`, {
    method: "POST",
    headers: authJsonHeaders(token),
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    return parseApiError(response, "Failed to create server.");
  }

  return normalizeServer((await response.json()) as RawServer);
}

export async function getServerById(token: string, serverId: string): Promise<ChatServer> {
  const response = await fetch(`${CHAT_BASE_URL}/server/${serverId}`, {
    method: "GET",
    headers: authJsonHeaders(token)
  });

  if (!response.ok) {
    return parseApiError(response, "Server not found.");
  }

  return normalizeServer((await response.json()) as RawServer);
}

export async function joinServer(token: string, serverId: string): Promise<void> {
  const response = await fetch(`${CHAT_BASE_URL}/server/${serverId}/join`, {
    method: "POST",
    headers: authJsonHeaders(token)
  });

  if (!response.ok) {
    return parseApiError(response, "Failed to join server.");
  }
}

export async function getServerChannels(token: string, serverId: string): Promise<ChatChannel[]> {
  const response = await fetch(`${CHAT_BASE_URL}/server/${serverId}/channels`, {
    method: "GET",
    headers: authJsonHeaders(token)
  });

  if (!response.ok) {
    return parseApiError(response, "Failed to load channels.");
  }

  const channels = (await response.json()) as RawChannel[];
  return channels.map(normalizeChannel);
}

export async function getChannelMembers(token: string, channelId: string): Promise<ChannelMember[]> {
  const response = await fetch(`${CHAT_BASE_URL}/channels/${channelId}/members`, {
    method: "GET",
    headers: authJsonHeaders(token)
  });

  if (!response.ok) {
    return parseApiError(response, "Failed to load channel members.");
  }

  const members = (await response.json()) as Array<{
    channelId: string | number;
    userId: string | number;
  }>;

  return members.map((member) => ({
    channelId: String(member.channelId),
    userId: String(member.userId)
  }));
}

export async function createChannel(
  token: string,
  serverId: string,
  payload: { name: string; description?: string }
): Promise<ChatChannel> {
  const response = await fetch(`${CHAT_BASE_URL}/channels?serverId=${serverId}`, {
    method: "POST",
    headers: authJsonHeaders(token),
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    return parseApiError(response, "Failed to create channel.");
  }

  return normalizeChannel((await response.json()) as RawChannel);
}

export async function deleteChannel(token: string, channelId: string): Promise<void> {
  const response = await fetch(`${CHAT_BASE_URL}/channels/${channelId}`, {
    method: "DELETE",
    headers: authJsonHeaders(token)
  });

  if (!response.ok) {
    return parseApiError(response, "Failed to delete channel.");
  }
}

export async function getChannelMessages(
  token: string,
  channelId: string,
  limit = 50
): Promise<ChatMessage[]> {
  const response = await fetch(`${CHAT_BASE_URL}/channels/${channelId}/messages?limit=${limit}`, {
    method: "GET",
    headers: authJsonHeaders(token)
  });

  if (!response.ok) {
    return parseApiError(response, "Failed to load channel messages.");
  }

  const messages = (await response.json()) as RawMessage[];
  return messages.map(normalizeMessage);
}

export async function sendChannelMessage(
  token: string,
  channelId: string,
  payload: { content: string }
): Promise<ChatMessage> {
  const response = await fetch(`${CHAT_BASE_URL}/channels/${channelId}/messages`, {
    method: "POST",
    headers: authJsonHeaders(token),
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    return parseApiError(response, "Failed to send channel message.");
  }

  return normalizeMessage((await response.json()) as RawMessage);
}

export async function editChannelMessage(
  token: string,
  channelId: string,
  messageId: string,
  newContent: string
): Promise<ChatMessage> {
  const response = await fetch(`${CHAT_BASE_URL}/channels/${channelId}/messages/${messageId}`, {
    method: "PATCH",
    headers: authJsonHeaders(token),
    body: JSON.stringify({ newContent })
  });

  if (!response.ok) {
    return parseApiError(response, "Failed to edit channel message.");
  }

  return normalizeMessage((await response.json()) as RawMessage);
}

export async function deleteChannelMessage(
  token: string,
  channelId: string,
  messageId: string
): Promise<void> {
  const response = await fetch(`${CHAT_BASE_URL}/channels/${channelId}/messages/${messageId}`, {
    method: "DELETE",
    headers: authJsonHeaders(token)
  });

  if (!response.ok) {
    return parseApiError(response, "Failed to delete channel message.");
  }
}

export async function getChannelUnreadCount(token: string, channelId: string): Promise<number> {
  const response = await fetch(`${CHAT_BASE_URL}/chat/channels/${channelId}/unread-count`, {
    method: "GET",
    headers: authJsonHeaders(token)
  });
  if (!response.ok) {
    return 0;
  }
  const data = (await response.json()) as { unreadCount?: number };
  return typeof data.unreadCount === "number" ? data.unreadCount : 0;
}

export async function markMessageRead(
  token: string,
  payload: { messageId: string; roomType: "channel" | "conversation" }
): Promise<void> {
  const response = await fetch(`${CHAT_BASE_URL}/chat/messages/read`, {
    method: "POST",
    headers: authJsonHeaders(token),
    body: JSON.stringify(payload)
  });
  if (!response.ok) {
    console.warn("Failed to mark messages as read");
  }
}

export async function getConversationUnreadCount(token: string, conversationId: string): Promise<number> {
  const response = await fetch(`${CHAT_BASE_URL}/chat/conversations/${conversationId}/unread-count`, {
    method: "GET",
    headers: authJsonHeaders(token)
  });

  if (!response.ok) {
    return 0;
  }

  const data = (await response.json()) as { unreadCount?: number };
  return typeof data.unreadCount === "number" ? data.unreadCount : 0;
}

export async function getUnreadMessages(token: string): Promise<ChatUnreadSnapshot> {
  const response = await fetch(`${CHAT_BASE_URL}/chat/unread-messages`, {
    method: "GET",
    headers: authJsonHeaders(token)
  });

  if (!response.ok) {
    return parseApiError(response, "Failed to fetch unread messages.");
  }

  return (await response.json()) as ChatUnreadSnapshot;
}

export async function getConversations(token: string): Promise<ChatConversation[]> {
  const response = await fetch(`${CHAT_BASE_URL}/conversation`, {
    method: "GET",
    headers: authJsonHeaders(token)
  });

  if (!response.ok) {
    return parseApiError(response, "Failed to load conversations.");
  }

  const conversations = (await response.json()) as RawConversation[];
  return conversations.map(normalizeConversation);
}

export async function createConversation(
  token: string,
  payload: { userIds: string[]; name?: string }
): Promise<ChatConversation> {
  const response = await fetch(`${CHAT_BASE_URL}/conversation`, {
    method: "POST",
    headers: authJsonHeaders(token),
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    return parseApiError(response, "Failed to create conversation.");
  }

  return normalizeConversation((await response.json()) as RawConversation);
}

export async function getConversationMessages(
  token: string,
  conversationId: string,
  limit = 50
): Promise<ConversationMessage[]> {
  const response = await fetch(`${CHAT_BASE_URL}/conversation/${conversationId}/messages?limit=${limit}`, {
    method: "GET",
    headers: authJsonHeaders(token)
  });

  if (!response.ok) {
    return parseApiError(response, "Failed to load conversation messages.");
  }

  const messages = (await response.json()) as RawConversationMessage[];
  // Backend returns conversation history newest-first; normalize to oldest-first for chat UI.
  return messages
    .map(normalizeConversationMessage)
    .sort((a, b) => {
      const byTime = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      if (byTime !== 0) {
        return byTime;
      }
      return Number(a.id) - Number(b.id);
    });
}

export async function sendConversationMessage(
  token: string,
  conversationId: string,
  payload: { content: string }
): Promise<ConversationMessage> {
  const response = await fetch(`${CHAT_BASE_URL}/conversation/${conversationId}/messages`, {
    method: "POST",
    headers: authJsonHeaders(token),
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    return parseApiError(response, "Failed to send conversation message.");
  }

  return normalizeConversationMessage((await response.json()) as RawConversationMessage);
}

export async function editConversationMessage(
  token: string,
  conversationId: string,
  messageId: string,
  newContent: string
): Promise<ConversationMessage> {
  const response = await fetch(`${CHAT_BASE_URL}/conversation/${conversationId}/messages/${messageId}`, {
    method: "PATCH",
    headers: authJsonHeaders(token),
    body: JSON.stringify({ newContent })
  });

  if (!response.ok) {
    return parseApiError(response, "Failed to edit conversation message.");
  }

  return normalizeConversationMessage((await response.json()) as RawConversationMessage);
}

export async function deleteConversationMessage(
  token: string,
  conversationId: string,
  messageId: string,
  requesterId: string
): Promise<void> {
  const response = await fetch(`${CHAT_BASE_URL}/conversation/${conversationId}/messages/${messageId}`, {
    method: "DELETE",
    headers: authJsonHeaders(token),
    body: JSON.stringify({ requesterId })
  });

  if (!response.ok) {
    return parseApiError(response, "Failed to delete conversation message.");
  }
}

export async function addChannelReaction(
  token: string,
  channelId: string,
  messageId: string,
  emoji: string
): Promise<void> {
  const response = await fetch(`${CHAT_BASE_URL}/channels/${channelId}/messages/${messageId}/reactions`, {
    method: "POST",
    headers: authJsonHeaders(token),
    body: JSON.stringify({ emoji })
  });

  if (!response.ok) {
    return parseApiError(response, "Failed to add reaction.");
  }
}

export async function removeChannelReaction(
  token: string,
  channelId: string,
  messageId: string,
  emoji: string
): Promise<void> {
  const response = await fetch(`${CHAT_BASE_URL}/channels/${channelId}/messages/${messageId}/reactions`, {
    method: "DELETE",
    headers: authJsonHeaders(token),
    body: JSON.stringify({ emoji })
  });

  if (!response.ok) {
    return parseApiError(response, "Failed to remove reaction.");
  }
}

export async function getChannelReactions(
  token: string,
  channelId: string,
  messageId: string
): Promise<MessageReaction[]> {
  const response = await fetch(`${CHAT_BASE_URL}/channels/${channelId}/messages/${messageId}/reactions`, {
    method: "GET",
    headers: authJsonHeaders(token)
  });

  if (!response.ok) {
    return parseApiError(response, "Failed to load reactions.");
  }

  const list = (await response.json()) as Array<{
    id: string | number;
    emoji: string;
    userId: string | number;
    createdAt?: string;
  }>;

  return list.map((item) => ({
    id: String(item.id),
    emoji: item.emoji,
    userId: String(item.userId),
    createdAt: item.createdAt
  }));
}

export async function addConversationReaction(
  token: string,
  conversationId: string,
  messageId: string,
  emoji: string
): Promise<void> {
  const response = await fetch(`${CHAT_BASE_URL}/conversation/${conversationId}/messages/${messageId}/reactions`, {
    method: "POST",
    headers: authJsonHeaders(token),
    body: JSON.stringify({ emoji })
  });

  if (!response.ok) {
    return parseApiError(response, "Failed to add reaction.");
  }
}

export async function removeConversationReaction(
  token: string,
  conversationId: string,
  messageId: string,
  emoji: string
): Promise<void> {
  const response = await fetch(`${CHAT_BASE_URL}/conversation/${conversationId}/messages/${messageId}/reactions`, {
    method: "DELETE",
    headers: authJsonHeaders(token),
    body: JSON.stringify({ emoji })
  });

  if (!response.ok) {
    return parseApiError(response, "Failed to remove reaction.");
  }
}

export async function getConversationReactions(
  token: string,
  conversationId: string,
  messageId: string
): Promise<MessageReaction[]> {
  const response = await fetch(`${CHAT_BASE_URL}/conversation/${conversationId}/messages/${messageId}/reactions`, {
    method: "GET",
    headers: authJsonHeaders(token)
  });

  if (!response.ok) {
    return parseApiError(response, "Failed to load reactions.");
  }

  const list = (await response.json()) as Array<{
    id: string | number;
    emoji: string;
    userId: string | number;
    createdAt?: string;
  }>;

  return list.map((item) => ({
    id: String(item.id),
    emoji: item.emoji,
    userId: String(item.userId),
    createdAt: item.createdAt
  }));
}

export async function getChannelReadReceipts(
  token: string,
  channelId: string,
  messageId: string
): Promise<MessageReadReceipt[]> {
  const response = await fetch(`${CHAT_BASE_URL}/chat/channels/${channelId}/messages/${messageId}/read-receipts`, {
    method: "GET",
    headers: authJsonHeaders(token)
  });

  if (!response.ok) {
    return parseApiError(response, "Failed to load channel read receipts.");
  }

  const list = (await response.json()) as Array<{
    id?: string | number;
    userId: string | number;
    messageId: string | number;
    readAt: string;
  }>;

  return list.map((item) => ({
    id: item.id ? String(item.id) : undefined,
    userId: String(item.userId),
    messageId: String(item.messageId),
    readAt: item.readAt
  }));
}

export async function getConversationReadReceipts(
  token: string,
  conversationId: string,
  messageId: string
): Promise<MessageReadReceipt[]> {
  const response = await fetch(
    `${CHAT_BASE_URL}/chat/conversations/${conversationId}/messages/${messageId}/read-receipts`,
    {
      method: "GET",
      headers: authJsonHeaders(token)
    }
  );

  if (!response.ok) {
    return parseApiError(response, "Failed to load conversation read receipts.");
  }

  const list = (await response.json()) as Array<{
    id?: string | number;
    userId: string | number;
    messageId: string | number;
    readAt: string;
  }>;

  return list.map((item) => ({
    id: item.id ? String(item.id) : undefined,
    userId: String(item.userId),
    messageId: String(item.messageId),
    readAt: item.readAt
  }));
}



export async function getFeedPosts(token?: string | null): Promise<FeedPost[]> {
  const headers = token ? authJsonHeaders(token) : jsonHeaders();
  const response = await fetch(`${CHAT_BASE_URL}/posts`, {
    method: "GET",
    headers
  });

  if (!response.ok) {
    return parseApiError(response, "Failed to load posts.");
  }

  const list = (await response.json()) as Array<{
    id: string | number;
    serverId?: string | number | null;
    authorId: string | number;
    content: string;
    imageId?: string | null;
    imageUrl?: string | null;
    title?: string | null;
    createdAt?: string;
    updatedAt?: string;
      likeCount?: number;
      hasLiked?: boolean;
      author?: unknown | null;
      comments?: FeedComment[];
    }>;

    return list.map((item) => ({
      id: String(item.id),
      serverId: item.serverId ? String(item.serverId) : "",
      authorId: String(item.authorId),
      content: item.content,
      imageId: item.imageId || item.imageUrl,
      title: item.title || "Untitled",
      createdAt: item.createdAt || new Date().toISOString(),
      updatedAt: item.updatedAt || new Date().toISOString(),
      likeCount: item.likeCount ?? 0,
      hasLiked: !!item.hasLiked,
      author: item.author as FeedPost["author"],
      comments: item.comments || []
    }));
  }

  export async function getPostById(postId: number | string, token?: string | null): Promise<FeedPost> {
  const headers = token ? authJsonHeaders(token) : jsonHeaders();
  const response = await fetch(`${CHAT_BASE_URL}/posts/${postId}`, {
    method: "GET",
    headers,
  });

  if (!response.ok) {
    return parseApiError(response, "Failed to load post.");
  }

  const item = (await response.json()) as FeedPost & { imageUrl?: string; likeCount?: number; hasLiked?: boolean };
  return {
    ...item,
    id: String(item.id),
    authorId: String(item.authorId),
    serverId: String((item as any).serverId || ""),
    imageId: item.imageId || item.imageUrl,
    likeCount: item.likeCount ?? 0,
    hasLiked: !!item.hasLiked,
    comments: Array.isArray(item.comments) ? item.comments.map(c => ({...c, id: String(c.id), authorId: String(c.authorId), postId: String(c.postId)})) : [],
  };
}

export async function createFeedPost(
  token: string,
  payload: { content: string; imageId?: string; title?: string; serverId?: string },
): Promise<FeedPost> {
  // Use /posts if no serverId (global/personal post)
  // Use /server/:id/posts as fallback/backward compat or specific endpoint if it exists
  // The new implementation uses c:\Users\imesh\OneDrive\Desktop\ChatStack\chat-service\src\post\post.controller.ts which is /posts
  const url = payload.serverId ? `${CHAT_BASE_URL}/server/${payload.serverId}/posts` : `${CHAT_BASE_URL}/posts`;
  
  const response = await fetch(url, {
    method: "POST",
    headers: authJsonHeaders(token),
    body: JSON.stringify({
      title: payload.title,
      content: payload.content,
      imageId: payload.imageId,
      serverId: payload.serverId
    }),
  });

  if (!response.ok) {
    return parseApiError(response, "Failed to create post.");
  }

  const item = (await response.json()) as FeedPost & { imageUrl?: string };
  return {
    ...item,
    id: String(item.id),
    serverId: String(item.serverId),
    authorId: String(item.authorId),
    imageId: item.imageId || item.imageUrl
  };
}

export async function updateFeedPost(
  token: string,
  postId: string,
  payload: Partial<{ content: string; imageId: string; title: string }>
): Promise<FeedPost> {
  const response = await fetch(`${CHAT_BASE_URL}/posts/${postId}`, {
    method: "PATCH",
    headers: authJsonHeaders(token),
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    return parseApiError(response, "Failed to update post.");
  }

  const item = (await response.json()) as FeedPost & { imageUrl?: string };
  return {
    ...item,
    id: String(item.id),
    serverId: String(item.serverId),
    authorId: String(item.authorId),
    imageId: item.imageId || item.imageUrl
  };
}

export async function deletePost(token: string, postId: number | string): Promise<void> {
  const response = await fetch(`${CHAT_BASE_URL}/posts/${postId}`, {
    method: "DELETE",
    headers: authJsonHeaders(token),
  });

  if (!response.ok) {
    return parseApiError(response, "Failed to delete post.");
  }
}

export async function getPostComments(postId: string): Promise<FeedComment[]> {
  const response = await fetch(`${CHAT_BASE_URL}/comments/post/${postId}`, {
    method: "GET",
    headers: jsonHeaders()
  });

  if (!response.ok) {
    return parseApiError(response, "Failed to load comments.");
  }

  const list = (await response.json()) as Array<{
    id: string | number;
    postId: string | number;
    authorId: string | number;
    content: string;
    createdAt?: string;
    updatedAt?: string;
    author?: unknown | null;
  }>;

  return list.map((item) => ({
    id: String(item.id),
    postId: String(item.postId),
    authorId: String(item.authorId),
    content: item.content,
    createdAt: item.createdAt || new Date().toISOString(),
    updatedAt: item.updatedAt || new Date().toISOString(),
    author: item.author as FeedComment["author"]
  }));
}

export async function createComment(
  token: string,
  payload: { postId: number | string; content: string },
): Promise<FeedComment> {
  const response = await fetch(`${CHAT_BASE_URL}/comments`, {
    method: "POST",
    headers: authJsonHeaders(token),
    body: JSON.stringify({ ...payload, postId: Number(payload.postId) }),
  });

  if (!response.ok) {
    return parseApiError(response, "Failed to create comment.");
  }

  const item = (await response.json()) as FeedComment;
  return {
    ...item,
    id: String(item.id),
    postId: String(item.postId),
    authorId: String(item.authorId),
  };
}

export async function updateComment(token: string, commentId: string, content: string): Promise<FeedComment> {
  const response = await fetch(`${CHAT_BASE_URL}/comments/${commentId}`, {
    method: "PATCH",
    headers: authJsonHeaders(token),
    body: JSON.stringify({ content })
  });

  if (!response.ok) {
    return parseApiError(response, "Failed to update comment.");
  }

  const item = (await response.json()) as FeedComment;
  return {
    ...item,
    id: String(item.id),
    postId: String(item.postId),
    authorId: String(item.authorId)
  };
}

export async function deleteComment(token: string, commentId: number | string): Promise<void> {
  const response = await fetch(`${CHAT_BASE_URL}/comments/${commentId}`, {
    method: "DELETE",
    headers: authJsonHeaders(token),
  });

  if (!response.ok) {
    return parseApiError(response, "Failed to delete comment.");
  }
}

// SOCIAL CONNECTIONS
export async function sendConnectionRequest(token: string, receiverId: string): Promise<void> {
  const response = await fetch(`${SOCIAL_BASE_URL}/api/connection/request/${receiverId}`, {
    method: "POST",
    headers: authJsonHeaders(token)
  });
  if (!response.ok) return parseApiError(response, "Failed to send connection request.");
}

export async function acceptConnectionRequest(token: string, requesterId: string): Promise<void> {
  const response = await fetch(`${SOCIAL_BASE_URL}/api/connection/${requesterId}/accept`, {
    method: "PATCH",
    headers: authJsonHeaders(token)
  });
  if (!response.ok) return parseApiError(response, "Failed to accept connection request.");
}

export async function removeConnection(token: string, otherUserId: string): Promise<void> {
  const response = await fetch(`${SOCIAL_BASE_URL}/api/connection/${otherUserId}/remove`, {
    method: "DELETE",
    headers: authJsonHeaders(token)
  });
  if (!response.ok) return parseApiError(response, "Failed to remove connection.");
}

export async function getMyConnections(token: string): Promise<ChatUser[]> {
  const response = await fetch(`${SOCIAL_BASE_URL}/api/connection/me`, {
    method: "GET",
    headers: authJsonHeaders(token)
  });
  if (!response.ok) return parseApiError(response, "Failed to load connections.");
  
  const rawUsers = (await response.json()) as { id: string }[];
  if (!rawUsers || rawUsers.length === 0) return [];
  
  const users = await Promise.all(
    rawUsers.map(async (u) => {
      try {
        const profile = await getProfileByUserId(token, u.id);
        return {
          id: String(u.id),
          username: profile.username || `User ${u.id}`,
          profile: {
            displayName: profile.username,
            avatarUrl: profile.avatarUrl
          }
        };
      } catch (err) {
        return {
          id: String(u.id),
          username: `User ${u.id}`
        };
      }
    })
  );
  return users;
}

export async function getPendingRequests(token: string): Promise<ConnectionRequest[]> {
  const response = await fetch(`${SOCIAL_BASE_URL}/api/connection/pending`, {
    method: "GET",
    headers: authJsonHeaders(token)
  });
  if (!response.ok) return parseApiError(response, "Failed to load pending requests.");
  
  const rawRequests = (await response.json()) as any[];
  if (!rawRequests || rawRequests.length === 0) return [];
  
  const requests = await Promise.all(
    rawRequests.map(async (req) => {
      try {
        const profile = await getProfileByUserId(token, req.requesterId);
        return {
          ...req,
          requester: {
            id: String(req.requesterId),
            username: profile.username || `User ${req.requesterId}`,
            profile: {
              displayName: profile.username,
              avatarUrl: profile.avatarUrl
            }
          }
        };
      } catch (err) {
        return {
          ...req,
          requester: {
            id: String(req.requesterId),
            username: `User ${req.requesterId}`
          }
        };
      }
    })
  );
  
  return requests;
}

export async function getConnectionStatus(token: string, otherUserId: string): Promise<ConnectionStatus> {
  const response = await fetch(`${SOCIAL_BASE_URL}/api/connection/status/${otherUserId}`, {
    method: "GET",
    headers: authJsonHeaders(token)
  });
  if (!response.ok) return "NONE";
  const data = await response.json();
  return (data.status || "NONE") as ConnectionStatus;
}
export async function toggleFeedPostLike(token: string, postId: string) { const response = await fetch(`${CHAT_BASE_URL}/posts/${postId}/like`, { method: 'POST', headers: authJsonHeaders(token) }); if (response.status !== 200 && response.status !== 201) throw new Error('Failed to toggle like'); return response.json(); }
