/* ============================================================
   ECHANJ PLUS - JAVASCRIPT DETAY SÈVIS (INFOS)
   ============================================================ */

/**
 * Fonksyon pou ouvri yon modal
 * @param {string} modalId - ID modal la
 */
function openFeatureModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('hidden');
    }
}

/**
 * Fonksyon pou fèmen yon modal
 * @param {string} modalId - ID modal la
 */
function closeFeatureModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('hidden');
    }
}

/**
 * Fèmen modal la si yon moun klike sou zòn nwa ki deyò a (overlay)
 * @param {Event} event - Evènman klik la
 * @param {string} modalId - ID modal la
 */
function closeFeatureModalOnOverlay(event, modalId) {
    if (event.target.id === modalId) {
        closeFeatureModal(modalId);
    }
}

// Nou mete fonksyon yo sou fenèt la (window) pou HTML a ka jwenn yo fasil sou nenpòt platfòm (tankou CodePen)
window.openFeatureModal = openFeatureModal;
window.closeFeatureModal = closeFeatureModal;
window.closeFeatureModalOnOverlay = closeFeatureModalOnOverlay;
  
