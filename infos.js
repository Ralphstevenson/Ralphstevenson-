// Fonksyon pou louvri popup la
function openFeatureModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('hidden');
    }
}

// Fonksyon pou fèmen popup la
function closeFeatureModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('hidden');
    }
}

// Fèmen popup la si itilizatè a klike andeyò bwat la (sou zòn transparan an)
function closeFeatureModalOnOverlay(event, modalId) {
    if (event.target === event.currentTarget) {
        closeFeatureModal(modalId);
    }
}

