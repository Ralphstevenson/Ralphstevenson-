/**
 * ============================================================
 * SISTÈM ANIMASYON AVANSE POU SENBÒL - ECHANJ PLUS
 * ============================================================
 */

// 1. Fonksyon pou louvri yon modal ak bèl animasyon sou senbòl yo
function openFeatureModal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;

    // Louvri modal la an premye
    modal.classList.remove('hidden');

    // Chèche ikòn ki nan header modal la pou n anime l
    const modalHeaderIcon = modal.querySelector('.feature-modal-header i');
    
    if (modalHeaderIcon) {
        // Efè rebondisman ak grandi (Elastic Bounce) sou senbòl la
        modalHeaderIcon.animate([
            { transform: 'scale(0) rotate(-45deg)', opacity: 0 },
            { transform: 'scale(1.3) rotate(10deg)', opacity: 0.7, offset: 0.7 },
            { transform: 'scale(1) rotate(0deg)', opacity: 1 }
        ], {
            duration: 450,
            easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
            fill: 'forwards'
        });
    }

    // Anime ti pwen (list items) yo youn apre lòt (Stagger effect)
    const listItems = modal.querySelectorAll('.feature-modal-body li');
    listItems.forEach((li, index) => {
        li.style.opacity = '0';
        li.animate([
            { transform: 'translateX(-15px)', opacity: 0 },
            { transform: 'translateX(0)', opacity: 1 }
        ], {
            duration: 300,
            delay: 100 + (index * 60), // Ti delè ant chak liy pou stil elit la
            easing: 'ease-out',
            fill: 'forwards'
        });
    });
}

// 2. Fonksyon pou fèmen yon modal
function closeFeatureModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('hidden');
    }
}

// 3. Fèmen modal la si itilizatè a klike nan zòn vid (overlay) la
function closeFeatureModalOnOverlay(event, modalId) {
    if (event.target.id === modalId) {
        closeFeatureModal(modalId);
    }
}

// 4. ATRAKASYON SOU KAT YO (Lè paj la fin pare)
document.addEventListener("DOMContentLoaded", () => {
    console.log("JavaScript Echanj Plus chaje ak siksè! 🚀");

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
});
                      
