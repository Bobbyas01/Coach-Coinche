export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Méthode non autorisée' });

  const { fileUri, mimeType } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || !fileUri) return res.status(400).json({ error: "Configuration manquante" });

  try {
    const prompt = `Tu es un arbitre de Belote Coinchée. Analyse cette vidéo. 
Ton joueur est BobbyAs (BAS de l'écran).
1. Analyse chronologique : 1. Entame, 2. Carte joueur Bas, 3. Carte Gauche, 4. Carte Haut (Partenaire).
2. Vérifie si le joueur en bas a respecté les règles (fournir à la couleur, pisser si permis).
3. Si aucune erreur n'est faite, le tableau "erreurs_et_conseils" doit être VIDE [].
Rends uniquement un JSON : 
{ 
  "analyse_chronologique_du_pli": "", 
  "partie_context": { "contrat": "", "couleur_atout": "", "preneur": "", "score_final_estime": "" }, 
  "analyse_globale": { "note_strategique": 0, "point_fort": "", "axe_amelioration": "" }, 
  "erreurs_et_conseils": [] 
}`;

    // Appel direct au modèle Flash 3.6
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
    
    // Log complet pour le debug Vercel si jamais ça échoue encore
    if (!response.ok) {
        console.error("Erreur API Google :", JSON.stringify(data, null, 2));
        throw new Error(data.error?.message || "Erreur inconnue API");
    }

    res.status(200).send(data.candidates[0].content.parts[0].text);
  } catch (error) {
    console.error("Erreur Backend :", error);
    res.status(500).json({ error: error.message });
  }
}
