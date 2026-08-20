// src/js/app.js
import { processVideoWorkflow } from './api.js';

let mediaRecorder;
let recordedChunks = [];
let isRecording = false;

const recordBtn = document.getElementById('recordBtn');
const statusDiv = document.getElementById('status');

recordBtn.addEventListener('click', async () => {
    if (!isRecording) {
        await startRecording();
    } else {
        stopRecording();
    }
});

async function startRecording() {
    try {
        // Demande d'autorisation de capture d'écran (Standard Web, compatible Capacitor plus tard)
        const stream = await navigator.mediaDevices.getDisplayMedia({ 
            video: { displaySurface: "default" } 
        });
        
        // MimeType optimisé pour une compatibilité web/mobile
        const options = { mimeType: 'video/webm;codecs=vp8' };
        mediaRecorder = new MediaRecorder(stream, options);
        
        mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) recordedChunks.push(event.data);
        };

        mediaRecorder.onstop = handleVideoStop;
        
        mediaRecorder.start();
        isRecording = true;
        recordBtn.innerText = "⬛ Stopper l'enregistrement";
        recordBtn.style.background = "#555";
        statusDiv.innerText = "Enregistrement en cours... Jouez votre donne !";

    } catch (err) {
        statusDiv.innerText = "❌ Permission de capture refusée ou non supportée sur ce navigateur.";
        console.error("Erreur de capture:", err);
    }
}

function stopRecording() {
    mediaRecorder.stop();
    // Couper les flux vidéo pour retirer l'icône rouge du navigateur
    mediaRecorder.stream.getTracks().forEach(track => track.stop()); 
    isRecording = false;
    recordBtn.innerText = "🔴 Démarrer l'enregistrement";
    recordBtn.style.background = "#E53935";
    recordBtn.disabled = true; // On désactive pendant le traitement
}

async function handleVideoStop() {
    const videoBlob = new Blob(recordedChunks, { type: 'video/webm' });
    recordedChunks = []; // Reset pour la prochaine partie

    // Lancement du workflow réseau
    const analysisJson = await processVideoWorkflow(videoBlob);
    
    if (analysisJson) {
        // Affichage temporaire du JSON brut avant la Phase 4
        document.getElementById('replay-container').style.display = 'block';
        document.getElementById('jsonOutput').innerText = JSON.stringify(analysisJson, null, 2);
    }
    
    recordBtn.disabled = false;
}
