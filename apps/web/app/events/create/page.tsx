"use client";

import { useMemo, useRef, useState, Suspense } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Check, ChevronLeft, ChevronRight, ImagePlus, CalendarDays,
  ClipboardList, PartyPopper, X, Loader2,
} from "lucide-react";
import { useCategories } from "@/hooks/useCategories";
import { useCreateEvent } from "@/hooks/useEvents";
import { eventService } from "@/services/event.service";
import { Input, Textarea, Select } from "@/components/ui/FormField";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { clsx } from "clsx";

// ─── Schema (mirrors API CreateEventSchema) ──────────────────────────────────

const CreateEventFormSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(200, "Title must be under 200 characters"),
  categoryId: z.string().min(1, "Please choose a category"),
  description: z.string().max(5000, "Description must be under 5000 characters").optional(),
  date: z.string().min(1, "Event date is required").regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date"),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  venue: z.string().max(300).optional(),
  address: z.string().max(500).optional(),
});

type CreateEventForm = z.infer<typeof CreateEventFormSchema>;

const STEPS = [
  { id: "basics", label: "Basics", icon: ClipboardList, fields: ["title", "categoryId", "description"] as const },
  { id: "when-where", label: "When & Where", icon: CalendarDays, fields: ["date", "startTime", "endTime", "venue", "address"] as const },
  { id: "poster", label: "Poster", icon: ImagePlus, fields: [] as const },
  { id: "review", label: "Review", icon: PartyPopper, fields: [] as const },
];

function CreateEventContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: categories } = useCategories();
  const createEvent = useCreateEvent();

  const [step, setStep] = useState(0);
  const [posterFile, setPosterFile] = useState<File | null>(null);
  const [posterPreview, setPosterPreview] = useState<string | null>(null);
  const [posterError, setPosterError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<{ slug: string; posterFailed: boolean } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    trigger,
    getValues,
    watch,
    formState: { errors },
  } = useForm<CreateEventForm>({
    resolver: zodResolver(CreateEventFormSchema),
    mode: "onTouched",
    defaultValues: {
      title: "",
      categoryId: searchParams.get("category") ?? "",
      description: "",
      date: "",
      startTime: "",
      endTime: "",
      venue: "",
      address: "",
    },
  });

  const watchedValues = watch();

  const categoryOptions = useMemo(
    () => (categories ?? []).map((c) => ({ value: c.id, label: c.name })),
    [categories]
  );

  const goNext = async () => {
    const fields = STEPS[step].fields;
    const valid = fields.length > 0 ? await trigger([...fields]) : true;
    if (valid) setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const goBack = () => setStep((s) => Math.max(s - 1, 0));

  const onFileChange = (file: File | null) => {
    setPosterError("");
    if (!file) {
      setPosterFile(null);
      setPosterPreview(null);
      return;
    }
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setPosterError("Only JPG, PNG or WebP images are allowed.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setPosterError("Image must be under 10MB.");
      return;
    }
    setPosterFile(file);
    setPosterPreview(URL.createObjectURL(file));
  };

  const onSubmit = async (data: CreateEventForm) => {
    setSubmitError("");
    setSubmitting(true);
    try {
      const payload = {
        title: data.title.trim(),
        categoryId: data.categoryId,
        description: data.description?.trim() || undefined,
        date: data.date,
        startTime: data.startTime ? data.startTime.slice(0, 5) : undefined,
        endTime: data.endTime ? data.endTime.slice(0, 5) : undefined,
        venue: data.venue?.trim() || undefined,
        address: data.address?.trim() || undefined,
      };

      const result = await createEvent.mutateAsync(payload);
      let posterFailed = false;

      if (posterFile) {
        try {
          await eventService.uploadPoster(posterFile, result.event.id);
        } catch {
          posterFailed = true;
        }
      }

      setDone({ slug: result.event.slug, posterFailed });
    } catch (err) {
      const body = (err as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } })?.response?.data;
      setSubmitError(body?.message ?? "Failed to create event. Please try again.");
      setStep(0);
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Success screen ────────────────────────────────────────────────────────
  if (done) {
    return (
      <div className="max-w-xl mx-auto text-center py-10">
        <div className="w-16 h-16 rounded-full bg-green-500/15 border border-green-500/30 flex items-center justify-center mx-auto mb-5">
          <Check size={30} className="text-green-400" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Event submitted! 🎉</h1>
        <p className="text-white/60 text-sm leading-relaxed">
          Your event <span className="text-white font-medium">“{getValues("title")}”</span> is now pending
          review. An admin will approve it shortly, and it will appear on the public events feed.
        </p>

        {done.posterFailed && (
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-3 mt-5 text-yellow-400 text-sm">
            The event was created, but the poster upload failed. You can edit the event later to add it.
          </div>
        )}

        <div className="flex flex-wrap items-center justify-center gap-3 mt-7">
          <Link href="/profile/events" className="btn-primary">
            View My Events
          </Link>
          <button
            onClick={() => {
              setDone(null);
              setStep(0);
              setPosterFile(null);
              setPosterPreview(null);
            }}
            className="btn-secondary"
          >
            Create Another
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Create Event</h1>
        <p className="text-white/50 text-sm">
          Share your religious or community event with the world
        </p>
      </div>

      {/* Stepper */}
      <div className="flex items-center justify-between mb-8 max-w-2xl mx-auto">
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          const isDone = i < step;
          const isCurrent = i === step;
          return (
            <div key={s.id} className="flex items-center flex-1 last:flex-none">
              <button
                type="button"
                onClick={() => i < step && setStep(i)}
                disabled={i > step}
                className={clsx(
                  "flex flex-col items-center gap-1.5 group",
                  i > step && "cursor-not-allowed"
                )}
                aria-current={isCurrent ? "step" : undefined}
              >
                <div
                  className={clsx(
                    "w-10 h-10 rounded-full flex items-center justify-center border transition-all duration-200",
                    isDone && "bg-brand-600 border-brand-500 text-white",
                    isCurrent && "border-brand-500 bg-brand-600/20 text-brand-300 ring-2 ring-brand-500/40",
                    i > step && "border-white/15 text-white/30"
                  )}
                >
                  {isDone ? <Check size={16} /> : <Icon size={16} />}
                </div>
                <span
                  className={clsx(
                    "text-[11px] font-medium hidden sm:block",
                    isCurrent ? "text-brand-300" : isDone ? "text-white/60" : "text-white/30"
                  )}
                >
                  {s.label}
                </span>
              </button>

              {i < STEPS.length - 1 && (
                <div
                  className={clsx(
                    "flex-1 h-px mx-2 sm:mx-4 mb-6 sm:mb-0 transition-colors",
                    i < step ? "bg-brand-500" : "bg-white/10"
                  )}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Error banner */}
      {submitError && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 mb-5 text-red-400 text-sm">
          {submitError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="card-glass p-6 sm:p-8">
        {/* ── Step 1: Basics ── */}
        {step === 0 && (
          <div className="space-y-5 animate-slide-up">
            <Input
              id="event-title"
              label="Event Title"
              required
              placeholder="e.g. Friday Night Mehfil-e-Naat"
              error={errors.title?.message}
              {...register("title")}
            />

            <Select
              id="event-category"
              label="Category"
              required
              options={categoryOptions}
              placeholder={categoryOptions.length ? "Choose a category…" : "Loading categories…"}
              error={errors.categoryId?.message}
              {...register("categoryId")}
            />

            <Textarea
              id="event-description"
              label="Description"
              rows={6}
              placeholder="Describe the event — schedule, speakers, who it's for, any special arrangements…"
              hint="Optional but recommended. Up to 5000 characters."
              error={errors.description?.message}
              {...register("description")}
            />
          </div>
        )}

        {/* ── Step 2: When & Where ── */}
        {step === 1 && (
          <div className="space-y-5 animate-slide-up">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input
                id="event-date"
                label="Date"
                type="date"
                required
                error={errors.date?.message}
                {...register("date")}
              />
              <Input
                id="event-start"
                label="Start Time"
                type="time"
                error={errors.startTime?.message}
                {...register("startTime")}
              />
              <Input
                id="event-end"
                label="End Time"
                type="time"
                error={errors.endTime?.message}
                {...register("endTime")}
              />
            </div>

            <Input
              id="event-venue"
              label="Venue"
              placeholder="e.g. Masjid-e-Noor, Block C, Gulberg"
              hint="Optional — the venue name and landmark"
              error={errors.venue?.message}
              {...register("venue")}
            />

            <Textarea
              id="event-address"
              label="Full Address"
              rows={3}
              placeholder="Street, area, city…"
              hint="Optional — helps attendees find the location"
              error={errors.address?.message}
              {...register("address")}
            />
          </div>
        )}

        {/* ── Step 3: Poster ── */}
        {step === 2 && (
          <div className="animate-slide-up">
            <label className="label">Event Poster</label>
            {posterPreview ? (
              <div className="relative rounded-2xl overflow-hidden border border-white/10 group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={posterPreview}
                  alt="Poster preview"
                  className="w-full max-h-80 object-cover"
                />
                <button
                  type="button"
                  onClick={() => onFileChange(null)}
                  className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/60 backdrop-blur-sm border border-white/10 flex items-center justify-center text-white/80 hover:text-red-400 transition-colors"
                  aria-label="Remove poster"
                >
                  <X size={15} />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full border-2 border-dashed border-white/15 hover:border-brand-500/60 rounded-2xl py-12 flex flex-col items-center gap-3 text-white/40 hover:text-brand-300 transition-colors"
              >
                <ImagePlus size={32} />
                <span className="text-sm font-medium">Click to upload a poster</span>
                <span className="text-xs">JPG, PNG or WebP — up to 10MB</span>
              </button>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => onFileChange(e.target.files?.[0] ?? null)}
            />

            {posterError && <p className="form-error">{posterError}</p>}
            <p className="text-white/40 text-xs mt-3">
              Tip: a 4:3 landscape image with the event name, date and venue works best.
            </p>
          </div>
        )}

        {/* ── Step 4: Review ── */}
        {step === 3 && (
          <div className="animate-slide-up">
            <h2 className="text-lg font-semibold text-white mb-4">Review your event</h2>

            <div className="space-y-3 text-sm">
              <ReviewRow label="Title" value={watchedValues.title} />
              <ReviewRow
                label="Category"
                value={categoryOptions.find((c) => c.value === watchedValues.categoryId)?.label ?? "—"}
              />
              <ReviewRow label="Date" value={watchedValues.date} />
              <ReviewRow
                label="Time"
                value={
                  watchedValues.startTime || watchedValues.endTime
                    ? `${watchedValues.startTime ?? "?"} – ${watchedValues.endTime ?? "?"}`
                    : "Not specified"
                }
              />
              <ReviewRow label="Venue" value={watchedValues.venue || "Not specified"} />
              <ReviewRow label="Address" value={watchedValues.address || "Not specified"} />
              <ReviewRow
                label="Description"
                value={watchedValues.description || "No description"}
                multiline
              />
              <ReviewRow
                label="Poster"
                value={posterFile ? posterFile.name : "No poster — a default will be shown"}
              />
            </div>

            <div className="bg-brand-900/30 border border-brand-700/40 rounded-xl p-4 mt-6 text-brand-200 text-sm leading-relaxed">
              After submission your event goes to <strong>Pending Review</strong>. An admin will approve
              it before it appears publicly.
            </div>
          </div>
        )}

        {/* ── Navigation ── */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-white/10">
          <button
            type="button"
            onClick={goBack}
            disabled={step === 0 || submitting}
            className="btn-ghost disabled:opacity-40 disabled:pointer-events-none"
          >
            <ChevronLeft size={16} /> Back
          </button>

          {step < STEPS.length - 1 ? (
            <button type="button" onClick={goNext} className="btn-primary">
              Continue <ChevronRight size={16} />
            </button>
          ) : (
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary min-w-[160px]"
            >
              {submitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Submitting…
                </>
              ) : (
                "Submit for Review"
              )}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

function ReviewRow({ label, value, multiline }: { label: string; value?: string; multiline?: boolean }) {
  return (
    <div className={clsx("flex gap-3", multiline && "flex-col")}>
      <span className="text-white/40 w-28 shrink-0">{label}</span>
      <span className={clsx("text-white/90", multiline && "whitespace-pre-line")}>{value || "—"}</span>
    </div>
  );
}

export default function CreateEventPage() {
  return (
    <AuthGuard>
      <div className="container-page py-10">
        <Suspense>
          <CreateEventContent />
        </Suspense>
      </div>
    </AuthGuard>
  );
}
