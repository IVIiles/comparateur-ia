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
    return new Response(JSON.stringify({ error: 'Clé API manquante' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  let body;
  try {
    body = await req.json();
  } catch (e) {
    return new Response(JSON.stringify({ error: 'JSON invalide' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const origin = req.headers.get('origin') || 'https://comparateur-ia-self.vercel.app';
    const proxyRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': origin,
        'X-Title': 'Comparateur IA Vercel'
      },
      body: JSON.stringify(body)
    });

    // On forward la réponse exacte d'OpenRouter (même si c'est une erreur 4xx/5xx)
    const proxyBody = await proxyRes.text();
    return new Response(proxyBody, {
      status: proxyRes.status,
      headers: {
        'Content-Type': proxyRes.headers.get('content-type') || 'application/json',
        'Access-Control-Allow-Origin': origin
      }
    });
  } catch (error) {
    console.error('Erreur dans /api/ask :', error);
    return new Response(JSON.stringify({ error: 'Erreur serveur proxy' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
