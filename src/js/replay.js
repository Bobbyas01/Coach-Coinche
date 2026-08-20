// src/js/replay.js

export function renderReplayDashboard(data, videoUrl) {
    const container = document.getElementById('replay-container');
    if (!container) return;

    // Extraction du texte renvoyé par Gemini
    let rawText = "";
    if (data?.candidates?.[0]?.content?.parts?.[0]?.text) {
        rawText = data.candidates[0].content.parts[0].text;
    } else if (typeof data === "string") {
        rawText = data;
    } else {
        rawText = JSON.stringify(data, null, 2);
    }

    // Nettoyage si Gemini renvoie des balises Markdown ```json ... ```
    let cleanText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();

    let parsed = null;
    try {
        parsed = JSON.parse(cleanText);
    } catch (e) {
        parsed = null;
    }

    let cardsHtml = "";

    if (parsed && (parsed.analyse || parsed.erreurs)) {
        if (parsed.analyse) {
            cardsHtml += `
                <div class="card">
                    <h3>💡 Analyse du jeu</h3>
                    <div class="feedback">${parsed.analyse}</div>
                </div>
            `;
        }
        if (Array.isArray(parsed.erreurs) && parsed.erreurs.length > 0) {
            parsed.erreurs.forEach((err, idx) => {
                cardsHtml += `
                    <div class="card error-card">
                        <h3>⚠️ Erreur ${idx + 1}</h3>
                        <div class="feedback">${typeof err === 'string' ? err : JSON.stringify(err)}</div>
                    </div>
                `;
            });
        } else if (Array.isArray(parsed.erreurs)) {
            cardsHtml += `
                <div class="card">
                    <h3>🎉 Aucun faux pas détecté !</h3>
                    <div class="feedback">Le pli a été parfaitement joué.</div>
                </div>
            `;
        }
    } else {
        cardsHtml = `
            <div class="card">
                <h3>📋 Rapport de l'arbitre</h3>
                <div class="feedback" style="white-space: pre-wrap;">${cleanText}</div>
            </div>
        `;
    }

    container.innerHTML = `
        <div class="video-wrapper">
            <video id="replayVideo" src="${videoUrl}" controls playsinline></video>
        </div>
        ${cardsHtml}
    `;

    container.style.display = "block";
    container.scrollIntoView({ behavior: 'smooth' });
}
