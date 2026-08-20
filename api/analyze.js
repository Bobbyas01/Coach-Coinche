export default async function handler(req, res) {
    // En-têtes CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Méthode non autorisée' });

    const { fileUri } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!fileUri) return res.status(400).json({ error: "L'URI du fichier est requise." });
    if (!apiKey) return res.status(500).json({ error: "Clé API Gemini introuvable." });

    // Le Super Prompt formaté pour la Coinche
    const promptCoinche = `Tu es un Coach et Arbitre Expert de Coinche, de niveau mondial.
Ta mission est d'analyser cette courte vidéo d'un pli de Coinche et de coacher le joueur situé EN BAS de l'écran (c'est le joueur "BobbyAs", dont on voit les cartes en main).

RÈGLES DE LA COINCHE À APPLIQUER STRICTEMENT (Référence: belote.com) :
1. Le jeu se déroule TOUJOURS dans le sens des aiguilles d'une montre.
2. Il faut TOUJOURS fournir la couleur demandée par la première carte posée (l'entame).
3. Si on n'a pas la couleur demandée, on DOIT couper avec un Atout (si l'adversaire est maître) ou on PEUT se défausser (si le partenaire est maître).
4. À l'Atout, on est OBLIGÉ de monter (jouer un Atout supérieur) si on le peut.
5. Valeur et ordre des cartes à l'Atout : Valet (20), Neuf (14), As (11), Dix (10), Roi (4), Dame (3), Huit (0), Sept (0).
6. Valeur et ordre des cartes hors Atout : As (11), Dix (10), Roi (4), Dame (3), Valet (2), Neuf (0), Huit (0), Sept (0).

MÉTHODOLOGIE D'ANALYSE (Suis ces étapes scrupuleusement, mais ne les affiche pas dans ta réponse finale) :
Étape 1 : Identifie le contrat en cours. Regarde le petit encadré à côté du nom "BobbyAs" en bas à gauche pour trouver l'Atout.
Étape 2 : Identifie le joueur qui entame le pli (le premier à jouer). Regarde qui a le jeton "1er" ou qui pose la première carte au centre.
Étape 3 : Liste, dans l'ordre chronologique (dans le sens des aiguilles d'une montre), les 4 cartes jouées pour ce pli et le joueur correspondant (Ex: Serge (Droite) joue [Carte], BobbyAs (Bas) joue [Carte]...).
Étape 4 : Analyse le choix de carte du joueur EN BAS (BobbyAs). A-t-il respecté les règles (fournir, couper, monter) compte tenu des cartes VISIBLES dans sa main ? Son choix était-il stratégiquement judicieux ?

RÉPONSE ATTENDUE (Format JSON STRICT) :
Génère une réponse au format JSON valide avec exactement cette structure :
{
  "analyse": "Un paragraphe concis (3-4 phrases max) décrivant le déroulement du pli. Mentionne l'entame, les cartes jouées dans l'ordre, et qui remporte le pli.",
  "erreurs": [
    "Si le joueur EN BAS (BobbyAs) a fait une erreur de règle (ex: renonce) ou un mauvais choix tactique évident, décris-le ici clairement et donne le conseil approprié.",
    "S'il a parfaitement bien joué, écris : 'Parfait, aucune erreur sur ce pli. Le choix de carte était le meilleur possible.' (Ne laisse pas le tableau vide)."
  ]
}`;

    try {
        // Utilisation du modèle gemini-3.6-flash
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
        
        if (!response.ok) {
            throw new Error(data.error?.message || JSON.stringify(data));
        }

        res.status(200).json(data);
    } catch (error) { 
        res.status(500).json({ error: error.message }); 
    }
}
