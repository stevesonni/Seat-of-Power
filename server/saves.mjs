/* A career in progress is never lost to another: when sop_save is replaced by a different game
   (or cleared), the old one is kept in p.bak (the last three), and the player can bring it back. */
export const careerOf = (v) => { try { const j = JSON.parse(v), st = j.setup || {}; return [st.nm || "", st.state || "", (j.stc || {}).pseed || "", st.startYear || ""].join("|"); } catch (e) { return "?"; } };
export const careerName = (v) => { try { const j = JSON.parse(v), st = j.setup || {}; return (st.nm || "A governor") + " · " + String(st.state || "").replace(/_/g, " ") + " · year " + (j.turn || 1); } catch (e) { return "A saved game"; } };
export const keepBackup = (p, k, v) => {
  if (k !== "sop_save") return; const old = p.data && p.data.sop_save; if (!old) return;
  if (v && careerOf(v) === careerOf(old)) return;
  p.bak = [{ t: Date.now(), v: old }, ...(p.bak || []).filter(b => careerOf(b.v) !== careerOf(old))].slice(0, 3);
};
