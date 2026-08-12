// Endpoint PÚBLICO para la landing /api/asesor: dice qué asesor le tocó al lead más reciente,
// para enrutar el "chatear ahora" a ese mismo asesor. Solo devuelve el NOMBRE (no datos del lead),
// y la clave del Apps Script queda del lado servidor (env). Si algo falla → {ok:false} y el link usa 50/50.
const GAS_URL = process.env.APPS_SCRIPT_URL;
const GAS_KEY = process.env.APPS_SCRIPT_KEY;

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (!GAS_URL || !GAS_KEY) return res.status(200).json({ ok: false });
  try {
    const url = GAS_URL + '?key=' + encodeURIComponent(GAS_KEY) + '&action=latest&_=' + Date.now();
    const r = await fetch(url, { redirect: 'follow', headers: { 'User-Agent': 'Mozilla/5.0 (asesor)' } });
    const j = await r.json();
    const asesor = (j && j.asesor === 'Mili') ? 'Mili' : (j && j.asesor === 'Oscar') ? 'Oscar' : '';
    return res.status(200).json({ ok: !!(j && j.ok), asesor, fresh: !!(j && j.fresh) });
  } catch (e) {
    return res.status(200).json({ ok: false });
  }
};
