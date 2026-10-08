"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { Mail, ArrowLeft, Loader2, CheckCircle2 } from "lucide-react";
import { authService } from "@/services/auth.service";
import { Input } from "@/components/ui/FormField";

const ForgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

type ForgotPasswordForm = z.infer<typeof ForgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);

  const mutation = useMutation({
    mutationFn: (data: ForgotPasswordForm) => authService.forgotPassword(data),
    onSuccess: () => setSent(true),
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordForm>({ resolver: zodResolver(ForgotPasswordSchema) });

  return (
    <div className="container-page py-16 max-w-md mx-auto">
      <div className="card-glass p-8">
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-xs text-white/50 hover:text-white transition-colors mb-6"
        >
          <ArrowLeft size={14} /> Back to sign in
        </Link>

        {sent ? (
          <div className="text-center py-4">
            <CheckCircle2 size={40} className="mx-auto text-green-400 mb-4" />
            <h1 className="text-xl font-bold text-white mb-2">Check your inbox</h1>
            <p className="text-white/60 text-sm">
              If an account exists for that email, a password reset link has been sent. The link
              expires in 1 hour.
            </p>
            <Link href="/login" className="btn-primary mt-6 inline-flex text-sm">
              Back to Sign In
            </Link>
          </div>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-white mb-2">Forgot password?</h1>
            <p className="text-white/50 text-sm mb-6">
              Enter your email and we&apos;ll send you a link to reset it.
            </p>

            <form
              onSubmit={handleSubmit((data) => mutation.mutate(data))}
              className="space-y-4"
              id="forgot-password-form"
            >
              <Input
                label="Email address"
                type="email"
                placeholder="you@example.com"
                error={errors.email?.message}
                {...register("email")}
              />

              {mutation.isError && (
                <p className="form-error">
                  {(
                    mutation.error as { response?: { data?: { message?: string } } }
                  )?.response?.data?.message ?? "Something went wrong. Please try again."}
                </p>
              )}

              <button
                type="submit"
                disabled={mutation.isPending}
                className="btn-primary w-full py-3 justify-center gap-2"
                id="forgot-password-submit"
              >
                {mutation.isPending ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Mail size={16} />
                )}
                Send Reset Link
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
