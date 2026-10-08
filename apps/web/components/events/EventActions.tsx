"use client";

import { useState } from "react";
import Link from "next/link";
import { Bookmark, BookmarkCheck, Flag, Share2, Check } from "lucide-react";
import { useAuthStore } from "@/stores/auth.store";
import { useSavedEvents, useSaveEvent, useUnsaveEvent } from "@/hooks/useEvents";
import { eventService } from "@/services/event.service";

const REPORT_REASONS = [
  { value: "FAKE_INFORMATION", label: "Fake information" },
  { value: "WRONG_LOCATION", label: "Wrong location" },
  { value: "WRONG_DATE", label: "Wrong date" },
  { value: "DUPLICATE", label: "Duplicate event" },
  { value: "SPAM", label: "Spam" },
  { value: "OFFENSIVE_CONTENT", label: "Offensive content" },
  { value: "EVENT_CANCELLED", label: "Event was cancelled" },
  { value: "OTHER", label: "Other" },
];

interface Props {
  eventId: string;
}

export function EventActions({ eventId }: Props) {
  const { isAuthenticated } = useAuthStore();
  const { data: savedData } = useSavedEvents(1, 100, isAuthenticated);
  const save = useSaveEvent();
  const unsave = useUnsaveEvent();

  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState(REPORT_REASONS[0].value);
  const [reportDescription, setReportDescription] = useState("");
  const [reportStatus, setReportStatus] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [copied, setCopied] = useState(false);

  const isSaved = savedData?.data.some((item) => item.event.id === eventId) ?? false;

  const toggleSave = () => {
    if (!isAuthenticated) return;
    if (isSaved) unsave.mutate(eventId);
    else save.mutate(eventId);
  };

  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: document.title, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* user dismissed share sheet */
    }
  };

  const submitReport = async () => {
    setReportStatus("sending");
    try {
      await eventService.reportEvent(eventId, {
        reason: reportReason,
        description: reportDescription || undefined,
      });
      setReportStatus("done");
    } catch {
      setReportStatus("error");
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        onClick={toggleSave}
        disabled={!isAuthenticated || save.isPending || unsave.isPending}
        title={isAuthenticated ? (isSaved ? "Remove from saved" : "Save event") : "Sign in to save events"}
        className={
          isSaved
            ? "btn-secondary py-2.5 px-4 border-brand-600/50 text-brand-300"
            : "btn-secondary py-2.5 px-4"
        }
      >
        {isSaved ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
        {isSaved ? "Saved" : "Save"}
      </button>

      <button onClick={share} className="btn-secondary py-2.5 px-4">
        {copied ? <Check size={16} className="text-green-400" /> : <Share2 size={16} />}
        {copied ? "Copied!" : "Share"}
      </button>

      {isAuthenticated && (
        <button
          onClick={() => { setReportOpen(true); setReportStatus("idle"); }}
          className="btn-ghost py-2.5 px-4 text-white/40 hover:text-red-400"
        >
          <Flag size={15} /> Report
        </button>
      )}

      {/* Report modal */}
      {reportOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/70 backdrop-blur-sm">
          <div className="card-glass w-full max-w-md p-6 animate-scale-in">
            {reportStatus === "done" ? (
              <div className="text-center py-4">
                <div className="w-12 h-12 rounded-full bg-green-500/15 border border-green-500/30 flex items-center justify-center mx-auto mb-4">
                  <Check size={24} className="text-green-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-1">Report submitted</h3>
                <p className="text-white/50 text-sm">Our team will review it shortly. Thank you.</p>
                <button onClick={() => setReportOpen(false)} className="btn-secondary mt-5">
                  Close
                </button>
              </div>
            ) : (
              <>
                <h3 className="text-lg font-semibold text-white mb-4">Report this event</h3>

                <label className="label" htmlFor="report-reason">Reason</label>
                <select
                  id="report-reason"
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  className="input mb-4"
                >
                  {REPORT_REASONS.map((r) => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>

                <label className="label" htmlFor="report-details">Details (optional)</label>
                <textarea
                  id="report-details"
                  value={reportDescription}
                  onChange={(e) => setReportDescription(e.target.value)}
                  rows={3}
                  maxLength={1000}
                  placeholder="Add any details that will help us review…"
                  className="input resize-none"
                />

                {reportStatus === "error" && (
                  <p className="form-error mt-2">Failed to submit report. Please try again.</p>
                )}

                <div className="flex justify-end gap-3 mt-5">
                  <button onClick={() => setReportOpen(false)} className="btn-ghost">Cancel</button>
                  <button
                    onClick={submitReport}
                    disabled={reportStatus === "sending"}
                    className="btn-primary py-2.5 px-5"
                  >
                    {reportStatus === "sending" ? "Submitting…" : "Submit Report"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
