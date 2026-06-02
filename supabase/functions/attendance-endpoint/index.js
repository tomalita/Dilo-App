// attendance-endpoint — Supabase Edge Function (Deno)
// Handles Teams attendance data via Microsoft Graph API.
// NEVER modify rapid-endpoint — this is the dedicated attendance function.
//
// Env vars required: TENANT_ID, CLIENT_ID, CLIENT_SECRET

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const TENANT_ID     = Deno.env.get("TENANT_ID");
const CLIENT_ID     = Deno.env.get("CLIENT_ID");
const CLIENT_SECRET = Deno.env.get("CLIENT_SECRET");
const USER_ID       = "info@dilo.club";
const GRAPH         = "https://graph.microsoft.com";

const CORS = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function jsonResp(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

// ── Auth ──────────────────────────────────────────────────────────────────────
async function getToken() {
  const res = await fetch(
    `https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/token`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id:     CLIENT_ID,
        client_secret: CLIENT_SECRET,
        scope:         "https://graph.microsoft.com/.default",
        grant_type:    "client_credentials",
      }),
    }
  );
  const d = await res.json();
  if (!d.access_token) throw new Error("Token failed: " + JSON.stringify(d));
  return d.access_token;
}

// ── Graph GET with automatic 429 retry ───────────────────────────────────────
async function gGet(token, path, attempt = 0) {
  const url = path.startsWith("http") ? path : `${GRAPH}/${path}`;
  const res = await fetch(url, { headers: { Authorization: "Bearer " + token } });

  if (res.status === 429) {
    if (attempt >= 3) throw new Error(`Graph 429 rate limit [${path.slice(0, 60)}]`);
    const retryAfter = parseInt(res.headers.get("Retry-After") || "5", 10);
    console.log(`[gGet] 429 on ${path.slice(0, 50)}, waiting ${retryAfter}s (attempt ${attempt + 1})`);
    await sleep(retryAfter * 1000);
    return gGet(token, path, attempt + 1);
  }

  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { return { _raw: text, _status: res.status }; }
  if (!res.ok) {
    throw new Error(`Graph ${res.status} [${path.slice(0, 60)}]: ${JSON.stringify(data?.error || data)}`);
  }
  return data;
}

// ── Run items in batches to avoid hammering Graph API ─────────────────────────
async function batchedAllSettled(items, fn, batchSize = 8, delayMs = 500) {
  const results = [];
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchRes = await Promise.allSettled(batch.map(fn));
    results.push(...batchRes);
    if (i + batchSize < items.length) await sleep(delayMs);
  }
  return results;
}

// ── Get OnlineMeeting for a calendar event ────────────────────────────────────
// Strategy 1: beta /events/{id}/onlineMeeting  (rarely returns id, but gives joinUrl)
// Strategy 2: extract 19:meeting_X@thread.v2 from joinUrl → $filter chatInfo/threadId
async function getMeetingForEvent(token, eventId, joinUrl) {
  let resolvedJoinUrl = joinUrl;

  // Strategy 1 — beta endpoint (mainly to harvest joinUrl if we don't have one)
  try {
    const m = await gGet(token, `beta/users/${USER_ID}/events/${eventId}/onlineMeeting`);
    if (m && m.id) {
      console.log(`[meeting] beta hit: ${m.id.slice(0, 30)}…`);
      return m;
    }
    // Beta doesn't return id, but use its joinUrl as fallback
    if (!resolvedJoinUrl && m && m.joinUrl) resolvedJoinUrl = m.joinUrl;
    console.log(`[meeting] beta no id → joinUrl: ${(resolvedJoinUrl || "none").slice(0, 60)}`);
  } catch (e) {
    console.log(`[meeting] beta err: ${e.message.slice(0, 80)}`);
  }

  // Strategy 2 — parse threadId from joinUrl, filter /onlineMeetings
  if (!resolvedJoinUrl) {
    console.log(`[meeting] no joinUrl for …${eventId.slice(-8)}, giving up`);
    return null;
  }

  try {
    // Strip ?context=... from the join URL — Graph API stores the base URL without it,
    // and the context JSON breaks OData string parsing.
    // App-only auth only supports $filter=joinWebUrl (not chatInfo/threadId).
    const baseUrl = resolvedJoinUrl.split("?")[0];
    console.log(`[meeting] joinWebUrl filter: ${baseUrl.slice(0, 80)}`);

    const filter = encodeURIComponent(`joinWebUrl eq '${baseUrl}'`);
    const res    = await gGet(token,
      `v1.0/users/${USER_ID}/onlineMeetings?$filter=${filter}`
    );
    const meetings = res.value || [];
    console.log(`[meeting] joinWebUrl filter → ${meetings.length} result(s)`);

    if (meetings[0]?.id) {
      console.log(`[meeting] found: ${meetings[0].id.slice(0, 30)}…`);
      return meetings[0];
    }
  } catch (e) {
    console.log(`[meeting] joinWebUrl err: ${e.message.slice(0, 100)}`);
  }

  return null;
}

// ── Get latest attendance report for a meeting ────────────────────────────────
async function getAttendance(token, meetingId) {
  try {
    const encoded = encodeURIComponent(meetingId);

    const rptRes = await gGet(token,
      `v1.0/users/${USER_ID}/onlineMeetings/${encoded}/attendanceReports`
    );
    const reports = rptRes.value || [];
    if (!reports.length) {
      console.log(`[attendance] …${meetingId.slice(-8)}: no reports`);
      return null;
    }

    const latest = reports[reports.length - 1];
    const recRes = await gGet(token,
      `v1.0/users/${USER_ID}/onlineMeetings/${encoded}/attendanceReports/${latest.id}/attendanceRecords`
    );

    return {
      reportId:          latest.id,
      totalParticipants: latest.totalParticipantCount,
      startDateTime:     latest.meetingStartDateTime,
      endDateTime:       latest.meetingEndDateTime,
      records: (recRes.value || []).map(r => ({
        name:      r.identity?.displayName || r.emailAddress || "Unknown",
        email:     r.emailAddress || "",
        duration:  r.totalAttendanceInSeconds || 0,
        firstJoin: r.attendanceIntervals?.[0]?.joinDateTime || null,
        lastLeave: r.attendanceIntervals?.slice(-1)[0]?.leaveDateTime || null,
      })),
    };
  } catch (e) {
    console.log(`[attendance] …${meetingId.slice(-8)} err: ${e.message.slice(0, 80)}`);
    return null;
  }
}

// ── Main handler ──────────────────────────────────────────────────────────────
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  let body;
  try { body = await req.json(); } catch { return jsonResp({ error: "Invalid JSON body" }, 400); }

  const { source, eventId, subject, year, month } = body;
  console.log(`[attendance-endpoint] source=${source} eventId=${eventId || "-"} subject=${subject || "-"} year=${year} month=${month}`);

  try {
    const token = await getToken();

    // ── Single-event attendance (schedule modal) ──────────────────────────────
    if (source === "attendance") {
      if (!eventId) return jsonResp({ error: "eventId required" }, 400);

      const meeting = await getMeetingForEvent(token, eventId, body.joinUrl || null);
      if (!meeting) {
        return jsonResp({ records: [], error: "No Teams meeting linked to this calendar event." });
      }

      console.log(`[attendance] meetingId: ${meeting.id.slice(0, 40)}…`);
      const data = await getAttendance(token, meeting.id);
      if (!data) {
        return jsonResp({
          records: [],
          meetingId: meeting.id,
          error: "No attendance report available (meeting may not have ended yet).",
        });
      }

      return jsonResp(data);
    }

    // ── Monthly student attendance summary ────────────────────────────────────
    if (source === "student-attendance") {
      if (!year || !month) return jsonResp({ error: "year and month required" }, 400);

      const mm        = String(month).padStart(2, "0");
      const daysInMon = new Date(year, month, 0).getDate();
      const startDT   = `${year}-${mm}-01T00:00:00`;
      const endDT     = `${year}-${mm}-${String(daysInMon).padStart(2, "0")}T23:59:59`;
      const nowISO    = new Date().toISOString();

      // 1. Fetch all calendar events for the month
      const evRes = await gGet(token,
        `v1.0/users/${USER_ID}/calendarView` +
        `?startDateTime=${startDT}&endDateTime=${endDT}` +
        `&$select=id,subject,start,end,attendees&$top=200`
      );
      const allEvents  = evRes.value || [];
      const pastEvents = allEvents.filter(e => new Date(e.end.dateTime + "Z") < new Date(nowISO));
      console.log(`[student-attendance] events: ${allEvents.length} total / ${pastEvents.length} past`);

      // 2. Build per-student class counts from ALL events (invited = scheduled)
      const studentMap = {};
      for (const ev of allEvents) {
        for (const att of ev.attendees || []) {
          if (att.type !== "required" && att.type !== "optional") continue;
          const name  = att.emailAddress?.name  || att.emailAddress?.address || "Unknown";
          const email = (att.emailAddress?.address || "").toLowerCase();
          if (!studentMap[name]) studentMap[name] = { name, email, classCount: 0, minutes: 0 };
          studentMap[name].classCount++;
        }
      }
      console.log(`[student-attendance] students scheduled: ${Object.keys(studentMap).length}`);

      // 3. Get meeting IDs in batches of 8 (avoids 429)
      const meetingResults = await batchedAllSettled(
        pastEvents,
        ev => getMeetingForEvent(token, ev.id).then(m => ({ evId: ev.id, meeting: m })),
        8, 600
      );
      const meetingPairs = meetingResults
        .filter(r => r.status === "fulfilled" && r.value.meeting)
        .map(r => r.value);
      console.log(`[student-attendance] meetings found: ${meetingPairs.length}/${pastEvents.length}`);

      // 4. Fetch attendance in batches of 5 (each call is 2 Graph requests)
      const attendanceResults = await batchedAllSettled(
        meetingPairs,
        p => getAttendance(token, p.meeting.id),
        5, 800
      );

      // 5. Aggregate minutes per student
      let reportsWithData = 0;
      for (const res of attendanceResults) {
        if (res.status !== "fulfilled" || !res.value) continue;
        reportsWithData++;
        for (const rec of res.value.records) {
          const key = studentMap[rec.name]
            ? rec.name
            : Object.keys(studentMap).find(k => studentMap[k].email === rec.email);
          if (key) studentMap[key].minutes += Math.round(rec.duration / 60);
        }
      }
      console.log(`[student-attendance] reports with data: ${reportsWithData}`);

      // 6. Shape output
      const output = Object.values(studentMap)
        .filter(s => s.classCount > 0)
        .sort((a, b) => a.name.localeCompare(b.name))
        .map(s => ({
          name:            s.name,
          classCount:      s.classCount,
          actualMinutes:   s.minutes,
          expectedMinutes: s.classCount * 50,
          completion:      s.classCount > 0
            ? Math.round((s.minutes / (s.classCount * 50)) * 100)
            : 0,
        }));

      return jsonResp(output);
    }

    // ── Class attendance history (single subject, month or full year) ────────
    if (source === "class-history") {
      if (!subject || !year) return jsonResp({ error: "subject and year required" }, 400);

      const mm        = String(month || 1).padStart(2, "0");
      const startDT   = month
        ? `${year}-${mm}-01T00:00:00`
        : `${year}-01-01T00:00:00`;
      const endDT     = month
        ? `${year}-${mm}-${String(new Date(year, month, 0).getDate()).padStart(2, "0")}T23:59:59`
        : `${year}-12-31T23:59:59`;
      const nowISO    = new Date().toISOString();

      // Fetch all events in the date range (up to 500)
      const evRes = await gGet(token,
        `v1.0/users/${USER_ID}/calendarView` +
        `?startDateTime=${startDT}&endDateTime=${endDT}` +
        `&$select=id,subject,start,end,onlineMeeting&$top=500`
      );
      const allEvents = evRes.value || [];

      // Filter: same subject, already ended
      const matching = allEvents.filter(e =>
        e.subject === subject &&
        new Date(e.end.dateTime + "Z") < new Date(nowISO)
      );
      console.log(`[class-history] "${subject}" → ${matching.length} past sessions`);

      // Fetch meeting + attendance for each session in batches
      const results = await batchedAllSettled(
        matching,
        async ev => {
          const joinUrl = ev.onlineMeeting?.joinUrl || null;
          const meeting = await getMeetingForEvent(token, ev.id, joinUrl);
          if (!meeting) return { date: ev.start.dateTime, eventId: ev.id, records: [] };
          const att = await getAttendance(token, meeting.id);
          return {
            date:    ev.start.dateTime,
            eventId: ev.id,
            records: att?.records || [],
          };
        },
        6, 600
      );

      const sessions = results
        .filter(r => r.status === "fulfilled")
        .map(r => r.value)
        .sort((a, b) => new Date(b.date) - new Date(a.date)); // newest first

      return jsonResp(sessions);
    }

    // ── Test: Graph API beta aiInsights ──────────────────────────────────────
    // { source: "test-ai-insights", subject: "04B1 - Your English Class", date: "2026-05-27" }
    // { source: "test-ai-insights", eventId: "AAMk..." }
    // { source: "test-ai-insights", meetingId: "MSo..." }
    if (source === "test-ai-insights") {
      let meetingId    = body.meetingId || null;
      let eventId      = body.eventId   || null;
      const testUserId = body.userId    || USER_ID;   // pass "userId":"ricardo@dilo.club" to override
      const debug      = [];
      debug.push(`testUserId: ${testUserId}`);

      // Strategy 1 — resolve eventId from subject + date
      if (!meetingId && !eventId && body.subject && body.date) {
        debug.push(`looking up event: "${body.subject}" on ${body.date}`);
        try {
          const dayStart = `${body.date}T00:00:00`;
          const dayEnd   = `${body.date}T23:59:59`;
          const evRes    = await gGet(token,
            `v1.0/users/${testUserId}/calendarView` +
            `?startDateTime=${dayStart}&endDateTime=${dayEnd}` +
            `&$select=id,subject,start&$top=50`
          );
          const events = evRes.value || [];
          debug.push(`events on ${body.date}: ${events.length}`);
          const matched = events.find(e =>
            e.subject?.toLowerCase().includes(body.subject.toLowerCase()) ||
            body.subject.toLowerCase().includes(e.subject?.toLowerCase())
          );
          if (matched) {
            eventId = matched.id;
            debug.push(`matched: "${matched.subject}" → eventId …${eventId.slice(-12)}`);
          } else {
            return jsonResp({
              error: `No event found matching "${body.subject}" on ${body.date}`,
              debug,
              eventsOnDay: events.map(e => ({ subject: e.subject, start: e.start?.dateTime })),
            }, 404);
          }
        } catch (e) {
          debug.push(`calendar lookup err: ${e.message.slice(0, 100)}`);
        }
      }

      // Diagnostic: test bare onlineMeetings endpoint (no filter) to confirm policy works
      try {
        const listTest = await gGet(token, `v1.0/users/${testUserId}/onlineMeetings?$top=1`);
        debug.push(`bare list test: ok, value.length=${listTest.value?.length ?? "n/a"}`);
      } catch (e) {
        debug.push(`bare list test err: ${e.message.slice(0, 120)}`);
      }

      // Strategy 2 — resolve meetingId from eventId, exposing raw responses
      if (!meetingId && eventId) {
        debug.push(`resolving meetingId from eventId …${eventId.slice(-12)}`);

        // 2a: beta /events/{id}/onlineMeeting — grab id, joinUrl, chatInfo
        let betaRaw = null;
        let betaThreadId = null;
        try {
          betaRaw = await gGet(token, `beta/users/${testUserId}/events/${eventId}/onlineMeeting`);
          debug.push(`beta id: ${betaRaw?.id ?? "null"}`);
          debug.push(`beta joinUrl: ${betaRaw?.joinUrl ?? "null"}`);
          debug.push(`beta joinWebUrl: ${betaRaw?.joinWebUrl ?? "null"}`);
          debug.push(`beta chatInfo: ${JSON.stringify(betaRaw?.chatInfo ?? null)}`);
          debug.push(`beta keys: ${Object.keys(betaRaw || {}).join(", ")}`);
          if (betaRaw?.id) meetingId = betaRaw.id;
          if (betaRaw?.chatInfo?.threadId) betaThreadId = betaRaw.chatInfo.threadId;
        } catch (e) {
          debug.push(`beta onlineMeeting err: ${e.message.slice(0, 120)}`);
        }

        // 2b: full event → joinUrl + organizer; try multiple filter + ID construction strategies
        if (!meetingId) {
          try {
            const fullEv = await gGet(token,
              `v1.0/users/${testUserId}/events/${eventId}?$select=subject,onlineMeeting,start,organizer`
            );
            const ju        = fullEv?.onlineMeeting?.joinUrl;
            const organizer = fullEv?.organizer?.emailAddress?.address || null;
            debug.push(`event joinUrl: ${ju ? ju.slice(0, 100) : "null"}`);
            debug.push(`organizer: ${organizer ?? "null"}`);

            if (ju) {
              // Decode first to avoid double-encoding (%3a→%253a) when building the OData filter
              const baseUrl = decodeURIComponent(ju.split("?")[0]);
              debug.push(`baseUrl: ${baseUrl}`);

              // Parse organizer OID from the ?context= parameter in the joinUrl
              let organizerOID = null;
              try {
                const ctxMatch = ju.match(/[?&]context=([^&]+)/);
                if (ctxMatch) {
                  const ctx = JSON.parse(decodeURIComponent(ctxMatch[1]));
                  organizerOID = ctx?.Oid || null;
                  debug.push(`organizerOID (from joinUrl ctx): ${organizerOID}`);
                }
              } catch (e) { debug.push(`ctx parse err: ${e.message}`); }

              // Extract thread ID from the meetup-join path
              const threadMatch = decodeURIComponent(ju).match(/\/l\/meetup-join\/(19:[^/]+)/);
              const urlThreadId = threadMatch ? threadMatch[1] : null;
              const threadId    = betaThreadId || urlThreadId;
              if (threadId) debug.push(`threadId: ${threadId}`);

              // Resolve organizerOID → actual email (UPN), then add to users list
              let organizerEmailFromOID = null;
              if (organizerOID) {
                try {
                  const uInfo = await gGet(token, `v1.0/users/${organizerOID}?$select=mail,userPrincipalName,displayName`);
                  organizerEmailFromOID = uInfo.mail || uInfo.userPrincipalName || null;
                  debug.push(`organizerOID lookup → ${uInfo.displayName || "?"} (${organizerEmailFromOID ?? "no email"})`);
                } catch (e) { debug.push(`organizerOID lookup err: ${e.message.slice(0, 80)}`); }
              }

              // Users to try for filters: email, OID (from context), and OID-as-string
              const usersToTry = [testUserId];
              if (organizer && organizer.toLowerCase() !== testUserId.toLowerCase()) usersToTry.push(organizer);
              if (organizerEmailFromOID && !usersToTry.map(u=>u.toLowerCase()).includes(organizerEmailFromOID.toLowerCase())) usersToTry.push(organizerEmailFromOID);
              if (organizerOID && !usersToTry.includes(organizerOID)) usersToTry.push(organizerOID);
              debug.push(`usersToTry: ${usersToTry.join(", ")}`);

              for (const uid of usersToTry) {
                if (meetingId) break;
                debug.push(`--- filters under: ${uid}`);

                // v1.0 joinWebUrl filter
                try {
                  const f = encodeURIComponent(`joinWebUrl eq '${baseUrl}'`);
                  const r = await gGet(token, `v1.0/users/${uid}/onlineMeetings?$filter=${f}`);
                  debug.push(`v1.0 joinWebUrl → ${r.value?.length ?? 0} result(s)`);
                  if (r.value?.[0]?.id) meetingId = r.value[0].id;
                } catch (e) { debug.push(`v1.0 joinWebUrl err: ${e.message.slice(0, 80)}`); }

                // beta joinWebUrl filter
                if (!meetingId) {
                  try {
                    const f = encodeURIComponent(`joinWebUrl eq '${baseUrl}'`);
                    const r = await gGet(token, `beta/users/${uid}/onlineMeetings?$filter=${f}`);
                    debug.push(`beta joinWebUrl → ${r.value?.length ?? 0} result(s)`);
                    if (r.value?.[0]?.id) meetingId = r.value[0].id;
                  } catch (e) { debug.push(`beta joinWebUrl err: ${e.message.slice(0, 80)}`); }
                }

                // beta chatInfo/threadId filter
                if (!meetingId && threadId) {
                  try {
                    const f = encodeURIComponent(`chatInfo/threadId eq '${threadId}'`);
                    const r = await gGet(token, `beta/users/${uid}/onlineMeetings?$filter=${f}`);
                    debug.push(`beta threadId filter → ${r.value?.length ?? 0} result(s)`);
                    if (r.value?.[0]?.id) meetingId = r.value[0].id;
                  } catch (e) { debug.push(`beta threadId filter err: ${e.message.slice(0, 80)}`); }
                }

                // Try accessing meeting directly with threadId under this user
                if (!meetingId && threadId) {
                  try {
                    const r = await gGet(token,
                      `v1.0/users/${uid}/onlineMeetings/${encodeURIComponent(threadId)}`
                    );
                    debug.push(`direct threadId lookup (${uid.slice(0,16)}): id=${r?.id ?? "null"}`);
                    if (r?.id) meetingId = r.id;
                  } catch (e) { debug.push(`direct threadId err (${uid.slice(0,16)}): ${e.message.slice(0, 70)}`); }
                }
              }

              // 2b-2: /communications/onlineMeetings (tenant-level, no Application Access Policy needed)
              if (!meetingId) {
                try {
                  const f = encodeURIComponent(`joinWebUrl eq '${baseUrl}'`);
                  const r = await gGet(token, `v1.0/communications/onlineMeetings?$filter=${f}`);
                  debug.push(`/communications joinWebUrl → ${r.value?.length ?? 0} result(s)`);
                  if (r.value?.[0]?.id) meetingId = r.value[0].id;
                } catch (e) { debug.push(`/communications joinWebUrl err: ${e.message.slice(0, 80)}`); }
              }
              if (!meetingId && threadId) {
                try {
                  const f = encodeURIComponent(`chatInfo/threadId eq '${threadId}'`);
                  const r = await gGet(token, `beta/communications/onlineMeetings?$filter=${f}`);
                  debug.push(`/communications threadId → ${r.value?.length ?? 0} result(s)`);
                  if (r.value?.[0]?.id) meetingId = r.value[0].id;
                } catch (e) { debug.push(`/communications threadId err: ${e.message.slice(0, 80)}`); }
              }

              // 2c: Construct meetingId using Graph's internal format: base64url("{OID}*0*{threadId}")
              // This mirrors how Graph encodes scheduled meeting IDs internally.
              if (!meetingId && organizerOID && threadId) {
                const raw       = `${organizerOID}*0*${threadId}`;
                const b64       = btoa(raw).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
                const candidate = `MSo${b64}`;
                debug.push(`constructed meetingId: ${candidate.slice(0, 50)}…`);
                // Try fetching it to verify it resolves
                try {
                  const r = await gGet(token,
                    `v1.0/users/${testUserId}/onlineMeetings/${encodeURIComponent(candidate)}`
                  );
                  debug.push(`constructed id fetch: id=${r?.id ?? "null"}`);
                  if (r?.id) meetingId = r.id;
                  else if (r && !r.error) meetingId = candidate; // treat as valid if no error
                } catch (e) { debug.push(`constructed id err: ${e.message.slice(0, 80)}`); }
              }

              // 2d: /chats/{threadId}/onlineMeeting
              if (!meetingId && threadId) {
                try {
                  const r = await gGet(token, `beta/chats/${encodeURIComponent(threadId)}/onlineMeeting`);
                  debug.push(`chats meeting id: ${r?.id ?? "null"}`);
                  if (r?.id) meetingId = r.id;
                } catch (e) { debug.push(`chats meeting err: ${e.message.slice(0, 80)}`); }
              }

              // 2e: last resort — threadId works for /transcripts (got 403 not 404), try for aiInsights too
              if (!meetingId && threadId) {
                debug.push(`last resort: threadId as meetingId`);
                meetingId = threadId;
              }
            }
          } catch (e) {
            debug.push(`full event err: ${e.message.slice(0, 120)}`);
          }
        }

        debug.push(`final meetingId: ${meetingId ? meetingId.slice(0, 60) + "…" : "null"}`);
      }

      if (!meetingId) return jsonResp({ error: "Could not resolve meetingId", debug }, 400);

      const encoded = encodeURIComponent(meetingId);

      // 1. Beta aiInsights
      let aiInsights = null, aiError = null;
      try {
        aiInsights = await gGet(token, `beta/users/${testUserId}/onlineMeetings/${encoded}/aiInsights`);
      } catch (e) { aiError = e.message; }

      // 2. Transcripts (v1.0 stable)
      let transcripts = null, txError = null;
      try {
        const txRes = await gGet(token, `v1.0/users/${testUserId}/onlineMeetings/${encoded}/transcripts`);
        transcripts = txRes.value || [];
      } catch (e) { txError = e.message; }

      return jsonResp({
        meetingId,
        debug,
        aiInsights:       aiInsights ?? null,
        aiInsightsError:  aiError    ?? null,
        transcriptCount:  transcripts?.length ?? null,
        transcripts:      transcripts ?? null,
        transcriptsError: txError    ?? null,
      });
    }

    // ── Test: find transcript VTT from OneDrive ──────────────────────────────
    // { source: "test-vtt", subject: "04B1 - Your English Class", date: "2026-05-27" }
    if (source === "test-vtt") {
      const subj  = (body.subject || "").toLowerCase();
      const debug = [];

      // Helper: download a drive item's raw text content (follows redirect)
      async function driveContent(itemId) {
        const res = await fetch(
          `${GRAPH}/v1.0/users/${USER_ID}/drive/items/${encodeURIComponent(itemId)}/content`,
          { headers: { Authorization: "Bearer " + token }, redirect: "follow" }
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return await res.text();
      }

      // Helper: paginate ALL children of a OneDrive folder path (no $orderby — not supported)
      async function allChildren(folderPath) {
        const enc  = encodeURIComponent(folderPath).replace(/%2F/g, "/");
        let   url  = `${GRAPH}/v1.0/users/${USER_ID}/drive/root:/${enc}:/children?$select=id,name,createdDateTime,size,folder&$top=200`;
        const all  = [];
        let   page = 0;
        while (url && page < 15) {   // max 3000 items
          const res  = await fetch(url, { headers: { Authorization: "Bearer " + token } });
          if (!res.ok) throw new Error(`Graph ${res.status} [${folderPath}]`);
          const data = await res.json();
          all.push(...(data.value || []));
          url = data["@odata.nextLink"] || null;
          page++;
        }
        return all;
      }

      let vttText = null;
      let vttName = null;

      // 1. Paginate through Recordings folder to find all .vtt files
      try {
        const files    = await allChildren("Recordings");
        const exts     = [...new Set(files.map(f => (f.name || "").split(".").pop()))];
        const allVtt   = files.filter(f => (f.name || "").toLowerCase().endsWith(".vtt"));
        const subfolders = files.filter(f => f.folder);
        debug.push(`Recordings: ${files.length} total items`);
        debug.push(`extensions: ${exts.join(", ")}`);
        debug.push(`all VTT (${allVtt.length}): ${allVtt.slice(0, 15).map(f => f.name).join(" | ") || "none"}`);
        debug.push(`subfolders (${subfolders.length}): ${subfolders.slice(0, 5).map(f => f.name).join(" | ")}`);

        // Match VTT by subject keywords
        const subWords = subj.split(/\s+/).filter(w => w.length > 2);
        const candidates = allVtt.filter(f =>
          subWords.some(w => (f.name || "").toLowerCase().includes(w))
        );
        debug.push(`VTT candidates: ${candidates.map(f => f.name).join(", ") || "none"}`);

        const sorted = candidates.sort((a, b) => new Date(b.createdDateTime) - new Date(a.createdDateTime));
        const pick   = body.date
          ? sorted.find(f => f.createdDateTime?.startsWith(body.date)) || sorted[0]
          : sorted[0];

        if (pick) {
          debug.push(`downloading: ${pick.name}`);
          vttText = await driveContent(pick.id);
          vttName = pick.name;
        }
      } catch (e) {
        debug.push(`Recordings err: ${e.message.slice(0, 100)}`);
      }

      if (!vttText) {
        return jsonResp({ debug, transcript: null,
          hint: "No VTT found — transcription may not be enabled in Teams, or the AI transcript is stored differently." });
      }

      // Parse VTT → plain text
      const plainText = vttText.split("\n")
        .filter(l => l.trim() &&
          !l.startsWith("WEBVTT") && !l.startsWith("NOTE") &&
          !/^\d{2}:\d{2}/.test(l) && !/^[\da-f-]{36}$/.test(l.trim()))
        .join("\n").trim();

      return jsonResp({ debug, vttName, transcript: plainText, rawVtt: vttText });
    }

    return jsonResp({ error: `Unknown source: ${source}` }, 400);

  } catch (err) {
    console.error("[attendance-endpoint] Fatal:", err.message);
    return jsonResp({ error: err.message }, 500);
  }
});
