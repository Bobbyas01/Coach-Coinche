export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Méthode non autorisée' });

  const { fileUri, mimeType } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  try {
    const prompt = `Tu es un expert mondial de la Belote Coinchée. Analyse ce pli. 
BobbyAs (Bas) joue contre Serge (Droite) et l'autre adversaire (Gauche). Partenaire est en Haut.
- Respecte les règles : Annonces, Sans Atout/Tout Atout, et le droit de pisser sur une coupe du partenaire.
- Utilise une chaîne de pensée pour chronométrer le pli avant de juger.
- Rends uniquement un JSON avec : 
{ "analyse_chronologique_du_pli": "", "partie_context": {...}, "analyse_globale": {...}, "erreurs_et_conseils": [...] }`;

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`;

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: prompt },
            { fileData: { mimeType: mimeType || 'video/mp4', fileUri: fileUri } }
          ]
        }],
        generationConfig: { responseMimeType: "application/json" }
      })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message);

    res.status(200).send(data.candidates[0].content.parts[0].text);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
