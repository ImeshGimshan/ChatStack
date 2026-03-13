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

export type ChatMessage = {
  id: string;
  channelId: string;
  senderId: string;
  content: string;
  isEncrypted: boolean;
  createdAt: string;
};

type ErrorBody = {
  Error?: string;
  error?: string;
  message?: string;
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
  isEncrypted: boolean;
  createdAt: string;
};

const CHAT_BASE_URL = process.env.NEXT_PUBLIC_CHAT_API || "http://localhost:3333";

async function parseError(response: Response, fallbackMessage: string): Promise<never> {
  let message = fallbackMessage;

  try {
    const body = (await response.json()) as ErrorBody;
    message = body.Error || body.error || body.message || message;
  } catch {
    // Keep fallback when response is not JSON.
  }

  throw new Error(message);
}

function authHeaders(token: string): HeadersInit {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`
  };
}

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
    isEncrypted: message.isEncrypted,
    createdAt: message.createdAt
  };
}

export async function getMyServers(token: string): Promise<ChatServer[]> {
  const [ownedResponse, memberResponse] = await Promise.all([
    fetch(`${CHAT_BASE_URL}/server/me`, {
      method: "GET",
      headers: authHeaders(token)
    }),
    fetch(`${CHAT_BASE_URL}/server/mine`, {
      method: "GET",
      headers: authHeaders(token)
    })
  ]);

  if (!ownedResponse.ok) {
    return parseError(ownedResponse, "Failed to fetch your servers.");
  }

  if (!memberResponse.ok) {
    return parseError(memberResponse, "Failed to fetch member servers.");
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
    headers: authHeaders(token),
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    return parseError(response, "Failed to create server.");
  }

  return normalizeServer((await response.json()) as RawServer);
}

export async function getServerById(token: string, serverId: string): Promise<ChatServer> {
  const response = await fetch(`${CHAT_BASE_URL}/server/${serverId}`, {
    method: "GET",
    headers: authHeaders(token)
  });

  if (!response.ok) {
    return parseError(response, "Server not found.");
  }

  return normalizeServer((await response.json()) as RawServer);
}

export async function joinServer(token: string, serverId: string): Promise<void> {
  const response = await fetch(`${CHAT_BASE_URL}/server/${serverId}/join`, {
    method: "POST",
    headers: authHeaders(token)
  });

  if (!response.ok) {
    return parseError(response, "Failed to join server.");
  }
}

export async function getServerChannels(token: string, serverId: string): Promise<ChatChannel[]> {
  const response = await fetch(`${CHAT_BASE_URL}/server/${serverId}/channels`, {
    method: "GET",
    headers: authHeaders(token)
  });

  if (!response.ok) {
    return parseError(response, "Failed to load channels.");
  }

  const channels = (await response.json()) as RawChannel[];
  return channels.map(normalizeChannel);
}

export async function createChannel(
  token: string,
  serverId: string,
  payload: { name: string; description?: string }
): Promise<ChatChannel> {
  const response = await fetch(`${CHAT_BASE_URL}/channels?serverId=${serverId}`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    return parseError(response, "Failed to create channel.");
  }

  return normalizeChannel((await response.json()) as RawChannel);
}

export async function deleteChannel(token: string, channelId: string): Promise<void> {
  const response = await fetch(`${CHAT_BASE_URL}/channels/${channelId}`, {
    method: "DELETE",
    headers: authHeaders(token)
  });

  if (!response.ok) {
    return parseError(response, "Failed to delete channel.");
  }
}

export async function getChannelMessages(
  token: string,
  channelId: string,
  limit = 50
): Promise<ChatMessage[]> {
  const response = await fetch(`${CHAT_BASE_URL}/channels/${channelId}/messages?limit=${limit}`, {
    method: "GET",
    headers: authHeaders(token)
  });

  if (!response.ok) {
    return parseError(response, "Failed to load channel messages.");
  }

  const messages = (await response.json()) as RawMessage[];
  return messages.map(normalizeMessage);
}
