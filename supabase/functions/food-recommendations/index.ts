import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { menuItems = [], hotelId } = await req.json();
    if (!Array.isArray(menuItems) || menuItems.length === 0) {
      return new Response(JSON.stringify({ itemIds: [], reasons: {} }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const menuList = menuItems
      .slice(0, 80)
      .map((m: any) => `- ${m.id} | ${m.name} (${m.category}) ₹${m.price}`)
      .join("\n");

    const systemPrompt = `You are a restaurant recommendation engine. Given a menu, suggest 5 items a customer is likely to enjoy. Mix categories. Use the recommend_items tool.`;
    const userPrompt = `Menu:\n${menuList}\n\nReturn 5 item IDs with a short reason for each.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "recommend_items",
              description: "Return recommended item IDs with reasons",
              parameters: {
                type: "object",
                properties: {
                  recommendations: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        id: { type: "string" },
                        reason: { type: "string" },
                      },
                      required: ["id", "reason"],
                    },
                  },
                },
                required: ["recommendations"],
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "recommend_items" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI processing failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    const args = toolCall ? JSON.parse(toolCall.function.arguments) : { recommendations: [] };
    const recs = args.recommendations || [];
    const itemIds = recs.map((r: any) => r.id).filter(Boolean);
    const reasons: Record<string, string> = {};
    recs.forEach((r: any) => { if (r.id) reasons[r.id] = r.reason; });

    return new Response(JSON.stringify({ itemIds, reasons }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("food-recommendations error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
