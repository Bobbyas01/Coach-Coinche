// src/js/replay.js

export function renderReplayDashboard(data, videoUrl) {
    const container = document.getElementById('replay-container');
    if (!container) return;

    let rawText = "";
    if (data?.candidates?.[0]?.content?.parts?.[0]?.text) {
        rawText = data.candidates[0].content.parts[0].text;
    } else if (typeof data === "string") {
        rawText = data;
    } else {
        rawText = JSON.stringify(data, null, 2);
    }

    let cleanText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();

    let parsed = null;
    try {
        parsed = JSON.parse(cleanText);
    } catch (e) {
        parsed = null;
    }

    let cardsHtml = "";

    if (parsed && parsed.plis) {
        // Affichage du contrat global
        if (parsed.contrat_global) {
            cardsHtml += `
                <div class="badge" style="background: #1976D2; font-size: 14px; margin-bottom: 20px;">
                    🎯 Contrat : ${parsed.contrat_global}
                </div>
            `;
        }

        // Boucle sur chaque pli de la vidéo
        parsed.plis.forEach((pli) => {
            cardsHtml += `
                <div class="card" style="border-left-color: #64B5F6;">
                    <h3>🃏 Pli n°${pli.numero_pli || '?'} <span class="badge success">Gagné par ${pli.gagnant_pli || '?'}</span></h3>
                    <div class="feedback" style="border: none; padding-top: 0; color: #fff;">
                        ${pli.description}
                    </div>
                </div>
            `;

            // Analyse et conseils pour ce pli
            if (pli.erreurs_bobbyas && pli.erreurs_bobbyas.length > 0) {
                pli.erreurs_bobbyas.forEach((err, idx) => {
                    cardsHtml += `
                        <div class="card error-card">
                            <h3>⚠️ Erreur ou Conseil</h3>
                            <div class="feedback">${err}</div>
                        </div>
                    `;
                });
            } else {
                cardsHtml += `
                    <div class="card" style="border-left-color: #4CAF50;">
                        <h3 style="color: #4CAF50;">✅ Choix de BobbyAs</h3>
                        <div class="feedback">${pli.conseil_coach || 'Choix validé, aucune erreur détectée.'}</div>
                    </div>
                `;
            }
        });

    } else {
        // Fallback si l'IA ne respecte pas le JSON
        cardsHtml = `
            <div class="card">
                <h3>📋 Rapport brut de l'arbitre</h3>
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
