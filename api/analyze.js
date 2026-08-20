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
    // PROMPT EXPERT : Règles spécifiques et Chaîne de Pensée (CoT)
    const prompt = `Tu es un expert mondial de la Belote Coinchée et un analyste vidéo.
Tu analyses une capture vidéo d'un jeu sur smartphone. TON JOUEUR (celui que tu conseilles) est "BobbyAs" situé en BAS de l'écran.

RÈGLES SPÉCIFIQUES DE CETTE PARTIE :
- Surcoupe sur le partenaire : Il est autorisé de "pisser" (se défausser d'une autre couleur) si le partenaire est maître du pli ou si l'on ne peut pas monter à l'atout.
- Annonces : Les annonces classiques (Tierce, Cinquante, Cent, Carré) sont actives et doivent être annoncées au 1er pli (sauf la Belote/Rebelote).
- Contrats : Les contrats Sans Atout (SA) et Tout Atout (TA) sont actifs et doivent être reconnus.

MÉTHODE D'ANALYSE CHRONOLOGIQUE OBLIGATOIRE (Chain of Thought) :
Pour ne jamais confondre les joueurs, tu vas décomposer l'action. Dans le champ "analyse_chronologique_du_pli" de ton JSON, tu DOIS décrire textuellement l'ordre du pli avant de faire ton analyse.
Exemple de logique attendue : "1. L'adversaire de Droite entame l'As de Pique. 2. BobbyAs (Bas) fournit le 7 de Pique. 3. L'adversaire de Gauche joue le Valet de Pique. 4. Le Partenaire (Haut) coupe avec le 10 de Cœur."
Seulement après avoir établi cette chronologie stricte, juge si BobbyAs (Bas) a commis une erreur stratégique.

Renvoie STRICTEMENT la réponse selon ce format JSON valide :
{
  "analyse_chronologique_du_pli": "",
  "partie_context": { "contrat": "", "couleur_atout": "", "preneur": "", "score_final_estime": "" },
  "analyse_globale": { "note_strategique": 0, "point_fort": "", "axe_amelioration": "" },
  "erreurs_et_conseils": [
    { "timestamp_video": "", "pli_numero": 0, "carte_jouee": "", "carte_recommandee": "", "type_erreur": "", "explication_tactique": "", "gravite": "" }
  ]
}`;

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`;

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

    if (!response.ok) {
      throw new Error(data.error?.message || `Erreur HTTP ${response.status}`);
    }

    const jsonResponse = data.candidates[0].content.parts[0].text;
    
    res.status(200).send(jsonResponse); 

  } catch (error) {
    console.error("Erreur REST :", error);
    res.status(500).json({ error: `Échec de l'appel direct : ${error.message}` });
  }
}
