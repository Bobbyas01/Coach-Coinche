export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Méthode non autorisée' });

    const { fileUri } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!fileUri) return res.status(400).json({ error: "L'URI du fichier est requise." });
    if (!apiKey) return res.status(500).json({ error: "Clé API Gemini introuvable." });

    const promptCoinche = `Tu es un Coach et Arbitre Expert de Coinche. Analyse cette vidéo. LE JOUEUR À COACHER EST "BobbyAs", VISIBLE EN BAS (on voit sa main).

RÈGLES ET PRÉCISIONS VISUELLES (belote.com) :
1. Le jeu tourne dans le sens des aiguilles d'une montre.
2. Obligation absolue de fournir la couleur demandée (Pique, Cœur, Carreau, Trèfle). Sinon, on coupe (Atout) ou on se défausse.
3. ATTENTION VISUELLE EXTRÊME : Ne confonds pas les cartes posées au centre de la table avec les cartes visibles dans la main de BobbyAs. Regarde attentivement la COULEUR (Rouge/Noir) et le SYMBOLE de chaque carte jouée au centre.

ANALYSE CHRONOLOGIQUE :
Tu dois analyser la vidéo pli par pli (un pli = 4 cartes jouées). S'il y a plusieurs plis dans la vidéo, analyse-les tous dans l'ordre.

RÉPONSE ATTENDUE (JSON STRICT) :
Génère une réponse au format JSON avec exactement cette structure :
{
  "contrat_global": "Ex: 80 Coeur par BobbyAs",
  "plis": [
    {
      "numero_pli": 1,
      "description": "Ex: Serge entame avec l'As de Pique, BobbyAs fournit le 7 de Pique, Linda joue le Valet de Pique, Fabienne coupe avec le 10 de Coeur.",
      "gagnant_pli": "Nom du joueur qui ramasse",
      "conseil_coach": "Analyse stratégique du choix de BobbyAs sur CE pli spécifique.",
      "erreurs_bobbyas": ["Liste des erreurs de règles ou tactiques de BobbyAs sur ce pli. Si aucune, laisse le tableau vide."]
    }
  ]
}`;

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ 
                    parts: [
                        { fileData: { mimeType: "video/mp4", fileUri: fileUri } }, 
                        { text: promptCoinche }
                    ] 
                }],
                generationConfig: {
                    responseMimeType: "application/json"
                }
            })
        });
        
        const data = await response.json();
        if (!response.ok) throw new Error(data.error?.message || JSON.stringify(data));

        res.status(200).json(data);
    } catch (error) { 
        res.status(500).json({ error: error.message }); 
    }
}
