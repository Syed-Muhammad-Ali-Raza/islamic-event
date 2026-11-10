import {
  api,
  registerUser,
  createCategory,
  createEventAs,
  authHeader,
  unique,
  TestUser,
} from "./helpers";
import { prisma } from "../src/config/prisma";
import { uploadImage } from "../src/modules/upload/storage.service";
import { Errors } from "../src/utils/AppError";

// No network in tests: the storage backend (S3/Cloudinary) is mocked, and the
// assertions cover the HTTP contract around it.
jest.mock("../src/modules/upload/storage.service", () => ({
  uploadImage: jest.fn(),
  deleteImage: jest.fn(),
  imageProvider: jest.fn(() => "s3"),
  isStorageConfigured: jest.fn(() => true),
}));

const uploadImageMock = uploadImage as jest.Mock;

const PNG_1PX = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64"
);

const stored = {
  url: "https://storage.example/event-posters/events/2026-11/poster.webp",
  publicId: "events/2026-11/poster.webp",
  width: 1200,
  height: 800,
  format: "webp",
  bytes: 12_345,
  provider: "s3" as const,
};

describe("Poster uploads", () => {
  let creator: TestUser;
  let other: TestUser;
  let categoryId: string;

  beforeAll(async () => {
    creator = await registerUser("uploader");
    other = await registerUser("uploaderoutsider");
    const category = await createCategory("UploadCat");
    categoryId = category.id;
  });

  beforeEach(() => {
    uploadImageMock.mockReset();
    uploadImageMock.mockResolvedValue(stored);
  });

  it("rejects unauthenticated uploads with 401", async () => {
    const res = await api()
      .post("/api/v1/upload/poster")
      .attach("poster", PNG_1PX, { filename: "poster.png", contentType: "image/png" });

    expect(res.status).toBe(401);
    expect(uploadImageMock).not.toHaveBeenCalled();
  });

  it("answers 400 when no file is attached", async () => {
    const res = await api()
      .post("/api/v1/upload/poster")
      .set(authHeader(creator.token))
      .field("eventId", "irrelevant");

    expect(res.status).toBe(400);
    expect(res.body.code).toBe("MISSING_FILE");
  });

  it("answers 400 for a disallowed file type", async () => {
    const res = await api()
      .post("/api/v1/upload/poster")
      .set(authHeader(creator.token))
      .attach("poster", Buffer.from("not an image"), {
        filename: "notes.txt",
        contentType: "text/plain",
      });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe("INVALID_FILE_TYPE");
    expect(uploadImageMock).not.toHaveBeenCalled();
  });

  it("answers 413 when the file exceeds the size limit", async () => {
    const tooBig = Buffer.alloc(10 * 1024 * 1024 + 1);
    const res = await api()
      .post("/api/v1/upload/poster")
      .set(authHeader(creator.token))
      .attach("poster", tooBig, { filename: "huge.png", contentType: "image/png" });

    expect(res.status).toBe(413);
    expect(res.body.code).toBe("PAYLOAD_TOO_LARGE");
    expect(uploadImageMock).not.toHaveBeenCalled();
  });

  it("stores the poster and returns the storage metadata", async () => {
    const res = await api()
      .post("/api/v1/upload/poster")
      .set(authHeader(creator.token))
      .attach("poster", PNG_1PX, { filename: "poster.png", contentType: "image/png" });

    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({ url: stored.url, publicId: stored.publicId, provider: "s3" });
    expect(uploadImageMock).toHaveBeenCalledTimes(1);
    expect(uploadImageMock.mock.calls[0][1]).toBe("events");
  });

  it("attaches the poster to the caller's event", async () => {
    const event = await createEventAs(creator.id, categoryId, {
      title: `Poster Event ${unique("ev")}`,
    });

    const res = await api()
      .post("/api/v1/upload/poster")
      .set(authHeader(creator.token))
      .field("eventId", event.id)
      .attach("poster", PNG_1PX, { filename: "poster.png", contentType: "image/png" });

    expect(res.status).toBe(201);
    const saved = await prisma.event.findUnique({ where: { id: event.id } });
    expect(saved?.posterUrl).toBe(stored.url);
    expect(saved?.posterPublicId).toBe(stored.publicId);
  });

  it("forbids attaching a poster to someone else's event", async () => {
    const event = await createEventAs(creator.id, categoryId, {
      title: `Foreign Poster ${unique("ev")}`,
    });

    const res = await api()
      .post("/api/v1/upload/poster")
      .set(authHeader(other.token))
      .field("eventId", event.id)
      .attach("poster", PNG_1PX, { filename: "poster.png", contentType: "image/png" });

    expect(res.status).toBe(403);
  });

  it("answers 404 when the target event does not exist", async () => {
    const res = await api()
      .post("/api/v1/upload/poster")
      .set(authHeader(creator.token))
      .field("eventId", "00000000-0000-0000-0000-000000000000")
      .attach("poster", PNG_1PX, { filename: "poster.png", contentType: "image/png" });

    expect(res.status).toBe(404);
  });

  it("surfaces a 503 when image storage is not configured", async () => {
    uploadImageMock.mockRejectedValueOnce(
      Errors.serviceUnavailable("Image uploads are not configured on this deployment.", "IMAGE_STORAGE_UNAVAILABLE")
    );

    const res = await api()
      .post("/api/v1/upload/poster")
      .set(authHeader(creator.token))
      .attach("poster", PNG_1PX, { filename: "poster.png", contentType: "image/png" });

    expect(res.status).toBe(503);
    expect(res.body.code).toBe("IMAGE_STORAGE_UNAVAILABLE");
  });
});
