// api/ask.js
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
  if (!OPENROUTER_API_KEY) {
    console.error('Clé API manquante');
    return res.status(500).json({ error: 'Erreur serveur : clé manquante' });
  }

  let body;
  try {
    body = req.body;
    if (typeof body === 'string') {
      body = JSON.parse(body);
    }
  } catch (e) {
    console.error('Erreur parsing JSON:', e.message);
    return res.status(400).json({ error: 'JSON invalide' });
  }

  const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
  const origin = req.headers.origin || 'https://comparateur-ia-self.vercel.app';

  try {
    const proxyRes = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': origin,
        'X-Title': 'Comparateur IA Vercel'
      },
      body: JSON.stringify(body)
    });

    const proxyData = await proxyRes.text();

    // Forward la réponse exacte d'OpenRouter
    res.status(proxyRes.status);
    res.setHeader('Content-Type', proxyRes.headers.get('content-type') || 'application/json');
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.send(proxyData);
  } catch (error) {
    console.error('Erreur proxy:', error.message || error);
    res.status(500).json({ error: 'Erreur serveur inattendue' });
  }
}
