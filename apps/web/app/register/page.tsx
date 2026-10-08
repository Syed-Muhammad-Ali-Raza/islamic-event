"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { useRegister } from "@/hooks/useAuth";
import { Input } from "@/components/ui/FormField";
import { Eye, EyeOff, CheckCircle } from "lucide-react";
import { useState } from "react";

const RegisterSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Please enter a valid email"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
    phone: z.string().optional(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type RegisterForm = z.infer<typeof RegisterSchema>;

const PASSWORD_STRENGTH = [
  { label: "At least 8 characters", check: (p: string) => p.length >= 8 },
  { label: "Contains a number", check: (p: string) => /\d/.test(p) },
  { label: "Contains uppercase", check: (p: string) => /[A-Z]/.test(p) },
];

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const register_ = useRegister();

  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<RegisterForm>({
    resolver: zodResolver(RegisterSchema),
  });

  const password = watch("password") ?? "";

  const onSubmit = async (data: RegisterForm) => {
    await register_.mutateAsync({
      name: data.name,
      email: data.email,
      password: data.password,
      phone: data.phone || undefined,
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-brand-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/4 w-64 h-64 bg-gold-500/10 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative">
        <div className="card-glass p-8 rounded-3xl shadow-2xl">
          <div className="text-center mb-8">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-500 to-purple-400 flex items-center justify-center mx-auto mb-4">
              <span className="text-white font-bold text-lg">CE</span>
            </div>
            <h1 className="text-2xl font-bold text-white">Create your account</h1>
            <p className="text-white/50 text-sm mt-1">Join the community platform</p>
          </div>

          {register_.error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 mb-5 text-red-400 text-sm">
              {(register_.error as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Registration failed. Please try again."}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
            <Input
              id="register-name"
              label="Full name"
              type="text"
              autoComplete="name"
              placeholder="Ali Raza"
              error={errors.name?.message}
              {...register("name")}
            />

            <Input
              id="register-email"
              label="Email address"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              error={errors.email?.message}
              {...register("email")}
            />

            <Input
              id="register-phone"
              label="Phone (optional)"
              type="tel"
              autoComplete="tel"
              placeholder="+92 300 1234567"
              error={errors.phone?.message}
              {...register("phone")}
            />

            <div className="relative">
              <Input
                id="register-password"
                label="Password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                placeholder="Min. 8 characters"
                error={errors.password?.message}
                {...register("password")}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-9 text-white/40 hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {/* Password strength */}
            {password.length > 0 && (
              <div className="space-y-1.5 pl-1">
                {PASSWORD_STRENGTH.map(({ label, check }) => (
                  <div key={label} className="flex items-center gap-2">
                    <CheckCircle
                      size={13}
                      className={check(password) ? "text-green-400" : "text-white/20"}
                    />
                    <span className={`text-xs ${check(password) ? "text-white/60" : "text-white/25"}`}>
                      {label}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <Input
              id="register-confirm-password"
              label="Confirm password"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              error={errors.confirmPassword?.message}
              {...register("confirmPassword")}
            />

            <button
              id="register-submit"
              type="submit"
              disabled={isSubmitting || register_.isPending}
              className="btn-primary w-full py-3"
            >
              {register_.isPending ? "Creating account…" : "Create Account"}
            </button>
          </form>

          <p className="text-center text-white/40 text-sm mt-6">
            Already have an account?{" "}
            <Link href="/login" className="text-brand-400 hover:text-brand-300 font-medium transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
