"use client";

import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { useEffect, useMemo, useRef, useState } from "react";

const HEARTBEAT_INTERVAL_MS = 10_000;

export type RosterEntry = {
  clerkUserId: string;
  online: boolean;
  lastDisconnected: number;
  name?: string;
  avatarUrl?: string;
  typingConversationId?: Id<"conversations">;
  activeConversationId?: Id<"conversations">;
};

// Minted session id per tab. Survives re-renders unless refreshed
function useSessionId() {
  const ref = useRef<string | null>(null);
  if (ref.current === null) {
    ref.current =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : Math.random().toString(36).slice(2);
  }

  return ref.current;
}

// Create and set tokens
// Establish Convex heartbeat connection
export function usePresence(opts?: {
  enabled?: boolean;
  activeConversationId?: Id<"conversations"> | null;
  typingConversationId?: Id<"conversations"> | null;
}): {
  roster: RosterEntry[];
  onlineCount: number;
} {
  const enabled = opts?.enabled ?? true;
  const sessionId = useSessionId();
  const heartbeat = useMutation(api.presence.heartbeat);
  const disconnect = useMutation(api.presence.disconnect);

  const [roomToken, setRoomToken] = useState<string | null>(null);
  const sessionTokenRef = useRef<string | null>(null);

  const data = useMemo(() => {
    const d: {
      typingConversationId?: Id<"conversations">;
      activeConversationId?: Id<"conversations">;
    } = {};
    if (opts?.typingConversationId)
      d.typingConversationId = opts.typingConversationId;
    if (opts?.activeConversationId)
      d.activeConversationId = opts.activeConversationId;
    return d;
  }, [opts?.typingConversationId, opts?.activeConversationId]);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;

    // Create and store Tokens in Ref and State
    const ping = async () => {
      try {
        const tokens = await heartbeat({
          sessionId,
          interval: HEARTBEAT_INTERVAL_MS,
          data: Object.keys(data).length > 0 ? data : undefined,
        });

        if (cancelled) return;
        sessionTokenRef.current = tokens.sessionToken;

        setRoomToken(tokens.roomToken);
      } catch {}
    };

    void ping();
    const id = setInterval(() => void ping(), HEARTBEAT_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [enabled, heartbeat, sessionId, data]);

  // Best effort to disconnect token on tab redirect
  useEffect(() => {
    if (!enabled) return;
    const onLeave = () => {
      const token = sessionTokenRef.current;
      if (token) void disconnect({ sessionToken: token });
      window.addEventListener("beforeunload", onLeave);
    };
    return () => {
      window.removeEventListener("beforeunload", onLeave);
    };
  }, [enabled, disconnect]);

  const roster = useQuery(
    api.presence.list,
    enabled && roomToken ? { roomToken } : "skip",
  );

  const entries: RosterEntry[] = roster ?? [];
  const onlineCount = entries.filter((r) => r.online).length;

  return {
    roster: entries,
    onlineCount,
  };
}
