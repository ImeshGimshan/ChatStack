"use client";
import { useEffect, useState } from "react";
import { serverService } from "@/services/server.service";
import { useAuth } from "@/context/AuthContext";

const STORAGE_KEY = "defaultServerId";

/**
 * Auto-provisions one "home" server per authenticated user.
 * Stores the server ID in localStorage so we don't recreate it on every load.
 * Recovery chain on failure:
 *   1. Try createServer
 *   2. On any error → try GET /server/me (servers I own)
 *   3. On error → try GET /server/mine (servers I'm a member of)
 */
export function useDefaultServer() {
  const { user } = useAuth();
  const [serverId, setServerId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    // Use cached ID if available
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      setServerId(stored);
      setLoading(false);
      return;
    }

    const persist = (id: string) => {
      localStorage.setItem(STORAGE_KEY, id);
      setServerId(id);
    };

    // Step 1: Try to create a new server
    const serverName = `${user.username}-home-${user.id}`;
    serverService
      .createServer({ name: serverName, description: "My personal server" })
      .then((server) => persist(String(server.id)))
      .catch(async () => {
        // Step 2: Creation failed — try GET /server/me
        try {
          const owned = await serverService.getMyServers();
          if (owned?.length > 0) {
            persist(String(owned[0].id));
            return;
          }
        } catch { /* fall through */ }

        // Step 3: Try GET /server/mine (look up by membership)
        try {
          const member = await serverService.getServersByMember();
          if (member?.length > 0) {
            persist(String(member[0].id));
            return;
          }
        } catch { /* fall through */ }

        setError("Could not provision server. Please refresh.");
      })
      .finally(() => setLoading(false));
  }, [user]);

  return { serverId, loading, error };
}
