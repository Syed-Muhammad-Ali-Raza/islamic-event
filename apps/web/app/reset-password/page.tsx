"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { KeyRound, Loader2, CheckCircle2, AlertTriangle } from "lucide-react";
import { authService } from "@/services/auth.service";
import { Input } from "@/components/ui/FormField";

const ResetPasswordSchema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type ResetPasswordForm = z.infer<typeof ResetPasswordSchema>;

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [done, setDone] = useState(false);

  const mutation = useMutation({
    mutationFn: (data: ResetPasswordForm) =>
      authService.resetPassword({ token, password: data.password }),
    onSuccess: () => {
      setDone(true);
      setTimeout(() => router.push("/login"), 2500);
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordForm>({ resolver: zodResolver(ResetPasswordSchema) });

  const errorMessage =
    (mutation.error as { response?: { data?: { message?: string } } })?.response?.data
      ?.message ?? "Something went wrong. Please try again.";

  if (!token) {
    return (
      <div className="text-center py-6">
        <AlertTriangle size={40} className="mx-auto text-yellow-600 mb-4" />
        <h1 className="text-xl font-bold text-slate-900 mb-2">Missing reset link</h1>
        <p className="text-slate-500 text-sm mb-6">
          This page needs a valid reset token. Request a new link below.
        </p>
        <Link href="/forgot-password" className="btn-primary inline-flex text-sm">
          Request Reset Link
        </Link>
      </div>
    );
  }

  if (done) {
    return (
      <div className="text-center py-6">
        <CheckCircle2 size={40} className="mx-auto text-green-600 mb-4" />
        <h1 className="text-xl font-bold text-slate-900 mb-2">Password updated</h1>
        <p className="text-slate-500 text-sm">Redirecting you to sign in…</p>
        <Link href="/login" className="btn-primary mt-6 inline-flex text-sm">
          Sign In Now
        </Link>
      </div>
    );
  }

  return (
    <>
      <h1 className="text-2xl font-bold text-slate-900 mb-2">Set a new password</h1>
      <p className="text-slate-500 text-sm mb-6">Choose a strong password for your account.</p>

      <form
        onSubmit={handleSubmit((data) => mutation.mutate(data))}
        className="space-y-4"
        id="reset-password-form"
      >
        <Input
          label="New password"
          type="password"
          placeholder="At least 8 characters"
          error={errors.password?.message}
          {...register("password")}
        />
        <Input
          label="Confirm password"
          type="password"
          placeholder="Repeat the password"
          error={errors.confirmPassword?.message}
          {...register("confirmPassword")}
        />

        {mutation.isError && <p className="form-error">{errorMessage}</p>}

        <button
          type="submit"
          disabled={mutation.isPending}
          className="btn-primary w-full py-3 justify-center gap-2"
          id="reset-password-submit"
        >
          {mutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <KeyRound size={16} />}
          Update Password
        </button>
      </form>
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="container-page py-16 max-w-md mx-auto">
      <div className="card-glass p-8">
        <Suspense
          fallback={
            <div className="space-y-4">
              <div className="skeleton h-6 w-48" />
              <div className="skeleton h-10 w-full" />
              <div className="skeleton h-10 w-full" />
            </div>
          }
        >
          <ResetPasswordContent />
        </Suspense>
      </div>
    </div>
  );
}
