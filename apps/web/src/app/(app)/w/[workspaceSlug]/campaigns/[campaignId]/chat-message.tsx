"use client";

import { cn } from "@/lib/utils";
import { User, Sparkles } from "lucide-react";

type TextPart = { type: "text"; content: string };
type ImagePart = { type: "image"; data: string; mimeType: string };
export type MessagePart = TextPart | ImagePart;

export type Message = {
  id: string;
  role: "user" | "assistant";
  parts: MessagePart[];
  createdAt: string;
};

type Props = {
  message: Message;
};

export function ChatMessage({ message }: Props) {
  const isUser = message.role === "user";

  return (
    <div
      className={cn(
        "flex gap-3",
        isUser ? "flex-row-reverse" : "flex-row"
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
          isUser ? "bg-primary" : "bg-muted"
        )}
      >
        {isUser ? (
          <User className="h-4 w-4 text-primary-foreground" />
        ) : (
          <Sparkles className="h-4 w-4 text-muted-foreground" />
        )}
      </div>

      {/* Content — render parts in order */}
      <div
        className={cn(
          "max-w-[85%] space-y-2",
          isUser ? "items-end" : "items-start"
        )}
      >
        {message.parts.map((part, i) => {
          if (part.type === "text" && part.content) {
            return (
              <div
                key={i}
                className={cn(
                  "rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                  isUser
                    ? "rounded-tr-sm bg-primary text-primary-foreground"
                    : "rounded-tl-sm bg-muted/50"
                )}
              >
                <MessageContent content={part.content} />
              </div>
            );
          }
          if (part.type === "image") {
            return (
              <div
                key={i}
                className="overflow-hidden rounded-xl border bg-muted/30"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`data:${part.mimeType};base64,${part.data}`}
                  alt={`Generated concept ${i + 1}`}
                  className="max-h-80 max-w-full object-contain"
                />
              </div>
            );
          }
          return null;
        })}
      </div>
    </div>
  );
}

function MessageContent({ content }: { content: string }) {
  const lines = content.split("\n");

  return (
    <div className="space-y-1">
      {lines.map((line, i) => {
        const trimmed = line.trim();
        if (!trimmed) return <br key={i} />;

        // Simple markdown: bold
        const rendered = trimmed
          .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
          .replace(/\*(.*?)\*/g, "<em>$1</em>");

        // Headings
        if (trimmed.startsWith("### ")) {
          return (
            <p key={i} className="font-semibold mt-2">
              {trimmed.slice(4)}
            </p>
          );
        }
        if (trimmed.startsWith("## ")) {
          return (
            <p key={i} className="font-semibold mt-2">
              {trimmed.slice(3)}
            </p>
          );
        }

        // List items
        if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
          return (
            <p
              key={i}
              className="pl-3"
              dangerouslySetInnerHTML={{
                __html: `&bull; ${rendered.slice(2)}`,
              }}
            />
          );
        }

        return (
          <p
            key={i}
            dangerouslySetInnerHTML={{ __html: rendered }}
          />
        );
      })}
    </div>
  );
}
