"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface ChatRoomRow {
  id: string;
  created_at: string;
  other_user: {
    id: string;
    name: string;
    avatar_url: string | null;
  };
  last_message: string | null;
  last_message_at: string | null;
  unread_count: number;
}

export interface MessageRow {
  id: string;
  room_id: string;
  sender_id: string;
  text: string;
  created_at: string;
  is_ai_response?: boolean;
  ai_confidence?: number;
  escalated?: boolean;
}

export function useChatRooms() {
  const { user } = useAuth();
  const [rooms, setRooms] = useState<ChatRoomRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!user) return;
    const res = await window.fetch("/api/chat/rooms");
    if (res.ok) {
      const data = await res.json();
      setRooms(data ?? []);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  const createRoom = async (otherUserId: string) => {
    const res = await window.fetch("/api/chat/rooms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ target_user_id: otherUserId }),
    });
    if (res.ok) {
      const data = await res.json();
      await fetch();
      return data.room_id;
    }
    return null;
  };

  return { rooms, loading, refetch: fetch, createRoom };
}

export function useChatMessages(roomId: string | null) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [loading, setLoading] = useState(true);
  const channelRef = useRef<ReturnType<ReturnType<typeof getSupabaseBrowserClient>["channel"]> | null>(null);

  // 메시지 불러오기
  const fetchMessages = useCallback(async () => {
    if (!roomId) return;
    const res = await window.fetch(`/api/chat/rooms/${roomId}/messages`);
    if (res.ok) {
      const data = await res.json();
      setMessages(data.messages ?? []);
    }
    setLoading(false);
  }, [roomId]);

  // 실시간 구독
  useEffect(() => {
    if (!roomId || !user) return;

    fetchMessages();

    const supabase = getSupabaseBrowserClient();
    const channel = supabase
      .channel(`room:${roomId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          const newMsg = payload.new as MessageRow;
          setMessages((prev) => [...prev, newMsg]);
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, user]);

  // 메시지 전송
  const sendMessage = async (text: string) => {
    if (!roomId || !text.trim()) return;
    const res = await window.fetch(`/api/chat/rooms/${roomId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    return res.ok;
  };

  return {
    messages,
    loading,
    sendMessage,
    currentUserId: user?.id ?? null,
  };
}
