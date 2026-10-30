import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { generateResponse, GatewayError } from "@lovable.dev/ai-gateway";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const Msg = z.object({ role: z.enum(["user", "assistant"]), content: z.string().min(1).max(4000) });

const SYSTEM = `You are the Power Grid assistant, an expert on electric vehicles and EV charging infrastructure in India.
Help users with charging station availability, charger types (AC/DC, CCS2, Type 2, Bharat AC/DC), costs, trip planning, state EV policies, subsidies (PM E-DRIVE, FAME), EV sales trends and where new stations could be built. Be concise, use bullet points when useful, and say when figures are approximate.
Power Grid's map stations and potential sites are illustrative, generated examples, not verified operational stations or approved development projects. You have no live availability feed or access to the user's location. Never invent exact nearby station names, current crowd levels, prices or verified availability. Ask for city/area when needed and recommend confirming operational details with the operator. Treat potential sites as unvalidated planning ideas and explain the demand, access, grid capacity and land permissions needed. Do not claim to have searched the web. Distinguish historical policies from current eligibility and direct users to official scheme sources to confirm current terms.`;

export const askAssistant = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ messages: z.array(Msg).min(1).max(30) }).parse(d))
  .handler(async ({ data }) => {
    try {
      const res = await generateResponse({
        model: "openai/gpt-6-astra",
        instructions: SYSTEM,
        input: data.messages.map((m) => ({ role: m.role, content: m.content })),
      });
      let text = "";
      for (const item of res.output ?? []) {
        if (item.type === "message") {
          for (const c of item.content) if (c.type === "output_text") text += c.text;
        }
      }
      return { reply: text || "Sorry, I couldn't generate a response.", error: null as string | null };
    } catch (e) {
      console.error("assistant error", e);
      if (e instanceof GatewayError && e.httpStatus === 429) return { reply: "", error: "Too many requests — please wait a moment." };
      if (e instanceof GatewayError && e.httpStatus === 402) return { reply: "", error: "AI credits are exhausted for this workspace." };
      return { reply: "", error: "The assistant is unavailable right now. Please try again." };
    }
  });
