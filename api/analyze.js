export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  const { mimeType, videoBase64 } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: "Clé API Gemini introuvable." });
  }
  if (!videoBase64) {
    return res.status(400).json({ error: "Aucune vidéo reçue." });
  }

  try {
    // LE PROMPT ANTI-HALLUCINATION : Froid, factuel, autorisant l'absence d'erreur.
    const prompt = `Tu es un arbitre intransigeant et un expert de la Belote Coinchée.
Tu analyses une courte vidéo d'un jeu. TON JOUEUR est en BAS de l'écran.

RÈGLE ABSOLUE ANTI-HALLUCINATION :
Tu ne dois JAMAIS deviner ou inventer une carte. Si l'action est trop rapide, base-toi uniquement sur ce qui est certain.
IL EST TRÈS FRÉQUENT QUE LE JOUEUR NE FASSE AUCUNE ERREUR. La majorité des coups sont logiques. Ton but n'est pas de trouver des fautes à tout prix.

MÉTHODE D'ANALYSE (Chain of Thought) :
Dans le champ "analyse_chronologique_du_pli", tu DOIS procéder ainsi :
1. Liste les cartes visibles dans la main du joueur en BAS au tout début (ex: V Coeur, As Coeur, 7 Pique...).
2. Décris l'entame (Quelle carte ? Jouée par qui ? Droite, Gauche, Haut ou Bas ?).
3. Décris la carte jouée par le joueur en BAS. 
4. Est-ce que cette carte respecte les règles (fournir à la couleur demandée) ? Fournir une petite carte sous un As adverse est un EXCELLENT coup.

CRITÈRE D'ERREUR :
- Si le joueur a joué la bonne couleur, ou a "pissé" intelligemment (si autorisé car le partenaire Haut coupe), il n'y a AUCUNE ERREUR.
- Si AUCUNE ERREUR n'est détectée, le tableau "erreurs_et_conseils" DOIT ÊTRE STRICTEMENT VIDE []. Ne crée pas d'erreur factice.

Renvoie STRICTEMENT la réponse selon ce format JSON valide :
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
