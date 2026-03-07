"use client";
import { useEffect, useState } from "react";
import { channelService, Channel } from "@/services/channel.service";
import { useDefaultServer } from "@/hooks/useDefaultServer";
import { useAuth } from "@/context/AuthContext";

const storageKey = (userId: number) => `generalChannelId_${userId}`;

export function useGeneralChannel() {
  const { user } = useAuth();
  const { serverId, loading: serverLoading } = useDefaultServer();
  const [channel, setChannel] = useState<Channel | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    const key = storageKey(user.id);
    const stored = localStorage.getItem(key);
    if (stored) {
      try {
        setChannel(JSON.parse(stored));
        setLoading(false);
        return;
      } catch {
        localStorage.removeItem(key);
      }
    }

    const persist = (ch: Channel) => {
      localStorage.setItem(key, JSON.stringify(ch));
      setChannel(ch);
    };

    const tryViaServer = async () => {
      if (!serverId) return false;
      try {
        const channels = await channelService.getChannels(serverId);
        const general = channels.find((c) => c.name.toLowerCase() === "general");
        if (general) { persist(general); return true; }

        // No general channel yet — create one
        const newCh = await channelService.createChannel(serverId, "general", "General discussion");
        persist(newCh);
        return true;
      } catch {
        return false;
      }
    };

    const tryViaMembership = async () => {
      try {
        const channels = await channelService.getMyChannels();
        if (channels && channels.length > 0) {
          const general = channels.find((c) => c.name.toLowerCase() === "general") ?? channels[0];
          persist(general);
          return true;
        }
        return false;
      } catch {
        return false;
      }
    };

    const run = async () => {
      // Wait for server provisioning to settle (max 8s)
      let waited = 0;
      while (serverLoading && waited < 8000) {
        await new Promise((r) => setTimeout(r, 300));
        waited += 300;
      }

      if (await tryViaServer()) return;
      if (await tryViaMembership()) return;

      setError("Could not find or create a channel. Please refresh.");
    };

    run().finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, serverId]);

  return { channel, loading, error };
}
