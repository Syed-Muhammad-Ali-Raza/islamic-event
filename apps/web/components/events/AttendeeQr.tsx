"use client";

import { useEffect, useState } from "react";
import { QrCode, CircleCheckBig } from "lucide-react";
import QRCode from "qrcode";
import { useMyRsvp } from "@/hooks/useEvents";

export function AttendeeQr({ eventId }: { eventId: string }) {
  const { data, isLoading, isError } = useMyRsvp(eventId);
  const [dataUrl, setDataUrl] = useState<string | null>(null);

  const attending = data?.type === "ATTENDING";

  useEffect(() => {
    if (!attending || !data?.qrToken) return;
    QRCode.toDataURL(data.qrToken, {
      width: 240,
      margin: 1,
      color: { dark: "#0f172a", light: "#ffffff" },
    })
      .then(setDataUrl)
      .catch(() => setDataUrl(null));
  }, [attending, data?.qrToken]);

  if (isLoading || isError || !attending) return null;

  return (
    <div id="attendee-qr" className="mt-4 inline-flex flex-col items-center gap-2 rounded-2xl bg-white/95 p-4 shadow-lg">
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700">
        <QrCode size={14} /> Your check-in pass
      </span>
      {dataUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={dataUrl} alt="Attendee check-in QR code" width={240} height={240} className="rounded-lg" />
      ) : (
        <div className="skeleton h-[240px] w-[240px] rounded-lg" />
      )}
      {data?.checkedInAt ? (
        <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
          <CircleCheckBig size={13} /> Checked in
        </span>
      ) : (
        <span className="text-[11px] text-slate-500 text-center max-w-[240px]">
          Show this code at the entrance — organizers will scan it to check you in.
        </span>
      )}
    </div>
  );
}
