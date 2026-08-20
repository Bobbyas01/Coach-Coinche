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
    // LE SUPER PROMPT : Structuration spatiale et logique
    const prompt = `Tu es un expert mondial de la Belote Coinchée et un analyste vidéo. 
Tu analyses une capture vidéo d'un jeu sur smartphone.

REGLES DE LECTURE SPATIALE DE L'ÉCRAN (CRUCIAL) :
1. TON JOUEUR (Celui qu'on conseille) : Ses cartes sont visibles en BAS de l'écran.
2. LE PARTENAIRE : Il est situé en HAUT de l'écran. C'est l'allié du joueur.
3. LES ADVERSAIRES : Ils sont situés à GAUCHE et à DROITE de l'écran. (Ex: "Serge" ou d'autres noms sur les côtés).

ANALYSE LOGIQUE DU PLI :
- Regarde TRÈS attentivement D'OÙ part la première carte jouée (l'entame). Si elle vient de la gauche/droite, c'est l'adversaire qui entame. Si elle vient du haut, c'est le partenaire.
- Suis l'ordre d'apparition des cartes au centre de la table.
- Ne confonds jamais une carte jouée par le partenaire (Haut) avec une carte jouée par un adversaire (Côtés).
- Si le partenaire (Haut) coupe une carte de l'adversaire, le pli appartient à TON équipe.

Ton objectif est de repérer les erreurs stratégiques du joueur en BAS (mauvaise défausse, coupe sur le partenaire, oubli d'appel).
Si aucune erreur majeure n'est faite par le joueur, indique-le clairement.

Renvoie strictement la réponse selon cette structure JSON :
{
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
