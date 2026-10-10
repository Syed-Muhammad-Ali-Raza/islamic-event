import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database…");

  // ─── Categories ──────────────────────────────────────────────────────────────
  const categories = [
    { name: "Majlis", slug: "majlis", description: "Religious gatherings, particularly in Shia tradition", sortOrder: 1 },
    { name: "Milad", slug: "milad", description: "Celebration of the Prophet's birth ﷺ", sortOrder: 2 },
    { name: "Mehfil-e-Naat", slug: "mehfil-e-naat", description: "Gatherings for recitation of Naats in praise of the Prophet ﷺ", sortOrder: 3 },
    { name: "Dars", slug: "dars", description: "Religious lectures and lessons", sortOrder: 4 },
    { name: "Quran Khwani", slug: "quran-khwani", description: "Quranic recitation gatherings", sortOrder: 5 },
    { name: "Jashan", slug: "jashan", description: "Joyful religious celebrations", sortOrder: 6 },
    { name: "Urs", slug: "urs", description: "Annual commemoration of saints", sortOrder: 7 },
    { name: "Seerat-un-Nabi", slug: "seerat-un-nabi", description: "Programs on the life and character of the Prophet ﷺ", sortOrder: 8 },
    { name: "Muharram", slug: "muharram", description: "Programs related to Muharram and Karbala", sortOrder: 9 },
    { name: "Ramadan", slug: "ramadan", description: "Ramadan programs and events", sortOrder: 10 },
    { name: "Iftar", slug: "iftar", description: "Iftar gatherings and dinners", sortOrder: 11 },
    { name: "Charity", slug: "charity", description: "Charitable events and fundraisers", sortOrder: 12 },
    { name: "Community", slug: "community", description: "General community gatherings", sortOrder: 13 },
    { name: "Educational", slug: "educational", description: "Educational programs and workshops", sortOrder: 14 },
    { name: "Other", slug: "other", description: "Other religious and community events", sortOrder: 15 },
  ];

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    });
  }
  console.log(`  ✓ ${categories.length} categories seeded`);

  // ─── Countries ────────────────────────────────────────────────────────────────
  const countries = [
    { name: "Pakistan", code: "PK", dialCode: "+92" },
    { name: "India", code: "IN", dialCode: "+91" },
    { name: "United Kingdom", code: "GB", dialCode: "+44" },
    { name: "United States", code: "US", dialCode: "+1" },
    { name: "Canada", code: "CA", dialCode: "+1" },
    { name: "United Arab Emirates", code: "AE", dialCode: "+971" },
    { name: "Saudi Arabia", code: "SA", dialCode: "+966" },
    { name: "Australia", code: "AU", dialCode: "+61" },
    { name: "Bangladesh", code: "BD", dialCode: "+880" },
  ];

  for (const country of countries) {
    await prisma.country.upsert({
      where: { code: country.code },
      update: {},
      create: country,
    });
  }
  console.log(`  ✓ ${countries.length} countries seeded`);

  // ─── Pakistan cities ───────────────────────────────────────────────────────
  const pakistan = await prisma.country.findUnique({ where: { code: "PK" } });
  if (pakistan) {
    const punjabState = await prisma.state.upsert({
      where: { name_countryId: { name: "Punjab", countryId: pakistan.id } },
      update: {},
      create: { name: "Punjab", countryId: pakistan.id },
    });

    const sindState = await prisma.state.upsert({
      where: { name_countryId: { name: "Sindh", countryId: pakistan.id } },
      update: {},
      create: { name: "Sindh", countryId: pakistan.id },
    });

    const kpkState = await prisma.state.upsert({
      where: { name_countryId: { name: "Khyber Pakhtunkhwa", countryId: pakistan.id } },
      update: {},
      create: { name: "Khyber Pakhtunkhwa", countryId: pakistan.id },
    });

    const cities = [
      { name: "Lahore", slug: "lahore", stateId: punjabState.id },
      { name: "Karachi", slug: "karachi", stateId: sindState.id },
      { name: "Islamabad", slug: "islamabad", stateId: punjabState.id },
      { name: "Rawalpindi", slug: "rawalpindi", stateId: punjabState.id },
      { name: "Faisalabad", slug: "faisalabad", stateId: punjabState.id },
      { name: "Multan", slug: "multan", stateId: punjabState.id },
      { name: "Peshawar", slug: "peshawar", stateId: kpkState.id },
      { name: "Quetta", slug: "quetta", stateId: kpkState.id },
    ];

    for (const city of cities) {
      await prisma.city.upsert({
        where: { slug_stateId: { slug: city.slug, stateId: city.stateId } },
        update: {},
        create: city,
      });
    }
    console.log(`  ✓ Pakistan cities seeded`);
  }

  // ─── Admin user ───────────────────────────────────────────────────────────────
  // ── Free Dastarkhwan points (idempotent; preserves admin edits) ──────────
  const dastarkhwanFile = path.join(__dirname, "data", "dastarkhwan-points.json");
  if (fs.existsSync(dastarkhwanFile)) {
    const raw = JSON.parse(fs.readFileSync(dastarkhwanFile, "utf8"));
    const points: Array<{
      id: string; name: string; city: string; area?: string | null; address: string;
      google_maps_url?: string | null; latitude?: number | null; longitude?: number | null;
      type: string; schedule?: string | null; source?: string | null; source_year?: string | null;
      verified?: boolean; notes?: string | null;
    }> = raw.points ?? [];

    for (const p of points) {
      await prisma.dastarkhwan.upsert({
        where: { sourceId: p.id },
        update: {},
        create: {
          sourceId: p.id,
          name: p.name,
          city: p.city,
          area: p.area ?? null,
          address: p.address,
          googleMapsUrl: p.google_maps_url ?? null,
          latitude: p.latitude ?? null,
          longitude: p.longitude ?? null,
          type: p.type,
          schedule: p.schedule ?? null,
          sourceUrl: p.source ?? null,
          sourceYear: p.source_year ?? null,
          verified: p.verified ?? false,
          notes: p.notes ?? null,
        },
      });
    }
    console.log(`  ✓ ${points.length} free dastarkhwan points seeded`);
  }

  // ── Imambargahs / Karbalas (idempotent; preserves admin edits) ─────────────
  const imambargahFile = path.join(__dirname, "data", "imambargahs.json");
  if (fs.existsSync(imambargahFile)) {
    const raw = JSON.parse(fs.readFileSync(imambargahFile, "utf8"));
    const points: Array<{
      id: string; name: string; city: string; area?: string | null; address: string;
      google_maps_url?: string | null; latitude?: number | null; longitude?: number | null;
      year_built?: string | null; founder_or_caretaker?: string | null; contact?: string | null;
      notes?: string | null; source?: string | null; verified?: boolean; confidence?: string;
    }> = raw.points ?? [];

    for (const p of points) {
      await prisma.imambargah.upsert({
        where: { sourceId: p.id },
        update: {},
        create: {
          sourceId: p.id,
          name: p.name,
          city: p.city,
          area: p.area ?? null,
          address: p.address,
          googleMapsUrl: p.google_maps_url ?? null,
          latitude: p.latitude ?? null,
          longitude: p.longitude ?? null,
          yearBuilt: p.year_built ?? null,
          founderOrCaretaker: p.founder_or_caretaker ?? null,
          contact: p.contact ?? null,
          notes: p.notes ?? null,
          sourceUrl: p.source ?? null,
          verified: p.verified ?? false,
          confidence: p.confidence ?? "unconfirmed",
        },
      });
    }
    console.log(`  ✓ ${points.length} imambargah points seeded`);
  }

  // ── Pakistan places (historical / religious / cultural / natural) ──────────
  const placesFile = path.join(__dirname, "data", "pakistan-places.json");
  if (fs.existsSync(placesFile)) {
    const raw = JSON.parse(fs.readFileSync(placesFile, "utf8"));
    const places: Array<{
      id: string; name: string; category: string; type: string; city: string; province: string;
      address: string; map_link?: string | null;
      built?: { year?: string | null; builder?: string | null } | null;
      unesco_status?: string | null;
      visiting?: { timings?: string | null; ticket?: string | null } | null;
      description?: string | null; source_link?: string | null;
    }> = raw.places ?? [];

    for (const p of places) {
      await prisma.place.upsert({
        where: { sourceId: p.id },
        update: {},
        create: {
          sourceId: p.id,
          name: p.name,
          category: p.category,
          type: p.type,
          city: p.city,
          province: p.province,
          address: p.address,
          mapLink: p.map_link ?? null,
          builtYear: p.built?.year ?? null,
          builtBuilder: p.built?.builder ?? null,
          unescoStatus: p.unesco_status ?? null,
          timings: p.visiting?.timings ?? null,
          ticket: p.visiting?.ticket ?? null,
          description: p.description ?? null,
          sourceLink: p.source_link ?? null,
        },
      });
    }
    console.log(`  ✓ ${places.length} Pakistan places seeded`);
  }

  // ── Darbars (Sufi shrines) ────────────────────────────────────────────────
  const darbarsFile = path.join(__dirname, "data", "pakistan-darbars.json");
  if (fs.existsSync(darbarsFile)) {
    const raw = JSON.parse(fs.readFileSync(darbarsFile, "utf8"));
    const darbars: Array<{
      id: string; name: string; saint: string; saint_death_year?: string | null;
      urs_date?: string | null; city: string; province: string; address: string;
      map_link?: string | null; timings?: string | null; description?: string | null;
      source_link?: string | null;
    }> = raw.darbars ?? [];

    for (const d of darbars) {
      await prisma.darbar.upsert({
        where: { sourceId: d.id },
        update: {},
        create: {
          sourceId: d.id,
          name: d.name,
          saint: d.saint,
          saintDeathYear: d.saint_death_year ?? null,
          ursDate: d.urs_date ?? null,
          city: d.city,
          province: d.province,
          address: d.address,
          mapLink: d.map_link ?? null,
          timings: d.timings ?? null,
          description: d.description ?? null,
          sourceLink: d.source_link ?? null,
        },
      });
    }
    console.log(`  ✓ ${darbars.length} darbars seeded`);
  }

  // ── Urs dates (researched schedules; idempotent) ──────────────────────────
  const ursFile = path.join(__dirname, "data", "pakistan-urs-dates.json");
  if (fs.existsSync(ursFile)) {
    const raw = JSON.parse(fs.readFileSync(ursFile, "utf8"));
    const upcomingOrder: Record<string, number> = {
      "shah-rukn-alam": 1,
      "sultan-bahu": 2,
      "golra-sharif-babuji": 3,
      "lal-shahbaz": 4,
      "sachal-sarmast": 5,
      "madhu-lal-hussain": 6,
      "golra-sharif-lala-ji": 7,
      "abdullah-shah-ghazi": 8,
      "baba-farid": 9,
      "shah-latif": 10,
      "data-darbar": 11,
      "golra-sharif-mehr-ali-shah": 12,
      "bari-imam": 13,
      "bulleh-shah": 14,
    };

    const researched: Array<{
      id: string; name: string; saint: string; saint_death_year?: string | null; city: string;
      urs_rule?: string | null; calendar_basis?: string | null; last_observed?: string | null;
      next_expected?: string | null; confidence?: string; sources?: string[]; notes?: string | null;
    }> = raw.shrines_with_researched_dates ?? [];
    const unverified: Array<{
      id: string; name: string; saint: string; saint_death_year?: string | null; city: string;
      how_to_confirm?: string | null;
    }> = raw.shrines_not_verified ?? [];

    for (const u of researched) {
      await prisma.ursDate.upsert({
        where: { sourceId: u.id },
        update: {},
        create: {
          sourceId: u.id,
          name: u.name,
          saint: u.saint,
          saintDeathYear: u.saint_death_year ?? null,
          city: u.city,
          ursRule: u.urs_rule ?? null,
          calendarBasis: u.calendar_basis ?? null,
          lastObserved: u.last_observed ?? null,
          nextExpected: u.next_expected ?? null,
          confidence: u.confidence ?? "medium",
          sources: (u.sources ?? []).join(" ; ") || null,
          notes: u.notes ?? null,
          researched: true,
          upcomingOrder: upcomingOrder[u.id] ?? null,
        },
      });
    }

    for (const u of unverified) {
      await prisma.ursDate.upsert({
        where: { sourceId: u.id },
        update: {},
        create: {
          sourceId: u.id,
          name: u.name,
          saint: u.saint,
          saintDeathYear: u.saint_death_year ?? null,
          city: u.city,
          confidence: "none",
          howToConfirm: u.how_to_confirm ?? null,
          researched: false,
        },
      });
    }

    console.log(`  ✓ ${researched.length + unverified.length} Urs dates seeded (${researched.length} researched, ${unverified.length} not verified)`);
  }

  const adminEmail = "admin@communityevents.pk";
  const adminExists = await prisma.user.findUnique({ where: { email: adminEmail } });

  if (!adminExists) {
    await prisma.user.create({
      data: {
        name: "Platform Admin",
        email: adminEmail,
        passwordHash: await bcrypt.hash("Admin@123456", 12),
        role: "ADMIN",
      },
    });
    console.log(`  ✓ Admin user created — email: ${adminEmail}, password: Admin@123456`);
    console.log("    ⚠️  Change this password immediately in production!");
  } else {
    console.log("  ✓ Admin user already exists, skipping");
  }

  console.log("\nSeeding complete!");
}

main()
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
