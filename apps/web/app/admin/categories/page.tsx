"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Pencil, PlusCircle, Tags, X } from "lucide-react";
import { useAdminCategories, useCategoryAction } from "@/hooks/useAdmin";
import { Input } from "@/components/ui/FormField";
import type { AdminCategory } from "@/services/admin.service";

const CategorySchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(80, "Name must be under 80 characters"),
  description: z.string().max(500, "Description must be under 500 characters"),
  icon: z.string().max(10, "Icon must be short"),
  sortOrder: z.coerce.number().int("Must be a whole number").min(0, "Cannot be negative"),
});

type CategoryForm = z.infer<typeof CategorySchema>;

function CategoryFormCard({ editing, onClose }: { editing: AdminCategory | null; onClose: () => void }) {
  const action = useCategoryAction();

  const form = useForm<CategoryForm>({
    resolver: zodResolver(CategorySchema),
    defaultValues: {
      name: editing?.name ?? "",
      description: editing?.description ?? "",
      icon: editing?.icon ?? "",
      sortOrder: editing?.sortOrder ?? 0,
    },
  });

  const onSubmit = async (data: CategoryForm) => {
    const payload = {
      name: data.name,
      description: data.description || undefined,
      icon: data.icon || undefined,
      sortOrder: data.sortOrder,
    };

    if (editing) {
      await action.mutateAsync({ type: "update", id: editing.id, data: payload });
    } else {
      await action.mutateAsync({ type: "create", data: payload });
    }
    form.reset();
    onClose();
  };

  return (
    <div className="card-glass p-5 mb-5" id="category-form-card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-slate-900">{editing ? "Edit Category" : "New Category"}</h3>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-700 transition-colors" aria-label="Close form">
          <X size={16} />
        </button>
      </div>

      {action.isError && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 mb-4 text-red-500 text-sm">
          {(action.error as { response?: { data?: { message?: string } } })?.response?.data?.message ??
            "Could not save the category."}
        </div>
      )}

      <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 sm:grid-cols-2 gap-4" noValidate>
        <Input
          id="category-name"
          label="Name"
          placeholder="e.g. Milad"
          error={form.formState.errors.name?.message}
          {...form.register("name")}
        />
        <Input
          id="category-icon"
          label="Icon (emoji)"
          placeholder="🕌"
          error={form.formState.errors.icon?.message}
          {...form.register("icon")}
        />
        <Input
          id="category-description"
          label="Description"
          placeholder="Short description"
          error={form.formState.errors.description?.message}
          {...form.register("description")}
        />
        <Input
          id="category-sort"
          label="Sort order"
          type="number"
          error={form.formState.errors.sortOrder?.message}
          {...form.register("sortOrder")}
        />
        <div className="sm:col-span-2 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="btn-secondary text-sm py-2.5">
            Cancel
          </button>
          <button
            id="category-save"
            type="submit"
            disabled={form.formState.isSubmitting || action.isPending}
            className="btn-primary text-sm py-2.5"
          >
            {action.isPending ? "Saving…" : editing ? "Save Changes" : "Create Category"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function AdminCategoriesPage() {
  const { data, isLoading } = useAdminCategories();
  const action = useCategoryAction();
  const [mode, setMode] = useState<"closed" | "create">("closed");
  const [editing, setEditing] = useState<AdminCategory | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const openCreate = () => {
    setEditing(null);
    setMode("create");
  };

  const openEdit = (cat: AdminCategory) => {
    setEditing(cat);
    setMode("create");
  };

  const closeForm = () => {
    setMode("closed");
    setEditing(null);
  };

  const toggleActive = async (cat: AdminCategory) => {
    setTogglingId(cat.id);
    try {
      await action.mutateAsync({ type: "update", id: cat.id, data: { isActive: !cat.isActive } });
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-semibold text-slate-900">Categories</h2>
        <div className="flex items-center gap-3">
          {data && <span className="text-slate-500 text-sm">{data.length} categories</span>}
          <button id="category-new" onClick={openCreate} className="btn-primary text-sm py-2.5">
            <PlusCircle size={15} /> New Category
          </button>
        </div>
      </div>

      {mode !== "closed" && (
        <CategoryFormCard key={editing?.id ?? "new"} editing={editing} onClose={closeForm} />
      )}

      <div className="card-glass overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-slate-500 text-xs uppercase tracking-wider">
                <th className="px-5 py-3 font-medium">Category</th>
                <th className="px-5 py-3 font-medium">Slug</th>
                <th className="px-5 py-3 font-medium">Events</th>
                <th className="px-5 py-3 font-medium">Sort</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="border-b border-slate-200">
                    <td colSpan={6} className="px-5 py-4">
                      <div className="skeleton h-5 w-full" />
                    </td>
                  </tr>
                ))
              ) : !data || data.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-slate-500">
                    No categories yet.
                  </td>
                </tr>
              ) : (
                data.map((cat) => (
                  <tr
                    key={cat.id}
                    className={`border-b border-slate-200 hover:bg-slate-50 transition-colors ${
                      !cat.isActive ? "opacity-60" : ""
                    }`}
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-brand-50 border border-brand-100 flex items-center justify-center text-lg shrink-0">
                          {cat.icon ?? <Tags size={15} className="text-brand-600" />}
                        </div>
                        <div className="min-w-0">
                          <p className="text-slate-900 font-medium truncate">{cat.name}</p>
                          {cat.description && (
                            <p className="text-slate-500 text-xs truncate max-w-[240px]">{cat.description}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-slate-500 text-xs">{cat.slug}</td>
                    <td className="px-5 py-4 text-slate-700">{cat._count?.events ?? 0}</td>
                    <td className="px-5 py-4 text-slate-500">{cat.sortOrder}</td>
                    <td className="px-5 py-4">
                      <span className={cat.isActive ? "badge-green text-[11px]" : "badge-red text-[11px]"}>
                        {cat.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="inline-flex items-center gap-2">
                        <button
                          id={`category-edit-${cat.slug}`}
                          onClick={() => openEdit(cat)}
                          className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-brand-50 text-brand-700 border border-brand-200 hover:bg-brand-100 transition-colors"
                        >
                          <Pencil size={12} className="inline mr-1" /> Edit
                        </button>
                        <button
                          id={`category-toggle-${cat.slug}`}
                          onClick={() => toggleActive(cat)}
                          disabled={togglingId === cat.id}
                          className={
                            cat.isActive
                              ? "px-2.5 py-1.5 rounded-lg text-xs font-medium bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition-colors disabled:opacity-40"
                              : "px-2.5 py-1.5 rounded-lg text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors disabled:opacity-40"
                          }
                        >
                          {togglingId === cat.id ? "Saving…" : cat.isActive ? "Deactivate" : "Activate"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
