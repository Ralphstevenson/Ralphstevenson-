/**
 * ============================================================
 * ECHANJ PLUS - SISTÈM JESTYON PAJ AKÈY (HOME PAGE CONTROLLER)
 * ============================================================
 */

// 1. KÒMANSE CAROUSEL BANNER LA
function initHomeCarousel() {
    const slider = document.getElementById('carousel-slider');
    const dots = document.querySelectorAll('.dot-pro');
    if (!slider || dots.length === 0) return;

    let currentIndex = 0;
    const totalSlides = dots.length;
    let intervalId;

    function goToSlide(index) {
        currentIndex = index;
        // Deplase slider a (Chak slide pran 20% paske nou gen 5 slides sou 500% lajè)
        slider.style.transform = `translateX(-${currentIndex * 20}%)`;
        slider.style.transition = 'transform 0.5s ease-in-out';

        // Mete dot aktif la ajou
        dots.forEach((dot, idx) => {
            if (idx === currentIndex) {
                dot.classList.add('active');
            } else {
                dot.classList.remove('active');
            }
        });
    }

    function startAutoPlay() {
        intervalId = setInterval(() => {
            let nextIndex = (currentIndex + 1) % totalSlides;
            goToSlide(nextIndex);
        }, 4000); // Chanje banner chak 4 segonn
    }

    function stopAutoPlay() {
        clearInterval(intervalId);
    }

    // Ajoute sipò klike sou ti pwen yo (dots)
    dots.forEach((dot, index) => {
        dot.addEventListener('click', () => {
            stopAutoPlay();
            goToSlide(index);
            startAutoPlay();
        });
    });

    // Kòmanse vire otomatikman
    startAutoPlay();
}

// 2. SISTÈM FAQ (ACCORDION)
function toggleFaq(element) {
    // Chèche repons lan ki nan FAQ klike a
    const answer = element.querySelector('.faq-answer');
    const icon = element.querySelector('.faq-question i');
    
    // Fèmen tout lòt FAQ ki te ka louvri anvan pou stil pwòp (Opsyonèl)
    document.querySelectorAll('.faq-item').forEach(item => {
        if (item !== element) {
            const openAnswer = item.querySelector('.faq-answer');
            const openIcon = item.querySelector('.faq-question i');
            if (openAnswer) openAnswer.classList.add('hidden');
            if (openIcon) openIcon.style.transform = 'rotate(0deg)';
        }
    });

    if (answer) {
        const isHidden = answer.classList.contains('hidden');
        if (isHidden) {
            answer.classList.remove('hidden');
            if (icon) icon.style.transform = 'rotate(180deg)';
            // Ti animasyon dous sou afichaj la
            answer.animate([
                { opacity: 0, transform: 'translateY(-5px)' },
                { opacity: 1, transform: 'translateY(0)' }
            ], { duration: 200, easing: 'ease-out' });
        } else {
            answer.classList.add('hidden');
            if (icon) icon.style.transform = 'rotate(0deg)';
        }
    }
}

// 3. ENTEGRASYON DONE FIREBASE YO (Balans, Flash Info, Gateways, ak Aktivite)
auth.onAuthStateChanged((user) => {
    const balanceElement = document.getElementById('user-balance');
    const flashBar = document.getElementById('header-flash-info');
    const moncashStatus = document.getElementById('moncash-status');
    const moncashDot = document.getElementById('moncash-dot');
    const natcashStatus = document.getElementById('natcash-status');
    const natcashDot = document.getElementById('natcash-dot');
    const activityContainer = document.getElementById('home-recent-activity');

    if (user) {
        const userId = user.uid;

        // A. Rale Balans Itilizatè a depi nan Firebase
        database.ref(`users/${userId}/balance`).on('value', (snapshot) => {
            if (snapshot.exists()) {
                const balanceVal = snapshot.val();
                // Fòma balans lan pou l toujou gen 2 chif apre vigil la (fòma HTG)
                if (balanceElement) {
                    balanceElement.textContent = parseFloat(balanceVal).toFixed(2);
                }
            } else {
                if (balanceElement) balanceElement.textContent = "0.00";
            }
        });

        // B. Rale Flash Info Bar nan settings Firebase
        database.ref('settings/flash_message').on('value', (snapshot) => {
            if (flashBar) {
                if (snapshot.exists() && snapshot.val().trim() !== "") {
                    flashBar.style.display = 'block';
                    flashBar.innerHTML = `<div class="flash-info-scroll"><i class="fa-solid fa-bullhorn"></i> ${snapshot.val()}</div>`;
                } else {
                    flashBar.style.display = 'none';
                }
            }
        });

        // C. Rale Estati Pòtay Peman yo (MonCash / NatCash Gateways)
        database.ref('settings/gateways').on('value', (snapshot) => {
            if (snapshot.exists()) {
                const gateways = snapshot.val();
                
                // Jere MonCash Status
                if (gateways.moncash && moncashStatus && moncashDot) {
                    const isMoncashOnline = gateways.moncash.status === "online" || gateways.moncash.status === "active" || gateways.moncash.status === true;
                    moncashStatus.textContent = isMoncashOnline ? "Operasyonèl" : "Antretyen";
                    moncashStatus.style.color = isMoncashOnline ? "#16a34a" : "#dc2626";
                    moncashDot.className = isMoncashOnline ? "dot-online" : "dot-offline";
                }

                // Jere NatCash Status
                if (gateways.natcash && natcashStatus && natcashDot) {
                    const isNatcashOnline = gateways.natcash.status === "online" || gateways.natcash.status === "active" || gateways.natcash.status === true;
                    natcashStatus.textContent = isNatcashOnline ? "Operasyonèl" : "Antretyen";
                    natcashStatus.style.color = isNatcashOnline ? "#16a34a" : "#dc2626";
                    natcashDot.className = isNatcashOnline ? "dot-online" : "dot-offline";
                }
            }
        });

        // D. Rale 3 Dènye Tranzaksyon Yo (Dènye Aktivite)
        if (activityContainer) {
            const dbRef = database.ref('transactions')
                                  .orderByChild('uid')
                                  .equalTo(userId);

            dbRef.on('value', (snapshot) => {
                activityContainer.innerHTML = ''; // Retire mesaj "Ap chaje..." la

                if (snapshot.exists()) {
                    const data = snapshot.val();
                    let transactionsList = [];
                    
                    for (let key in data) {
                        transactionsList.push({ id: key, ...data[key] });
                    }

                    // Triye pa dat/timestamp depi sou sa ki pi resan an
                    transactionsList.sort((a, b) => {
                        const dateA = a.timestamp ? new Date(a.timestamp) : new Date(a.date);
                        const dateB = b.timestamp ? new Date(b.timestamp) : new Date(b.date);
                        return dateB - dateA;
                    });

                    // Limite sèlman a 3 tranzaksyon
                    const topThree = transactionsList.slice(0, 3);

                    topThree.forEach((tx) => {
                        let statusClass = 'status-pending';
                        let statusText = tx.status || 'En atant';
                        let statusIcon = 'fa-clock';

                        // Detèmine klas yo ak ikòn
                        if (statusText.toLowerCase() === 'validé' || statusText.toLowerCase() === 'valide') {
                            statusClass = 'status-success';
                            statusIcon = 'fa-circle-check';
                        } else if (statusText.toLowerCase() === 'echwe' || statusText.toLowerCase() === 'failed') {
                            statusClass = 'status-failed';
                            statusIcon = 'fa-circle-xmark';
                        }

                        const type = tx.type || 'Tranzaksyon';
                        const amount = tx.amount ? `${tx.amount} HTG` : '0.00 HTG';
                        
                        let dateFormatted = '';
                        if (tx.date) {
                            const d = new Date(tx.date);
                            dateFormatted = !isNaN(d) ? d.toLocaleDateString('ht-HT', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric'
                            }) : tx.date;
                        }

                        const activityHTML = `
                            <div class="activity-item-pro">
                                <div class="activity-left">
                                    <div class="activity-icon-box ${statusClass}">
                                        <i class="fa-solid ${statusIcon}"></i>
                                    </div>
                                    <div class="activity-details">
                                        <span class="activity-type">${type}</span>
                                        <span class="activity-date">${dateFormatted}</span>
                                    </div>
                                </div>
                                <div class="activity-right">
                                    <span class="activity-amount">${amount}</span>
                                    <span class="activity-status-label ${statusClass}">${statusText}</span>
                                </div>
                            </div>
                        `;
                        activityContainer.insertAdjacentHTML('beforeend', activityHTML);
                    });

                } else {
                    activityContainer.innerHTML = `
                        <p class="empty-msg-mini">Ou poko gen okenn aktivite sou kont ou.</p>
                    `;
                }
            }, (error) => {
                console.error("Erè lekti tranzaksyon:", error);
                activityContainer.innerHTML = `
                    <p class="empty-msg-mini text-danger">Koneksyon limite. Rafrechi paj la.</p>
                `;
            });
        }

    } else {
        // Si itilizatè a dekonekte
        if (balanceElement) balanceElement.textContent = "0.00";
        if (flashBar) flashBar.style.display = 'none';
        if (activityContainer) {
            activityContainer.innerHTML = `
                <p class="empty-msg-mini">Tanpri konekte pou w wè aktivite w yo.</p>
            `;
        }
    }
});

// 4. LANSE CAROUSEL LA LÈ HTML A FINI CHAJE NÈT
document.addEventListener('DOMContentLoaded', () => {
    initHomeCarousel();
});
   
