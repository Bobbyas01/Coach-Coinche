// src/js/api.js

export async function processVideoWorkflow(videoBlob) {
    const statusDiv = document.getElementById('status');
    
    try {
        statusDiv.innerHTML = "Étape 1/2 : Encodage de la vidéo en cours...<br>";
        
        // Conversion en Base64
        const base64Video = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64 = reader.result.split(',')[1];
                resolve(base64);
            };
            reader.onerror = reject;
            reader.readAsDataURL(videoBlob);
        });

        // Calcul du poids estimé en MegaOctets
        const sizeMB = (base64Video.length * 0.75) / (1024 * 1024);
        
        // Sécurité anti-crash Vercel (limite 4.5 Mo)
        if (sizeMB > 4.2) {
            throw new Error(`Vidéo trop lourde (${sizeMB.toFixed(1)} Mo). Vercel limite à 4.5 Mo. Choisissez une vidéo de 3 à 5 secondes maximum pour ce test.`);
        }

        statusDiv.innerHTML += `Étape 2/2 : Envoi au Coach IA (Taille : ${sizeMB.toFixed(1)} Mo). Analyse en cours (15-30s)...<br>`;
        
        const analyzeRes = await fetch('/api/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                mimeType: videoBlob.type || 'video/mp4',
                videoBase64: base64Video
            })
        });
        
        // On lit la réponse brute en texte d'abord (pour intercepter le HTML de Vercel)
        const rawText = await analyzeRes.text();
        
        if (!analyzeRes.ok) {
            // Si la réponse commence par '<', c'est une page d'erreur Vercel (ex: Timeout)
            if (rawText.startsWith('<')) {
                throw new Error(`Coupure Vercel (HTTP ${analyzeRes.status}). Soit la vidéo est trop lourde, soit l'IA a mis plus de 60s à répondre.`);
            }
            // Sinon, c'est une erreur JSON propre de notre backend
            const errorJson = JSON.parse(rawText);
            throw new Error(errorJson.error || `Erreur serveur HTTP ${analyzeRes.status}`);
        }
        
        // Si tout va bien, on convertit le texte validé en JSON
        const analysisJson = JSON.parse(rawText);
        
        statusDiv.innerHTML += "✅ Analyse terminée avec succès !";
        return analysisJson;

    } catch (error) {
        statusDiv.innerHTML += `<br>❌ Échec : ${error.message}`;
        console.error(error);
        return null;
    }
}
