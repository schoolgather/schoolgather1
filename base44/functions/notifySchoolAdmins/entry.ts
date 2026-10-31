const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

const LOGO_URL = "https://media.db.com/images/public/6ae5a83517eb7a4bd4eec737/5fb4b6cd9_LOGO.png";

function encodeBase64(text) {
  const bytes = new TextEncoder().encode(text);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function toBase64Url(base64) {
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function encodeHeader(value) {
  const text = String(value || "").replace(/[\r\n]+/g, " ").trim();
  if (/^[\x20-\x7E]*$/.test(text)) return text;
  return `=?UTF-8?B?${encodeBase64(text)}?=`;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildRawMessage({ to, subject, html }) {
  const body = encodeBase64(html).replace(/(.{76})/g, "$1\r\n");
  const message = [
    `To: ${to.join(", ")}`,
    `Subject: ${encodeHeader(subject)}`,
    "MIME-Version: 1.0",
    'Content-Type: text/html; charset="UTF-8"',
    "Content-Transfer-Encoding: base64",
    "",
    body,
  ].join("\r\n");
  return toBase64Url(encodeBase64(message));
}

function wrap(bodyHtml) {
  return `<!doctype html><html><body style="margin:0;padding:24px;background:#f3f7f5;font-family:'Helvetica Neue',Arial,sans-serif;color:#12202b;">
  <div style="max-width:580px;margin:0 auto;background:#ffffff;border-radius:18px;overflow:hidden;border:1px solid #e2eae7;">
    <div style="padding:20px 26px;background:linear-gradient(135deg,#22c55e,#2dd4bf);">
      <img src="${LOGO_URL}" alt="School Gather" style="height:56px;border-radius:10px;display:block;" />
    </div>
    <div style="padding:26px;font-size:15px;line-height:1.6;">${bodyHtml}</div>
    <div style="padding:16px 26px;border-top:1px solid #eef2f1;font-size:12px;color:#6b7b86;">
      Sent by School Gather — helping families and schools find each other, without the paperwork.
    </div>
  </div></body></html>`;
}

function detailRow(label, value) {
  if (!value) return "";
  return `<tr><td style="padding:4px 12px 4px 0;color:#6b7b86;white-space:nowrap;vertical-align:top;">${escapeHtml(label)}</td><td style="padding:4px 0;font-weight:600;">${escapeHtml(value)}</td></tr>`;
}

async function sendMail(accessToken, raw) {
  const response = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ raw }),
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Gmail rejected the message (${response.status}): ${detail.slice(0, 300)}`);
  }
  return response.json();
}

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await db.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: "Please sign in first." }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const { type, id } = body || {};
    if (!type || !id) return Response.json({ error: "type and id are required" }, { status: 400 });
    if (type !== "application" && type !== "inquiry") {
      return Response.json({ error: "type must be application or inquiry" }, { status: 400 });
    }

    const appUrl = (req.headers.get("x-base44-app-url") || "").replace(/\/$/, "");
    let schoolId = null;
    let subject = "";
    let html = "";
    let recipients = [];

    if (type === "application") {
      const application = await db.entities.Application.get(id).catch((e) => (e.status === 404 ? null : Promise.reject(e)));
      if (!application) return Response.json({ error: "Application not found" }, { status: 404 });
      if (application.status !== "SUBMITTED") return Response.json({ sent: 0, skipped: "application not submitted" });
      const submissions = (application.timeline || []).filter((entry) => entry.status === "SUBMITTED").length;
      if (submissions > 1) return Response.json({ sent: 0, skipped: "already notified" });

      schoolId = application.school_id;
      const school = await db.entities.School.get(schoolId).catch((e) => (e.status === 404 ? null : Promise.reject(e)));
      if (!school) return Response.json({ error: "School not found" }, { status: 404 });

      recipients = school.admin_emails?.length ? school.admin_emails : [school.contact_email].filter(Boolean);
      subject = `New application: ${application.student_name} — ${application.grade_applying || "placement"} (${application.academic_year || "next year"})`;

      const statement = (application.personal_statement || "").trim();
      html = wrap(`
        <p style="margin:0 0 14px;">Hi ${escapeHtml(school.name)} team,</p>
        <p style="margin:0 0 18px;">Good news — <strong>${escapeHtml(application.student_name)}</strong> just sent you an application and is hoping to join you${application.grade_applying ? ` in <strong>${escapeHtml(application.grade_applying)}</strong>` : ""}.</p>
        <table style="width:100%;border-collapse:collapse;margin:0 0 20px;font-size:14px;">
          ${detailRow("Student", application.student_name)}
          ${detailRow("Parent / guardian", application.guardian_name)}
          ${detailRow("Guardian email", application.guardian_email)}
          ${detailRow("Guardian phone", application.guardian_phone)}
          ${detailRow("Year group", application.grade_applying)}
          ${detailRow("Academic year", application.academic_year)}
          ${detailRow("Current school", application.answers?.current_school)}
          ${detailRow("Documents", application.documents?.length ? `${application.documents.length} attached` : "None yet")}
        </table>
        ${statement ? `<p style="margin:0 0 6px;font-weight:600;">In their own words</p>
        <blockquote style="margin:0 0 22px;padding:14px 16px;background:#f5f9f7;border-left:3px solid #22c55e;border-radius:8px;color:#28414f;">${escapeHtml(statement.slice(0, 900))}${statement.length > 900 ? "…" : ""}</blockquote>` : ""}
        <p style="margin:0 0 8px;">Whenever you are ready, you can review the full application and reply from your admissions console.</p>
        ${appUrl ? `<p style="margin:0 0 4px;"><a href="${escapeHtml(appUrl)}/dashboard/school" style="display:inline-block;padding:11px 20px;border-radius:10px;background:#123a52;color:#ffffff;text-decoration:none;font-weight:600;font-size:14px;">Open admissions console</a></p>` : ""}
        <p style="margin:18px 0 0;">Warmly,<br/>The School Gather team</p>
      `);
    } else {
      const thread = await db.entities.Thread.get(id).catch((e) => (e.status === 404 ? null : Promise.reject(e)));
      if (!thread) return Response.json({ error: "Conversation not found" }, { status: 404 });

      schoolId = thread.school_id;
      const school = await db.entities.School.get(schoolId).catch((e) => (e.status === 404 ? null : Promise.reject(e)));
      if (!school) return Response.json({ error: "School not found" }, { status: 404 });

      const latest = await db.entities.Message.filter({ thread_id: thread.id }, { sort: "-created_date", limit: 1 });
      const message = latest.items?.[0];
      if (!message || message.sender_role !== "student") {
        return Response.json({ sent: 0, skipped: "no student message to notify about" });
      }

      recipients = school.admin_emails?.length ? school.admin_emails : [school.contact_email].filter(Boolean);
      subject = `New enquiry from ${message.sender_name || thread.student_name} — ${thread.subject || school.name}`;

      html = wrap(`
        <p style="margin:0 0 14px;">Hi ${escapeHtml(school.name)} team,</p>
        <p style="margin:0 0 18px;"><strong>${escapeHtml(message.sender_name || thread.student_name)}</strong> has a question about ${escapeHtml(school.name)} and is waiting to hear from you.</p>
        <p style="margin:0 0 6px;font-weight:600;">${escapeHtml(thread.subject || `Enquiry about ${school.name}`)}</p>
        <blockquote style="margin:0 0 20px;padding:14px 16px;background:#f5f9f7;border-left:3px solid #22c55e;border-radius:8px;color:#28414f;">${escapeHtml((message.content || "").slice(0, 1200))}${(message.content || "").length > 1200 ? "…" : ""}</blockquote>
        <p style="margin:0 0 4px;font-size:14px;color:#6b7b86;">Reply to ${escapeHtml(message.sender_email || thread.student_email)} — your reply lands straight in their family dashboard.</p>
        ${appUrl ? `<p style="margin:14px 0 0;"><a href="${escapeHtml(appUrl)}/dashboard/school" style="display:inline-block;padding:11px 20px;border-radius:10px;background:#123a52;color:#ffffff;text-decoration:none;font-weight:600;font-size:14px;">Answer in admissions console</a></p>` : ""}
        <p style="margin:18px 0 0;">Thanks for being quick to reply,<br/>The School Gather team</p>
      `);
    }

    const to = Array.from(new Set(recipients.map((email) => String(email).trim().toLowerCase()).filter(Boolean))).slice(0, 10);
    if (!to.length) {
      return Response.json({ sent: 0, skipped: "school has no admissions contacts yet" });
    }

    const { accessToken } = await db.asServiceRole.connectors.getConnection("gmail");
    await sendMail(accessToken, buildRawMessage({ to, subject, html }));

    return Response.json({ sent: to.length, recipients: to, subject });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}