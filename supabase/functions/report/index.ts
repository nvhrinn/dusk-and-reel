import { serve } from "https://deno.land/std/http/server.ts";
import { Resend } from "npm:resend";

const resend = new Resend(Deno.env.get("re_378XCzxf_5qN1eHR42YcdJgNbbsDWyhra"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { message, page } = await req.json();

    if (!message || message.length < 5) {
      return new Response(
        JSON.stringify({ error: "Pesan terlalu pendek" }),
        { status: 400, headers: corsHeaders }
      );
    }

    await resend.emails.send({
      from: "Report <report@anirull.biz.id>",
      to: "khoirulmustofa767@gmail.com",
      subject: "Website Report",
      text: `
Page: ${page}

Message:
${message}
      `,
    });

    return new Response(
      JSON.stringify({ success: true }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (err) {
    console.error(err);

    return new Response(
      JSON.stringify({ error: "Gagal mengirim report" }),
      { status: 500, headers: corsHeaders }
    );
  }
});
