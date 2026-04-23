import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const MENU_ITEMS_CONTEXT = `
Available menu items (use exact names for matching):
South Indian: Idli, Vada, Idli Vada Combo, Ven Pongal, Upma, Kesari Bath, Plain Dosa, Masala Dosa, Set Dosa, Rava Dosa, Onion Dosa, Mysore Masala Dosa, Bisi Bele Bath, Full Meals, Mini Meals, Curd Rice, Sambar Rice, Samosa, Mirchi Bajji, Onion Pakoda, Bread Pakoda, Masala Chai, Filter Coffee, Chapathi Kurma, Paratha with Curry
North Indian: Paneer Butter Masala, Palak Paneer, Dal Fry, Dal Tadka, Mixed Vegetable Curry, Aloo Gobi, Chana Masala, Butter Roti, Plain Naan, Butter Naan, Garlic Naan, Jeera Rice, Roti Sabji Combo
Chinese: Veg Fried Rice, Schezwan Fried Rice, Veg Noodles, Hakka Noodles, Schezwan Noodles, Gobi Manchurian Dry, Gobi Manchurian Gravy, Chilli Paneer, Veg Spring Roll, Sweet Corn Soup
Tandoor: Paneer Tikka, Malai Paneer Tikka, Tandoori Roti, Rumali Roti, Stuffed Kulcha, Mushroom Tikka, Veg Seekh Kebab, Hara Bhara Kebab
`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { text } = await req.json();
    if (!text || typeof text !== "string" || text.trim().length === 0) {
      return new Response(JSON.stringify({ error: "No text provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `You are a restaurant voice assistant for Nalapaka restaurant. Parse the user's speech into structured JSON actions.
${MENU_ITEMS_CONTEXT}

The user may speak in English, Kannada, Hindi, or any language. Understand the intent regardless of language.

Common Kannada phrases:
- "haaki" / "hak" = add
- "tegedi" / "remove madu" = remove  
- "munde hogi" / "proceed" = proceed order
- "table" = table selection
- "parcel" = parcel order

Return a JSON array of actions. Each action must have this structure:
{
  "action": "add_item" | "remove_item" | "navigate_menu" | "navigate_cart" | "proceed_order" | "select_table" | "select_seat" | "select_block" | "set_customer_name" | "set_phone_number" | "set_order_type" | "pay_cash" | "pay_online" | "finish_order" | "unknown",
  "item_name": "exact menu item name from the list above or empty string",
  "quantity": number (default 1),
  "table_number": "string or empty",
  "seat_blocks": ["array of seat letters or empty"],
  "dining_type": "dine-in" | "parcel" | "",
  "customer_name": "string or empty",
  "phone_number": "10 digit string or empty",
  "response_text": "brief confirmation in same language user spoke"
}

IMPORTANT:
- Match item names fuzzy (e.g. "dosa" = "Plain Dosa", "masala dosa" = "Masala Dosa", "paneer" = "Paneer Butter Masala")
- For voice form fill commands:
  - "my name is Arsha" => action "set_customer_name" and customer_name="Arsha"
  - "my number is 9876543210" => action "set_phone_number" and phone_number="9876543210"
  - "dine in" / "parcel" => action "set_order_type" and dining_type accordingly
- If user says multiple things like "add 2 dosa and proceed", return multiple actions in array
- For quantity, detect numbers in any language (e.g. "two" = 2, "eradu" = 2)
- For table+seat phrases like "table 3 block A" return select_table then select_seat/select_block actions
- For fill actions, keep response_text empty (no greeting)
- Return ONLY the JSON array, nothing else
- If you can't understand, return [{"action":"unknown","item_name":"","quantity":1,"table_number":"","seat_blocks":[],"dining_type":"","customer_name":"","phone_number":"","response_text":"Sorry, I didn't understand. Please try again."}]`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: text },
        ],
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again shortly." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
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

    const aiData = await response.json();
    const content = aiData.choices?.[0]?.message?.content || "";
    
    // Extract JSON from response (handle markdown code blocks)
    let jsonStr = content.trim();
    if (jsonStr.startsWith("```")) {
      jsonStr = jsonStr.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    }
    
    let actions;
    try {
      actions = JSON.parse(jsonStr);
      if (!Array.isArray(actions)) actions = [actions];
    } catch {
      console.error("Failed to parse AI response:", content);
      actions = [{ action: "unknown", item_name: "", quantity: 1, table_number: "", seat_blocks: [], dining_type: "", response_text: "Sorry, please try again." }];
    }

    return new Response(JSON.stringify({ actions }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("voice-intent error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
