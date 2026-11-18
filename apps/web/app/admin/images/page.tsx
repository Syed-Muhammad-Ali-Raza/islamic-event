"use client";

import { useState } from "react";
import {
  CalendarDays,
  HeartHandshake,
  ImagePlus,
  Landmark,
  Search,
  Soup,
  Sparkles,
  Trash2,
  Tent,
  User,
  Images,
  type LucideIcon,
} from "lucide-react";
import { clsx } from "clsx";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useDirectoryImageAction, useDirectoryImages } from "@/hooks/useAdmin";
import { DirectoryPhoto } from "@/components/ui/DirectoryPhoto";
import type { DirectoryImageEntityType } from "@/services/admin.service";

const ENTITIES: Array<{ value: DirectoryImageEntityType; label: string; icon: LucideIcon }> = [
  { value: "scholar", label: "Scholars", icon: User },
  { value: "place", label: "Places", icon: Landmark },
  { value: "dastarkhwan", label: "Free food", icon: Soup },
  { value: "imambargah", label: "Imambargahs", icon: Landmark },
  { value: "darbar", label: "Darbars", icon: Sparkles },
  { value: "ursDate", label: "Urs dates", icon: CalendarDays },
  { value: "charity", label: "Charities", icon: HeartHandshake },
  { value: "mela", label: "Melas", icon: Tent },
  { value: "event", label: "Events", icon: CalendarDays },
];

function errorMessage(err: unknown, fallback: string): string {
  const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
  return message ?? fallback;
}

export default function AdminImagesPage() {
  const [entityType, setEntityType] = useState<DirectoryImageEntityType>("scholar");
  const [input, setInput] = useState("");
  const q = useDebouncedValue(input, 250);
  const { data, isLoading } = useDirectoryImages(entityType, q.trim());
  const action = useDirectoryImageAction();
  const [error, setError] = useState<string | null>(null);

  const active = ENTITIES.find((entity) => entity.value === entityType) ?? ENTITIES[0];
  const ActiveIcon = active.icon;

  const changeEntity = (type: DirectoryImageEntityType) => {
    setEntityType(type);
    setError(null);
  };

  const run = async (next: Parameters<typeof action.mutateAsync>[0]) => {
    setError(null);
    try {
      await action.mutateAsync(next);
    } catch (err) {
      setError(errorMessage(err, "Could not save the image. Please try again."));
    }
  };

  const pickFile = (type: DirectoryImageEntityType, id: string, file: File | undefined) => {
    if (!file) return;
    void run({ type: "upload", entityType: type, entityId: id, file });
  };

  return (
    <div>
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-slate-900">Directory images</h2>
        <p className="text-slate-500 text-sm mt-1">
          Add a reference photo to any entry. It appears on the public card within a minute.
          JPG, PNG or WebP, up to 10 MB.
        </p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 mb-5 text-red-600 text-sm">
          {error}
        </div>
      )}

      <div className="card-glass p-4 sm:p-5 mb-5">
        <div className="flex flex-wrap items-center gap-2 mb-4">
          {ENTITIES.map((entity) => {
            const Icon = entity.icon;
            return (
              <button
                key={entity.value}
                type="button"
                aria-pressed={entityType === entity.value}
                onClick={() => changeEntity(entity.value)}
                className={clsx(
                  "inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold border transition-colors cursor-pointer",
                  entityType === entity.value
                    ? "bg-brand-600 text-white border-brand-600"
                    : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                )}
              >
                <Icon size={13} />
                {entity.label}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-3 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus-within:border-brand-500 focus-within:bg-white transition-all">
          <Search size={16} className="text-slate-400 shrink-0" aria-hidden />
          <input
            type="search"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder={`Search ${active.label.toLowerCase()} by name or city`}
            aria-label={`Search ${active.label}`}
            className="flex-1 bg-transparent text-slate-900 placeholder-slate-400 text-sm focus:outline-none"
          />
          {data && <span className="text-xs text-slate-400 shrink-0">{data.length} shown</span>}
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="skeleton h-24 rounded-2xl" />
          ))}
        </div>
      ) : !data || data.length === 0 ? (
        <div className="card-glass py-14 text-center text-slate-500 text-sm">
          No matching entries. Try a different search or directory.
        </div>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {data.map((item) => {
              const busy =
                action.isPending &&
                action.variables?.type === "upload" &&
                action.variables.entityId === item.id &&
                action.variables.entityType === entityType;
              const removing =
                action.isPending &&
                action.variables?.type === "remove" &&
                action.variables.entityId === item.id &&
                action.variables.entityType === entityType;

              return (
                <div
                  key={item.id}
                  className="card-glass p-3 flex items-center gap-3 min-w-0"
                >
                  <DirectoryPhoto
                    src={item.imageUrl}
                    alt={item.name}
                    icon={ActiveIcon}
                    variant="compact"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-900 truncate">{item.name}</p>
                    <p className="text-xs text-slate-500 truncate">{item.subtitle}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <label
                        className={clsx(
                          "inline-flex items-center gap-1.5 rounded-lg border border-brand-200 bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700 cursor-pointer hover:bg-brand-100 transition-colors",
                          (busy || removing) && "opacity-50 cursor-not-allowed"
                        )}
                      >
                        <ImagePlus size={13} aria-hidden />
                        {busy ? "Uploading…" : item.hasImage ? "Replace" : "Upload"}
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          className="sr-only"
                          disabled={busy || removing}
                          onChange={(event) => {
                            pickFile(item.entityType, item.id, event.target.files?.[0]);
                            event.target.value = "";
                          }}
                        />
                      </label>
                      {item.hasImage && (
                        <button
                          type="button"
                          disabled={busy || removing}
                          onClick={() =>
                            void run({ type: "remove", entityType: item.entityType, entityId: item.id })
                          }
                          className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-600 hover:bg-red-100 transition-colors disabled:opacity-50 cursor-pointer"
                        >
                          <Trash2 size={13} aria-hidden />
                          {removing ? "Removing…" : "Remove"}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <p className="text-xs text-slate-400 mt-4">
            <Images size={12} className="inline mr-1" aria-hidden />
            Showing the first 50 matches. Narrow your search to find another entry.
          </p>
        </>
      )}
    </div>
  );
}
