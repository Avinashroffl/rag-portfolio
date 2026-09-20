/**
 * Cloudflare Worker for Serverless RAG Proxy
 * Proxies requests to a Free LLM API (e.g., Groq, Gemini)
 */

export default {
  async fetch(request, env, ctx) {
    console.log(`[Worker] Received ${request.method} request to ${request.url}`);

    // Handle CORS preflight requests
    if (request.method === "OPTIONS") {
      console.log("[Worker] Handling CORS OPTIONS preflight request.");
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      });
    }

    if (request.method !== "POST") {
      console.warn(`[Worker] Method ${request.method} is not allowed.`);
      return new Response("Method not allowed", { status: 405 });
    }

    try {
      let requestData;
      try {
        requestData = await request.json();
        console.log("[Worker] Successfully parsed incoming JSON request body.");
      } catch (parseError) {
        console.error("[Worker] Failed to parse JSON request body.", parseError);
        return new Response(JSON.stringify({ error: "Invalid JSON body" }), { status: 400 });
      }

      const { query, context } = requestData;

      if (!query || !context) {
        console.error("[Worker] Missing required 'query' or 'context' fields in request.");
        return new Response("Missing query or context", { status: 400 });
      }

      console.log(`[Worker] Processing query: "${query.substring(0, 50)}..."`);
      console.log(`[Worker] Context length provided: ${context.length} characters.`);

      const prompt = `You are the official AI assistant representing Avinash R's portfolio. 
Use the following context to answer the user's question in a professional, enthusiastic tone. 
Important Rules:
1. ALWAYS format your responses beautifully using Markdown. Use bolding, bullet points, and tables where appropriate.
2. Liberally use relevant emojis (🚀, 💻, 💡, etc.) to make the response engaging!
3. If the context does not contain the answer, politely state that you do not have that information but encourage them to contact Avinash.
4. AT THE VERY END of your response, you MUST provide exactly 3 suggested follow-up questions that the user could ask next. Wrap these suggestions exactly inside this tag format:
[SUGGESTIONS]
Question 1|Question 2|Question 3
[/SUGGESTIONS]
      
Context:
${context}

User Question: ${query}

Answer:`;

      // Example using Gemini API (Requires LLM_API_KEY in worker secrets)
      const apiKey = env.LLM_API_KEY;
      if (!apiKey) {
         console.error("[Worker] CRITICAL: LLM_API_KEY environment variable is not configured.");
         return new Response(JSON.stringify({ error: "API Key not configured on backend." }), { 
             status: 500, 
             headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } 
         });
      }

      let finalAnswer = "Sorry, I couldn't generate a response.";
      
      try {
        console.log("[Worker] Sending request to Primary LLM (Groq Llama 3)...");
        
        if (!env.GROQ_API_KEY) {
           throw new Error("GROQ_API_KEY is not configured.");
        }

        const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${env.GROQ_API_KEY}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model: "openai/gpt-oss-20b",
            messages: [{ role: "user", "content": prompt }]
          })
        });

        if (!groqResponse.ok) {
           const errorText = await groqResponse.text();
           console.error(`[Worker] Groq API error: ${groqResponse.status} - ${errorText}`);
           throw new Error(`Groq Request Failed: ${groqResponse.status}`);
        }

        const data = await groqResponse.json();
        const answer = data?.choices?.[0]?.message?.content;
        
        if (answer) {
          finalAnswer = answer;
          console.log("[Worker] Successfully received response from Groq.");
        } else {
          throw new Error("Invalid Groq response format.");
        }
      } catch (groqError) {
        console.warn("[Worker] Primary LLM failed. Attempting fallback to Gemini...", groqError.message);
        
        if (!apiKey) {
           console.error("[Worker] LLM_API_KEY is not configured for fallback.");
           throw new Error("Groq failed and no fallback API key is configured. Please try again later.");
        }

        console.log("[Worker] Sending request to Fallback LLM (Google Gemini)...");
        const llmUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`;
        const llmResponse = await fetch(llmUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
        });

        if (!llmResponse.ok) {
           const errorText = await llmResponse.text();
           console.error(`[Worker] Gemini API error: ${llmResponse.status} - ${errorText}`);
           throw new Error("Both Groq and Gemini requests failed.");
        }
        
        const data = await llmResponse.json();
        const answer = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        
        if (answer) {
          finalAnswer = answer;
          console.log("[Worker] Successfully received response from Gemini.");
        } else {
          throw new Error("Invalid Gemini response format.");
        }
      }

      return new Response(JSON.stringify({ answer: finalAnswer }), {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      });

    } catch (err) {
      console.error("[Worker] Uncaught exception in worker execution:", err.message, err.stack);
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      });
    }
  },
};
