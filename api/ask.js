// api/ask.js
export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Méthode non autorisée' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
  if (!OPENROUTER_API_KEY) {
    console.error('Clé API manquante');
    return new Response(JSON.stringify({ error: 'Erreur serveur : clé manquante' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  let body;
  try {
    const text = await req.text(); // ✅ req.text(), pas req.json()
    if (!text) {
      return new Response(JSON.stringify({ error: 'Corps vide' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }
    body = JSON.parse(text);
  } catch (e) {
    console.error('Erreur parsing JSON:', e.message);
    return new Response(JSON.stringify({ error: 'JSON invalide' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'; // ✅ Pas d’espace !
  const origin = req.headers.get('origin') || 'https://comparateur-ia-self.vercel.app';

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000); // 25s timeout

    const proxyRes = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': origin,
        'X-Title': 'Comparateur IA Vercel'
      },
      body: JSON.stringify(body),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    // Forward la réponse exacte
    const proxyText = await proxyRes.text();
    return new Response(proxyText, {
      status: proxyRes.status,
      headers: {
        'Content-Type': proxyRes.headers.get('content-type') || 'application/json',
        'Access-Control-Allow-Origin': origin
      }
    });
  } catch (error) {
    console.error('Erreur proxy:', error.message || error);

    if (error.name === 'AbortError') {
      return new Response(JSON.stringify({ error: 'Timeout: OpenRouter ne répond pas' }), {
        status: 504,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ error: 'Erreur serveur inattendue' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
