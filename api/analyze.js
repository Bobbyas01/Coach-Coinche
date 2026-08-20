export default async function handler(req, res) {
  // 1. Autorisations CORS indispensables pour l'application mobile (APK)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Gérer la requête de pré-vérification du navigateur/mobile
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') return res.status(405).json({ error: 'Méthode non autorisée' });

  const { mimeType, videoBase64 } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || !videoBase64) return res.status(400).json({ error: "Clé API ou vidéo manquante." });

  try {
    const prompt = `Tu es un arbitre intransigeant et un expert de la Belote Coinchée. Tu analyses une courte vidéo d'un jeu. TON JOUEUR est en BAS de l'écran (BobbyAs).

RÈGLES SPÉCIFIQUES:
- Autorisation de "pisser" (se défausser) si on ne peut pas monter à l'atout ou si le partenaire (Haut) coupe et est maître.
- Annonces et contrats Sans Atout/Tout Atout actifs.

RÈGLE ABSOLUE ANTI-HALLUCINATION :
Ne devine JAMAIS une carte. Il est TRÈS FRÉQUENT que le joueur ne fasse aucune erreur.

MÉTHODE D'ANALYSE OBLIGATOIRE (Chain of Thought) :
Dans "analyse_chronologique_du_pli", décris formellement l'action :
1. Cartes en main de BobbyAs.
2. Carte d'entame (Qui et quoi).
3. Carte jouée par BobbyAs.
4. Carte Gauche.
5. Carte Haut (Partenaire).
Seulement après, juge. Si BobbyAs a bien joué, "erreurs_et_conseils" DOIT ÊTRE VIDE [].

Renvoie STRICTEMENT un JSON valide :
{
  "analyse_chronologique_du_pli": "",
  "partie_context": { "contrat": "", "couleur_atout": "", "preneur": "", "score_final_estime": "" },
  "analyse_globale": { "note_strategique": 0, "point_fort": "", "axe_amelioration": "" },
  "erreurs_et_conseils": []
}`;

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`;

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: prompt },
            { inlineData: { mimeType: mimeType || 'video/mp4', data: videoBase64 } }
          ]
        }],
        generationConfig: { responseMimeType: "application/json" }
      })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || "Erreur API Google");

    res.status(200).send(data.candidates[0].content.parts[0].text);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
