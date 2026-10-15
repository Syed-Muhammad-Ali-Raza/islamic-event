import { randomUUID } from "crypto";
import { ApprovalStatus, Prisma, UserRole } from "@prisma/client";
import { prisma } from "../config/prisma";
import { Errors } from "../utils/AppError";
import {
  PermissionUser,
  isSuperAdmin,
  canSubmitForOrg,
  canApproveForOrg,
} from "../utils/permissions";
import { notify } from "./notification.service";

// ─── Generic submission/approval engine for the nine moderated directories ───
// dastarkhwan, imambargah, place, darbar, urs-date, procession, charity, mela
// and scholar all share the same moderation fields (schema: ApprovalStatus on
// each model). Module services reuse the functions below instead of
// re-implementing submit/approve/reject; GET /api/v1/approvals serves the
// permission-scoped queue over the same registry.

/**
 * When true, every directory submission is approved immediately (no review
 * queue). Defaults to false; set AUTO_APPROVE_SUBMISSIONS=true in an
 * environment that wants to skip moderation (demos/local only — never
 * production).
 */
export const AUTO_APPROVE_SUBMISSIONS = process.env.AUTO_APPROVE_SUBMISSIONS === "true";

export type DirectoryKey =
  | "dastarkhwan"
  | "imambargah"
  | "place"
  | "darbar"
  | "ursDate"
  | "procession"
  | "charity"
  | "mela"
  | "scholar";

/** The acting user (req.user / a Prisma user row) — never null in practice. */
type Actor = { id: string; role: UserRole };

/** Row shape shared by all nine moderated directory models. */
const moderationSelect = {
  id: true,
  sourceId: true,
  name: true,
  approvalStatus: true,
  submittedById: true,
  organizerId: true,
  reviewedById: true,
  reviewedAt: true,
  rejectionReason: true,
  createdAt: true,
} as const;

export type DirectorySubmission = {
  id: string;
  sourceId: string;
  name: string;
  approvalStatus: ApprovalStatus;
  submittedById: string | null;
  organizerId: string | null;
  reviewedById: string | null;
  reviewedAt: Date | null;
  rejectionReason: string | null;
  createdAt: Date;
};

export type QueueSubmission = DirectorySubmission & {
  module: DirectoryKey;
  moduleLabel: string;
  moduleRoute: string;
};

/** The subset of a Prisma WHERE input the queue builds (structurally
 *  assignable to every model's WhereInput — see the `as` casts below). */
type SubmissionScope = {
  approvalStatus?: ApprovalStatus;
  submittedById?: string;
  organizerId?: string | { in: string[] };
  OR?: SubmissionScope[];
};

/** Content + moderation fields merged into a create call. Content shapes are
 *  zod-validated per module before they get here; the per-model casts inside
 *  the registry are the single place that trusts this boundary. */
type SubmissionCreateData = Record<string, unknown>;

/** Moderation-only fields (plus optional content) for an update call. */
type ModerationUpdate = {
  approvalStatus?: ApprovalStatus;
  submittedById?: string | null;
  reviewedById?: string | null;
  reviewedAt?: Date | null;
  rejectionReason?: string | null;
  organizerId?: string | null;
};

type DirectoryEntry = {
  key: DirectoryKey;
  /** Human label used in messages: "Dastarkhwan point". */
  label: string;
  /** Public mount segment used in links: "dastarkhwans". */
  route: string;
  load(id: string): Promise<DirectorySubmission | null>;
  create(data: SubmissionCreateData): Promise<DirectorySubmission>;
  update(id: string, data: ModerationUpdate & SubmissionCreateData): Promise<DirectorySubmission>;
  count(where: SubmissionScope): Promise<number>;
  fetch(where: SubmissionScope, take: number): Promise<DirectorySubmission[]>;
};

const entries: Record<DirectoryKey, DirectoryEntry> = {
  dastarkhwan: {
    key: "dastarkhwan",
    label: "Dastarkhwan point",
    route: "dastarkhwans",
    load: (id) => prisma.dastarkhwan.findUnique({ where: { id }, select: moderationSelect }),
    create: (data) =>
      prisma.dastarkhwan.create({
        data: data as unknown as Prisma.DastarkhwanCreateInput,
        select: moderationSelect,
      }),
    update: (id, data) =>
      prisma.dastarkhwan.update({
        where: { id },
        data: data as unknown as Prisma.DastarkhwanUpdateInput,
        select: moderationSelect,
      }),
    count: (where) => prisma.dastarkhwan.count({ where: where as Prisma.DastarkhwanWhereInput }),
    fetch: (where, take) =>
      prisma.dastarkhwan.findMany({
        where: where as Prisma.DastarkhwanWhereInput,
        select: moderationSelect,
        orderBy: { createdAt: "desc" },
        take,
      }),
  },
  imambargah: {
    key: "imambargah",
    label: "Imambargah",
    route: "imambargahs",
    load: (id) => prisma.imambargah.findUnique({ where: { id }, select: moderationSelect }),
    create: (data) =>
      prisma.imambargah.create({
        data: data as unknown as Prisma.ImambargahCreateInput,
        select: moderationSelect,
      }),
    update: (id, data) =>
      prisma.imambargah.update({
        where: { id },
        data: data as unknown as Prisma.ImambargahUpdateInput,
        select: moderationSelect,
      }),
    count: (where) => prisma.imambargah.count({ where: where as Prisma.ImambargahWhereInput }),
    fetch: (where, take) =>
      prisma.imambargah.findMany({
        where: where as Prisma.ImambargahWhereInput,
        select: moderationSelect,
        orderBy: { createdAt: "desc" },
        take,
      }),
  },
  place: {
    key: "place",
    label: "Place",
    route: "places",
    load: (id) => prisma.place.findUnique({ where: { id }, select: moderationSelect }),
    create: (data) =>
      prisma.place.create({
        data: data as unknown as Prisma.PlaceCreateInput,
        select: moderationSelect,
      }),
    update: (id, data) =>
      prisma.place.update({
        where: { id },
        data: data as unknown as Prisma.PlaceUpdateInput,
        select: moderationSelect,
      }),
    count: (where) => prisma.place.count({ where: where as Prisma.PlaceWhereInput }),
    fetch: (where, take) =>
      prisma.place.findMany({
        where: where as Prisma.PlaceWhereInput,
        select: moderationSelect,
        orderBy: { createdAt: "desc" },
        take,
      }),
  },
  darbar: {
    key: "darbar",
    label: "Darbar",
    route: "darbars",
    load: (id) => prisma.darbar.findUnique({ where: { id }, select: moderationSelect }),
    create: (data) =>
      prisma.darbar.create({
        data: data as unknown as Prisma.DarbarCreateInput,
        select: moderationSelect,
      }),
    update: (id, data) =>
      prisma.darbar.update({
        where: { id },
        data: data as unknown as Prisma.DarbarUpdateInput,
        select: moderationSelect,
      }),
    count: (where) => prisma.darbar.count({ where: where as Prisma.DarbarWhereInput }),
    fetch: (where, take) =>
      prisma.darbar.findMany({
        where: where as Prisma.DarbarWhereInput,
        select: moderationSelect,
        orderBy: { createdAt: "desc" },
        take,
      }),
  },
  ursDate: {
    key: "ursDate",
    label: "Urs date",
    route: "urs-dates",
    load: (id) => prisma.ursDate.findUnique({ where: { id }, select: moderationSelect }),
    create: (data) =>
      prisma.ursDate.create({
        data: data as unknown as Prisma.UrsDateCreateInput,
        select: moderationSelect,
      }),
    update: (id, data) =>
      prisma.ursDate.update({
        where: { id },
        data: data as unknown as Prisma.UrsDateUpdateInput,
        select: moderationSelect,
      }),
    count: (where) => prisma.ursDate.count({ where: where as Prisma.UrsDateWhereInput }),
    fetch: (where, take) =>
      prisma.ursDate.findMany({
        where: where as Prisma.UrsDateWhereInput,
        select: moderationSelect,
        orderBy: { createdAt: "desc" },
        take,
      }),
  },
  procession: {
    key: "procession",
    label: "Procession",
    route: "processions",
    load: (id) => prisma.procession.findUnique({ where: { id }, select: moderationSelect }),
    create: (data) =>
      prisma.procession.create({
        data: data as unknown as Prisma.ProcessionCreateInput,
        select: moderationSelect,
      }),
    update: (id, data) =>
      prisma.procession.update({
        where: { id },
        data: data as unknown as Prisma.ProcessionUpdateInput,
        select: moderationSelect,
      }),
    count: (where) => prisma.procession.count({ where: where as Prisma.ProcessionWhereInput }),
    fetch: (where, take) =>
      prisma.procession.findMany({
        where: where as Prisma.ProcessionWhereInput,
        select: moderationSelect,
        orderBy: { createdAt: "desc" },
        take,
      }),
  },
  charity: {
    key: "charity",
    label: "Charity",
    route: "charities",
    load: (id) => prisma.charity.findUnique({ where: { id }, select: moderationSelect }),
    create: (data) =>
      prisma.charity.create({
        data: data as unknown as Prisma.CharityCreateInput,
        select: moderationSelect,
      }),
    update: (id, data) =>
      prisma.charity.update({
        where: { id },
        data: data as unknown as Prisma.CharityUpdateInput,
        select: moderationSelect,
      }),
    count: (where) => prisma.charity.count({ where: where as Prisma.CharityWhereInput }),
    fetch: (where, take) =>
      prisma.charity.findMany({
        where: where as Prisma.CharityWhereInput,
        select: moderationSelect,
        orderBy: { createdAt: "desc" },
        take,
      }),
  },
  mela: {
    key: "mela",
    label: "Mela",
    route: "melas",
    load: (id) => prisma.mela.findUnique({ where: { id }, select: moderationSelect }),
    create: (data) =>
      prisma.mela.create({
        data: data as unknown as Prisma.MelaCreateInput,
        select: moderationSelect,
      }),
    update: (id, data) =>
      prisma.mela.update({
        where: { id },
        data: data as unknown as Prisma.MelaUpdateInput,
        select: moderationSelect,
      }),
    count: (where) => prisma.mela.count({ where: where as Prisma.MelaWhereInput }),
    fetch: (where, take) =>
      prisma.mela.findMany({
        where: where as Prisma.MelaWhereInput,
        select: moderationSelect,
        orderBy: { createdAt: "desc" },
        take,
      }),
  },
  scholar: {
    key: "scholar",
    label: "Scholar",
    route: "scholars",
    load: (id) => prisma.scholar.findUnique({ where: { id }, select: moderationSelect }),
    create: (data) =>
      prisma.scholar.create({
        data: data as unknown as Prisma.ScholarCreateInput,
        select: moderationSelect,
      }),
    update: (id, data) =>
      prisma.scholar.update({
        where: { id },
        data: data as unknown as Prisma.ScholarUpdateInput,
        select: moderationSelect,
      }),
    count: (where) => prisma.scholar.count({ where: where as Prisma.ScholarWhereInput }),
    fetch: (where, take) =>
      prisma.scholar.findMany({
        where: where as Prisma.ScholarWhereInput,
        select: moderationSelect,
        orderBy: { createdAt: "desc" },
        take,
      }),
  },
};

// ─── Submission creation ──────────────────────────────────────────────────────

type PreparedSubmission = {
  sourceId: string;
  organizerId: string | null;
  submittedById: string;
  approvalStatus: ApprovalStatus;
  reviewedById: string | null;
  reviewedAt: Date | null;
  rejectionReason: null;
};

/**
 * Validates the target organization (if any) and computes the moderation
 * fields for a new directory row. Generated sourceId keeps user submissions
 * distinguishable from curated seed rows ("user-" prefix + UUID).
 */
async function prepareSubmission(
  user: Actor,
  organizerId?: string
): Promise<PreparedSubmission> {
  let resolvedOrg: string | null = null;
  if (organizerId) {
    const org = await prisma.organizer.findUnique({
      where: { id: organizerId },
      select: { id: true, isActive: true },
    });
    if (!org || !org.isActive) throw Errors.notFound("Organization");
    if (!(await canSubmitForOrg(user, organizerId))) throw Errors.forbidden();
    resolvedOrg = organizerId;
  }

  const approved = AUTO_APPROVE_SUBMISSIONS || isSuperAdmin(user);
  return {
    sourceId: `user-${randomUUID()}`,
    organizerId: resolvedOrg,
    submittedById: user.id,
    approvalStatus: approved ? "APPROVED" : "PENDING",
    reviewedById: approved ? user.id : null,
    reviewedAt: approved ? new Date() : null,
    rejectionReason: null,
  };
}

/**
 * Create a directory submission. `content` must already exclude
 * `organizerId` (passed separately so it can be validated) — the module's
 * CreateSchema is the validation boundary for content fields.
 */
export async function createDirectorySubmission(
  key: DirectoryKey,
  user: PermissionUser,
  content: SubmissionCreateData,
  organizerId?: string
): Promise<DirectorySubmission> {
  if (!user) throw Errors.unauthorized();
  const entry = entries[key];
  const submission = await prepareSubmission(user, organizerId);

  const row = await entry.create({
    ...content,
    sourceId: submission.sourceId,
    organizerId: submission.organizerId,
    submittedById: submission.submittedById,
    approvalStatus: submission.approvalStatus,
    reviewedById: submission.reviewedById,
    reviewedAt: submission.reviewedAt,
    rejectionReason: submission.rejectionReason,
  });

  // Only PENDING creations need reviewers pinged — super-admin / auto-approved
  // rows are already live.
  if (row.approvalStatus === "PENDING") {
    await announcePendingSubmission(entry, row, user, "created");
  }
  return row;
}

// ─── Submission updates ───────────────────────────────────────────────────────

/**
 * Who may EDIT a directory row:
 *  - super admin: anything;
 *  - org-bound rows: any current member of the row's organization (leaving the
 *    organization revokes access, even for the original submitter);
 *  - un-org'd rows: only the original submitter.
 */
async function assertCanEditRow(row: DirectorySubmission, user: PermissionUser): Promise<void> {
  if (!user) throw Errors.unauthorized();
  if (isSuperAdmin(user)) return;
  if (row.organizerId) {
    if (await canSubmitForOrg(user, row.organizerId)) return;
    throw Errors.forbidden("Only current members of the organization can edit this submission.");
  }
  if (row.submittedById === user.id) return;
  throw Errors.forbidden();
}

/**
 * Edit a directory row. Non-super-admin edits always return the row to
 * PENDING (nothing stays public without approval) and reassign the
 * submitter to the editor. Super-admin edits keep the current moderation
 * state — curators edit live content directly.
 */
export async function applySubmissionUpdate(
  key: DirectoryKey,
  id: string,
  user: PermissionUser,
  content: SubmissionCreateData,
  organizerId?: string
): Promise<DirectorySubmission> {
  if (!user) throw Errors.unauthorized();
  const entry = entries[key];
  const row = await entry.load(id);
  if (!row) throw Errors.notFound(entry.label);
  await assertCanEditRow(row, user);

  const data: ModerationUpdate & SubmissionCreateData = { ...content };

  // Organization reassignment must pass the same membership check as creation.
  if (organizerId !== undefined && organizerId !== row.organizerId) {
    const org = organizerId
      ? await prisma.organizer.findUnique({
          where: { id: organizerId },
          select: { id: true, isActive: true },
        })
      : null;
    if (organizerId && (!org || !org.isActive)) throw Errors.notFound("Organization");
    if (organizerId && !(await canSubmitForOrg(user, organizerId))) throw Errors.forbidden();
    data.organizerId = organizerId;
  }

  if (!isSuperAdmin(user)) {
    data.approvalStatus = "PENDING";
    data.submittedById = user.id;
    data.reviewedById = null;
    data.reviewedAt = null;
    data.rejectionReason = null;
  }

  const updated = await entry.update(id, data);
  if (!isSuperAdmin(user)) {
    await announcePendingSubmission(entry, updated, user, "updated");
  }
  return updated;
}

// ─── Approve / reject ─────────────────────────────────────────────────────────

export type SubmissionDecision = "APPROVED" | "REJECTED";

/**
 * Approve or reject a directory submission.
 *
 * Permission re-checked HERE (not just by queue scoping): super admin may
 * decide anything; otherwise only org OWNER/ADMIN may decide rows belonging
 * to their organization; un-org'd rows are super-admin-only and nobody can
 * approve their own un-org'd submission.
 */
export async function decideSubmission(
  key: DirectoryKey,
  id: string,
  user: PermissionUser,
  decision: SubmissionDecision,
  reason?: string
): Promise<DirectorySubmission> {
  if (!user) throw Errors.unauthorized();
  const entry = entries[key];
  const row = await entry.load(id);
  if (!row) throw Errors.notFound(entry.label);

  if (decision === "APPROVED" && row.approvalStatus === "APPROVED") {
    throw Errors.conflict("Submission is already approved.", "ALREADY_APPROVED");
  }
  if (decision === "REJECTED" && row.approvalStatus === "REJECTED") {
    throw Errors.conflict("Submission is already rejected.", "ALREADY_REJECTED");
  }

  // Server-side re-check — the /approvals queue is advisory only.
  if (!isSuperAdmin(user)) {
    const allowed = row.organizerId ? await canApproveForOrg(user, row.organizerId) : false;
    if (!allowed) {
      throw Errors.forbidden(
        "Only an organization owner/admin or a super admin can review this submission."
      );
    }
  }

  const updated = await entry.update(id, {
    approvalStatus: decision,
    reviewedById: user.id,
    reviewedAt: new Date(),
    rejectionReason: decision === "REJECTED" ? reason ?? null : null,
  });

  await announceDecision(entry, updated, user, decision);
  return updated;
}

// ─── Queue (GET /api/v1/approvals) ───────────────────────────────────────────

export type SubmissionStatusFilter = "PENDING" | "APPROVED" | "REJECTED" | "ALL";

export type ListSubmissionsOptions = {
  status: SubmissionStatusFilter;
  mine: boolean;
  module?: DirectoryKey;
  page: number;
  limit: number;
};

/**
 * Permission-scoped moderation queue across all nine directories.
 *
 * Scope:
 *  - super admin: every row (all modules);
 *  - org OWNER/ADMIN: rows of their organizations + their own submissions;
 *  - everyone else: their own submissions only (EDITORs included).
 *
 * Deep pages read at most the first QUEUE_FETCH_CAP rows per module —
 * the queue is an operational view, not a data export.
 */
const QUEUE_FETCH_CAP = 500;

export async function listSubmissions(
  user: PermissionUser,
  opts: ListSubmissionsOptions
): Promise<{ items: QueueSubmission[]; total: number }> {
  if (!user) throw Errors.unauthorized();
  const superAdmin = isSuperAdmin(user);

  let orgIds: string[] = [];
  if (!superAdmin && !opts.mine) {
    const memberships = await prisma.organizationMember.findMany({
      where: { userId: user.id, role: { in: ["OWNER", "ADMIN"] } },
      select: { organizerId: true },
    });
    orgIds = memberships.map((m) => m.organizerId);
  }

  const statusFilter =
    opts.status === "ALL" ? undefined : ({ approvalStatus: opts.status } as const);

  let where: SubmissionScope;
  if (opts.mine) {
    where = { ...statusFilter, submittedById: user.id };
  } else if (superAdmin) {
    where = { ...statusFilter };
  } else {
    where = {
      ...statusFilter,
      OR: [
        { submittedById: user.id },
        ...(orgIds.length ? [{ organizerId: { in: orgIds } }] : []),
      ],
    };
  }

  const keys: DirectoryKey[] = opts.module ? [opts.module] : (Object.keys(entries) as DirectoryKey[]);
  const fetchCap = Math.min(Math.max(opts.page * opts.limit, opts.limit), QUEUE_FETCH_CAP);

  const perModule = await Promise.all(
    keys.map(async (key) => {
      const entry = entries[key];
      const [total, rows] = await Promise.all([entry.count(where), entry.fetch(where, fetchCap)]);
      return { entry, total, rows };
    })
  );

  const total = perModule.reduce((sum, r) => sum + r.total, 0);
  const merged = perModule
    .flatMap(({ entry, rows }) =>
      rows.map((row) => ({
        ...row,
        module: entry.key,
        moduleLabel: entry.label,
        moduleRoute: entry.route,
      }))
    )
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  const skip = (opts.page - 1) * opts.limit;
  const items = merged.slice(skip, skip + opts.limit);
  return { items, total };
}

// ─── Notifications ────────────────────────────────────────────────────────────

/**
 * Reviewers for a row: the row's org OWNER/ADMIN members, or (for un-org'd
 * rows) every super admin. The acting user is never notified about their own
 * action.
 */
async function collectReviewers(row: DirectorySubmission, actorId: string): Promise<string[]> {
  if (row.organizerId) {
    const members = await prisma.organizationMember.findMany({
      where: { organizerId: row.organizerId, role: { in: ["OWNER", "ADMIN"] } },
      select: { userId: true },
    });
    return members.map((m) => m.userId).filter((id) => id !== actorId);
  }
  const admins = await prisma.user.findMany({
    where: { role: { in: ["SUPER_ADMIN", "ADMIN"] } },
    select: { id: true },
  });
  return admins.map((u) => u.id).filter((id) => id !== actorId);
}

/**
 * Ping reviewers about a PENDING row and (on creation) confirm receipt to the
 * submitter. Fire-and-forget via notify()'s never-throw contract.
 */
async function announcePendingSubmission(
  entry: DirectoryEntry,
  row: DirectorySubmission,
  actor: Actor,
  kind: "created" | "updated"
): Promise<void> {
  const reviewerIds = await collectReviewers(row, actor.id);
  const jobs: Promise<void>[] = reviewerIds.map((userId) =>
    notify({
      userId,
      type: "NEW_SUBMISSION",
      title:
        kind === "created"
          ? "New submission to review"
          : "Submission updated — review requested",
      body: `"${row.name}" (${entry.label}) is awaiting approval.`,
      link: "/approvals",
    })
  );

  if (kind === "created") {
    jobs.push(
      notify({
        userId: actor.id,
        type: "SUBMISSION_RECEIVED",
        title: "Submission received",
        body: `Your ${entry.label.toLowerCase()} "${row.name}" was submitted for review. It will appear in the public directory once approved.`,
        link: "/approvals?mine=true",
      })
    );
  }

  await Promise.all(jobs);
}

/** Notify the submitter and the org's OWNER/ADMIN about an approve/reject. */
async function announceDecision(
  entry: DirectoryEntry,
  row: DirectorySubmission,
  actor: Actor,
  decision: SubmissionDecision
): Promise<void> {
  const approved = decision === "APPROVED";
  const jobs: Promise<void>[] = [];

  if (row.submittedById && row.submittedById !== actor.id) {
    jobs.push(
      notify({
        userId: row.submittedById,
        type: approved ? "SUBMISSION_APPROVED" : "SUBMISSION_REJECTED",
        title: approved ? "Submission approved" : "Submission needs changes",
        body: approved
          ? `Your ${entry.label.toLowerCase()} "${row.name}" is now live in the public directory.`
          : `Your ${entry.label.toLowerCase()} "${row.name}" was rejected${
              row.rejectionReason ? `: ${row.rejectionReason}` : "."
            }`,
        link: "/approvals?mine=true",
      })
    );
  }

  if (row.organizerId) {
    const members = await prisma.organizationMember.findMany({
      where: { organizerId: row.organizerId, role: { in: ["OWNER", "ADMIN"] } },
      select: { userId: true },
    });
    for (const member of members) {
      if (member.userId === actor.id || member.userId === row.submittedById) continue;
      jobs.push(
        notify({
          userId: member.userId,
          type: approved ? "SUBMISSION_APPROVED" : "SUBMISSION_REJECTED",
          title: approved ? "Submission approved" : "Submission rejected",
          body: `"${row.name}" (${entry.label}) was ${approved ? "approved" : "rejected"} for your organization.`,
          link: "/approvals",
        })
      );
    }
  }

  await Promise.all(jobs);
}
