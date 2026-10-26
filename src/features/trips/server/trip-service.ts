import { GraphQLError } from "graphql";
import { z } from "zod";
import type { GraphQLContext } from "@/lib/graphql/context";
import type { TripRow, ActivityRow } from "@/lib/supabase/database.types";
import { createTripSchema } from "../model/create-trip-schema";
import { activitySchema } from "../model/activity";
import { getTripStatus } from "../lib/trip-status";
import { normalizeText } from "../lib/trip-filters";

function fail(message: string, code = "BAD_USER_INPUT"): never {
  throw new GraphQLError(message, { extensions: { code } });
}

function check(error: { code?: string; message: string } | null, fallback: string) {
  if (!error) return;
  if (error.code === "23514" && /período|passeios/.test(error.message)) fail(error.message);
  if (error.code === "42501") fail("Você não tem permissão para esta ação.", "FORBIDDEN");
  throw new GraphQLError(fallback, { extensions: { code: "OPERATION_FAILED" } });
}

async function readRows<T>(
  page: (
    from: number,
    to: number,
  ) => PromiseLike<{ data: T[] | null; error: { code?: string; message: string } | null }>,
  message: string,
) {
  const rows: T[] = [];
  for (let offset = 0; ; offset += 1000) {
    const { data, error } = await page(offset, offset + 999);
    check(error, message);
    rows.push(...data!);
    if (data!.length < 1000) return rows;
  }
}

function parse<T>(schema: z.ZodType<T>, input: unknown): T {
  const result = schema.safeParse(input);
  if (!result.success) {
    throw new GraphQLError(result.error.issues[0].message, {
      extensions: { code: "BAD_USER_INPUT", fieldErrors: z.flattenError(result.error).fieldErrors },
    });
  }
  return result.data;
}

export function tripSummary(row: TripRow, count: number, userId: string) {
  return {
    id: row.id,
    name: row.name,
    destination: row.destination,
    startDate: row.start_date,
    endDate: row.end_date,
    participantCount: count,
    status: getTripStatus(row.start_date, row.end_date),
    isOwner: row.owner_id === userId,
  };
}

export async function requireTrip(ctx: GraphQLContext, id: string) {
  parse(z.uuid(), id);
  const { data, error } = await ctx.db.from("trips").select("*").eq("id", id).maybeSingle();
  check(error, "Não foi possível carregar a viagem.");
  if (!data) fail("Viagem não encontrada ou sem acesso.", "NOT_FOUND");
  return data;
}

async function requireOwner(ctx: GraphQLContext, id: string) {
  const trip = await requireTrip(ctx, id);
  if (trip.owner_id !== ctx.userId) fail("Somente o organizador pode fazer isso.", "FORBIDDEN");
  return trip;
}

export async function listTrips(ctx: GraphQLContext, raw: unknown) {
  const filters = parse(
    z.object({
      query: z.string().trim().max(120).default(""),
      status: z.enum(["all", "upcoming", "ongoing", "completed"]).default("all"),
      offset: z.number().int().min(0).max(100000).default(0),
      limit: z.number().int().min(1).max(50).default(12),
    }),
    raw ?? {},
  );
  const { count: allCount, error: allError } = await ctx.db
    .from("trips")
    .select("id", { count: "exact", head: true });
  check(allError, "Não foi possível carregar suas viagens.");
  let query = ctx.db
    .from("trips")
    .select("*", { count: "exact" })
    .order("start_date", { ascending: false })
    .order("id");
  const search = normalizeText(filters.query).replace(/[%_\\]/g, "\\$&");
  if (search) query = query.ilike("search_text", "%" + search + "%");
  const today = new Date().toISOString().slice(0, 10);
  if (filters.status === "upcoming") query = query.gt("start_date", today);
  if (filters.status === "completed") query = query.lt("end_date", today);
  if (filters.status === "ongoing") query = query.lte("start_date", today).gte("end_date", today);
  const {
    data: rows,
    count,
    error,
  } = await query.range(filters.offset, filters.offset + filters.limit - 1);
  check(error, "Não foi possível carregar suas viagens.");
  const items = await Promise.all(
    rows!.map(async (row) => {
      const { count: participants, error: countError } = await ctx.db
        .from("trip_members")
        .select("user_id", { count: "exact", head: true })
        .eq("trip_id", row.id);
      check(countError, "Não foi possível carregar os participantes.");
      return tripSummary(row, participants ?? 0, ctx.userId);
    }),
  );
  return {
    items,
    total: count ?? 0,
    hasTrips: Boolean(allCount),
  };
}

export async function tripDetail(ctx: GraphQLContext, id: string) {
  const trip = await requireTrip(ctx, id);
  const [members, activities] = await Promise.all([
    readRows(
      (from, to) =>
        ctx.db
          .from("trip_members")
          .select("*")
          .eq("trip_id", id)
          .order("created_at")
          .order("user_id")
          .range(from, to),
      "Não foi possível carregar os participantes.",
    ),
    readRows(
      (from, to) =>
        ctx.db
          .from("activities")
          .select("*")
          .eq("trip_id", id)
          .order("day")
          .order("start_time")
          .order("id")
          .range(from, to),
      "Não foi possível carregar o roteiro.",
    ),
  ]);
  const ids = activities.map((a) => a.id);
  const votes: { activity_id: string; user_id: string }[] = [];
  for (let offset = 0; offset < ids.length; offset += 100) {
    const batch = ids.slice(offset, offset + 100);
    votes.push(
      ...(await readRows(
        (from, to) =>
          ctx.db
            .from("activity_votes")
            .select("*")
            .in("activity_id", batch)
            .order("activity_id")
            .order("user_id")
            .range(from, to),
        "Não foi possível carregar os votos.",
      )),
    );
  }
  return {
    ...tripSummary(trip, members!.length, ctx.userId),
    members: members!.map((m) => ({
      userId: m.user_id,
      displayName: m.display_name,
      isOwner: m.user_id === trip.owner_id,
    })),
    activities: activities!.map((a: ActivityRow) => ({
      id: a.id,
      title: a.title,
      day: a.day,
      startTime: a.start_time?.slice(0, 5) ?? null,
      location: a.location,
      estimatedCost: Number(a.estimated_cost),
      status: a.status,
      createdBy: a.created_by,
      votes: votes!.filter((v) => v.activity_id === a.id).length,
      votedByMe: votes!.some((v) => v.activity_id === a.id && v.user_id === ctx.userId),
    })),
  };
}

export async function saveTrip(ctx: GraphQLContext, input: unknown, id?: string) {
  const values = parse(createTripSchema, input);
  if (id) await requireOwner(ctx, id);
  const row = {
    name: values.name,
    destination: values.destination,
    start_date: values.startDate,
    end_date: values.endDate,
  };
  const { data, error } = id
    ? await ctx.db.from("trips").update(row).eq("id", id).select("id").single()
    : await ctx.db
        .from("trips")
        .insert({ ...row, owner_id: ctx.userId })
        .select("id")
        .single();
  check(error, "Não foi possível salvar a viagem.");
  return tripDetail(ctx, data!.id);
}

export async function deleteTrip(ctx: GraphQLContext, id: string) {
  await requireOwner(ctx, id);
  const { error } = await ctx.db.from("trips").delete().eq("id", id);
  check(error, "Não foi possível excluir a viagem.");
  return true;
}

export async function addActivity(ctx: GraphQLContext, tripId: string, input: unknown) {
  const trip = await requireTrip(ctx, tripId);
  const values = parse(activitySchema, input);
  if (values.day < trip.start_date || values.day > trip.end_date)
    fail("O passeio deve estar dentro do período da viagem.");
  const { error } = await ctx.db.from("activities").insert({
    trip_id: tripId,
    created_by: ctx.userId,
    title: values.title,
    day: values.day,
    start_time: values.startTime,
    location: values.location,
    estimated_cost: values.estimatedCost,
    status: "proposed",
  });
  check(error, "Não foi possível adicionar o passeio.");
  return tripDetail(ctx, tripId);
}

async function requireActivity(ctx: GraphQLContext, id: string) {
  parse(z.uuid(), id);
  const { data, error } = await ctx.db.from("activities").select("*").eq("id", id).maybeSingle();
  check(error, "Não foi possível carregar o passeio.");
  if (!data) fail("Passeio não encontrado ou sem acesso.", "NOT_FOUND");
  return data;
}

export async function setActivityStatus(ctx: GraphQLContext, id: string, confirmed: boolean) {
  const activity = await requireActivity(ctx, id);
  await requireOwner(ctx, activity.trip_id);
  const { error } = await ctx.db
    .from("activities")
    .update({ status: confirmed ? "confirmed" : "proposed" })
    .eq("id", id);
  check(error, "Não foi possível atualizar o passeio.");
  return tripDetail(ctx, activity.trip_id);
}

export async function deleteActivity(ctx: GraphQLContext, id: string) {
  const activity = await requireActivity(ctx, id);
  const trip = await requireTrip(ctx, activity.trip_id);
  if (
    trip.owner_id !== ctx.userId &&
    (activity.created_by !== ctx.userId || activity.status !== "proposed")
  ) {
    fail("Você não pode remover este passeio.", "FORBIDDEN");
  }
  const { error } = await ctx.db.from("activities").delete().eq("id", id);
  check(error, "Não foi possível remover o passeio.");
  return tripDetail(ctx, activity.trip_id);
}

export async function voteActivity(ctx: GraphQLContext, id: string, voted: boolean) {
  const activity = await requireActivity(ctx, id);
  if (activity.status !== "proposed") fail("A votação deste passeio está encerrada.");
  const query = ctx.db.from("activity_votes");
  const { error } = voted
    ? await query.upsert(
        { activity_id: id, user_id: ctx.userId },
        { onConflict: "activity_id,user_id", ignoreDuplicates: true },
      )
    : await query.delete().eq("activity_id", id).eq("user_id", ctx.userId);
  check(error, "Não foi possível registrar o voto.");
  return tripDetail(ctx, activity.trip_id);
}

export async function createInvite(ctx: GraphQLContext, tripId: string) {
  await requireOwner(ctx, tripId);
  const token = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 7 * 86400000).toISOString();
  const { error } = await ctx.db
    .from("trip_invites")
    .upsert({ trip_id: tripId, token, expires_at: expiresAt });
  check(error, "Não foi possível gerar o convite.");
  return { token, expiresAt };
}

export async function acceptInvite(ctx: GraphQLContext, token: string) {
  parse(z.uuid(), token);
  const { data, error } = await ctx.db.rpc("accept_trip_invite", { invite_token: token });
  if (error) fail("Convite inválido ou expirado.");
  return tripDetail(ctx, data!);
}

export async function removeMember(ctx: GraphQLContext, tripId: string, userId: string) {
  const trip = await requireTrip(ctx, tripId);
  parse(z.uuid(), userId);
  if (trip.owner_id === userId) fail("O organizador não pode sair da própria viagem.");
  if (trip.owner_id !== ctx.userId && ctx.userId !== userId)
    fail("Você não pode remover esse participante.", "FORBIDDEN");
  const { error } = await ctx.db
    .from("trip_members")
    .delete()
    .eq("trip_id", tripId)
    .eq("user_id", userId);
  check(error, "Não foi possível remover o participante.");
  return true;
}
