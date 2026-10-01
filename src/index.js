const MODELS = {
  clef: "@cf/cloudflare/clef",
  "clef-flash": "@cf/cloudflare/clef-flash",
};

// Workers AI list prices (developers.cloudflare.com/workers-ai/platform/pricing).
// Clef models only bill input tokens; output_tokens is always 0.
// Neurons are Workers AI's billing unit: $0.011 per 1,000, with 10,000 free per day.
const PRICING = {
  clef: { usdPerMInput: 0.24, neuronsPerMInput: 21818 },
  "clef-flash": { usdPerMInput: 0.09, neuronsPerMInput: 8182 },
};

function costOf(model, usage) {
  const p = PRICING[model];
  const tokens = usage?.input_tokens ?? 0;
  return {
    usd: (tokens / 1e6) * p.usdPerMInput,
    neurons: (tokens / 1e6) * p.neuronsPerMInput,
  };
}

async function decide(env, model, state, questions, images) {
  const t0 = Date.now();
  try {
    const result = await env.AI.run(MODELS[model], {
      model,
      state,
      questions,
      ...(images?.length ? { images } : {}),
    });
    return { model, ms: Date.now() - t0, result, cost: costOf(model, result.usage) };
  } catch (err) {
    return { model, ms: Date.now() - t0, error: String(err?.message ?? err) };
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/api/decide" && request.method === "POST") {
      const { models = ["clef", "clef-flash"], state, questions, images } = await request.json();
      const runs = await Promise.all(
        models.filter((m) => m in MODELS).map((m) => decide(env, m, state, questions, images)),
      );
      return Response.json({ runs });
    }
    return env.ASSETS?.fetch(request) ?? new Response("Not found", { status: 404 });
  },
};
