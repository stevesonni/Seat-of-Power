# Character voice: architecture, prototype, provider notes

## What is built
- **Rules** (`game/systems/voice.js`):
  - Every spoken line is identified by character, scene and line id, plus its text, voice profile and audio version.
  - Cache keys are built from text, voice and settings, so fixed lines can be generated once and reused.
  - Voices are assigned from a stable hash of the character id, never from ethnicity, religion or appearance.
  - `speakable()` reads naira amounts, titles and acronyms properly (₦1.69B → "1.69 billion naira", Hon. → "Honourable", EFCC → "E F C C").
- **Prototype** (`VoiceBar` in `game/seat-of-power.jsx`): the Secretariat case meeting only.
  - Entering the scene reads the commissioner's opening line. Choosing how to open the meeting reads their reply.
  - Leaving the scene stops playback.
  - Off by default; the player turns it on. Mute, volume, replay and skip are provided.
  - One line at a time; a new line stops the previous one.
- **Provider:** the device's own speech engine (Web Speech API).
  - Free, needs no account, and sends nothing to a server.
  - Voice quality and accent depend on the device.
  - Where speech is unavailable, the scene says so and works as text.
- **Guarantees:**
  - Text is always on screen first.
  - Speech never adds facts or changes state. Replay plays audio only and never repeats a decision.
  - A failure is silent and never blocks play.
  - No sound while Vatar pauses the game.

## YarnGPT (candidate, not configured)
I couldn't verify anything from this environment: yarngpt.ai did not resolve (DNS failure). What follows comes from web search results only, so check each point at the source before relying on it.

- **The product:**
  - A hosted service, yarngpt.ai, with API docs at yarngpt.ai/api-docs. Search snippets mention TTS jobs, streaming and a voice-list endpoint.
  - An open model on Hugging Face (saheedniyi/YarnGPT, YarnGPT2), listed as Apache-2.0.
  - A PyPI wrapper that says it is MIT-licensed.
- **Languages:** English, Nigerian Pidgin, Yorùbá, Igbo and Hausa.
- **Voices:** the sources disagree (16 on the API docs, about 11 on the model card, 12 in the wrapper).
- **Price:** the hosted service is described as free for now, with about 80 requests per day per user and a paid tier not yet announced.
- **Not found:**
  - the terms for the hosted API: commercial use, who owns the generated audio, and whether audio may be stored, cached or redistributed;
  - the API base URL and how to authenticate;
  - the audio format;
  - how long generation takes.

**Before any integration:**
1. Read the hosted API's terms. The questions are commercial use in a paid Vatar product, whether audio may be cached and stored, and whether attribution is required.
2. Measure how long generation takes, and listen to names, places and naira amounts.
3. Keep the key on the server only, for example a `/api/tts` route in `server/vatar-server.mjs` with `YARNGPT_API_KEY` set in Railway variables. Cache by `cacheKey()`, and cap how many dynamic lines can be generated.
4. Prefer generating fixed lines ahead of time. Generate dynamic lines (names, amounts) only within a budget.

Nothing has been bought or generated, and no YarnGPT key or route exists in the code. The game never presents YarnGPT as configured.
