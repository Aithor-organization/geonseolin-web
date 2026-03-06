"use client";

import { useState } from "react";
import Avatar from "@/components/ui/Avatar";
import Badge from "@/components/ui/Badge";
import ChatBubble from "@/components/features/ChatBubble";
import { useChatRooms, useChatMessages } from "@/lib/hooks/use-chat";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

export default function ChatPage() {
  const { user } = useAuth();
  const { rooms, loading: roomsLoading } = useChatRooms();
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);

  const activeRoomId = selectedRoomId ?? rooms[0]?.id ?? null;
  const { messages, sendMessage, loading: msgsLoading } = useChatMessages(activeRoomId);
  const [input, setInput] = useState("");

  const activeRoom = rooms.find((r) => r.id === activeRoomId);

  const handleSend = () => {
    if (!input.trim()) return;
    sendMessage(input.trim());
    setInput("");
  };

  if (roomsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500 animate-pulse">로딩 중...</p>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-64px)] bg-parchment">
      {/* 채팅 목록 */}
      <div className="w-full md:w-80 border-r border-muted bg-white flex flex-col">
        <div className="p-4 border-b border-muted">
          <h1 className="font-heading text-lg font-bold text-dark">메시지</h1>
        </div>
        <div className="flex-1 overflow-y-auto">
          {rooms.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <span className="text-3xl block mb-2">💬</span>
              <p className="text-sm">채팅방이 없습니다</p>
            </div>
          )}
          {rooms.map((r) => (
            <button
              key={r.id}
              onClick={() => setSelectedRoomId(r.id)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors text-left cursor-pointer",
                activeRoomId === r.id && "bg-sage/5"
              )}
            >
              <Avatar emoji="👷" size="md" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-dark truncate">{r.other_user?.name ?? "상대방"}</span>
                  <span className="text-[10px] text-gray-500 shrink-0">{r.last_message_at ? new Date(r.last_message_at).toLocaleDateString("ko-KR") : ""}</span>
                </div>
                <p className="text-xs text-gray-500 truncate mt-0.5">{r.last_message ?? ""}</p>
              </div>
              {(r.unread_count ?? 0) > 0 && <Badge variant="terracotta">{r.unread_count}</Badge>}
            </button>
          ))}
        </div>
      </div>

      {/* 대화 영역 */}
      <div className="hidden md:flex flex-1 flex-col">
        {activeRoom ? (
          <>
            <div className="flex items-center gap-3 p-4 border-b border-muted bg-white">
              <Avatar emoji="👷" size="sm" />
              <div>
                <p className="text-sm font-semibold text-dark">{activeRoom.other_user?.name ?? "상대방"}</p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
              {msgsLoading ? (
                <p className="text-center py-8 text-gray-400 animate-pulse">메시지 로딩 중...</p>
              ) : (
                messages.map((msg) => (
                  <ChatBubble
                    key={msg.id}
                    text={msg.text}
                    time={new Date(msg.created_at).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })}
                    sender={msg.sender_id === user?.id ? "me" : "other"}
                  />
                ))
              )}
              {!msgsLoading && messages.length === 0 && (
                <div className="text-center text-gray-500 py-12">
                  <span className="text-4xl block mb-2">💬</span>
                  <p className="text-sm">대화를 시작해보세요</p>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-muted bg-white">
              <div className="flex gap-2">
                <input
                  className="flex-1 px-4 py-3 rounded-full border border-muted bg-parchment text-sm text-dark placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-sage/40"
                  placeholder="메시지를 입력하세요..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                />
                <button
                  onClick={handleSend}
                  className="w-11 h-11 flex items-center justify-center rounded-full bg-sage text-white hover:bg-sage-dark transition-colors cursor-pointer"
                >
                  ➤
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <span className="text-5xl block mb-3">💬</span>
              <p>채팅방을 선택하세요</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
