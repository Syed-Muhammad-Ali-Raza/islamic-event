"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { useTranslation } from "react-i18next";
import { MapPin, MessageCircle, RotateCcw, Send, X, Loader2 } from "lucide-react";
import { useCities } from "@/hooks/useCities";
import { eventService } from "@/services/event.service";
import {
  planAssistantMessage,
  type AssistantEventQuery,
  type FaqTopic,
} from "@/lib/assistant";
import type { EventSummary } from "@/types";

interface UserMessage {
  id: string;
  role: "user";
  text: string;
}

interface AssistantMessage {
  id: string;
  role: "assistant";
  /** i18n key for answers fixed by the assistant (translated at render time). */
  key?: string;
  text?: string;
  faq?: FaqTopic;
  events?: EventSummary[];
  loading?: boolean;
  failed?: boolean;
}

type ChatMessage = UserMessage | AssistantMessage;

const FAQ_KEYS: Record<FaqTopic, { text: string; cta: string; href: string }> = {
  register: { text: "assistant.faqRegisterText", cta: "assistant.faqRegisterCta", href: "/register" },
  rsvp: { text: "assistant.faqRsvpText", cta: "assistant.faqRsvpCta", href: "/events" },
  verify: { text: "assistant.faqVerifyText", cta: "assistant.faqVerifyCta", href: "/verify-email" },
  password: { text: "assistant.faqPasswordText", cta: "assistant.faqPasswordCta", href: "/forgot-password" },
  create: { text: "assistant.faqCreateText", cta: "assistant.faqCreateCta", href: "/events/create" },
  report: { text: "assistant.faqReportText", cta: "assistant.faqReportCta", href: "/events" },
  directories: { text: "assistant.faqDirectoriesText", cta: "assistant.faqDirectoriesCta", href: "/dastarkhwan" },
  saved: { text: "assistant.faqSavedText", cta: "assistant.faqSavedCta", href: "/saved" },
};

const QUICK_REPLIES = [
  "assistant.quickEvents",
  "assistant.quickRegister",
  "assistant.quickRsvp",
  "assistant.quickReport",
] as const;

function eventRange(event: EventSummary): string {
  const start = format(new Date(event.date), "d MMM");
  if (!event.endDate) return start;
  return `${start} – ${format(new Date(event.endDate), "d MMM")}`;
}

/**
 * Floating, rule-based community assistant.
 *
 * FAQ answers are static and cost nothing. Event lookups reuse the existing
 * `/events` endpoint through React Query, so an identical question is served
 * from cache instead of hitting the API again.
 */
export function CommunityAssistant() {
  const { t } = useTranslation();
  const pathname = usePathname();
  const { data: cities } = useCities();

  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [filters, setFilters] = useState<AssistantEventQuery | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const nextId = useRef(0);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const endRef = useRef<HTMLDivElement | null>(null);
  const previousPath = useRef(pathname);

  const { data, isFetching, isError } = useQuery({
    queryKey: ["assistant", "events", filters],
    queryFn: () => eventService.listEvents({ ...(filters ?? {}), limit: 5 }),
    enabled: filters !== null,
    staleTime: 300_000,
    gcTime: 1_800_000,
  });

  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  useEffect(() => {
    if (open) endRef.current?.scrollIntoView({ block: "end" });
  }, [messages, open]);

  // The widget lives in the root layout, so it survives navigation. Close it
  // after a link inside a message actually navigates (not on click, which
  // would unmount the Link before Next.js can follow it).
  useEffect(() => {
    if (pathname !== previousPath.current) {
      previousPath.current = pathname;
      setOpen(false);
    }
  }, [pathname]);

  useEffect(() => {
    if (!pendingId || isFetching) return;
    setMessages((previous) =>
      previous.map((message) =>
        message.id === pendingId && message.role === "assistant"
          ? {
              ...message,
              events: isError ? [] : (data?.data ?? []),
              failed: isError,
              loading: false,
            }
          : message
      )
    );
    setPendingId(null);
  }, [data, isFetching, isError, pendingId]);

  const id = () => `assistant-msg-${++nextId.current}`;

  const send = (raw: string) => {
    const text = raw.trim();
    if (!text) return;

    // Finalise an older pending answer so it cannot be filled by the new query.
    setMessages((previous) => [
      ...previous.map((message) =>
        message.role === "assistant" && message.loading
          ? { ...message, loading: false }
          : message
      ),
      { id: id(), role: "user", text },
    ]);
    setInput("");

    const plan = planAssistantMessage(text, cities ?? []);

    if (plan.intent === "events" && plan.filters) {
      const answerId = id();
      setMessages((previous) => [
        ...previous,
        { id: answerId, role: "assistant", key: "assistant.intro", loading: true },
      ]);
      setFilters(plan.filters);
      setPendingId(answerId);
      return;
    }

    setFilters(null);
    setPendingId(null);

    if (plan.intent === "faq" && plan.faq) {
      setMessages((previous) => [
        ...previous,
        { id: id(), role: "assistant", faq: plan.faq, key: FAQ_KEYS[plan.faq!].text },
      ]);
    } else if (plan.intent === "greeting") {
      setMessages((previous) => [
        ...previous,
        { id: id(), role: "assistant", key: "assistant.greeting" },
      ]);
    } else if (plan.intent === "thanks") {
      setMessages((previous) => [
        ...previous,
        { id: id(), role: "assistant", text: t("assistant.viewAll") },
      ]);
    } else {
      setMessages((previous) => [
        ...previous,
        { id: id(), role: "assistant", key: "assistant.fallback" },
      ]);
    }
  };

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    send(input);
  };

  const reset = () => {
    setMessages([]);
    setFilters(null);
    setPendingId(null);
    setInput("");
    inputRef.current?.focus();
  };

  return (
    <div data-testid="assistant-root" className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-3">
      {open && (
        <section
          data-testid="assistant-panel"
          role="dialog"
          aria-label={t("assistant.title")}
          className="flex h-[min(34rem,calc(100vh-7rem))] w-[min(24rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
        >
          <header className="flex items-center justify-between gap-3 bg-gradient-to-r from-[#062c23] to-[#093c30] px-4 py-3 text-white">
            <div className="flex items-center gap-2.5">
              <span className="rounded-full bg-white/10 p-1.5">
                <MessageCircle size={16} aria-hidden="true" />
              </span>
              <div>
                <h2 className="text-sm font-semibold leading-tight">{t("assistant.title")}</h2>
                <p className="text-[10px] text-emerald-200/70">{t("assistant.subtitle")}</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                data-testid="assistant-reset"
                onClick={reset}
                aria-label={t("assistant.reset")}
                title={t("assistant.reset")}
                className="rounded-lg p-1.5 text-emerald-200/80 transition-colors hover:bg-white/10 hover:text-white"
              >
                <RotateCcw size={14} />
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label={t("assistant.close")}
                className="rounded-lg p-1.5 text-emerald-200/80 transition-colors hover:bg-white/10 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>
          </header>

          <div className="flex-1 space-y-3 overflow-y-auto bg-slate-50 p-3" aria-live="polite">
            <div data-testid="assistant-message" className="max-w-[92%] rounded-2xl rounded-tl-sm border border-slate-200 bg-white px-3 py-2 text-xs leading-relaxed text-slate-700 shadow-sm">
              {t("assistant.greeting")}
            </div>

            {messages.length === 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {QUICK_REPLIES.map((key) => (
                  <button
                    key={key}
                    type="button"
                    data-testid="assistant-quick-reply"
                    onClick={() => send(t(key))}
                    className="rounded-full border border-brand-200 bg-brand-50 px-2.5 py-1 text-[11px] font-medium text-brand-700 transition-colors hover:bg-brand-100"
                  >
                    {t(key)}
                  </button>
                ))}
              </div>
            )}

            {messages.map((message) =>
              message.role === "user" ? (
                <div key={message.id} className="flex justify-end">
                  <div data-testid="assistant-message" className="max-w-[88%] rounded-2xl rounded-tr-sm bg-brand-600 px-3 py-2 text-xs leading-relaxed text-white shadow-sm">
                    {message.text}
                  </div>
                </div>
              ) : (
                <div key={message.id} data-testid="assistant-message" className="max-w-[94%] rounded-2xl rounded-tl-sm border border-slate-200 bg-white px-3 py-2 text-xs leading-relaxed text-slate-700 shadow-sm">
                  <p className="flex items-start gap-1.5">
                    {message.loading && <Loader2 size={12} className="mt-0.5 shrink-0 animate-spin text-brand-600" aria-hidden="true" />}
                    <span>{message.key ? t(message.key) : message.text}</span>
                  </p>

                  {message.faq && (
                    <Link
                      href={FAQ_KEYS[message.faq].href}
                      className="mt-2 inline-flex items-center gap-1 rounded-lg bg-brand-50 px-2 py-1 text-[11px] font-semibold text-brand-700 hover:bg-brand-100"
                    >
                      {t(FAQ_KEYS[message.faq].cta)} <span aria-hidden="true">→</span>
                    </Link>
                  )}

                  {message.loading && (
                    <p className="mt-1 text-[10px] text-slate-400">{t("assistant.thinking")}</p>
                  )}

                  {message.failed && <p className="mt-1 text-[11px] text-red-600">{t("assistant.failed")}</p>}

                  {!message.loading && message.events?.length === 0 && !message.failed && (
                    <p className="mt-1 text-[11px] text-slate-500">{t("assistant.empty")}</p>
                  )}

                  {message.events && message.events.length > 0 && (
                    <div className="mt-2 space-y-1.5">
                      {message.events.map((event) => (
                        <Link
                          key={event.id}
                          href={`/events/${event.slug}`}
                          data-testid="assistant-event-card"
                          className="block rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2 transition-colors hover:border-brand-300 hover:bg-brand-50"
                        >
                          <span className="block truncate font-semibold text-slate-800">{event.title}</span>
                          <span className="mt-0.5 flex items-center gap-1 text-[10px] text-slate-500">
                            <span>{eventRange(event)}</span>
                            {event.city && (
                              <span className="inline-flex items-center gap-0.5">
                                <MapPin size={9} aria-hidden="true" /> {event.city.name}
                              </span>
                            )}
                          </span>
                        </Link>
                      ))}
                      <Link
                        href="/events"
                        className="inline-block pt-0.5 text-[11px] font-semibold text-brand-700 hover:underline"
                      >
                        {t("assistant.viewAll")} →
                      </Link>
                    </div>
                  )}
                </div>
              )
            )}
            <div ref={endRef} />
          </div>

          <form onSubmit={onSubmit} className="flex items-center gap-2 border-t border-slate-200 bg-white p-2.5">
            <label htmlFor="assistant-input" className="sr-only">{t("assistant.placeholder")}</label>
            <input
              id="assistant-input"
              ref={inputRef}
              data-testid="assistant-input"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder={t("assistant.placeholder")}
              autoComplete="off"
              className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400"
            />
            <button
              type="submit"
              data-testid="assistant-send"
              disabled={!input.trim()}
              aria-label={t("assistant.send")}
              className="rounded-lg bg-brand-600 p-2 text-white transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Send size={14} />
            </button>
          </form>
        </section>
      )}

      <button
        type="button"
        data-testid="assistant-toggle"
        onClick={() => setOpen((value) => !value)}
        aria-label={open ? t("assistant.close") : t("assistant.open")}
        aria-expanded={open}
        className="flex items-center gap-2 rounded-full bg-brand-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-900/20 transition-transform hover:scale-105 hover:bg-brand-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2"
      >
        {open ? <X size={18} /> : <MessageCircle size={18} />}
        <span className="hidden sm:inline">{t("assistant.title")}</span>
      </button>
    </div>
  );
}
