export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Méthode non autorisée' });

  const { fileUri, mimeType } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || !fileUri) return res.status(400).json({ error: "Données manquantes" });

  try {
    // 1. EXTRACTION DU NOM DU FICHIER (nécessaire pour vérifier le statut)
    const fileId = fileUri.split('/').pop();
    const statusUrl = `https://generativelanguage.googleapis.com/v1beta/files/${fileId}?key=${apiKey}`;

    // 2. POLLING : On attend que Google ait fini de traiter la vidéo
    let isActive = false;
    for (let i = 0; i < 5; i++) { // Max 5 tentatives (10 secondes)
      const statusRes = await fetch(statusUrl);
      const fileData = await statusRes.json();
      
      if (fileData.state === "ACTIVE") {
        isActive = true;
        break;
      }
      await new Promise(resolve => setTimeout(resolve, 2000)); // Attente 2s
    }

    if (!isActive) throw new Error("Le traitement vidéo est trop long (Processing timeout).");

    // 3. ANALYSE (Le fichier est maintenant prêt)
    const prompt = `Tu es un expert mondial de la Belote Coinchée. Analyse ce pli. 
- BobbyAs (Bas) joue contre Serge (Droite) et l'adversaire Gauche. Partenaire est en Haut.
- Respecte les règles : Annonces, Sans Atout/Tout Atout, et le droit de pisser.
- Analyse chronologique d'abord, puis erreurs stratégiques.
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
