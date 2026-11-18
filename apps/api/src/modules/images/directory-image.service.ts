import { prisma } from "../../config/prisma";
import type { ImageEntityType } from "./directory-image.validation";

// The admin media manager is deliberately the only writer of these fields:
// public directory APIs expose imageUrl but never imagePublicId.

export interface DirectoryImageItem {
  entityType: ImageEntityType;
  id: string;
  name: string;
  subtitle: string;
  imageUrl: string | null;
  hasImage: boolean;
}

interface ImageTarget {
  name: string;
  imageUrl: string | null;
  imagePublicId: string | null;
}

const FOLDERS: Record<ImageEntityType, string> = {
  scholar: "scholars",
  place: "places",
  dastarkhwan: "dastarkhwans",
  imambargah: "imambargahs",
  darbar: "darbars",
  ursDate: "urs-dates",
  charity: "charities",
  mela: "melas",
  event: "events",
};

const LIST_LIMIT = 50;

export function imageFolder(entityType: ImageEntityType): string {
  return FOLDERS[entityType];
}

function like(term: string) {
  return { contains: term, mode: "insensitive" as const };
}

function place(parts: Array<string | null | undefined>): string {
  const values = parts.filter((part): part is string => Boolean(part && part.trim()));
  return values.length > 0 ? values.join(", ") : "Location not listed";
}

export async function listDirectoryImages(
  entityType: ImageEntityType,
  query: string
): Promise<DirectoryImageItem[]> {
  const term = query.trim();
  const search = like(term);

  switch (entityType) {
    case "scholar": {
      const rows = await prisma.scholar.findMany({
        where: term ? { OR: [{ name: search }, { city: search }, { country: search }] } : {},
        select: { id: true, name: true, city: true, country: true, imageUrl: true },
        orderBy: { name: "asc" },
        take: LIST_LIMIT,
      });
      return rows.map((row) => ({
        entityType,
        id: row.id,
        name: row.name,
        subtitle: place([row.city, row.country]),
        imageUrl: row.imageUrl,
        hasImage: Boolean(row.imageUrl),
      }));
    }
    case "place": {
      const rows = await prisma.place.findMany({
        where: term ? { OR: [{ name: search }, { city: search }, { province: search }] } : {},
        select: { id: true, name: true, city: true, province: true, imageUrl: true },
        orderBy: { name: "asc" },
        take: LIST_LIMIT,
      });
      return rows.map((row) => ({
        entityType,
        id: row.id,
        name: row.name,
        subtitle: place([row.city, row.province]),
        imageUrl: row.imageUrl,
        hasImage: Boolean(row.imageUrl),
      }));
    }
    case "dastarkhwan": {
      const rows = await prisma.dastarkhwan.findMany({
        where: term ? { OR: [{ name: search }, { city: search }, { area: search }] } : {},
        select: { id: true, name: true, city: true, area: true, imageUrl: true },
        orderBy: { name: "asc" },
        take: LIST_LIMIT,
      });
      return rows.map((row) => ({
        entityType,
        id: row.id,
        name: row.name,
        subtitle: place([row.city, row.area]),
        imageUrl: row.imageUrl,
        hasImage: Boolean(row.imageUrl),
      }));
    }
    case "imambargah": {
      const rows = await prisma.imambargah.findMany({
        where: term ? { OR: [{ name: search }, { city: search }, { area: search }] } : {},
        select: { id: true, name: true, city: true, area: true, imageUrl: true },
        orderBy: { name: "asc" },
        take: LIST_LIMIT,
      });
      return rows.map((row) => ({
        entityType,
        id: row.id,
        name: row.name,
        subtitle: place([row.city, row.area]),
        imageUrl: row.imageUrl,
        hasImage: Boolean(row.imageUrl),
      }));
    }
    case "darbar": {
      const rows = await prisma.darbar.findMany({
        where: term ? { OR: [{ name: search }, { saint: search }, { city: search }] } : {},
        select: { id: true, name: true, city: true, province: true, imageUrl: true },
        orderBy: { name: "asc" },
        take: LIST_LIMIT,
      });
      return rows.map((row) => ({
        entityType,
        id: row.id,
        name: row.name,
        subtitle: place([row.city, row.province]),
        imageUrl: row.imageUrl,
        hasImage: Boolean(row.imageUrl),
      }));
    }
    case "ursDate": {
      const rows = await prisma.ursDate.findMany({
        where: term ? { OR: [{ name: search }, { saint: search }, { city: search }] } : {},
        select: { id: true, name: true, saint: true, city: true, imageUrl: true },
        orderBy: { name: "asc" },
        take: LIST_LIMIT,
      });
      return rows.map((row) => ({
        entityType,
        id: row.id,
        name: row.name,
        subtitle: place([row.saint, row.city]),
        imageUrl: row.imageUrl,
        hasImage: Boolean(row.imageUrl),
      }));
    }
    case "charity": {
      const rows = await prisma.charity.findMany({
        where: term ? { OR: [{ name: search }, { city: search }, { province: search }] } : {},
        select: { id: true, name: true, city: true, province: true, imageUrl: true },
        orderBy: { name: "asc" },
        take: LIST_LIMIT,
      });
      return rows.map((row) => ({
        entityType,
        id: row.id,
        name: row.name,
        subtitle: place([row.city, row.province]),
        imageUrl: row.imageUrl,
        hasImage: Boolean(row.imageUrl),
      }));
    }
    case "mela": {
      const rows = await prisma.mela.findMany({
        where: term ? { OR: [{ name: search }, { city: search }, { venue: search }] } : {},
        select: { id: true, name: true, city: true, province: true, imageUrl: true },
        orderBy: { name: "asc" },
        take: LIST_LIMIT,
      });
      return rows.map((row) => ({
        entityType,
        id: row.id,
        name: row.name,
        subtitle: place([row.city, row.province]),
        imageUrl: row.imageUrl,
        hasImage: Boolean(row.imageUrl),
      }));
    }
    case "event": {
      const rows = await prisma.event.findMany({
        where: term ? { OR: [{ title: search }, { venue: search }, { description: search }] } : {},
        select: {
          id: true,
          title: true,
          venue: true,
          city: { select: { name: true } },
          posterUrl: true,
        },
        orderBy: { date: "desc" },
        take: LIST_LIMIT,
      });
      return rows.map((row) => ({
        entityType,
        id: row.id,
        name: row.title,
        subtitle: place([row.venue, row.city?.name]),
        imageUrl: row.posterUrl,
        hasImage: Boolean(row.posterUrl),
      }));
    }
  }
}

export async function getImageTarget(
  entityType: ImageEntityType,
  id: string
): Promise<ImageTarget | null> {
  switch (entityType) {
    case "scholar": {
      const row = await prisma.scholar.findUnique({
        where: { id },
        select: { name: true, imageUrl: true, imagePublicId: true },
      });
      return row ? { name: row.name, imageUrl: row.imageUrl, imagePublicId: row.imagePublicId } : null;
    }
    case "place": {
      const row = await prisma.place.findUnique({
        where: { id },
        select: { name: true, imageUrl: true, imagePublicId: true },
      });
      return row ? { name: row.name, imageUrl: row.imageUrl, imagePublicId: row.imagePublicId } : null;
    }
    case "dastarkhwan": {
      const row = await prisma.dastarkhwan.findUnique({
        where: { id },
        select: { name: true, imageUrl: true, imagePublicId: true },
      });
      return row ? { name: row.name, imageUrl: row.imageUrl, imagePublicId: row.imagePublicId } : null;
    }
    case "imambargah": {
      const row = await prisma.imambargah.findUnique({
        where: { id },
        select: { name: true, imageUrl: true, imagePublicId: true },
      });
      return row ? { name: row.name, imageUrl: row.imageUrl, imagePublicId: row.imagePublicId } : null;
    }
    case "darbar": {
      const row = await prisma.darbar.findUnique({
        where: { id },
        select: { name: true, imageUrl: true, imagePublicId: true },
      });
      return row ? { name: row.name, imageUrl: row.imageUrl, imagePublicId: row.imagePublicId } : null;
    }
    case "ursDate": {
      const row = await prisma.ursDate.findUnique({
        where: { id },
        select: { name: true, imageUrl: true, imagePublicId: true },
      });
      return row ? { name: row.name, imageUrl: row.imageUrl, imagePublicId: row.imagePublicId } : null;
    }
    case "charity": {
      const row = await prisma.charity.findUnique({
        where: { id },
        select: { name: true, imageUrl: true, imagePublicId: true },
      });
      return row ? { name: row.name, imageUrl: row.imageUrl, imagePublicId: row.imagePublicId } : null;
    }
    case "mela": {
      const row = await prisma.mela.findUnique({
        where: { id },
        select: { name: true, imageUrl: true, imagePublicId: true },
      });
      return row ? { name: row.name, imageUrl: row.imageUrl, imagePublicId: row.imagePublicId } : null;
    }
    case "event": {
      const row = await prisma.event.findUnique({
        where: { id },
        select: { title: true, posterUrl: true, posterPublicId: true },
      });
      return row
        ? { name: row.title, imageUrl: row.posterUrl, imagePublicId: row.posterPublicId }
        : null;
    }
  }
}

export async function setDirectoryImage(
  entityType: ImageEntityType,
  id: string,
  url: string,
  publicId: string
): Promise<void> {
  switch (entityType) {
    case "scholar":
    case "place":
    case "dastarkhwan":
    case "imambargah":
    case "darbar":
    case "ursDate":
    case "charity":
    case "mela": {
      const data = { imageUrl: url, imagePublicId: publicId };
      switch (entityType) {
        case "scholar":
          await prisma.scholar.update({ where: { id }, data });
          break;
        case "place":
          await prisma.place.update({ where: { id }, data });
          break;
        case "dastarkhwan":
          await prisma.dastarkhwan.update({ where: { id }, data });
          break;
        case "imambargah":
          await prisma.imambargah.update({ where: { id }, data });
          break;
        case "darbar":
          await prisma.darbar.update({ where: { id }, data });
          break;
        case "ursDate":
          await prisma.ursDate.update({ where: { id }, data });
          break;
        case "charity":
          await prisma.charity.update({ where: { id }, data });
          break;
        case "mela":
          await prisma.mela.update({ where: { id }, data });
          break;
      }
      break;
    }
    case "event":
      await prisma.event.update({
        where: { id },
        data: { posterUrl: url, posterPublicId: publicId },
      });
      break;
  }
}

export async function clearDirectoryImage(
  entityType: ImageEntityType,
  id: string
): Promise<void> {
  switch (entityType) {
    case "scholar":
      await prisma.scholar.update({ where: { id }, data: { imageUrl: null, imagePublicId: null } });
      break;
    case "place":
      await prisma.place.update({ where: { id }, data: { imageUrl: null, imagePublicId: null } });
      break;
    case "dastarkhwan":
      await prisma.dastarkhwan.update({ where: { id }, data: { imageUrl: null, imagePublicId: null } });
      break;
    case "imambargah":
      await prisma.imambargah.update({ where: { id }, data: { imageUrl: null, imagePublicId: null } });
      break;
    case "darbar":
      await prisma.darbar.update({ where: { id }, data: { imageUrl: null, imagePublicId: null } });
      break;
    case "ursDate":
      await prisma.ursDate.update({ where: { id }, data: { imageUrl: null, imagePublicId: null } });
      break;
    case "charity":
      await prisma.charity.update({ where: { id }, data: { imageUrl: null, imagePublicId: null } });
      break;
    case "mela":
      await prisma.mela.update({ where: { id }, data: { imageUrl: null, imagePublicId: null } });
      break;
    case "event":
      await prisma.event.update({
        where: { id },
        data: { posterUrl: null, posterPublicId: null },
      });
      break;
  }
}
