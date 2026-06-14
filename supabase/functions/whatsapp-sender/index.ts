// whatsapp-sender — Supabase Edge Function (Deno)
// Sends WhatsApp messages via Meta Cloud API and logs them to whatsapp_messages table.
//
// Env vars: WHATSAPP_TOKEN, WHATSAPP_PHONE_NUMBER_ID, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const WA_TOKEN = Deno.env.get("WHATSAPP_TOKEN")!;
const PHONE_ID = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID")!;
const SB_URL   = Deno.env.get("SUPABASE_URL")!;
const SB_KEY   = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const WA_API   = "https://graph.facebook.com/v25.0";

const CORS = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function jsonResp(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}

async function sendTemplate(
  phone: string,
  templateName: string,
  params: string[],
  language = "es"
) {
  const components = params.length
    ? [{
        type: "body",
        parameters: params.map((p: any) =>
          typeof p === "object" && p.name
            ? { type: "text", parameter_name: p.name, text: p.value ?? "" }
            : { type: "text", text: String(p) }
        ),
      }]
    : [];

  const payload = {
    messaging_product: "whatsapp",
    to: phone.replace(/[^\d+]/g, ""),
    type: "template",
    template: {
      name: templateName,
      language: { code: language },
      ...(components.length ? { components } : {}),
    },
  };

  const res = await fetch(`${WA_API}/${PHONE_ID}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${WA_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return { status: res.status, data: await res.json() };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  let body: any;
  try { body = await req.json(); } catch { return jsonResp({ error: "Invalid JSON body" }, 400); }

  const { source } = body;
  const supabase = createClient(SB_URL, SB_KEY);

  try {

    // ── Register phone number with Cloud API (run once) ─────────────────────
    // { source: "register", pin: "000000" }
    if (source === "register") {
      const pin = body.pin ?? "000000";
      const res = await fetch(`${WA_API}/${PHONE_ID}/register`, {
        method: "POST",
        headers: { Authorization: `Bearer ${WA_TOKEN}`, "Content-Type": "application/json" },
        body: JSON.stringify({ messaging_product: "whatsapp", pin }),
      });
      const data = await res.json();
      console.log("[register]", JSON.stringify(data));
      return jsonResp({ status: res.status, data });
    }

    // ── Send a WhatsApp template message (single or broadcast) ──────────────
    // { source: "send", to: "+50612345678" | ["+506..."], template: "class_reminder",
    //   params: ["John", "6:00 AM"], category: "class_reminder", recipientName: "John" }
    if (source === "send") {
      const { to, template, params = [], category = null, language = "es" } = body;
      if (!to || !template) return jsonResp({ error: "to and template are required" }, 400);

      const recipients: string[] = Array.isArray(to) ? to : [to];
      const results = [];

      for (const phone of recipients) {
        const { status, data } = await sendTemplate(phone, template, params, language);
        const messageId    = data.messages?.[0]?.id ?? null;
        const errorMessage = data.error?.message ?? null;

        await supabase.from("whatsapp_messages").insert({
          to_phone:        phone,
          template_name:   template,
          params:          params,
          category:        category,
          status:          errorMessage ? "failed" : "sent",
          meta_message_id: messageId,
          error_message:   errorMessage,
          recipient_name:  body.recipientName ?? null,
        });

        results.push({ phone, messageId, error: errorMessage, status });
      }

      const failed = results.filter(r => r.error);
      return jsonResp({
        results,
        sent:   results.length - failed.length,
        failed: failed.length,
      });
    }

    // ── Get message history ──────────────────────────────────────────────────
    // { source: "history", limit: 50, category: "class_reminder" }
    if (source === "history") {
      const limit    = Number(body.limit ?? 50);
      const category = body.category ?? null;

      let query = supabase
        .from("whatsapp_messages")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit);

      if (category) query = query.eq("category", category);

      const { data, error } = await query;
      if (error) return jsonResp({ error: error.message }, 500);
      return jsonResp({ messages: data });
    }

    return jsonResp({ error: `Unknown source: ${source}` }, 400);

  } catch (err: any) {
    console.error("[whatsapp-sender]", err.message);
    return jsonResp({ error: err.message }, 500);
  }
});
