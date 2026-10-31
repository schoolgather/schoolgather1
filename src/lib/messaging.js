const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };


const RATE_WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 6;

async function assertRateLimit(threadId) {
  const page = await db.entities.Message.filter({ thread_id: threadId }, { sort: "-created_date", limit: 10 });
  const items = page.items || [];
  const cutoff = Date.now() - RATE_WINDOW_MS;
  const recent = items.filter((m) => new Date(m.created_date).getTime() > cutoff);
  if (recent.length >= MAX_PER_WINDOW) {
    throw new Error("You are sending messages too quickly. Please wait a minute and try again.");
  }
}

export async function sendThreadMessage({ thread, sender, content }) {
  const text = String(content || "").trim();
  if (!text) throw new Error("Write a message first");
  if (text.length > 4000) throw new Error("Messages are limited to 4000 characters");
  if (!(thread.participant_emails || []).includes(sender.email)) {
    throw new Error("You are not a participant in this conversation");
  }
  await assertRateLimit(thread.id);

  const isStudent = sender.email !== thread.student_email;
  const message = await db.entities.Message.create({
    thread_id: thread.id,
    school_id: thread.school_id,
    participant_emails: thread.participant_emails,
    sender_email: sender.email,
    sender_name: sender.name,
    sender_role: isStudent ? "school_admin" : "student",
    content: text,
    read_by_admin: isStudent,
    read_by_student: !isStudent,
  });

  await db.entities.Thread.update(thread.id, {
    last_message_at: new Date().toISOString(),
    last_message_preview: text.slice(0, 140),
    admin_unread: isStudent ? (thread.admin_unread || 0) + 1 : 0,
    student_unread: !isStudent ? (thread.student_unread || 0) + 1 : 0,
  });

  return message;
}

export async function startThread({ school, student, subject, content }) {
  const admins = (school.admin_emails || []).map((e) => String(e).toLowerCase());
  if (!admins.length) {
    throw new Error("This school has not published admissions contacts yet. Please apply and their team will reach out.");
  }
  const participants = Array.from(new Set([student.email, ...admins]));
  const text = String(content || "").trim();
  if (!text) throw new Error("Write a message first");

  const thread = await db.entities.Thread.create({
    school_id: school.id,
    school_name: school.name,
    school_slug: school.slug,
    student_email: student.email,
    student_name: student.name,
    participant_emails: participants,
    subject: subject || `Enquiry about ${school.name}`,
    last_message_at: new Date().toISOString(),
    last_message_preview: text.slice(0, 140),
    admin_unread: 1,
    student_unread: 0,
  });

  await db.entities.Message.create({
    thread_id: thread.id,
    school_id: school.id,
    participant_emails: participants,
    sender_email: student.email,
    sender_name: student.name,
    sender_role: "student",
    content: text,
    read_by_admin: false,
    read_by_student: true,
  });

  await db.entities.School.update(school.id, {
    inquiries_count: (Number(school.inquiries_count) || 0) + 1,
  });

  db.functions.invoke("notifySchoolAdmins", { type: "inquiry", id: thread.id }).catch(() => {});

  return thread;
}