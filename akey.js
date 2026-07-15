/**
 * ============================================================
 * ECHANJ PLUS - JESTYON PAJ AKÈY (akey.js - ES MODULE)
 * Depann nèt sou script.js pou koneksyon Firebase v10
 * ============================================================
 */

import { db } from "./script.js"; // Nou enpòte instans db a dirèkteman
import { ref, onValue, query, orderByChild, equalTo } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// ==========================================
// 1. JESTYON CAROUSEL BANNER LA
// ==========================================
export function initHomeCarousel() {
    const slider = document.getElementById('carousel-slider');
    const dots = document.querySelectorAll('.dot-pro');
    if (!slider || dots.length === 0) return;

    let currentIndex = 0;
    const totalSlides = dots.length;
    let intervalId;

    function goToSlide(index) {
        currentIndex = index;
        // Deplase slider a (5 slides = 20% chak slide)
        slider.style.transform = `translateX(-${currentIndex * 20}%)`;
        slider.style.transition = 'transform 0.5s ease-in-out';

        // Mete dot ki aktif la ajou
        dots.forEach((dot, idx) => {
            if (idx === currentIndex) {
                dot.classList.add('active');
            } else {
                dot.classList.remove('active');
            }
        });
    }

    function startAutoPlay() {
        if (intervalId) clearInterval(intervalId);
        intervalId = setInterval(() => {
            let nextIndex = (currentIndex + 1) % totalSlides;
            goToSlide(nextIndex);
        }, 4000); // Chanje banner chak 4 segonn
    }

    // Ajoute klike sou dots yo
    dots.forEach((dot, index) => {
        dot.addEventListener('click', () => {
            clearInterval(intervalId);
            goToSlide(index);
            startAutoPlay();
        });
    });

    // Demare oto-play
    startAutoPlay();
}

// ==========================================
// 2. JESTYON DONE AKÈY YO (FIREBASE V10)
// ==========================================
export function initAkeyDone(uid) {
    if (!uid) return;

    const balanceElement = document.getElementById('user-balance');
    const flashBar = document.getElementById('header-flash-info');
    const moncashStatus = document.getElementById('moncash-status');
    const moncashDot = document.getElementById('moncash-dot');
    const natcashStatus = document.getElementById('natcash-status');
    const natcashDot = document.getElementById('natcash-dot');
    const activityContainer = document.getElementById('home-recent-activity');

    // A. Koute Balans Itilizatè a an tan reyèl
    onValue(ref(db, `users/${uid}/balance`), (snapshot) => {
        if (balanceElement) {
            if (snapshot.exists()) {
                const balanceVal = snapshot.val();
                balanceElement.textContent = parseFloat(balanceVal).toFixed(2);
            } else {
                balanceElement.textContent = "0.00";
            }
        }
    }, (error) => {
        console.error("Erè lekti balans:", error);
    });

    // B. Koute Flash Info Bar la
    onValue(ref(db, 'settings/flash_message'), (snapshot) => {
        if (flashBar) {
            if (snapshot.exists() && snapshot.val().trim() !== "") {
                flashBar.style.display = 'block';
                flashBar.innerHTML = `<div class="flash-info-scroll"><i class="fa-solid fa-bullhorn"></i> ${snapshot.val()}</div>`;
            } else {
                flashBar.style.display = 'none';
            }
        }
    });

    // C. Koute Pòtay Peman yo (Gateways Status)
    onValue(ref(db, 'settings/gateways'), (snapshot) => {
        if (snapshot.exists()) {
            const gateways = snapshot.val();
            
            // Kontwòl MonCash
            if (gateways.moncash && moncashStatus && moncashDot) {
                const isOnline = gateways.moncash.status === "online" || gateways.moncash.status === "active" || gateways.moncash.status === true;
                moncashStatus.textContent = isOnline ? "Operasyonèl" : "Antretyen";
                moncashStatus.style.color = isOnline ? "#16a34a" : "#dc2626";
                moncashDot.className = isOnline ? "dot-online" : "dot-offline";
            }

            // Kontwòl NatCash
            if (gateways.natcash && natcashStatus && natcashDot) {
                const isOnline = gateways.natcash.status === "online" || gateways.natcash.status === "active" || gateways.natcash.status === true;
                natcashStatus.textContent = isOnline ? "Operasyonèl" : "Antretyen";
                natcashStatus.style.color = isOnline ? "#16a34a" : "#dc2626";
                natcashDot.className = isOnline ? "dot-online" : "dot-offline";
            }
        }
    });

    // D. Koute 3 Dènye Tranzaksyon Yo (Dènye Aktivite)
    if (activityContainer) {
        const queryRef = query(
            ref(db, 'transactions'),
            orderByChild('uid'),
            equalTo(uid)
        );

        onValue(queryRef, (snapshot) => {
            activityContainer.innerHTML = ''; // Netwaye mesaj "Ap chaje..." a

            if (snapshot.exists()) {
                const data = snapshot.val();
                let transactionsList = [];
                
                // Konvèti objè a an Array
                for (let key in data) {
                    transactionsList.push({ id: key, ...data[key] });
                }

                // Triye depi sou sa ki pi resan an
                transactionsList.sort((a, b) => {
                    const dateA = a.timestamp ? new Date(a.timestamp) : new Date(a.date);
                    const dateB = b.timestamp ? new Date(b.timestamp) : new Date(b.date);
                    return dateB - dateA;
                });

                // Pran sèlman 3 premye yo
                const topThree = transactionsList.slice(0, 3);

                topThree.forEach((tx) => {
                    let statusClass = 'status-pending';
                    let statusText = tx.status || 'En atant';
                    let statusIcon = 'fa-clock';

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
}

// Globalize pou bouton ak HTML ka jwenn yo fasil
window.initHomeCarousel = initHomeCarousel;
window.initAkeyDone = initAkeyDone;

// ==========================================
// 3. JESTYON FAQ ACCORDION (FENÈT GLOBAL)
// ==========================================
window.toggleFaq = function(element) {
    const answer = element.querySelector('.faq-answer');
    const icon = element.querySelector('.faq-question i');
    
    if (answer) {
        const isHidden = answer.classList.contains('hidden');
        if (isHidden) {
            answer.classList.remove('hidden');
            if (icon) icon.style.transform = 'rotate(180deg)';
        } else {
            answer.classList.add('hidden');
            if (icon) icon.style.transform = 'rotate(0deg)';
        }
    }
};
        
