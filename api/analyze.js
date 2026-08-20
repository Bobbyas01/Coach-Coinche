import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  const { fileUri, mimeType } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;
  const genAI = new GoogleGenerativeAI(apiKey);

  try {
    // Le prompt "Coach Coinche", injectant notre expertise métier
    const prompt = `
Tu es un expert mondial de la Belote Coinchée. Tu connais parfaitement les règles classiques, les probabilités, la gestion des atouts, les impasses et les appels à la défausse.
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

    // Initialisation du modèle Pro (idéal pour la vidéo longue)
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-pro",
      generationConfig: { 
        responseMimeType: "application/json" // Force le respect absolu de notre contrat JSON
      }
    });

    // Envoi de l'URI (stocké chez Google) et du prompt
    const result = await model.generateContent([
      {
        fileData: { mimeType: mimeType, fileUri: fileUri }
      },
      prompt
    ]);

    // Récupération de la réponse JSON brute
    const jsonResponse = result.response.text();
    
    // Renvoi au frontend pour l'affichage du Replay Interactif
    res.status(200).send(jsonResponse); 

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
