# Clef playground

A small Cloudflare Worker that demos [Clef](https://blog.cloudflare.com/clef-decision-models), Cloudflare's decision models. Give it some text (and optionally images) plus a set of typed questions, and it returns calibrated probabilities from `clef` and `clef-flash` side by side, with latency and cost for each call.

- **Scenarios:** support triage, content moderation, image check, sales lead scoring. Each one ends with a line of plain code that turns the probabilities into an action.
- **Question types:** `noul` (yes/no), `choice` (pick one), `score` (ordered rubric).
- **Images:** up to 4 PNG/JPEG/WebP files, resized in the browser to 512px before sending, because larger images are much slower.
- **Cost:** worked out from `usage.input_tokens` using Workers AI list prices ($0.24 per million input tokens for `clef`, $0.09 for `clef-flash`).

## Run it

You need a Cloudflare account with Workers AI enabled. No API keys are required: the Worker uses the `AI` binding, and `wrangler` uses your own login.

```sh
npm install
npx wrangler login
npm run dev      # http://localhost:8787
npm run deploy   # optional: publish to your workers.dev subdomain
```

Every request is billed to the Cloudflare account that runs it. A deployed copy has no auth, so anyone with the URL can spend your Workers AI usage.

## API

`POST /api/decide`

```json
{
  "models": ["clef", "clef-flash"],
  "state": "Checkout has been failing for every customer for the last hour.",
  "images": ["data:image/jpeg;base64,..."],
  "questions": {
    "urgent": { "type": "noul", "instructions": "Is this support request urgent?" }
  }
}
```

The response has one entry per model in `runs`, each with `ms`, the raw model `result`, and `cost` (`usd`, `neurons`).
