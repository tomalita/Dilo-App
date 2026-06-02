// attendance-endpoint — Supabase Edge Function (Deno)
// Handles Teams attendance data via Microsoft Graph API.
// NEVER modify rapid-endpoint — this is the dedicated attendance function.
//
// Env vars required: TENANT_ID, CLIENT_ID, CLIENT_SECRET
// Required Azure permissions: Calendars.Read, CallRecords.Read.All, Files.Read.All

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const TENANT_ID     = Deno.env.get("TENANT_ID");
const CLIENT_ID     = Deno.env.get("CLIENT_ID");
const CLIENT_SECRET = Deno.env.get("CLIENT_SECRET");
const USER_ID       = "info@dilo.club";
const GRAPH         = "https://graph.microsoft.com";
// Coaches excluded from all student-facing attendance reports
const COACH_EMAILS  = new Set(["jesse@dilo.club", "ricardo@dilo.club"]);

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

// ── Normalize a Teams join URL for matching ───────────────────────────────────
// Strips query string and decodes percent-encoding so both calendar joinUrl
// and callRecord joinWebUrl compare identically.
function normalizeJoinUrl(url) {
  if (!url) return null;
  try { return decodeURIComponent(url.split("?")[0]); }
  catch { return url.split("?")[0]; }
}

// ── Fetch all callRecords in a date range (handles @odata.nextLink) ──────────
// callRecords API restriction: only last 30 days, no future dates.
// Strip milliseconds from dates — Graph OData filter doesn't accept fractional seconds.
function isoNoMs(d) { return d instanceof Date ? d.toISOString().slice(0, 19) + "Z" : d.slice(0, 19) + "Z"; }

async function getAllCallRecords(token, startISO, endISO) {
  const now       = new Date();
  // Use 28 days to stay well within the 30-day limit
  const safeStart = new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000);

  const clampedStart = startISO < isoNoMs(safeStart) ? isoNoMs(safeStart) : isoNoMs(new Date(startISO));
  const clampedEnd   = endISO   > isoNoMs(now)        ? isoNoMs(now)       : isoNoMs(new Date(endISO));

  if (clampedStart >= clampedEnd) {
    console.log(`[callRecords] range out of bounds or too old: ${clampedStart} → ${clampedEnd}`);
    return [];
  }

  console.log(`[callRecords] querying ${clampedStart} → ${clampedEnd}`);
  let url = `${GRAPH}/v1.0/communications/callRecords` +
    `?$filter=startDateTime ge ${clampedStart} and startDateTime lt ${clampedEnd}` +
    `&$select=id,startDateTime,endDateTime,joinWebUrl`;
  const all = [];
  let page = 0;
  while (url && page < 20) {
    const res = await fetch(url, { headers: { Authorization: "Bearer " + token } });
    if (!res.ok) {
      const t = await res.text();
      // Log and return empty rather than crashing the whole request
      console.error(`[callRecords] 400/error: ${t.slice(0, 200)}`);
      return all; // return whatever we have so far
    }
    const data = await res.json();
    all.push(...(data.value || []));
    url = data["@odata.nextLink"] || null;
    page++;
    if (url) await sleep(150);
  }
  console.log(`[callRecords] fetched ${all.length} records (${page} page(s))`);
  return all;
}

// ── Build lookup map: normalizedJoinUrl → Array<{id, startDateTime}> ─────────
// Recurring meetings share the same joinWebUrl across occurrences, so we keep
// ALL callRecord entries per URL and match by time proximity later.
function buildCallRecordMap(callRecords) {
  const map = new Map();
  for (const rec of callRecords) {
    const key = normalizeJoinUrl(rec.joinWebUrl);
    if (!key) continue;
    if (!map.has(key)) map.set(key, []);
    map.get(key).push({ id: rec.id, startDateTime: rec.startDateTime });
  }
  return map;
}

// ── Find the callRecord closest in time to a given event start ────────────────
function findClosestCallRecord(callRecordMap, normalizedUrl, eventStartISO) {
  if (!normalizedUrl) return null;
  const candidates = callRecordMap.get(normalizedUrl);
  if (!candidates?.length) return null;
  if (candidates.length === 1) return candidates[0].id;
  const evTime = new Date(eventStartISO).getTime();
  let best = null, bestDiff = Infinity;
  for (const c of candidates) {
    const diff = Math.abs(new Date(c.startDateTime).getTime() - evTime);
    if (diff < bestDiff) { bestDiff = diff; best = c.id; }
  }
  return best;
}

// ── Get attendance detail from a callRecord ───────────────────────────────────
// Uses sessions (one per participant) to extract who was in the call + duration.
async function getAttendanceFromCallRecord(token, callRecordId) {
  try {
    const detail = await gGet(token,
      `v1.0/communications/callRecords/${callRecordId}?$expand=sessions`
    );

    const participants = new Map();

    for (const session of (detail.sessions || [])) {
      // associatedIdentity has email (UPN); identity.user for internal; identity.guest for external
      const assoc   = session.caller?.associatedIdentity;
      const idUser  = session.caller?.identity?.user;
      const idGuest = session.caller?.identity?.guest; // external / anonymous users

      const uid   = assoc?.id    || idUser?.id    || idGuest?.id;
      const name  = assoc?.displayName || idUser?.displayName || idGuest?.displayName;
      const email = (assoc?.userPrincipalName || "").toLowerCase();

      // Skip if no identity or looks like a service endpoint
      if (!uid || !name) continue;
      // Skip coaches
      if (COACH_EMAILS.has(email)) continue;

      const isExternal = email === "" || !email.endsWith("@dilo.club");

      const secs = (session.startDateTime && session.endDateTime)
        ? Math.round((new Date(session.endDateTime) - new Date(session.startDateTime)) / 1000)
        : 0;

      if (!participants.has(uid)) {
        participants.set(uid, {
          name, email, isExternal, secs,
          firstJoin:  session.startDateTime,
          lastLeave:  session.endDateTime,
        });
      } else {
        const p = participants.get(uid);
        p.secs += secs;
        if (session.startDateTime < p.firstJoin) p.firstJoin = session.startDateTime;
        if (session.endDateTime   > p.lastLeave) p.lastLeave = session.endDateTime;
      }
    }

    return {
      reportId:          detail.id,
      totalParticipants: participants.size,
      startDateTime:     detail.startDateTime,
      endDateTime:       detail.endDateTime,
      records: [...participants.values()].map(p => ({
        name:       p.name,
        email:      p.email,
        isExternal: p.isExternal,
        duration:   p.secs,
        firstJoin:  p.firstJoin,
        lastLeave:  p.lastLeave,
      })),
    };
  } catch (e) {
    console.log(`[callRecord] err ${callRecordId?.slice(0, 8)}: ${e.message.slice(0, 80)}`);
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

      // Get event to extract joinUrl
      const ev = await gGet(token,
        `v1.0/users/${USER_ID}/events/${eventId}?$select=subject,start,end,onlineMeeting,onlineMeetingUrl`
      );
      const joinUrl = ev?.onlineMeeting?.joinUrl || ev?.onlineMeetingUrl || body.joinUrl || null;
      if (!joinUrl) {
        return jsonResp({ records: [], error: "No Teams meeting linked to this calendar event." });
      }

      const key      = normalizeJoinUrl(joinUrl);
      const evDate   = (ev.start?.dateTime || "").slice(0, 10);
      // Widen the window ±1 day to handle timezone differences
      const evBase    = new Date(evDate + "T00:00:00Z").getTime();
      const dayBefore = new Date(evBase - 86400000).toISOString().slice(0, 10);
      const dayAfter  = new Date(evBase + 86400000 * 2).toISOString().slice(0, 10);

      const callRecs  = await getAllCallRecords(token, `${dayBefore}T00:00:00Z`, `${dayAfter}T00:00:00Z`);
      const callMap   = buildCallRecordMap(callRecs);
      const recordId  = findClosestCallRecord(callMap, key, ev.start?.dateTime);

      if (!recordId) {
        return jsonResp({ records: [], error: "No Teams call record found for this event." });
      }

      console.log(`[attendance] callRecordId: ${recordId}`);
      const data = await getAttendanceFromCallRecord(token, recordId);
      if (!data) {
        return jsonResp({ records: [], error: "Could not retrieve attendance data." });
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

      // 1. Fetch all calendar events for the month (include onlineMeeting + onlineMeetingUrl for joinUrl)
      const evRes = await gGet(token,
        `v1.0/users/${USER_ID}/calendarView` +
        `?startDateTime=${startDT}&endDateTime=${endDT}` +
        `&$select=id,subject,start,end,attendees,onlineMeeting,onlineMeetingUrl&$top=200`
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
          if (COACH_EMAILS.has(email)) continue; // exclude coaches
          const isExternal = email === "" || !email.endsWith("@dilo.club");
          if (!studentMap[name]) studentMap[name] = { name, email, isExternal, classCount: 0, minutes: 0 };
          studentMap[name].classCount++;
        }
      }
      console.log(`[student-attendance] students scheduled: ${Object.keys(studentMap).length}`);

      // 3. Fetch all callRecords for the month
      const nextMm    = String(month === 12 ? 1 : month + 1).padStart(2, "0");
      const nextYear  = month === 12 ? year + 1 : year;
      const callRecs  = await getAllCallRecords(token,
        `${year}-${mm}-01T00:00:00Z`,
        `${nextYear}-${nextMm}-01T00:00:00Z`
      );
      const callMap   = buildCallRecordMap(callRecs);

      // 4. Match past calendar events → callRecordIds
      // calendarView may not return onlineMeeting.joinUrl for recurring occurrences;
      // fall back to individual event fetch when needed.
      const matchedPairsSettled = await batchedAllSettled(
        pastEvents,
        async ev => {
          let joinUrl = ev.onlineMeeting?.joinUrl || ev.onlineMeetingUrl || null;
          if (!joinUrl) {
            try {
              const detail = await gGet(token,
                `v1.0/users/${USER_ID}/events/${ev.id}?$select=onlineMeeting,onlineMeetingUrl`
              );
              joinUrl = detail?.onlineMeeting?.joinUrl || detail?.onlineMeetingUrl || null;
            } catch {}
          }
          const key      = normalizeJoinUrl(joinUrl);
          const recordId = findClosestCallRecord(callMap, key, ev.start?.dateTime);
          return recordId ? { ev, recordId } : null;
        },
        8, 300
      );
      const matchedPairs = matchedPairsSettled
        .filter(r => r.status === "fulfilled" && r.value)
        .map(r => r.value);
      console.log(`[student-attendance] matched: ${matchedPairs.length}/${pastEvents.length} past events`);

      // 5. Fetch attendance in batches of 5 (each call expands sessions)
      const attendanceResults = await batchedAllSettled(
        matchedPairs,
        p => getAttendanceFromCallRecord(token, p.recordId),
        5, 600
      );

      // 6. Aggregate minutes per student
      // orphanMap collects external participants who joined via Teams link
      // but were NOT formal calendar attendees (so not in studentMap).
      const orphanMap = {};
      let reportsWithData = 0;
      for (const res of attendanceResults) {
        if (res.status !== "fulfilled" || !res.value) continue;
        reportsWithData++;
        for (const rec of res.value.records) {
          const key = studentMap[rec.name]
            ? rec.name
            : Object.keys(studentMap).find(k => studentMap[k].email === rec.email?.toLowerCase());
          if (key) {
            studentMap[key].minutes += Math.round(rec.duration / 60);
          } else {
            // Not a calendar attendee — track as orphan (likely external guest via link)
            const oKey = rec.email || rec.name;
            if (!orphanMap[oKey]) {
              orphanMap[oKey] = {
                name: rec.name, email: rec.email,
                isExternal: true, // by definition if not in calendar
                minutes: 0, sessions: 0,
              };
            }
            orphanMap[oKey].minutes  += Math.round(rec.duration / 60);
            orphanMap[oKey].sessions += 1;
          }
        }
      }
      console.log(`[student-attendance] reports with data: ${reportsWithData}, orphan externals: ${Object.keys(orphanMap).length}`);

      // 7. Shape output — calendar-invited students first, then orphan externals
      const output = [
        ...Object.values(studentMap)
          .filter(s => s.classCount > 0)
          .map(s => ({
            name:            s.name,
            email:           s.email,
            isExternal:      s.isExternal,
            classCount:      s.classCount,
            actualMinutes:   s.minutes,
            expectedMinutes: s.classCount * 50,
            completion:      s.classCount > 0
              ? Math.round((s.minutes / (s.classCount * 50)) * 100)
              : 0,
          })),
        // Orphan externals: classCount = sessions they actually attended
        ...Object.values(orphanMap).map(o => ({
          name:            o.name,
          email:           o.email,
          isExternal:      true,
          classCount:      o.sessions,
          actualMinutes:   o.minutes,
          expectedMinutes: o.sessions * 50,
          completion:      o.sessions > 0
            ? Math.round((o.minutes / (o.sessions * 50)) * 100)
            : 0,
        })),
      ].sort((a, b) => a.name.localeCompare(b.name));

      return jsonResp(output);
    }

    // ── Class attendance history (single subject, month or full year) ────────
    if (source === "class-history") {
      if (!subject || !year) return jsonResp({ error: "subject and year required" }, 400);

      const mm      = String(month || 1).padStart(2, "0");
      const startDT = month
        ? `${year}-${mm}-01T00:00:00`
        : `${year}-01-01T00:00:00`;
      const endDT   = month
        ? `${year}-${mm}-${String(new Date(year, month, 0).getDate()).padStart(2, "0")}T23:59:59`
        : `${year}-12-31T23:59:59`;
      const nowISO  = new Date().toISOString();

      // 1. Fetch all events in range
      const evRes = await gGet(token,
        `v1.0/users/${USER_ID}/calendarView` +
        `?startDateTime=${startDT}&endDateTime=${endDT}` +
        `&$select=id,subject,start,end,onlineMeeting,onlineMeetingUrl&$top=500`
      );
      const allEvents = evRes.value || [];

      // 2. Filter by subject + already ended
      const matching = allEvents.filter(e =>
        e.subject === subject &&
        new Date(e.end.dateTime + "Z") < new Date(nowISO)
      );
      console.log(`[class-history] "${subject}" → ${matching.length} past sessions`);

      // 3. Fetch callRecords for the whole period
      const callStartISO = month
        ? `${year}-${mm}-01T00:00:00Z`
        : `${year}-01-01T00:00:00Z`;
      const callEndISO   = month
        ? `${year}-${mm}-${String(new Date(year, month, 0).getDate()).padStart(2, "0")}T23:59:59Z`
        : `${year}-12-31T23:59:59Z`;
      const callRecs = await getAllCallRecords(token, callStartISO, callEndISO);
      const callMap  = buildCallRecordMap(callRecs);

      // 4. For each matching event, get attendance from callRecord
      // calendarView doesn't return onlineMeeting.joinUrl for recurring occurrences —
      // fall back to an individual event fetch if needed.
      const results = await batchedAllSettled(
        matching,
        async ev => {
          let joinUrl = ev.onlineMeeting?.joinUrl || ev.onlineMeetingUrl || null;
          if (!joinUrl) {
            try {
              const detail = await gGet(token,
                `v1.0/users/${USER_ID}/events/${ev.id}?$select=onlineMeeting,onlineMeetingUrl`
              );
              joinUrl = detail?.onlineMeeting?.joinUrl || detail?.onlineMeetingUrl || null;
            } catch (e) {
              console.log(`[class-history] event fetch err ${ev.id.slice(-8)}: ${e.message.slice(0, 60)}`);
            }
          }
          const key      = normalizeJoinUrl(joinUrl);
          const recordId = findClosestCallRecord(callMap, key, ev.start?.dateTime);
          if (!recordId) {
            console.log(`[class-history] no callRecord for ${ev.start.dateTime} key=${key?.slice(0, 60) || "null"}`);
            return { date: ev.start.dateTime, eventId: ev.id, records: [] };
          }
          const att = await getAttendanceFromCallRecord(token, recordId);
          return {
            date:    ev.start.dateTime,
            eventId: ev.id,
            records: att?.records || [],
          };
        },
        4, 800  // smaller batch — each item may do 2 Graph calls
      );

      const sessions = results
        .filter(r => r.status === "fulfilled")
        .map(r => r.value)
        .sort((a, b) => new Date(b.date) - new Date(a.date));

      return jsonResp(sessions);
    }

    // ── Test: Graph API beta aiInsights ──────────────────────────────────────
    // { source: "test-ai-insights", subject: "04B1 - Your English Class", date: "2026-05-27" }
    if (source === "test-ai-insights") {
      let meetingId    = body.meetingId || null;
      let eventId      = body.eventId   || null;
      const testUserId = body.userId    || USER_ID;
      const debug      = [];
      debug.push(`testUserId: ${testUserId}`);

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

      try {
        const listTest = await gGet(token, `v1.0/users/${testUserId}/onlineMeetings?$top=1`);
        debug.push(`bare list test: ok, value.length=${listTest.value?.length ?? "n/a"}`);
      } catch (e) {
        debug.push(`bare list test err: ${e.message.slice(0, 120)}`);
      }

      if (!meetingId && eventId) {
        debug.push(`resolving meetingId from eventId …${eventId.slice(-12)}`);
        let betaRaw = null;
        let betaThreadId = null;
        try {
          betaRaw = await gGet(token, `beta/users/${testUserId}/events/${eventId}/onlineMeeting`);
          debug.push(`beta id: ${betaRaw?.id ?? "null"}`);
          debug.push(`beta joinUrl: ${betaRaw?.joinUrl ?? "null"}`);
          debug.push(`beta chatInfo: ${JSON.stringify(betaRaw?.chatInfo ?? null)}`);
          if (betaRaw?.id) meetingId = betaRaw.id;
          if (betaRaw?.chatInfo?.threadId) betaThreadId = betaRaw.chatInfo.threadId;
        } catch (e) {
          debug.push(`beta onlineMeeting err: ${e.message.slice(0, 120)}`);
        }

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
              const baseUrl = decodeURIComponent(ju.split("?")[0]);
              const ctxMatch = ju.match(/[?&]context=([^&]+)/);
              let organizerOID = null;
              if (ctxMatch) {
                try {
                  const ctx = JSON.parse(decodeURIComponent(ctxMatch[1]));
                  organizerOID = ctx?.Oid || null;
                  debug.push(`organizerOID: ${organizerOID}`);
                } catch {}
              }
              const threadMatch = decodeURIComponent(ju).match(/\/l\/meetup-join\/(19:[^/]+)/);
              const threadId = betaThreadId || (threadMatch ? threadMatch[1] : null);
              if (threadId) debug.push(`threadId: ${threadId}`);

              const usersToTry = [testUserId];
              if (organizer && organizer.toLowerCase() !== testUserId.toLowerCase()) usersToTry.push(organizer);
              if (organizerOID && !usersToTry.includes(organizerOID)) usersToTry.push(organizerOID);

              for (const uid of usersToTry) {
                if (meetingId) break;
                try {
                  const f = encodeURIComponent(`joinWebUrl eq '${baseUrl}'`);
                  const r = await gGet(token, `v1.0/users/${uid}/onlineMeetings?$filter=${f}`);
                  debug.push(`v1.0 joinWebUrl (${uid.slice(0,16)}) → ${r.value?.length ?? 0}`);
                  if (r.value?.[0]?.id) meetingId = r.value[0].id;
                } catch (e) { debug.push(`v1.0 err (${uid.slice(0,16)}): ${e.message.slice(0, 60)}`); }
              }

              if (!meetingId && threadId) {
                meetingId = threadId;
                debug.push(`last resort: threadId as meetingId`);
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
      let aiInsights = null, aiError = null;
      try {
        aiInsights = await gGet(token, `beta/users/${testUserId}/onlineMeetings/${encoded}/aiInsights`);
      } catch (e) { aiError = e.message; }

      let transcripts = null, txError = null;
      try {
        const txRes = await gGet(token, `v1.0/users/${testUserId}/onlineMeetings/${encoded}/transcripts`);
        transcripts = txRes.value || [];
      } catch (e) { txError = e.message; }

      return jsonResp({
        meetingId, debug,
        aiInsights:       aiInsights ?? null,
        aiInsightsError:  aiError    ?? null,
        transcriptCount:  transcripts?.length ?? null,
        transcripts:      transcripts ?? null,
        transcriptsError: txError    ?? null,
      });
    }

    // ── Test: callRecords API ────────────────────────────────────────────────
    // { source: "test-callrecords", date: "2026-05-27" }
    if (source === "test-callrecords") {
      const debug = [];
      const date  = body.date || new Date().toISOString().slice(0, 10);
      const dayStart = `${date}T00:00:00Z`;
      const dayAfter = new Date(new Date(date + "T00:00:00Z").getTime() + 86400000 * 3)
        .toISOString().slice(0, 10) + "T00:00:00Z";

      try {
        const r = await getAllCallRecords(token, dayStart, dayAfter);
        debug.push(`callRecords: ${r.length} result(s)`);

        for (const rec of r.slice(0, 5)) {
          debug.push(`--- ${rec.id?.slice(0, 16)}`);
          debug.push(`  start: ${rec.startDateTime} → ${rec.endDateTime}`);
          debug.push(`  joinWebUrl: ${(rec.joinWebUrl || "null").slice(0, 90)}`);
        }

        if (r[0]) {
          const detail = await getAttendanceFromCallRecord(token, r[0].id);
          debug.push(`first record attendance: ${detail?.records?.length ?? 0} participant(s)`);
          if (detail?.records?.length) {
            debug.push(`  → ${detail.records.map(p => `${p.name} (${Math.round(p.duration/60)}min)`).join(", ")}`);
          }
          return jsonResp({ debug, records: r, firstAttendance: detail });
        }

        return jsonResp({ debug, records: r });
      } catch (e) {
        debug.push(`err: ${e.message.slice(0, 150)}`);
        return jsonResp({ debug, error: e.message }, 500);
      }
    }

    // ── Test: find transcript VTT from OneDrive ──────────────────────────────
    // { source: "test-vtt", subject: "04B1 - Your English Class", date: "2026-05-27" }
    if (source === "test-vtt") {
      const subj  = (body.subject || "").toLowerCase();
      const debug = [];

      async function driveContent(itemId) {
        const res = await fetch(
          `${GRAPH}/v1.0/users/${USER_ID}/drive/items/${encodeURIComponent(itemId)}/content`,
          { headers: { Authorization: "Bearer " + token }, redirect: "follow" }
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return await res.text();
      }

      async function allChildren(folderPath) {
        const enc  = encodeURIComponent(folderPath).replace(/%2F/g, "/");
        let   url  = `${GRAPH}/v1.0/users/${USER_ID}/drive/root:/${enc}:/children?$select=id,name,createdDateTime,size,folder&$top=200`;
        const all  = [];
        let   page = 0;
        while (url && page < 15) {
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

      try {
        const files      = await allChildren("Recordings");
        const exts       = [...new Set(files.map(f => (f.name || "").split(".").pop()))];
        const allVtt     = files.filter(f => (f.name || "").toLowerCase().endsWith(".vtt"));
        const subfolders = files.filter(f => f.folder);
        debug.push(`Recordings: ${files.length} total items`);
        debug.push(`extensions: ${exts.join(", ")}`);
        debug.push(`all VTT (${allVtt.length}): ${allVtt.slice(0, 15).map(f => f.name).join(" | ") || "none"}`);
        debug.push(`subfolders (${subfolders.length}): ${subfolders.slice(0, 5).map(f => f.name).join(" | ")}`);

        const subWords   = subj.split(/\s+/).filter(w => w.length > 2);
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
