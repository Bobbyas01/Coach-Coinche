// src/js/api.js

export async function processVideoWorkflow(videoBlob) {
    const statusDiv = document.getElementById('status');
    
    try {
        // Affichage façon terminal pour bien suivre l'avancement
        statusDiv.innerHTML = "Étape 1/2 : Encodage de la vidéo en cours...<br>";
        
        // Conversion de la vidéo en Base64 pour passer à travers Vercel
        const base64Video = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                // On extrait uniquement la chaîne de caractères (sans l'entête data:video/mp4;base64,)
                const base64 = reader.result.split(',')[1];
                resolve(base64);
            };
            reader.onerror = reject;
            reader.readAsDataURL(videoBlob);
        });

        statusDiv.innerHTML += "Étape 2/2 : Envoi au Coach IA (Analyse en cours, patientez)...<br>";
        
        // Envoi direct au backend Vercel
        const analyzeRes = await fetch('/api/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                mimeType: videoBlob.type || 'video/mp4',
                videoBase64: base64Video
            })
        });
        
        // Gestion des erreurs serveur (ex: vidéo trop lourde > 4.5MB)
        if (!analyzeRes.ok) {
            const errorData = await analyzeRes.json();
            throw new Error(errorData.error || `Erreur serveur HTTP ${analyzeRes.status}`);
        }
        
        const analysisJson = await analyzeRes.json();
        
        statusDiv.innerHTML += "✅ Analyse terminée avec succès !";
        return analysisJson;

    } catch (error) {
        statusDiv.innerHTML += `<br>❌ Échec : ${error.message}`;
        console.error(error);
        return null;
    }
}
