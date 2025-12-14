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
    console.error('Clé API manquante dans les variables d’environnement');
    return new Response(JSON.stringify({ error: 'Erreur serveur : clé manquante' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  let body;
  try {
    body = await req.json();
  } catch (e) {
    return new Response(JSON.stringify({ error: 'JSON invalide dans la requête' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // 🔥 URLs CORRIGÉES : aucun espace en fin de chaîne !
  const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
  const origin = req.headers.get('origin') || 'https://comparateur-ia-self.vercel.app';

  try {
    const proxyRes = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': origin,
        'X-Title': 'Comparateur IA Vercel'
      },
      body: JSON.stringify(body),
      // 🔥 Ajout d’un timeout explicite pour éviter les hangs
      signal: AbortSignal.timeout(25000) // 25 secondes max
    });

    const proxyBody = await proxyRes.text();
    return new Response(proxyBody, {
      status: proxyRes.status,
      headers: {
        'Content-Type': proxyRes.headers.get('content-type') || 'application/json',
        'Access-Control-Allow-Origin': origin
      }
    });
  } catch (error) {
    console.error('Erreur dans /api/ask :', error.message || error);
    if (error.name === 'TimeoutError') {
      return new Response(JSON.stringify({ error: 'Timeout: OpenRouter ne répond pas' }), {
        status: 504,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    return new Response(JSON.stringify({ error: 'Erreur proxy inattendue' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
