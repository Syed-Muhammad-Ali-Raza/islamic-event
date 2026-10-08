"use client";

import Link from "next/link";
import { format } from "date-fns";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Bookmark, CalendarClock, CheckCircle2, KeyRound, PlusCircle, Settings, ShieldCheck, UserRound } from "lucide-react";
import { useAuthStore } from "@/stores/auth.store";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { Input } from "@/components/ui/FormField";
import { useUpdateProfile, useChangePassword } from "@/hooks/useAuth";

const ProfileSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be under 100 characters"),
  phone: z
    .string()
    .refine((v) => v === "" || /^\+?[0-9\s\-()]{7,20}$/.test(v), "Please enter a valid phone number"),
});

type ProfileForm = z.infer<typeof ProfileSchema>;

const PasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(72, "Password must be under 72 characters"),
    confirmPassword: z.string().min(1, "Confirm your new password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type PasswordForm = z.infer<typeof PasswordSchema>;

function apiErrorMessage(error: unknown, fallback: string): string {
  return (
    (error as { response?: { data?: { message?: string } } })?.response?.data?.message ?? fallback
  );
}

function ProfileContent() {
  const { user } = useAuthStore();
  const update = useUpdateProfile();
  const passwordMutation = useChangePassword();

  const profile = useForm<ProfileForm>({
    resolver: zodResolver(ProfileSchema),
    defaultValues: { name: user?.name ?? "", phone: user?.phone ?? "" },
  });

  const password = useForm<PasswordForm>({
    resolver: zodResolver(PasswordSchema),
    defaultValues: { currentPassword: "", password: "", confirmPassword: "" },
  });

  const onProfileSubmit = async (data: ProfileForm) => {
    await update.mutateAsync({ name: data.name, phone: data.phone || undefined });
  };

  const onPasswordSubmit = async (data: PasswordForm) => {
    await passwordMutation.mutateAsync({
      currentPassword: data.currentPassword,
      password: data.password,
    });
    password.reset();
  };

  const stats = [
    { label: "My Events", icon: CalendarClock, href: "/profile/events" },
    { label: "Saved Events", icon: Bookmark, href: "/saved" },
    { label: "Create Event", icon: PlusCircle, href: "/events/create" },
  ];

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-slate-900 mb-6">Profile</h1>

      {/* Identity card */}
      <div className="card-glass p-6 sm:p-8">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-brand-600 to-brand-400 flex items-center justify-center text-white text-2xl font-bold shrink-0">
            {user?.name?.charAt(0).toUpperCase() ?? "U"}
          </div>
          <div className="min-w-0">
            <h2 className="text-xl font-semibold text-slate-900 truncate">{user?.name}</h2>
            <p className="text-slate-500 text-sm truncate">{user?.email}</p>
            <div className="mt-1.5">
              <span
                className={
                  user?.role === "ADMIN"
                    ? "badge-brand text-[11px]"
                    : user?.role === "ORGANIZER"
                      ? "badge-gold text-[11px]"
                      : "badge text-[11px] bg-slate-100 text-slate-500 border border-slate-200"
                }
              >
                {user?.role}
              </span>
            </div>
          </div>
        </div>

        <div className="divider" />

        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-slate-500 text-xs uppercase tracking-wider mb-1">Phone</dt>
            <dd className="text-slate-800">{user?.phone ?? "Not provided"}</dd>
          </div>
          <div>
            <dt className="text-slate-500 text-xs uppercase tracking-wider mb-1">Member Since</dt>
            <dd className="text-slate-800">
              {user?.createdAt ? format(new Date(user.createdAt), "MMMM yyyy") : "—"}
            </dd>
          </div>
        </dl>
      </div>

      {/* Edit profile */}
      <div className="card-glass p-6 sm:p-8 mt-6">
        <div className="flex items-center gap-2 mb-5">
          <UserRound size={18} className="text-brand-600" />
          <h2 className="text-lg font-semibold text-slate-900">Edit Profile</h2>
        </div>

        {update.isSuccess && (
          <div
            id="profile-update-success"
            className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3 mb-5 text-emerald-700 text-sm"
          >
            <CheckCircle2 size={15} className="shrink-0" /> Profile updated successfully.
          </div>
        )}
        {update.isError && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 mb-5 text-red-500 text-sm">
            {apiErrorMessage(update.error, "Could not update profile. Please try again.")}
          </div>
        )}

        <form
          id="profile-form"
          onSubmit={profile.handleSubmit(onProfileSubmit)}
          className="space-y-4"
          noValidate
        >
          <Input
            id="profile-name"
            label="Display name"
            placeholder="Your name"
            error={profile.formState.errors.name?.message}
            {...profile.register("name")}
          />
          <Input
            id="profile-phone"
            label="Phone (optional)"
            type="tel"
            placeholder="+92 300 1234567"
            error={profile.formState.errors.phone?.message}
            {...profile.register("phone")}
          />
          <div className="flex justify-end">
            <button
              id="profile-save"
              type="submit"
              disabled={profile.formState.isSubmitting || update.isPending}
              className="btn-primary text-sm py-2.5"
            >
              {update.isPending ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </form>
      </div>

      {/* Change password */}
      <div className="card-glass p-6 sm:p-8 mt-6">
        <div className="flex items-center gap-2 mb-5">
          <KeyRound size={18} className="text-brand-600" />
          <h2 className="text-lg font-semibold text-slate-900">Change Password</h2>
        </div>

        {passwordMutation.isSuccess && (
          <div
            id="password-change-success"
            className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3 mb-5 text-emerald-700 text-sm"
          >
            <CheckCircle2 size={15} className="shrink-0" /> Password changed successfully.
          </div>
        )}
        {passwordMutation.isError && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 mb-5 text-red-500 text-sm">
            {apiErrorMessage(passwordMutation.error, "Could not change password. Please try again.")}
          </div>
        )}

        <form
          id="password-form"
          onSubmit={password.handleSubmit(onPasswordSubmit)}
          className="space-y-4"
          noValidate
        >
          <Input
            id="password-current"
            label="Current password"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            error={password.formState.errors.currentPassword?.message}
            {...password.register("currentPassword")}
          />
          <Input
            id="password-new"
            label="New password"
            type="password"
            autoComplete="new-password"
            placeholder="••••••••"
            error={password.formState.errors.password?.message}
            {...password.register("password")}
          />
          <Input
            id="password-confirm"
            label="Confirm new password"
            type="password"
            autoComplete="new-password"
            placeholder="••••••••"
            error={password.formState.errors.confirmPassword?.message}
            {...password.register("confirmPassword")}
          />
          <div className="flex justify-end">
            <button
              id="password-save"
              type="submit"
              disabled={password.formState.isSubmitting || passwordMutation.isPending}
              className="btn-primary text-sm py-2.5"
            >
              {passwordMutation.isPending ? "Updating…" : "Update Password"}
            </button>
          </div>
        </form>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link
              key={stat.label}
              href={stat.href}
              className="card-glass p-5 hover:border-brand-600/40 transition-all group text-center"
            >
              <Icon size={20} className="mx-auto text-brand-600 mb-2 group-hover:scale-110 transition-transform" />
              <p className="text-slate-900 text-sm font-medium">{stat.label}</p>
            </Link>
          );
        })}
      </div>

      {/* Admin + settings */}
      <div className="flex flex-wrap gap-3 mt-6">
        {user?.role === "ADMIN" && (
          <Link href="/admin" className="btn-primary text-sm py-2.5">
            <ShieldCheck size={15} /> Admin Panel
          </Link>
        )}
        <Link href="/profile/events" className="btn-secondary text-sm py-2.5">
          <Settings size={15} /> Manage My Events
        </Link>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <AuthGuard>
      <div className="container-page py-10">
        <ProfileContent />
      </div>
    </AuthGuard>
  );
}
