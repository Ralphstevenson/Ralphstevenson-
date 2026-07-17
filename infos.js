/**
 * ============================================================
 * SISTÈM ANIMASYON AVANSE POU SENBÒL - ECHANJ PLUS
 * ============================================================
 */

// 1. Fonksyon pou louvri yon modal ak bèl animasyon sou senbòl yo
window.openFeatureModal = function(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;

    // Louvri modal la an premye
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden'; // Bloke scroll dèyè a pou evite deranjman

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
};

// 2. Fonksyon pou fèmen yon modal
window.closeFeatureModal = function(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('hidden');
        document.body.style.overflow = ''; // Remete scroll paj la nòmal
    }
};

// 3. Fèmen modal la si itilizatè a klike nan zòn vid (overlay) la
window.closeFeatureModalOnOverlay = function(event, modalId) {
    if (event.target.id === modalId) {
        window.closeFeatureModal(modalId);
    }
};

// 4. ATRAKASYON SOU KAT YO AK KONTWÒL DISPLAY SEKSYON AN
document.addEventListener("DOMContentLoaded", () => {
    console.log("JavaScript Echanj Plus chaje ak siksè! 🚀");

    const infosSection = document.getElementById('infos');

    // Jere klike sou kat yo pou ti animasyon
    document.querySelectorAll('.feature-poster-card').forEach(card => {
        card.addEventListener('click', function() {
            const icon = this.querySelector('.poster-hover-hint i'); // Aliyen ak klas ki nan HTML la
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

    /**
     * ============================================================
     * OTO-KONTWÒL DISPLAY POU SEKSYON #INFOS LA (SEKIRIZE ✅)
     * ============================================================
     * Lojik sa a ap siveye chanjman nan paj yo otomatikman si yo egziste.
     * Si lòt paj sa yo pa nan dokiman an (tankou sou paj separe), li pap bay erè.
     */
    if (infosSection) {
        // Filtre sèlman paj ki reyèlman egziste nan paj HTML kote JS la ap kouri a
        const lòtPajYo = [
            document.getElementById('paj-echanj'),
            document.getElementById('paj-retre'),
            document.getElementById('paj-istorik'),
            document.getElementById('paj-sipo')
        ].filter(el => el !== null); // Evite erè "null" si yon paj pa la

        // Si gen lòt paj nan HTML la, n ap aplike sistèm siveyans lan
        if (lòtPajYo.length > 0) {
            const tchekeEpiKacheInfos = () => {
                let genLòtPajKiLouvri = false;

                lòtPajYo.forEach(paj => {
                    if (!paj.classList.contains('hidden')) {
                        genLòtPajKiLouvri = true;
                    }
                });

                if (genLòtPajKiLouvri) {
                    infosSection.classList.add('hidden'); // Kache detay sèvis yo si yon lòt paj aktif
                } else {
                    infosSection.classList.remove('hidden'); // Montre yo si nou tounen sou Akèy
                }
            };

            // Kouri tcheke a depi paj la chaje pou premye fwa
            tchekeEpiKacheInfos();

            // Konfigure yon obsèvatè (Observer) pou siveye lè klas "hidden" ap chanje sou paj sa yo
            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    if (mutation.attributeName === 'class') {
                        tchekeEpiKacheInfos();
                    }
                });
            });

            // Kòmanse siveye chak lòt paj yo
            lòtPajYo.forEach(paj => {
                observer.observe(paj, { attributes: true });
            });
        } else {
            // Si nou sou paj "infos.html" separe a, asire w seksyon #infos la pa kache nan CSS la
            infosSection.classList.remove('hidden');
        }
    }
});
                        
