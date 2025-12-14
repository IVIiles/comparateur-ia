// api/ask.js
export default async function handler(req) {
  // Vérifier que la méthode est POST
  if (req.method !== 'POST') {
    return new Response('Méthode non autorisée', { status: 405 });
  }

  // Récupérer le corps de la requête
  const body = await req.json();

  // Récupérer la clé depuis les variables d'environnement (sécurisé !)
  const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
  if (!OPENROUTER_API_KEY) {
    return new Response('Clé API manquante côté serveur', { status: 500 });
  }

  try {
    const proxyRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': req.headers.get('origin') || 'https://comparateur-ia-self.vercel.app',
        'X-Title': 'Comparateur IA Vercel'
      },
      body: JSON.stringify(body)
    });

    // Forward la réponse d'OpenRouter telle quelle
    return new Response(proxyRes.body, {
      status: proxyRes.status,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': req.headers.get('origin') || '*'
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}