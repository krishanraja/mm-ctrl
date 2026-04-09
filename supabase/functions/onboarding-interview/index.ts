/**
 * onboarding-interview Edge Function
 *
 * Orchestrates a dynamic conversational interview with new users.
 * Uses GPT-4o to generate contextually-aware follow-up questions
 * based on the conversation history, ensuring all required profile
 * fields are captured before completing.
 */

import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, getResponseHeaders } from "../_shared/security-headers.ts";
import { callOpenAI } from "../_shared/openai-utils.ts";

const SYSTEM_PROMPT = `You are Krishan, the creator of The Mind Maker. You're having a warm, natural conversation with someone who just signed up for Control by Mindmaker. Your goal is to learn about them so you can build a rich profile that makes the product immediately useful.

CONVERSATION STYLE:
- Warm, genuine, curious (not corporate or stiff)
- One question at a time
- React naturally to what they share before asking the next thing
- Short acknowledgments ("That's great", "I love that", "Interesting")
- Keep questions concise (1-2 sentences max)
- Sound like a real person having a conversation, not running a survey
- Use contractions naturally (I'm, you're, what's, that's)

REQUIRED FIELDS (must be captured before marking complete):
- name: Their name
- role: Their role or job title
- company: Their company or organization
- current_work: What they're currently working on
- top_goal: Their top goal or priority (next 90 days)
- challenge: Their biggest challenge or blocker

OPTIONAL BUT VALUABLE (cover if conversation flows there naturally):
- Team size or who they manage
- Industry or company stage
- Communication style preferences
- AI tool usage or comfort level
- How they prefer to learn or think

RULES:
- Never ask more than one question at a time
- If their answer covers multiple required fields, acknowledge that and skip ahead
- Track which REQUIRED fields have been captured from the conversation so far
- Do NOT set is_complete until all 6 required fields are covered
- After all required fields are captured and you've had 5-8 exchanges total, set is_complete to true
- Your final message (when is_complete is true) should be a warm wrap-up thanking them for sharing
- Do not use em dashes (--) in any text; use commas, semicolons, or parentheses instead
- Keep your responses concise; they will be read aloud via text-to-speech

You MUST respond with valid JSON in this exact format:
{
  "message": "Your conversational response including the next question",
  "is_complete": false,
  "required_fields_captured": ["name", "role"],
  "required_fields_remaining": ["company", "current_work", "top_goal", "challenge"]
}`;

interface ConversationMessage {
  role: "interviewer" | "user";
  content: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { conversation, turn_count } = await req.json() as {
      conversation: ConversationMessage[];
      turn_count: number;
    };

    if (!conversation || !Array.isArray(conversation)) {
      throw new Error("conversation array is required");
    }

    // Build messages for OpenAI
    const messages: Array<{ role: string; content: string }> = [
      { role: "system", content: SYSTEM_PROMPT },
    ];

    // Add conversation history
    for (const msg of conversation) {
      messages.push({
        role: msg.role === "interviewer" ? "assistant" : "user",
        content: msg.content,
      });
    }

    // Add turn context to help the AI track progress
    if (turn_count > 0) {
      messages.push({
        role: "system",
        content: `This is turn ${turn_count} of the interview. Remember to check which required fields have been captured from the conversation so far and which still need to be asked about. If all 6 required fields are captured and you've had enough exchanges, set is_complete to true.`,
      });
    }

    const result = await callOpenAI(
      {
        messages,
        model: "gpt-4o",
        temperature: 0.8,
        max_tokens: 500,
        response_format: { type: "json_object" },
      },
      { useCache: false },
    );

    // Parse the AI response
    let parsed;
    try {
      parsed = JSON.parse(result.content);
    } catch {
      // If JSON parsing fails, wrap the raw text
      parsed = {
        message: result.content,
        is_complete: false,
        required_fields_captured: [],
        required_fields_remaining: [
          "name",
          "role",
          "company",
          "current_work",
          "top_goal",
          "challenge",
        ],
      };
    }

    // Safety: force completion after 10 turns to prevent infinite loops
    if (turn_count >= 10 && !parsed.is_complete) {
      parsed.is_complete = true;
      if (!parsed.message.toLowerCase().includes("thank")) {
        parsed.message +=
          " Thanks so much for sharing all of that with me. I have a great picture of who you are and what you're working on. Let's get your Memory Web set up!";
      }
    }

    return new Response(JSON.stringify(parsed), {
      headers: getResponseHeaders(),
    });
  } catch (error) {
    console.error("onboarding-interview error:", error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: getResponseHeaders() },
    );
  }
});
