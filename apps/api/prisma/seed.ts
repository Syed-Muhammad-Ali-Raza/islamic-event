import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { State, City } from "country-state-city";
import slugify from "slugify";
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

  // ─── Countries (Pakistan-only platform) ─────────────────────────────────────
  const countries = [{ name: "Pakistan", code: "PK", dialCode: "+92" }];

  for (const country of countries) {
    await prisma.country.upsert({
      where: { code: country.code },
      update: {},
      create: country,
    });
  }
  console.log(`  ✓ ${countries.length} countries seeded`);
  // Platform is Pakistan-only: deactivate anything seeded earlier
  await prisma.country.updateMany({ where: { code: { not: "PK" } }, data: { isActive: false } });

  // ─── Pakistan states + all cities (from country-state-city) ─────────────────
  const pakistan = await prisma.country.findUnique({ where: { code: "PK" } });
  if (pakistan) {
    const stateIdByCode = new Map<string, string>();
    for (const s of State.getStatesOfCountry("PK")) {
      const row = await prisma.state.upsert({
        where: { name_countryId: { name: s.name, countryId: pakistan.id } },
        update: { code: s.isoCode },
        create: { name: s.name, code: s.isoCode, countryId: pakistan.id },
      });
      stateIdByCode.set(s.isoCode, row.id);
    }

    const pkCities = City.getCitiesOfCountry("PK") ?? [];
    const slugCounts = new Map<string, number>();
    for (const c of pkCities) {
      const slug = slugify(c.name, { lower: true, strict: true });
      slugCounts.set(slug, (slugCounts.get(slug) ?? 0) + 1);
    }

    for (const c of pkCities) {
      const slug = slugify(c.name, { lower: true, strict: true });
      const stateId = stateIdByCode.get(c.stateCode);
      if (!stateId) continue;

      if (slugCounts.get(slug) === 1) {
        // Unique slug: re-home any legacy row seeded under the wrong state
        const existing = await prisma.city.findFirst({ where: { slug } });
        if (existing) {
          if (existing.stateId !== stateId || existing.name !== c.name) {
            const clash = await prisma.city.findFirst({
              where: { slug, stateId, NOT: { id: existing.id } },
            });
            if (!clash) {
              await prisma.city.update({
                where: { id: existing.id },
                data: { stateId, name: c.name },
              });
            }
          }
        } else {
          await prisma.city.upsert({
            where: { slug_stateId: { slug, stateId } },
            update: {},
            create: { name: c.name, slug, stateId },
          });
        }
      } else {
        // Same name in multiple states (e.g. Shorkot): upsert per state
        await prisma.city.upsert({
          where: { slug_stateId: { slug, stateId } },
          update: {},
          create: { name: c.name, slug, stateId },
        });
      }
    }
    console.log(`  ✓ Pakistan states (${stateIdByCode.size}) + cities (${pkCities.length}) seeded`);
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

  // ── Muharram / Safar processions (jaloos routes; idempotent) ───────────────
  const processionFile = path.join(__dirname, "data", "muharram-processions.json");
  if (fs.existsSync(processionFile)) {
    const raw = JSON.parse(fs.readFileSync(processionFile, "utf8"));
    const items: Array<{
      id: string; city: string; month: string; day: string; kind?: string; name: string;
      type?: string | null; start?: string | null; end?: string | null; route?: string | null;
      routeHighlights?: string[]; time?: string | null; googleMaps?: string | null;
      description?: string | null; notes?: string | null; sortOrder?: number;
    }> = raw.processions ?? [];

    for (const p of items) {
      await prisma.procession.upsert({
        where: { sourceId: p.id },
        update: {},
        create: {
          sourceId: p.id,
          city: p.city,
          month: p.month,
          day: p.day,
          kind: p.kind ?? "procession",
          name: p.name,
          type: p.type ?? null,
          start: p.start ?? null,
          end: p.end ?? null,
          route: p.route ?? null,
          routeHighlights: (p.routeHighlights ?? []).join("\n") || null,
          time: p.time ?? null,
          googleMaps: p.googleMaps ?? null,
          description: p.description ?? null,
          notes: p.notes ?? null,
          sortOrder: p.sortOrder ?? 0,
        },
      });
    }
    console.log(`  ✓ ${items.length} processions seeded`);
  }

  // ── Melas (festivals; idempotent) ───────────────────────────────────────────
  const melasFile = path.join(__dirname, "data", "pakistan-melas.json");
  if (fs.existsSync(melasFile)) {
    const raw = JSON.parse(fs.readFileSync(melasFile, "utf8"));
    const melas: Array<{
      id: string; name: string; type?: string | null; city: string; province: string;
      venue?: string | null; address?: string | null; google_maps_url?: string | null;
      latitude?: number | null; longitude?: number | null; when_held?: string | null;
      duration?: string | null; history?: string | null; what_happens?: string | null;
      status_notes?: string | null; source?: string | null; verified?: boolean;
    }> = raw.melas ?? [];

    for (const m of melas) {
      await prisma.mela.upsert({
        where: { sourceId: m.id },
        update: {},
        create: {
          sourceId: m.id,
          name: m.name,
          type: m.type ?? null,
          city: m.city,
          province: m.province,
          venue: m.venue ?? null,
          address: m.address ?? null,
          googleMapsUrl: m.google_maps_url ?? null,
          latitude: m.latitude ?? null,
          longitude: m.longitude ?? null,
          whenHeld: m.when_held ?? null,
          duration: m.duration ?? null,
          history: m.history ?? null,
          whatHappens: m.what_happens ?? null,
          statusNotes: m.status_notes ?? null,
          source: m.source ?? null,
          verified: m.verified ?? false,
        },
      });
    }
    console.log(`  ✓ ${melas.length} melas seeded`);
  }

  // ── Punjab Auqaf urs calendar (idempotent) ──────────────────────────────────
  const auqafFile = path.join(__dirname, "data", "pakistan-melas.json");
  if (fs.existsSync(auqafFile)) {
    const raw = JSON.parse(fs.readFileSync(auqafFile, "utf8"));
    const auqaf: Array<{
      id: string; name: string; type?: string | null; zone: string; province: string;
      date_as_published: string; google_maps_url?: string | null;
      latitude?: number | null; longitude?: number | null; source?: string | null;
      verified?: boolean;
    }> = raw.auqaf_urs_calendar ?? [];

    for (const a of auqaf) {
      await prisma.auqafUrsDate.upsert({
        where: { sourceId: a.id },
        update: {},
        create: {
          sourceId: a.id,
          name: a.name,
          type: a.type ?? null,
          zone: a.zone,
          province: a.province,
          dateAsPublished: a.date_as_published,
          googleMapsUrl: a.google_maps_url ?? null,
          latitude: a.latitude ?? null,
          longitude: a.longitude ?? null,
          source: a.source ?? null,
          verified: a.verified ?? false,
        },
      });
    }
    console.log(`  ✓ ${auqaf.length} Auqaf urs calendar dates seeded`);
  }

  // ── Charity organizations (idempotent) ─────────────────────────────────────
  const charityFile = path.join(__dirname, "data", "pakistan-charities.json");
  if (fs.existsSync(charityFile)) {
    const raw = JSON.parse(fs.readFileSync(charityFile, "utf8"));
    const items: Array<{
      id: string; name: string; country: string; province: string; city: string;
      type?: string | null; focus?: string | null; policyNote?: string | null;
      address?: string | null; latitude?: number | null; longitude?: number | null;
      googleMapsLink?: string | null; contactNumbers?: string | null;
      founded?: string | null; founder?: string | null; website?: string | null;
      registration?: string | null;
    }> = raw.charities ?? [];

    for (const c of items) {
      await prisma.charity.upsert({
        where: { sourceId: c.id },
        update: {},
        create: {
          sourceId: c.id,
          name: c.name,
          country: c.country,
          province: c.province,
          city: c.city,
          type: c.type ?? null,
          focus: c.focus ?? null,
          policyNote: c.policyNote ?? null,
          address: c.address ?? null,
          latitude: c.latitude ?? null,
          longitude: c.longitude ?? null,
          googleMapsLink: c.googleMapsLink ?? null,
          contactNumbers: c.contactNumbers ?? null,
          founded: c.founded ?? null,
          founder: c.founder ?? null,
          website: c.website ?? null,
          registration: c.registration ?? null,
        },
      });
    }
    console.log(`  ✓ ${items.length} charities seeded`);
  }

  // ── Scholars (Sunni & Shia; idempotent) ──────────────────────────────────
  const scholarsFile = path.join(__dirname, "data", "scholars.json");
  if (fs.existsSync(scholarsFile)) {
    const raw = JSON.parse(fs.readFileSync(scholarsFile, "utf8"));
    const scholars: Array<{
      sourceId: string; slug: string; name: string; nameUrdu?: string | null;
      honorific?: string | null; sect: string; category: string; status?: string;
      birthDate?: string | null; deathDate?: string | null; city?: string | null;
      country?: string | null; bio?: string | null; education?: string | null;
      works?: string[] | null; officialLinks?: string | null; photoUrl?: string | null;
      photoCredit?: string | null; photoLicense?: string | null;
      sources?: Array<{ title: string; url: string }> | null;
      confidence?: string; lastVerified?: string | null;
    }> = raw.scholars ?? [];

    for (const s of scholars) {
      await prisma.scholar.upsert({
        where: { sourceId: s.sourceId },
        update: {},
        create: {
          sourceId: s.sourceId,
          slug: s.slug,
          name: s.name,
          nameUrdu: s.nameUrdu ?? null,
          honorific: s.honorific ?? null,
          sect: s.sect,
          category: s.category,
          status: s.status ?? "DECEASED",
          birthDate: s.birthDate ?? null,
          deathDate: s.deathDate ?? null,
          city: s.city ?? null,
          country: s.country ?? null,
          bio: s.bio ?? null,
          education: s.education ?? null,
          works: s.works ?? [],
          officialLinks: s.officialLinks ?? null,
          photoUrl: s.photoUrl ?? null,
          photoCredit: s.photoCredit ?? null,
          photoLicense: s.photoLicense ?? null,
          sources: (s.sources ?? []) as object[],
          confidence: s.confidence ?? "UNVERIFIED",
          lastVerified: s.lastVerified ?? null,
          isActive: true,
        },
      });
    }
    console.log(`  ✓ ${scholars.length} scholars seeded`);
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
