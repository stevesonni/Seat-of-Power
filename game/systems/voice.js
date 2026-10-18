/* Character speech: the architecture, independent of any provider.

   The simulation decides every line (text and consequences); speech only
   reads a line that already exists. Speech can never add facts, change
   state or repeat a decision: replaying a line plays audio, nothing else.

   Each spoken line is identified by:
     characterId · sceneId · lineId · text · voice profile · audio version
   so fixed lines can be cached and reused, keyed by text + voice + settings.

   Providers (chosen at runtime, all optional):
     browser – the device's own speech engine (Web Speech API). Free, offline
               on most phones, quality varies by device. Used by the prototype.
     yarngpt – Nigerian-language TTS. NOT CONFIGURED: its API, voice list,
               licence and caching terms could not be verified from this
               environment (see docs/VOICE.md). Credentials would live on the
               server, never in the page.

   Voices are assigned from a stable hash of the character id, never from
   ethnicity, religion or appearance. */
import { hashStr } from "./rng.js";

export const lineKey = ({ characterId, sceneId, lineId }) => [characterId, sceneId, lineId].join("·");
export const cacheKey = ({ text, voice, rate = 1, pitch = 1, provider = "browser", version = 1 }) => provider + ":" + version + ":" + voice + ":" + rate + ":" + pitch + ":" + hashStr(text);

// A stable voice profile for a recurring character. `voices` is whatever the
// provider offers (names); the same character always gets the same one.
export const voiceFor = (characterId, voices = []) => {
  const h = hashStr("voice:" + characterId);
  return { voice: voices.length ? voices[h % voices.length] : null, rate: .92 + ((h >>> 8) % 13) / 100, pitch: .9 + ((h >>> 16) % 21) / 100 };
};

// Lines for a scene, in order, each with a stable id.
export const sceneLines = (sceneId, characterId, texts) => texts.filter(Boolean).map((text, i) => ({ characterId, sceneId, lineId: "l" + i, text, key: lineKey({ characterId, sceneId, lineId: "l" + i }) }));

/* Names, places and amounts the speech engine should read properly.
   "₦1.69B" → "1.69 billion naira", "₦850M" → "850 million naira". */
export const speakable = (text) => String(text || "")
  .replace(/₦\s?([\d.,]+)\s?B\b/g, (_, n) => n + " billion naira")
  .replace(/₦\s?([\d.,]+)\s?M\b/g, (_, n) => n + " million naira")
  .replace(/₦\s?([\d.,]+)/g, (_, n) => n + " naira")
  .replace(/\bHon\.\s/g, "Honourable ").replace(/\bDr\.\s/g, "Doctor ").replace(/\bProf\.\s/g, "Professor ").replace(/\bBarr\.\s/g, "Barrister ")
  .replace(/\bLGA\b/g, "local government").replace(/\bEFCC\b/g, "E F C C").replace(/[“”"]/g, "");
