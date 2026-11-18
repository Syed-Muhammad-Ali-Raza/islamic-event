import {
  api,
  authHeader,
  createAdmin,
  createCategory,
  createEventAs,
  registerUser,
  unique,
  type TestUser,
} from "./helpers";
import { prisma } from "../src/config/prisma";
import { deleteImage, uploadImage } from "../src/modules/upload/storage.service";
import { Errors } from "../src/utils/AppError";

// No network in tests: the storage backend is mocked and the HTTP contract is
// asserted around it.
jest.mock("../src/modules/upload/storage.service", () => ({
  uploadImage: jest.fn(),
  deleteImage: jest.fn(),
  imageProvider: jest.fn(() => "s3"),
  isStorageConfigured: jest.fn(() => true),
}));

const uploadImageMock = uploadImage as jest.Mock;
const deleteImageMock = deleteImage as jest.Mock;

const PNG_1PX = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64"
);

const stored = {
  url: "https://storage.example/directory/scholars/2026-11/image.webp",
  publicId: "scholars/2026-11/image.webp",
  width: 800,
  height: 800,
  format: "webp",
  bytes: 9_876,
  provider: "s3" as const,
};

describe("Admin directory image uploads", () => {
  let admin: TestUser;
  let user: TestUser;
  let scholarId: string;
  let scholarToken: string;
  let eventId: string;
  let categoryId: string;

  beforeAll(async () => {
    admin = await createAdmin("dirimgadmin");
    user = await registerUser("dirimguser");
    scholarToken = unique("dirimgscholar");
    const scholar = await prisma.scholar.create({
      data: {
        sourceId: unique("dirimgsrc"),
        slug: unique("dirimgslug"),
        name: `${scholarToken} Scholar`,
        sect: "SUNNI",
        category: "SCHOLAR",
      },
    });
    scholarId = scholar.id;

    const category = await createCategory("DirImgCat");
    categoryId = category.id;
    const event = await createEventAs(admin.id, categoryId, {
      title: `${unique("dirimgevent")} Event`,
    });
    eventId = event.id;
  });

  beforeEach(() => {
    uploadImageMock.mockReset();
    deleteImageMock.mockReset();
    uploadImageMock.mockResolvedValue(stored);
    deleteImageMock.mockResolvedValue(undefined);
  });

  afterAll(async () => {
    await prisma.event.deleteMany({ where: { id: eventId } });
    await prisma.scholar.deleteMany({ where: { id: scholarId } });
    await prisma.category.deleteMany({ where: { id: categoryId } });
  });

  it("rejects unauthenticated uploads with 401", async () => {
    const res = await api()
      .post("/api/v1/admin/images")
      .field("entityType", "scholar")
      .field("entityId", scholarId)
      .attach("image", PNG_1PX, { filename: "photo.png", contentType: "image/png" });

    expect(res.status).toBe(401);
    expect(uploadImageMock).not.toHaveBeenCalled();
  });

  it("forbids regular users with 403", async () => {
    const res = await api()
      .post("/api/v1/admin/images")
      .set(authHeader(user.token))
      .field("entityType", "scholar")
      .field("entityId", scholarId)
      .attach("image", PNG_1PX, { filename: "photo.png", contentType: "image/png" });

    expect(res.status).toBe(403);
    expect(uploadImageMock).not.toHaveBeenCalled();
  });

  it("answers 422 for an unsupported entity type", async () => {
    const res = await api()
      .post("/api/v1/admin/images")
      .set(authHeader(admin.token))
      .field("entityType", "secret")
      .field("entityId", scholarId)
      .attach("image", PNG_1PX, { filename: "photo.png", contentType: "image/png" });

    expect(res.status).toBe(422);
    expect(uploadImageMock).not.toHaveBeenCalled();
  });

  it("answers 400 when no file is attached", async () => {
    const res = await api()
      .post("/api/v1/admin/images")
      .set(authHeader(admin.token))
      .field("entityType", "scholar")
      .field("entityId", scholarId);

    expect(res.status).toBe(400);
    expect(res.body.code).toBe("MISSING_FILE");
  });

  it("answers 404 when the target does not exist", async () => {
    const res = await api()
      .post("/api/v1/admin/images")
      .set(authHeader(admin.token))
      .field("entityType", "scholar")
      .field("entityId", "00000000-0000-0000-0000-000000000000")
      .attach("image", PNG_1PX, { filename: "photo.png", contentType: "image/png" });

    expect(res.status).toBe(404);
    expect(uploadImageMock).not.toHaveBeenCalled();
  });

  it("stores a scholar image, exposes it publicly and lists it for admins", async () => {
    const res = await api()
      .post("/api/v1/admin/images")
      .set(authHeader(admin.token))
      .field("entityType", "scholar")
      .field("entityId", scholarId)
      .attach("image", PNG_1PX, { filename: "photo.png", contentType: "image/png" });

    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({
      url: stored.url,
      publicId: stored.publicId,
      entityType: "scholar",
      entityId: scholarId,
    });
    expect(uploadImageMock.mock.calls[0][1]).toBe("scholars");

    const saved = await prisma.scholar.findUnique({ where: { id: scholarId } });
    expect(saved?.imageUrl).toBe(stored.url);
    expect(saved?.imagePublicId).toBe(stored.publicId);

    const publicList = await api().get("/api/v1/scholars").query({ q: scholarToken });
    expect(publicList.status).toBe(200);
    expect(publicList.body.data).toEqual(
      expect.arrayContaining([expect.objectContaining({ id: scholarId, imageUrl: stored.url })])
    );

    const adminList = await api()
      .get("/api/v1/admin/images")
      .set(authHeader(admin.token))
      .query({ entityType: "scholar", q: scholarToken });
    expect(adminList.status).toBe(200);
    expect(adminList.body.data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: scholarId, hasImage: true, imageUrl: stored.url }),
      ])
    );
    expect(adminList.body.data[0]).not.toHaveProperty("imagePublicId");
  });

  it("deletes the previous object when replacing an image", async () => {
    await prisma.scholar.update({
      where: { id: scholarId },
      data: { imagePublicId: "scholars/old-image.webp" },
    });

    const res = await api()
      .post("/api/v1/admin/images")
      .set(authHeader(admin.token))
      .field("entityType", "scholar")
      .field("entityId", scholarId)
      .attach("image", PNG_1PX, { filename: "photo.png", contentType: "image/png" });

    expect(res.status).toBe(201);
    expect(deleteImageMock).toHaveBeenCalledWith("scholars/old-image.webp");
  });

  it("can attach an event poster through the same admin flow", async () => {
    const res = await api()
      .post("/api/v1/admin/images")
      .set(authHeader(admin.token))
      .field("entityType", "event")
      .field("entityId", eventId)
      .attach("image", PNG_1PX, { filename: "poster.png", contentType: "image/png" });

    expect(res.status).toBe(201);
    expect(uploadImageMock.mock.calls[0][1]).toBe("events");
    const saved = await prisma.event.findUnique({ where: { id: eventId } });
    expect(saved?.posterUrl).toBe(stored.url);
    expect(saved?.posterPublicId).toBe(stored.publicId);
  });

  it("removes an image and its object", async () => {
    const res = await api()
      .delete(`/api/v1/admin/images/scholar/${scholarId}`)
      .set(authHeader(admin.token));

    expect(res.status).toBe(200);
    expect(deleteImageMock).toHaveBeenCalledWith(stored.publicId);
    const saved = await prisma.scholar.findUnique({ where: { id: scholarId } });
    expect(saved?.imageUrl).toBeNull();
    expect(saved?.imagePublicId).toBeNull();
  });

  it("surfaces 503 when image storage is not configured", async () => {
    uploadImageMock.mockRejectedValueOnce(
      Errors.serviceUnavailable("Image uploads are not configured on this deployment.", "IMAGE_STORAGE_UNAVAILABLE")
    );

    const res = await api()
      .post("/api/v1/admin/images")
      .set(authHeader(admin.token))
      .field("entityType", "scholar")
      .field("entityId", scholarId)
      .attach("image", PNG_1PX, { filename: "photo.png", contentType: "image/png" });

    expect(res.status).toBe(503);
    expect(res.body.code).toBe("IMAGE_STORAGE_UNAVAILABLE");
  });
});
