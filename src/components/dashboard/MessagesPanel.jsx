const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useEffect, useRef, useState } from "react";
import { Send, ArrowLeft, MessagesSquare, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { useSession } from "@/lib/permissions";
import { sendThreadMessage } from "@/lib/messaging";
import { cn } from "@/lib/utils";

function relative(value) {
  if (!value) return "";
  const diff = Date.now() - new Date(value).getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return new Date(value).toLocaleDateString();
}

export default function MessagesPanel({ role = "student" }) {
  const { user, email } = useSession();
  const { toast } = useToast();
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const endRef = useRef(null);

  const loadThreads = () => {
    if (!email) return;
    setLoading(true);
    db.entities.Thread.filter({ participant_emails: email }, { sort: "-last_message_at", limit: 50 })
      .then((page) => setThreads(page.items || []))
      .catch(() => setThreads([]))
      .finally(() => setLoading(false));
  };

  useEffect(loadThreads, [email]);

  const active = threads.find((t) => t.id === activeId) || null;

  useEffect(() => {
    if (!activeId) return;
    let mounted = true;
    setLoadingMessages(true);
    db.entities.Message.filter({ thread_id: activeId }, { sort: "created_date", limit: 200 })
      .then((page) => mounted && setMessages(page.items || []))
      .finally(() => mounted && setLoadingMessages(false));
    return () => {
      mounted = false;
    };
  }, [activeId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages]);

  const send = async () => {
    if (!active || !draft.trim()) return;
    setSending(true);
    try {
      const message = await sendThreadMessage({
        thread: active,
        sender: { email, name: user?.full_name || email },
        content: draft,
      });
      setMessages((prev) => [...prev, message]);
      setDraft("");
      setThreads((prev) =>
        prev.map((t) =>
          t.id === active.id
            ? { ...t, last_message_at: message.created_date, last_message_preview: message.content.slice(0, 140) }
            : t
        )
      );
    } catch (error) {
      toast({ title: "Message not sent", description: error.message, variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return <div className="h-64 animate-pulse rounded-2xl bg-secondary" />;
  }

  if (!threads.length) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
        <MessagesSquare className="mx-auto h-8 w-8 text-muted-foreground" />
        <p className="mt-3 font-semibold">No conversations yet</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {role === "student"
            ? "Open a school profile and use “Message admissions” to start a thread."
            : "Families who message your admissions team will appear here."}
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-[280px_1fr]">
      <div className={cn("space-y-2", activeId && "hidden md:block")}>
        {threads.map((thread) => {
          const unread = role === "student" ? thread.student_unread : thread.admin_unread;
          return (
            <button
              key={thread.id}
              type="button"
              onClick={() => setActiveId(thread.id)}
              className={cn(
                "w-full rounded-xl border p-3 text-left transition",
                activeId === thread.id ? "border-primary bg-primary/5" : "border-border bg-card hover:border-primary/40"
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-sm font-semibold">
                  {role === "student" ? thread.school_name : thread.student_name || thread.student_email}
                </span>
                {unread > 0 && (
                  <span className="shrink-0 rounded-full bg-accent px-1.5 text-[10px] font-bold text-accent-foreground">
                    {unread}
                  </span>
                )}
              </div>
              <p className="mt-1 truncate text-xs text-muted-foreground">{thread.last_message_preview}</p>
              <p className="mt-1 text-[10px] uppercase tracking-wide text-muted-foreground">
                {relative(thread.last_message_at)}
              </p>
            </button>
          );
        })}
      </div>

      <div className="rounded-2xl border border-border bg-card">
        {!active ? (
          <div className="grid h-full min-h-[240px] place-items-center p-8 text-center text-sm text-muted-foreground">
            Select a conversation to read the thread.
          </div>
        ) : (
          <div className="flex h-full max-h-[560px] flex-col">
            <div className="flex items-center gap-2 border-b border-border/70 p-4">
              <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setActiveId(null)}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="min-w-0">
                <p className="truncate font-semibold">
                  {role === "student" ? active.school_name : active.student_name || active.student_email}
                </p>
                <p className="truncate text-xs text-muted-foreground">{active.subject}</p>
              </div>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto p-4">
              {loadingMessages ? (
                <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
              ) : (
                messages.map((message) => {
                  const mine = message.sender_email === email;
                  return (
                    <div key={message.id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
                      <div
                        className={cn(
                          "max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm",
                          mine ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
                        )}
                      >
                        <p className="whitespace-pre-line">{message.content}</p>
                        <p className={cn("mt-1 text-[10px]", mine ? "text-primary-foreground/70" : "text-muted-foreground")}>
                          {message.sender_name} · {relative(message.created_date)}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={endRef} />
            </div>

            <div className="border-t border-border/70 p-3">
              <div className="flex items-end gap-2">
                <Textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      send();
                    }
                  }}
                  rows={2}
                  maxLength={4000}
                  placeholder="Write a message…"
                  className="flex-1 resize-none"
                />
                <Button onClick={send} disabled={sending || !draft.trim()} size="icon" className="h-10 w-10 shrink-0">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              <p className="mt-1.5 text-[10px] text-muted-foreground">
                Rate limited to 6 messages a minute. Never share sensitive documents here.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}