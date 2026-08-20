export default async function handler(req, res) {
  // On n'accepte que les requêtes POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  const { mimeType, byteCount } = req.body;

  try {
    // Appel à l'API REST de Google pour initier un "Resumable Upload"
    const response = await fetch(`https://generativelanguage.googleapis.com/upload/v1beta/files?uploadType=resumable&key=${apiKey}`, {
      method: 'POST',
      headers: {
        'X-Goog-Upload-Protocol': 'resumable',
        'X-Goog-Upload-Command': 'start',
        'X-Goog-Upload-Header-Content-Length': byteCount,
        'X-Goog-Upload-Header-Content-Type': mimeType,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ file: { display_name: "enregistrement_coinche.mp4" } })
    });

    // Google nous renvoie l'URL magique dans les headers
    const uploadUrl = response.headers.get('x-goog-upload-url');

    if (!uploadUrl) {
      throw new Error('Impossible de récupérer l\'URL d\'upload Google');
    }

    // On renvoie cette URL au smartphone
    res.status(200).json({ uploadUrl });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
