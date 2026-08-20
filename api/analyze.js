import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  const { mimeType, videoBase64 } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: "Clé API Gemini manquante sur Vercel." });
  }
  if (!videoBase64) {
    return res.status(400).json({ error: "Aucune vidéo reçue." });
  }

  const genAI = new GoogleGenerativeAI(apiKey);

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

    // Mise à jour vers le modèle actuel (2026)
    const model = genAI.getGenerativeModel({
      model: "gemini-3.1-pro",
      generationConfig: { 
        responseMimeType: "application/json" 
      }
    });

    const result = await model.generateContent([
      {
        inlineData: {
          mimeType: mimeType,
          data: videoBase64
        }
      },
      prompt
    ]);

    const jsonResponse = result.response.text();
    res.status(200).send(jsonResponse); 

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
