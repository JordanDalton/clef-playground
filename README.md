# Clef playground

A small Cloudflare Worker that demos [Clef](https://blog.cloudflare.com/clef-decision-models), Cloudflare's decision models. Give it some text (and optionally images, audio, or video) plus a set of typed questions, and it returns calibrated probabilities from `clef`, `clef-flash`, and `clef-omni` side by side, with latency and cost for each call. See the [multimodal release post](https://blog.cloudflare.com/clef-faster-cheaper-multimodal/) for what changed.

- **Scenarios:** support triage, content moderation, image check, call & video review, sales lead scoring. Each one ends with a line of plain code that turns the probabilities into an action.
- **Question types:** `noul` (yes/no), `choice` (pick one), `score` (ordered rubric).
- **Images:** up to 4 PNG/JPEG/WebP files, resized in the browser to 512px before sending, because larger images are much slower. All three models accept images.
- **Audio and video:** `clef-omni` only. Up to 4 WAV/MP3 files and up to 4 MP4/WebM files, sent unmodified as base64 data URLs. The API's limits, found by testing: 8 MiB per audio clip, 16 MiB per video clip, and roughly 27–35 MB for the whole request body after base64. The page checks these before sending. If you send audio or video to `clef` or `clef-flash`, the Worker skips that model and says why, rather than dropping the media without telling you.
- **Cost:** worked out from `usage.input_tokens` using Workers AI list prices per million input tokens: $0.24 for `clef`, $0.038 for `clef-flash`, and $0.15 for `clef-omni`. Note that hosted `clef-flash` now has a 24k-token context window, down from 64k.

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
  "models": ["clef", "clef-flash", "clef-omni"],
  "state": "Checkout has been failing for every customer for the last hour.",
  "images": ["data:image/jpeg;base64,..."],
  "audio": ["data:audio/mpeg;base64,..."],
  "videos": ["data:video/mp4;base64,..."],
  "questions": {
    "urgent": { "type": "noul", "instructions": "Is this support request urgent?" }
  }
}
```

The response has one entry per model in `runs`, each with `ms`, the raw model `result`, and `cost` (`usd`, `neurons`). A model that can't take the media you sent comes back with `skipped` instead.
