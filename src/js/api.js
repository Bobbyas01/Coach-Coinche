export async function processVideoWorkflow(file) {
    const statusDiv = document.getElementById('status');
    
    try {
        // 1. Demander une URL sécurisée à TON backend
        statusDiv.innerText = "1/3 : Initialisation de l'upload...";
        const initRes = await fetch('https://n-coinche.vercel.app/api/get-upload-url', { 
            method: 'POST',
            headers: {
                'X-Goog-Upload-Header-Content-Length': file.size,
                'X-Goog-Upload-Header-Content-Type': file.type
            }
        });
        const { uploadUrl } = await initRes.json();

        // 2. Upload direct chez Google (Protocol sécurisé)
        statusDiv.innerText = "2/3 : Envoi de la vidéo vers Google...";
        const uploadRes = await fetch(uploadUrl, {
            method: 'POST',
            headers: { 
                'X-Goog-Upload-Command': 'upload, finalize', 
                'X-Goog-Upload-Offset': '0' 
            },
            body: file
        });
        
        // C'est ici que l'on récupère le fameux 'fileUri'
        const uploadData = await uploadRes.json();
        const fileUri = uploadData.file.uri; 

        // 3. Demander à ton backend de lancer l'analyse
        statusDiv.innerText = "3/3 : Analyse par l'IA en cours...";
        const analyzeRes = await fetch('https://n-coinche.vercel.app/api/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fileUri: fileUri })
        });
        
        const analysisResult = await analyzeRes.json();
        
        // Affichage final
        statusDiv.innerText = "✅ Analyse terminée !";
        console.log("Résultat de l'analyse :", analysisResult);
        return analysisResult;

    } catch (error) {
        console.error("Erreur complète :", error);
        statusDiv.innerHTML = `<span style="color:red">❌ Erreur : ${error.message}</span>`;
        return null;
    }
}
