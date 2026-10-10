"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { format } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";
import {
  PlusCircle, Calendar, MapPin, Users, ChevronDown, ChevronUp, Download,
  ScanLine, Undo2, CircleCheckBig,
} from "lucide-react";
import { useMyEvents, useEventRsvps } from "@/hooks/useEvents";
import { eventService } from "@/services/event.service";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { clsx } from "clsx";

type CheckinMsg = { kind: "ok" | "warn" | "error"; text: string } | null;

function RsvpPanel({ eventId, eventTitle }: { eventId: string; eventTitle: string }) {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [exporting, setExporting] = useState(false);
  const [code, setCode] = useState("");
  const [checking, setChecking] = useState(false);
  const [scanMsg, setScanMsg] = useState<CheckinMsg>(null);
  const [scanning, setScanning] = useState(false);
  const scannerRef = useRef<import("html5-qrcode").Html5Qrcode | null>(null);
  const { data, isLoading } = useEventRsvps(eventId, page);

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["events"] });

  const exportCsv = async () => {
    setExporting(true);
    try {
      await eventService.downloadRsvpsCsv(eventId, eventTitle);
    } finally {
      setExporting(false);
    }
  };

  const submitCheckin = async (rawCode: string) => {
    if (!rawCode.trim() || checking) return;
    setChecking(true);
    setScanMsg(null);
    try {
      const result = await eventService.checkIn(eventId, rawCode.trim());
      setScanMsg({
        kind: result.alreadyCheckedIn ? "warn" : "ok",
        text: result.alreadyCheckedIn
          ? `${result.attendee.name} was already checked in at ${format(new Date(result.checkedInAt), "HH:mm")}.`
          : `${result.attendee.name} checked in!`,
      });
      setCode("");
      invalidate();
    } catch (err: unknown) {
      const anyErr = err as { response?: { status?: number; data?: { message?: string } } };
      const status = anyErr.response?.status;
      const msg = anyErr.response?.data?.message;
      setScanMsg({
        kind: "error",
        text:
          msg ??
          (status === 403
            ? "You can only check in people for your own events."
            : status === 404
              ? "Invalid or expired QR code."
              : "Check-in failed. Try again."),
      });
    } finally {
      setChecking(false);
    }
  };

  const stopScanner = async () => {
    try {
      await scannerRef.current?.stop();
      scannerRef.current?.clear();
    } catch {
      /* already stopped */
    }
    scannerRef.current = null;
    setScanning(false);
  };

  const toggleScan = async () => {
    if (scanning) {
      await stopScanner();
      return;
    }
    setScanMsg(null);
    try {
      const { Html5Qrcode } = await import("html5-qrcode");
      const scanner = new Html5Qrcode(`checkin-cam-${eventId}`);
      scannerRef.current = scanner;
      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 240, height: 240 } },
        async (decodedText) => {
          await stopScanner();
          await submitCheckin(decodedText);
        },
        () => { /* per-frame decode misses are fine */ }
      );
      setScanning(true);
    } catch {
      setScanning(false);
      setScanMsg({ kind: "error", text: "Camera unavailable — paste the code instead." });
    }
  };

  useEffect(() => {
    return () => {
      void stopScanner();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-2 mt-3">
        <div className="skeleton h-8 w-full rounded-lg" />
        <div className="skeleton h-8 w-full rounded-lg" />
      </div>
    );
  }

  const rsvps = data?.data ?? [];
  const counts = data?.counts;

  return (
    <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50/60 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 font-medium">
          <span className="inline-flex items-center gap-1 text-emerald-700">
            <Users size={12} /> {data?.pagination.total ?? 0} total
          </span>
          <span>Interested: {counts?.interested ?? 0}</span>
          <span>Attending: {counts?.attending ?? 0}</span>
          <span className="inline-flex items-center gap-1 text-blue-700">
            <CircleCheckBig size={12} /> In: {counts?.checkedIn ?? 0}
          </span>
        </div>
        {(data?.pagination.total ?? 0) > 0 && (
          <button
            id={`rsvp-export-${eventId}`}
            onClick={exportCsv}
            disabled={exporting}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:border-brand-300 hover:text-brand-700 transition-colors disabled:opacity-50"
          >
            <Download size={12} /> {exporting ? "Preparing…" : "Export CSV"}
          </button>
        )}
      </div>

      {(counts?.attending ?? 0) > 0 && (
        <div id={`checkin-${eventId}`} className="mt-3 rounded-xl border border-blue-200 bg-blue-50/60 p-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-blue-900 inline-flex items-center gap-1.5">
              <ScanLine size={13} /> Check in attendee
            </span>
            <div className="flex flex-1 min-w-[220px] items-center gap-2">
              <input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submitCheckin(code)}
                placeholder="Paste QR code"
                className="flex-1 rounded-lg border border-blue-200 bg-white px-2.5 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/40"
              />
              <button
                onClick={() => submitCheckin(code)}
                disabled={checking || !code.trim()}
                className="rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-700 transition-colors disabled:opacity-50"
              >
                {checking ? "…" : "Check in"}
              </button>
              <button
                onClick={toggleScan}
                className={clsx(
                  "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                  scanning
                    ? "bg-red-600 text-white hover:bg-red-700"
                    : "bg-white text-slate-700 border border-blue-200 hover:border-brand-300"
                )}
              >
                <ScanLine size={13} /> {scanning ? "Stop" : "Scan"}
              </button>
            </div>
          </div>
          <div id={`checkin-cam-${eventId}`} className={scanning ? "mt-2 rounded-lg overflow-hidden" : "hidden"} />
          {scanMsg && (
            <p
              className={clsx(
                "mt-2 text-xs font-medium",
                scanMsg.kind === "ok" && "text-emerald-700",
                scanMsg.kind === "warn" && "text-amber-700",
                scanMsg.kind === "error" && "text-red-600"
              )}
            >
              {scanMsg.text}
            </p>
          )}
        </div>
      )}

      {rsvps.length === 0 ? (
        <p className="text-slate-500 text-xs mt-2">No RSVPs yet — share this event to spread the word.</p>
      ) : (
        <ul className="mt-2 divide-y divide-slate-200/70">
          {rsvps.map((rsvp) => (
            <li key={rsvp.id} className="flex items-center justify-between gap-2 py-1.5">
              <span className="text-sm text-slate-900 truncate">{rsvp.user.name}</span>
              <span className="flex items-center gap-1.5 shrink-0">
                {rsvp.checkedInAt && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-blue-100 text-blue-700">
                    <CircleCheckBig size={10} />
                    {format(new Date(rsvp.checkedInAt), "HH:mm")}
                  </span>
                )}
                <span
                  className={clsx(
                    "text-[10px] font-medium px-1.5 py-0.5 rounded-md",
                    rsvp.type === "ATTENDING"
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-brand-50 text-brand-700"
                  )}
                >
                  {rsvp.type === "ATTENDING" ? "Attending" : "Interested"}
                </span>
                {rsvp.checkedInAt && (
                  <button
                    onClick={async () => {
                      try {
                        await eventService.undoCheckIn(eventId, rsvp.id);
                        invalidate();
                      } catch {
                        /* keep UI stable */
                      }
                    }}
                    title="Undo check-in"
                    className="text-slate-400 hover:text-red-600 transition-colors"
                  >
                    <Undo2 size={12} />
                  </button>
                )}
              </span>
            </li>
          ))}
        </ul>
      )}
      {data && data.pagination.totalPages > 1 && (
        <div className="flex items-center justify-between mt-2 text-xs">
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
            className="text-slate-500 hover:text-slate-900 disabled:opacity-40"
          >
            ← Prev
          </button>
          <span className="text-slate-400">
            {data.pagination.page}/{data.pagination.totalPages}
          </span>
          <button
            disabled={page === data.pagination.totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="text-slate-500 hover:text-slate-900 disabled:opacity-40"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}

function MyEventsContent() {
  const [page, setPage] = useState(1);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const { data, isLoading } = useMyEvents(page, 10);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">My Events</h1>
          <p className="text-slate-500 text-sm mt-1">
            {data?.pagination.total
              ? `${data.pagination.total} event${data.pagination.total === 1 ? "" : "s"} you created`
              : "Events you have submitted"}
          </p>
        </div>
        <Link href="/events/create" className="btn-primary py-2.5 px-4 text-sm">
          <PlusCircle size={15} /> Create Event
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton h-24 w-full rounded-2xl" />
          ))}
        </div>
      ) : !data || data.data.length === 0 ? (
        <div className="card-glass text-center py-16 px-6">
          <p className="text-5xl mb-4">📅</p>
          <p className="text-lg font-medium text-slate-900">No events yet</p>
          <p className="text-slate-500 text-sm mt-1">
            Create your first event and it will be reviewed before going live.
          </p>
          <Link href="/events/create" className="btn-primary mt-5 inline-flex">
            <PlusCircle size={15} /> Create Your First Event
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {data.data.map((event) => (
            <div key={event.id} className="card-glass p-4">
              <Link
                href={`/events/${event.slug}`}
                className="flex gap-4 group"
              >
                {/* Thumb */}
                <div className="relative w-24 h-20 sm:w-32 sm:h-24 rounded-xl overflow-hidden bg-surface-100 shrink-0">
                  {event.posterUrl ? (
                    <Image
                      src={event.posterUrl}
                      alt={event.title}
                      fill
                      className="object-cover"
                      sizes="128px"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-2xl opacity-40">🕌</div>
                  )}
                </div>

                {/* Info */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-slate-900 font-semibold line-clamp-1 group-hover:text-brand-700 transition-colors">
                      {event.title}
                    </h3>
                    <StatusBadge status={event.status} />
                  </div>

                  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-slate-500 text-xs">
                    <span className="inline-flex items-center gap-1.5">
                      <Calendar size={12} className="text-brand-600" />
                      {format(new Date(event.date), "dd MMM yyyy")}
                    </span>
                    {(event.venue || event.city) && (
                      <span className="inline-flex items-center gap-1.5 truncate">
                        <MapPin size={12} className="text-brand-600" />
                        {event.venue ?? event.city?.name}
                      </span>
                    )}
                    <span className="badge-brand text-[10px]">{event.category.name}</span>
                  </div>

                  {event.status === "PENDING_REVIEW" && (
                    <p className="text-yellow-700 text-xs mt-2">
                      Awaiting admin approval — this event is not publicly visible yet.
                    </p>
                  )}
                  {event.status === "REJECTED" && (
                    <p className="text-red-600 text-xs mt-2">
                      This event was rejected by a moderator. Please review the guidelines and create a new one.
                    </p>
                  )}
                </div>
              </Link>

              {event.status === "APPROVED" && (
                <div className="mt-3 pt-3 border-t border-slate-100">
                  <button
                    id={`rsvp-toggle-${event.id}`}
                    onClick={() => setExpandedId(expandedId === event.id ? null : event.id)}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-brand-700 transition-colors"
                  >
                    <Users size={13} />
                    {expandedId === event.id ? "Hide RSVPs" : "View RSVPs"}
                    {expandedId === event.id ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                  </button>
                  {expandedId === event.id && <RsvpPanel eventId={event.id} eventTitle={event.title} />}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {data && data.pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-8">
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
            className="btn-secondary py-2 px-4 text-sm disabled:opacity-40"
          >
            ← Previous
          </button>
          <span className="text-slate-500 text-sm">
            Page {data.pagination.page} of {data.pagination.totalPages}
          </span>
          <button
            disabled={page === data.pagination.totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="btn-secondary py-2 px-4 text-sm disabled:opacity-40"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}

export default function MyEventsPage() {
  return (
    <AuthGuard>
      <div className="container-page py-10">
        <MyEventsContent />
      </div>
    </AuthGuard>
  );
}
