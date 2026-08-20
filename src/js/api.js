export async function processVideoWorkflow(file) {
    const statusDiv = document.getElementById('status');
    
    try {
        statusDiv.innerText = "Étape 1/4 : Préparation...";
        const initRes = await fetch('/api/init-upload', { method: 'POST' });
        const { uploadUrl, fileUri, fileName } = await initRes.json();

        statusDiv.innerText = "Étape 2/4 : Upload de la vidéo vers Google...";
        await fetch(uploadUrl, { method: 'PUT', headers: { 'Content-Type': file.type }, body: file });

        // --- LA SOLUTION : BOUCLE D'ATTENTE CÔTÉ TÉLÉPHONE ---
        statusDiv.innerText = "Étape 3/4 : Traitement Google (patiente quelques secondes)...";
        let isReady = false;
        
        while (!isReady) {
            await new Promise(resolve => setTimeout(resolve, 3000)); // Attendre 3s avant de vérifier
            const statusRes = await fetch('/api/check-status', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ fileName })
            });
            const statusData = await statusRes.json();
            
            if (statusData.state === 'ACTIVE') {
                isReady = true;
            } else if (statusData.state === 'FAILED') {
                throw new Error("L'API Google a rejeté la vidéo.");
            }
            // Si c'est PROCESSING, la boucle recommence dans 3 secondes.
        }

        statusDiv.innerText = "Étape 4/4 : Analyse IA (Gemini 3.6 Flash)...";
        const analyzeRes = await fetch('/api/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fileUri, mimeType: file.type })
        });
        
        const result = await analyzeRes.json();
        if (analyzeRes.ok) return result;
        else throw new Error(result.error || "Erreur analyse");

    } catch (error) {
        statusDiv.innerText = "❌ Échec : " + error.message;
        return null;
    }
}
