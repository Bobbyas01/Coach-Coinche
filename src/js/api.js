export async function processVideoWorkflow(file) {
    const statusDiv = document.getElementById('status');
    const API_BASE = "https://n-coinche.vercel.app"; // Ton URL Vercel

    try {
        statusDiv.innerText = "1/3 : Initialisation...";
        const initRes = await fetch(`${API_BASE}/api/get-upload-url`, { 
            method: 'POST',
            headers: {
                'X-Goog-Upload-Header-Content-Length': file.size.toString(),
                'X-Goog-Upload-Header-Content-Type': file.type
            }
        });
        const { uploadUrl } = await initRes.json();

        statusDiv.innerText = "2/3 : Upload de la vidéo...";
        const uploadRes = await fetch(uploadUrl, {
            method: 'POST',
            headers: { 'X-Goog-Upload-Command': 'upload, finalize', 'X-Goog-Upload-Offset': '0' },
            body: file
        });
        const uploadData = await uploadRes.json();
        const fileUri = uploadData.file.uri;

        statusDiv.innerText = "3/3 : Analyse IA...";
        const analyzeRes = await fetch(`${API_BASE}/api/analyze`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fileUri: fileUri })
        });
        
        const result = await analyzeRes.json();
        statusDiv.innerText = "✅ Analyse terminée !";
        return result;

    } catch (error) {
        statusDiv.innerHTML = `<span style="color:red">❌ ${error.message}</span>`;
        return null;
    }
}
