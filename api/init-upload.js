// api/init-upload.js
export default async function handler(req, res) {
  const apiKey = process.env.GEMINI_API_KEY;
  // On demande à Google une URL d'upload sécurisée
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/files?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ file: { display_name: "partie_coinche.mp4" } })
  });
  
  const data = await response.json();
  // L'app Android utilisera 'upload_url' pour envoyer le fichier direct à Google
  res.status(200).json({ uploadUrl: data.file.upload_url, fileUri: data.file.uri });
}
