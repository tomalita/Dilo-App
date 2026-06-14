// whatsapp-webhook — Supabase Edge Function (Deno)
// Receives incoming WhatsApp messages from Meta and stores them in whatsapp_inbox.
//
// Env vars: WHATSAPP_VERIFY_TOKEN, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const VERIFY_TOKEN = Deno.env.get("WHATSAPP_VERIFY_TOKEN")!;
const SB_URL       = Deno.env.get("SUPABASE_URL")!;
const SB_KEY       = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

serve(async (req) => {
  // ── Webhook verification (GET) ───────────────────────────────────────────
  if (req.method === "GET") {
    const url       = new URL(req.url);
    const mode      = url.searchParams.get("hub.mode");
    const token     = url.searchParams.get("hub.verify_token");
    const challenge = url.searchParams.get("hub.challenge");

    if (mode === "subscribe" && token === VERIFY_TOKEN) {
      console.log("[webhook] verified");
      return new Response(challenge ?? "", { status: 200 });
    }
    return new Response("Forbidden", { status: 403 });
  }

  // ── Incoming message (POST) ──────────────────────────────────────────────
  if (req.method === "POST") {
    let body: any;
    try { body = await req.json(); } catch { return new Response("OK", { status: 200 }); }

    const messages = body.entry?.[0]?.changes?.[0]?.value?.messages;
    const contacts = body.entry?.[0]?.changes?.[0]?.value?.contacts;

    if (!messages?.length) return new Response("OK", { status: 200 });

    const supabase = createClient(SB_URL, SB_KEY);

    for (const msg of messages) {
      const fromPhone  = msg.from;
      const messageId  = msg.id;
      const msgType    = msg.type;
      const timestamp  = new Date(parseInt(msg.timestamp) * 1000).toISOString();
      const contact    = contacts?.find((c: any) => c.wa_id === fromPhone);
      const fromName   = contact?.profile?.name ?? fromPhone;

      let messageBody = "";
      if (msgType === "text") {
        messageBody = msg.text?.body ?? "";
      } else if (msgType === "interactive") {
        messageBody = msg.interactive?.button_reply?.title
          ?? msg.interactive?.list_reply?.title ?? "";
      } else {
        messageBody = `[${msgType}]`;
      }

      console.log(`[webhook] msg from ${fromPhone}: ${messageBody}`);

      await supabase.from("whatsapp_inbox").insert({
        from_phone:   fromPhone,
        from_name:    fromName,
        message_body: messageBody,
        message_id:   messageId,
        message_type: msgType,
        timestamp,
        metadata:     msg,
      });
    }

    return new Response("OK", { status: 200 });
  }

  return new Response("Method Not Allowed", { status: 405 });
});
