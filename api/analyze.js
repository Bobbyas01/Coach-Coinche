export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  const { mimeType, videoBase64 } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: "Clé API Gemini introuvable sur Vercel." });
  }
  if (!videoBase64) {
    return res.status(400).json({ error: "Aucune vidéo reçue." });
  }

  try {
    const prompt = `Tu es un expert mondial de la Belote Coinchée. Tu connais parfaitement les règles classiques, les probabilités, la gestion des atouts, les impasses et les appels à la défausse.
Analyse la vidéo de cette donne jouée sur mobile.
Ton objectif est de repérer les erreurs stratégiques du joueur qui enregistre (cartes jouées, erreurs d'annonces, mauvaise lecture du jeu).
Renvoie strictement la réponse selon cette structure JSON :
{
  "partie_context": { "contrat": "", "couleur_atout": "", "preneur": "", "score_final_estime": "" },
  "analyse_globale": { "note_strategique": 0, "point_fort": "", "axe_amelioration": "" },
  "erreurs_et_conseils": [
    { "timestamp_video": "", "pli_numero": 0, "carte_jouee": "", "carte_recommandee": "", "type_erreur": "", "explication_tactique": "", "gravite": "" }
  ]
}`;

    // L'URL EXACTE ET VALIDÉE POUR LE MODÈLE FLASH
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: prompt },
            { inlineData: { mimeType: mimeType, data: videoBase64 } }
          ]
        }],
        generationConfig: { 
          responseMimeType: "application/json" 
        }
      })
    });

    const data = await response.json();

    // Interception stricte des erreurs renvoyées par l'API Google
    if (!response.ok) {
      throw new Error(data.error?.message || `Erreur HTTP ${response.status}`);
    }

    // Extraction du JSON généré par l'IA
    const jsonResponse = data.candidates[0].content.parts[0].text;
    
    res.status(200).send(jsonResponse); 

  } catch (error) {
    console.error("Erreur REST :", error);
    res.status(500).json({ error: `Échec de l'appel direct : ${error.message}` });
  }
}
