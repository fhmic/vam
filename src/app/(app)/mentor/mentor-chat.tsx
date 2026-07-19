"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { MessageBubble } from "@/components/chat/message-bubble";
import { MessageFeedback } from "@/components/chat/message-feedback";
import { VoiceGenderToggle } from "@/components/voice/voice-gender-toggle";
import { useVoiceRecorder } from "@/hooks/use-voice-recorder";
import { createClient } from "@/lib/supabase/client";
import { getMentorAvatar } from "@/lib/avatar/registry";
import { WaveformBars } from "@/components/waveform/waveform-bars";
import type { UserPreferences } from "@/types/database";

interface ChatMessage {
  role: "user" | "mentor";
  content: string;
  id?: string;
}

export function MentorChat(props: {
  mentorSlug: string | null;
  mentorName: string;
  mentorTagline: string | null;
  initialSessionId: string | null;
  initialHistory: ChatMessage[];
  initialVoiceGender: UserPreferences["voice_gender"];
  voiceEnabled: boolean;
}) {
  const Avatar = getMentorAvatar(props.mentorSlug);
  const supabase = createClient();
  const [sessionId, setSessionId] = useState(props.initialSessionId);
  const [messages, setMessages] = useState<ChatMessage[]>(props.initialHistory);
  const [draft, setDraft] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const recorder = useVoiceRecorder();

  async function send(text: string, inputMode: "text" | "voice") {
    if (!text.trim() || isSending) return;
    setIsSending(true);
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setDraft("");

    let mentorReply = "";
    setMessages((prev) => [...prev, { role: "mentor", content: "" }]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, message: text, inputMode }),
      });

      const newSessionId = res.headers.get("X-Session-Id");
      if (newSessionId) setSessionId(newSessionId);

      if (!res.ok || !res.body) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error?.message ?? "The mentor is temporarily unavailable.");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith("data:")) continue;
          const payload = trimmed.slice("data:".length).trim();
          if (payload === "[DONE]") continue;
          try {
            const json = JSON.parse(payload);
            const delta: string | undefined = json?.choices?.[0]?.delta?.content;
            if (delta) {
              mentorReply += delta;
              setMessages((prev) => {
                const next = [...prev];
                next[next.length - 1] = { role: "mentor", content: mentorReply };
                return next;
              });
            }
          } catch {
            // Ignore malformed SSE chunks.
          }
        }
      }

      if (props.voiceEnabled && mentorReply) {
        void playMentorReply(mentorReply);
      }

      void attachMentorMessageId(sessionId ?? newSessionId);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong.";
      setMessages((prev) => {
        const next = [...prev];
        next[next.length - 1] = { role: "mentor", content: `(${message})` };
        return next;
      });
    } finally {
      setIsSending(false);
    }
  }

  async function attachMentorMessageId(activeSessionId: string | null) {
    if (!activeSessionId) return;
    // persistFullReply (server-side) writes the mentor message
    // asynchronously after this response stream ends, so there's an
    // inherent small race — retry once after a short delay rather than
    // failing silently on the first miss.
    for (const delayMs of [400, 1200]) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
      const { data } = await supabase
        .from("messages")
        .select("id")
        .eq("session_id", activeSessionId)
        .eq("role", "mentor")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (data?.id) {
        setMessages((prev) => {
          const next = [...prev];
          const lastIndex = next.length - 1;
          if (next[lastIndex] && next[lastIndex].role === "mentor" && !next[lastIndex].id) {
            next[lastIndex] = { ...next[lastIndex], id: data.id };
          }
          return next;
        });
        return;
      }
    }
  }

  async function playMentorReply(text: string) {
    try {
      const res = await fetch("/api/voice/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) return;
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      if (audioRef.current) {
        audioRef.current.src = url;
        await audioRef.current.play().catch(() => undefined);
      }
    } catch {
      // Voice playback is additive — a failure here should not disrupt
      // the text conversation already shown.
    }
  }

  async function handleMicClick() {
    setVoiceError(null);
    if (recorder.state === "idle") {
      await recorder.start();
      if (recorder.error) setVoiceError(recorder.error);
      return;
    }
    if (recorder.state === "recording") {
      const blob = await recorder.stop();
      if (!blob) return;

      const form = new FormData();
      form.append("audio", blob, "voice-note.webm");
      const res = await fetch("/api/voice/stt", { method: "POST", body: form });
      if (!res.ok) {
        setVoiceError("Could not transcribe that. Please try typing instead.");
        return;
      }
      const { transcript } = await res.json();
      if (transcript) {
        void send(transcript, "voice");
      }
    }
  }

  return (
    <div className="flex h-[calc(100vh-9rem)] flex-col">
      <div className="mb-4 flex items-center justify-between border-b border-ink/10 dark:border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-12 w-12 shrink-0" />
          <div>
            <h1 className="font-display text-xl font-medium text-ink dark:text-white">{props.mentorName}</h1>
            {props.mentorTagline ? <p className="text-sm text-ink/60 dark:text-white/60">{props.mentorTagline}</p> : null}
            <WaveformBars active={isSending} className="mt-1 h-3" />
          </div>
        </div>
        <VoiceGenderToggle initialValue={props.initialVoiceGender} />
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto py-2">
        {messages.length === 0 ? (
          <p className="text-sm text-ink/40 dark:text-white/40">Say hello to start your first conversation.</p>
        ) : (
        messages.map((m, i) => (
          <div key={i}>
            <MessageBubble role={m.role} content={m.content} />
            {m.role === "mentor" && m.id ? (
              <div className="pl-1">
                <MessageFeedback messageId={m.id} />
              </div>
            ) : null}
          </div>
        ))
        )}
      </div>

      {voiceError ? <p className="mb-2 text-xs text-red-600">{voiceError}</p> : null}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void send(draft, "text");
        }}
        className="flex items-end gap-2 border-t border-ink/10 dark:border-white/10 pt-4"
      >
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void send(draft, "text");
            }
          }}
          rows={1}
          placeholder="Type a message…"
          className="min-h-11 flex-1 resize-none rounded-xl border border-ink/10 dark:border-white/10 px-3 py-2.5 text-sm
            outline-none focus:border-signal-500 focus:ring-2 focus:ring-signal-500/30"
        />
        <Button
          type="button"
          variant={recorder.state === "recording" ? "primary" : "secondary"}
          onClick={handleMicClick}
        >
          {recorder.state === "recording" ? "Stop" : "🎙"}
        </Button>
        <Button type="submit" isLoading={isSending}>
          Send
        </Button>
      </form>

      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
      <audio ref={audioRef} className="hidden" />
    </div>
  );
}
