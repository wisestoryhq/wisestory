"use client";

import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { User, Sparkles, X } from "lucide-react";

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

function ImageLightbox({
  src,
  alt,
  onClose,
}: {
  src: string;
  alt: string;
  onClose: () => void;
}) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white/80 transition-colors hover:bg-white/20 hover:text-white"
      >
        <X className="h-4 w-4" />
      </button>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        className="max-h-[90vh] max-w-[90vw] rounded-lg object-contain"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
}

export function ChatMessage({ message }: Props) {
  const isUser = message.role === "user";
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);

  return (
    <>
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
              const src = `data:${part.mimeType};base64,${part.data}`;
              return (
                <div key={i} className="flex justify-center">
                  <button
                    onClick={() => setLightboxSrc(src)}
                    className="overflow-hidden rounded-xl border bg-muted/30 transition-transform hover:scale-[1.02] cursor-zoom-in"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={src}
                      alt={`Generated concept ${i + 1}`}
                      className="h-48 w-auto object-contain"
                    />
                  </button>
                </div>
              );
            }
            return null;
          })}
        </div>
      </div>

      {lightboxSrc && (
        <ImageLightbox
          src={lightboxSrc}
          alt="Generated concept"
          onClose={() => setLightboxSrc(null)}
        />
      )}
    </>
  );
}

function MessageContent({ content }: { content: string }) {
  const lines = content.split("\n");

  return (
    <div className="space-y-1">
      {lines.map((line, i) => {
        const trimmed = line.trim();
        if (!trimmed) return <br key={i} />;

        const rendered = trimmed
          .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
          .replace(/\*(.*?)\*/g, "<em>$1</em>");

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
