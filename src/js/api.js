export async function processVideoWorkflow(file) {
    const statusDiv = document.getElementById('status');
    
    try {
        statusDiv.innerText = "Étape 1/2 : Encodage de la vidéo en cours...";
        
        const reader = new FileReader();
        const base64Promise = new Promise((resolve, reject) => {
            reader.onload = () => resolve(reader.result.split(',')[1]);
            reader.onerror = error => reject(error);
        });
        reader.readAsDataURL(file);
        const videoBase64 = await base64Promise;

        statusDiv.innerText = "Étape 2/2 : Analyse IA (Modèle : Gemini 3.6 Flash)...";
        
        // URL ABSOLUE REQUISE POUR L'APPLICATION ANDROID !
        const analyzeRes = await fetch('https://n-coinche.vercel.app/api/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ mimeType: file.type, videoBase64: videoBase64 })
        });
        
        const result = await analyzeRes.json();
        
        if (analyzeRes.ok) {
            statusDiv.innerHTML = "✅ Analyse terminée avec succès !";
            return result;
        } else {
            throw new Error(result.error || "Erreur d'analyse IA");
        }

    } catch (error) {
        statusDiv.innerHTML = `<span style="color: #E53935;">❌ Échec : ${error.message}</span>`;
        return null;
    }
}
