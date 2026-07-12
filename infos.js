    }
}

// 3. Fèmen modal la si itilizatè a klike nan zòn vid (overlay) la
function closeFeatureModalOnOverlay(event, modalId) {
    if (event.target.id === modalId) {
        closeFeatureModal(modalId);
    }
}

// 4. ANIMASYON RAPID SOU KAT YO (Lè moun klike sou yo)
document.querySelectorAll('.feature-poster-card').forEach(card => {
    card.addEventListener('click', function() {
        const icon = this.querySelector('.poster-img-wrapper i');
        if (icon) {
            // Yon ti tranbleman ak flash rapid sou ikòn "Gade" a
            icon.animate([
                { transform: 'scale(1)', opacity: 1 },
                { transform: 'scale(1.2) rotate(-10deg)', opacity: 0.8 },
                { transform: 'scale(1)', opacity: 1 }
            ], {
                duration: 200,
                easing: 'ease-in-out'
            });
        }
    });
});
