import { describe, it, expect, vi, beforeEach } from "vitest";

const { get, post, del } = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  del: vi.fn(),
}));

vi.mock("@/lib/api-client", () => ({
  apiClient: { get, post, delete: del },
}));

import { adminService } from "./admin.service";

describe("admin directory image service", () => {
  beforeEach(() => {
    get.mockReset();
    post.mockReset();
    del.mockReset();
  });

  it("lists images for one entity type and skips an empty query", async () => {
    get.mockResolvedValue({ data: { data: [] } });

    await adminService.listDirectoryImages("scholar", "");
    expect(get).toHaveBeenCalledWith("/admin/images", {
      params: { entityType: "scholar", q: undefined },
    });

    await adminService.listDirectoryImages("place", "lahore");
    expect(get).toHaveBeenLastCalledWith("/admin/images", {
      params: { entityType: "place", q: "lahore" },
    });
  });

  it("uploads a multipart form with the target and the image", async () => {
    post.mockResolvedValue({ data: { data: { url: "https://example.test/x.webp" } } });
    const file = new File(["image"], "photo.png", { type: "image/png" });

    const result = await adminService.uploadDirectoryImage("dastarkhwan", "entry-1", file);

    expect(result.url).toBe("https://example.test/x.webp");
    const [path, form, config] = post.mock.calls[0];
    expect(path).toBe("/admin/images");
    expect(config).toEqual({ headers: { "Content-Type": "multipart/form-data" } });
    expect(form).toBeInstanceOf(FormData);
    expect(form.get("entityType")).toBe("dastarkhwan");
    expect(form.get("entityId")).toBe("entry-1");
    expect(form.get("image")).toBe(file);
  });

  it("deletes an image with the entity type and id in the path", async () => {
    del.mockResolvedValue({ data: { data: null } });

    await adminService.removeDirectoryImage("imambargah", "entry-2");

    expect(del).toHaveBeenCalledWith("/admin/images/imambargah/entry-2");
  });
});
