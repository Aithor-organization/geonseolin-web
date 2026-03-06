import { cn } from "@/lib/utils";

interface ChatBubbleProps {
  text: string;
  time: string;
  sender: "me" | "other";
}

export default function ChatBubble({ text, time, sender }: ChatBubbleProps) {
  const isMe = sender === "me";
  return (
    <div className={cn("flex", isMe ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[75%] px-4 py-2.5 rounded-2xl",
          isMe
            ? "bg-sage text-white rounded-br-sm"
            : "bg-white border border-muted text-dark rounded-bl-sm"
        )}
      >
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
