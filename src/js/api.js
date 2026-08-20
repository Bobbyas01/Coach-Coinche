export async function processVideoWorkflow(file) {
    const statusDiv = document.getElementById('status');
    
    // 1. Initialisation
    statusDiv.innerText = "Étape 1/3 : Préparation de l'upload...";
    const initRes = await fetch('/api/init-upload', { method: 'POST' });
    const { uploadUrl, fileUri } = await initRes.json();

    // 2. Upload Direct vers Google (La vidéo ne passe PAS par Vercel)
    statusDiv.innerText = "Étape 2/3 : Upload de la vidéo (Direct vers Google)...";
    await fetch(uploadUrl, { 
        method: 'PUT', 
        headers: { 'Content-Type': file.type }, 
        body: file 
    });

    // 3. Analyse
    statusDiv.innerText = "Étape 3/3 : Analyse par Gemini 3.6 Flash...";
    const analyzeRes = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileUri, mimeType: file.type })
    });
    
    return await analyzeRes.json();
}
