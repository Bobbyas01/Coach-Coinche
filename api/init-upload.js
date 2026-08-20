export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Méthode non autorisée' });

  const apiKey = process.env.GEMINI_API_KEY;

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/upload/files?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ file: { display_name: "video.mp4" } })
    });
    
    const data = await response.json();
    if (!response.ok) throw new Error(JSON.stringify(data));

    // On renvoie le fileName en plus pour le check-status
    res.status(200).json({ 
        uploadUrl: data.file.upload_url, 
        fileUri: data.file.uri,
        fileName: data.file.name 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
