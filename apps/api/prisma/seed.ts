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
