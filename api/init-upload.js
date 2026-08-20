export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Méthode non autorisée' });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "Clé API manquante" });

  try {
    // Demande de session d'upload à Google
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/upload/files?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ file: { display_name: "coinche_game.mp4" } })
    });
    
    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message);

    // Retourne l'URL pour l'upload direct et l'URI pour l'analyse
    res.status(200).json({ 
        uploadUrl: data.file.upload_url, 
        fileUri: data.file.uri 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
