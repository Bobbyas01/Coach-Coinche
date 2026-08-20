export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Méthode non autorisée' });
  const apiKey = process.env.GEMINI_API_KEY;

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/upload/v1beta/files?key=${apiKey}`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'X-Goog-Upload-Protocol': 'resumable',
        'X-Goog-Upload-Command': 'start'
      },
      body: JSON.stringify({ file: { display_name: "video_coinche.mp4" } })
    });
    
    // L'URL EST CACHÉE DANS LES HEADERS, PAS DANS LE JSON !
    const uploadUrl = response.headers.get('x-goog-upload-url');
    
    if (!uploadUrl) {
       const text = await response.text();
       throw new Error("Impossible d'obtenir l'URL d'upload: " + text);
    }

    res.status(200).json({ uploadUrl });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
