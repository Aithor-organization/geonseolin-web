import { cn } from "@/lib/utils";

interface ChatBubbleProps {
  text: string;
  time: string;
  sender: "me" | "other";
  isAiResponse?: boolean;
  escalated?: boolean;
}

export default function ChatBubble({ text, time, sender, isAiResponse, escalated }: ChatBubbleProps) {
  const isMe = sender === "me";
  return (
    <div className={cn("flex", isMe ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[75%] px-4 py-2.5 rounded-2xl",
          isMe
            ? "bg-sage text-white rounded-br-sm"
            : "bg-white border border-muted text-dark rounded-bl-sm",
          escalated && "border-terracotta/50"
        )}
      >
        {isAiResponse && (
          <span className="inline-block text-[10px] bg-sage/10 text-sage px-1.5 py-0.5 rounded-full mb-1 font-medium">
            AI {escalated ? "- 담당자 연결 필요" : "자동응답"}
          </span>
        )}
        <p className="text-sm leading-relaxed">{text}</p>
        <p
          className={cn(
            "text-[10px] mt-1",
            isMe ? "text-white/70 text-right" : "text-gray-500"
          )}
        >
          {time}
        </p>
      </div>
    </div>
  );
}
