"use client";

import { useEffect, useState } from "react";
import { Share2, Link2, Check, QrCode } from "lucide-react";
import QRCode from "qrcode";

interface Props {
  title: string;
  path: string;
}

export function ShareButtons({ title, path }: Props) {
  const [url, setUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [qrOpen, setQrOpen] = useState(false);

  useEffect(() => {
    setUrl(window.location.origin + path);
  }, [path]);

  useEffect(() => {
    if (!qrOpen || !url) return;
    QRCode.toDataURL(url, { width: 220, margin: 1, color: { dark: "#0f172a", light: "#ffffff" } })
      .then(setQrDataUrl)
      .catch(() => setQrDataUrl(null));
  }, [qrOpen, url]);

  const encodedUrl = encodeURIComponent(url);
  const text = encodeURIComponent(title);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable */
    }
  };

  return (
    <div id="share-buttons" className="flex flex-wrap items-center gap-2">
      <span className="inline-flex items-center gap-1.5 text-slate-500 text-xs font-medium mr-1">
        <Share2 size={13} /> Share
      </span>
      <a
        href={`https://wa.me/?text=${text}%20${encodedUrl}`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:border-emerald-300 hover:text-emerald-700 transition-colors"
      >
        WhatsApp
      </a>
      <a
        href={`https://twitter.com/intent/tweet?text=${text}&url=${encodedUrl}`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:border-slate-400 hover:text-slate-900 transition-colors"
      >
        X
      </a>
      <a
        href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:border-blue-300 hover:text-blue-700 transition-colors"
      >
        Facebook
      </a>
      <button
        onClick={copy}
        disabled={!url}
        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:border-brand-300 hover:text-brand-700 transition-colors disabled:opacity-50"
      >
        {copied ? <Check size={13} className="text-emerald-600" /> : <Link2 size={13} />}
        {copied ? "Copied!" : "Copy link"}
      </button>
      <button
        onClick={() => setQrOpen((v) => !v)}
        className={qrOpen
          ? "inline-flex items-center gap-1 rounded-lg border border-brand-300 bg-brand-50 px-2.5 py-1.5 text-xs font-medium text-brand-700 transition-colors"
          : "inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:border-brand-300 hover:text-brand-700 transition-colors"}
      >
        <QrCode size={13} /> QR
      </button>

      {qrOpen && (
        <div id="share-qr" className="w-full mt-2 flex flex-col items-center sm:items-start gap-2 rounded-xl border border-slate-200 bg-white p-4">
          {qrDataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={qrDataUrl} alt={`QR code for ${title}`} width={220} height={220} className="rounded-lg" />
          ) : (
            <div className="skeleton h-[220px] w-[220px] rounded-lg" />
          )}
          <p className="text-xs text-slate-500 text-center sm:text-left max-w-[260px]">
            Scan to open this event on any device.
          </p>
        </div>
      )}
    </div>
  );
}
