"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { BadgeCheck, Loader2, AlertTriangle, Mail } from "lucide-react";
import { authService } from "@/services/auth.service";
import { Input } from "@/components/ui/FormField";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [result, setResult] = useState<"verifying" | "verified" | "failed" | "missing">(
    token ? "verifying" : "missing"
  );
  const attempted = useRef(false);

  const verify = useMutation({
    mutationFn: () => authService.verifyEmail({ token }),
    onSuccess: () => setResult("verified"),
    onError: () => setResult("failed"),
  });

  useEffect(() => {
    if (token && !attempted.current) {
      attempted.current = true;
      verify.mutate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const [resendEmail, setResendEmail] = useState("");
  const resend = useMutation({
    mutationFn: (email: string) => authService.resendVerification({ email }),
  });

  if (result === "verifying") {
    return (
      <div className="text-center py-8">
        <Loader2 size={40} className="mx-auto text-brand-600 animate-spin mb-4" />
        <h1 className="text-xl font-bold text-slate-900">Verifying your email…</h1>
      </div>
    );
  }

  if (result === "verified") {
    return (
      <div className="text-center py-8">
        <BadgeCheck size={44} className="mx-auto text-green-600 mb-4" />
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Email verified! ✅</h1>
        <p className="text-slate-500 text-sm mb-6">
          Your email address has been confirmed. You&apos;re all set.
        </p>
        <Link href="/" className="btn-primary inline-flex text-sm">
          Explore Events
        </Link>
      </div>
    );
  }

  const resendSection = (
    <div className="mt-8 pt-6 border-t border-slate-200">
      <p className="text-slate-500 text-sm mb-3">
        {result === "missing"
          ? "This page expects a verification token."
          : "The link is invalid or has expired."}{" "}
        Need a new one?
      </p>
      {resend.isSuccess ? (
        <p className="text-green-600 text-sm">{resend.data.data.message}</p>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (resendEmail) resend.mutate(resendEmail);
          }}
          className="flex gap-2"
          id="resend-verification-form"
        >
          <Input
            type="email"
            placeholder="you@example.com"
            value={resendEmail}
            onChange={(e) => setResendEmail(e.target.value)}
            className="flex-1"
            aria-label="Email address"
          />
          <button type="submit" disabled={resend.isPending} className="btn-secondary px-4 text-sm shrink-0">
            {resend.isPending ? <Loader2 size={14} className="animate-spin" /> : <Mail size={14} />}
            Resend
          </button>
        </form>
      )}
    </div>
  );

  return (
    <div className="text-center py-8">
      <AlertTriangle size={40} className="mx-auto text-yellow-600 mb-4" />
      <h1 className="text-2xl font-bold text-slate-900 mb-2">
        {result === "missing" ? "Verification link missing" : "Verification failed"}
      </h1>
      <p className="text-slate-500 text-sm mb-4">
        {result === "missing"
          ? "Open the link from your email to verify your address."
          : "We couldn't verify this email address."}
      </p>
      {resendSection}
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="container-page py-16 max-w-md mx-auto">
      <div className="card-glass p-8">
        <Suspense
          fallback={
            <div className="space-y-4">
              <div className="skeleton h-6 w-48 mx-auto" />
              <div className="skeleton h-10 w-full" />
            </div>
          }
        >
          <VerifyEmailContent />
        </Suspense>
      </div>
    </div>
  );
}
