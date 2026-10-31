import { supabase } from "@/lib/supabaseClient";

const TABLES = {
  School: "schools",
  Application: "applications",
  Bookmark: "bookmarks",
  TourBooking: "tour_bookings",
  TourSlot: "tour_slots",
  Thread: "threads",
  Message: "messages",
  MatchProfile: "match_profiles",
  ProfileView: "profile_views",
  AuditLog: "audit_logs",
  User: "profiles",
};

const ARRAY_COLUMNS = new Set(["participant_emails"]);

const client = () => {
  if (!supabase) throw new Error("The data service is not configured.");
  return supabase;
};

const unwrap = ({ data, error }) => {
  if (error) throw error;
  return data;
};

const parseSort = (sort) => {
  if (!sort) return null;
  const descending = sort.startsWith("-");
  return { column: descending ? sort.slice(1) : sort, ascending: !descending };
};

const applyFilters = (query, filters = {}) => {
  let q = query;
  for (const [column, value] of Object.entries(filters)) {
    if (ARRAY_COLUMNS.has(column)) {
      q = q.contains(column, Array.isArray(value) ? value : [value]);
    } else if (Array.isArray(value)) {
      q = q.in(column, value);
    } else {
      q = q.eq(column, value);
    }
  }
  return q;
};

const makeEntity = (table) => {
  const selectWith = (filters, { sort, limit } = {}) => {
    let q = applyFilters(client().from(table).select("*"), filters);
    const order = parseSort(sort);
    if (order) q = q.order(order.column, { ascending: order.ascending });
    if (limit) q = q.limit(limit);
    return q;
  };

  const filter = async (filters, options) => ({ items: unwrap(await selectWith(filters, options)) ?? [] });

  return {
    filter,
    list: (options) => filter({}, options),
    get: async (id) => unwrap(await client().from(table).select("*").eq("id", id).maybeSingle()),
    count: async (filters) => {
      const { count, error } = await applyFilters(
        client().from(table).select("*", { count: "exact", head: true }),
        filters,
      );
      if (error) throw error;
      return count ?? 0;
    },
    create: async (values) => unwrap(await client().from(table).insert(values).select().single()),
    update: async (id, values) =>
      unwrap(await client().from(table).update(values).eq("id", id).select().single()),
    bulkUpdate: async (rows) =>
      Promise.all(rows.map(async ({ id, ...values }) =>
        unwrap(await client().from(table).update(values).eq("id", id).select().single()),
      )),
    delete: async (id) => unwrap(await client().from(table).delete().eq("id", id)),
  };
};

const notAvailable = async () => {
  throw new Error("File uploads are not set up yet.");
};

export const db = {
  entities: Object.fromEntries(Object.entries(TABLES).map(([name, table]) => [name, makeEntity(table)])),
  integrations: {
    Core: {
      UploadFile: notAvailable,
      CreateFileSignedUrl: notAvailable,
    },
  },
};
