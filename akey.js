/**
 * ============================================================
 * ECHANJ PLUS - JESTYON PAJ AKÈY (akey.js)
 * Depann nèt sou script.js ki gen konfigirasyon Firebase la
 * ============================================================
 */

// 1. SISTÈM CAROUSEL BANNER LA
function initHomeCarousel() {
    const slider = document.getElementById('carousel-slider');
    const dots = document.querySelectorAll('.dot-pro');
    if (!slider || dots.length === 0) return;

    let currentIndex = 0;
    const totalSlides = dots.length;
    let intervalId;

    function goToSlide(index) {
        currentIndex = index;
        // Deplase slider a (Chak slide pran 20% paske nou gen 5 slides)
        slider.style.transform = `translateX(-${currentIndex * 20}%)`;
        slider.style.transition = 'transform 0.5s ease-in-out';

        // Mete ti pwen (dot) aktif la ajou
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
        }, 4000); // Chanje chak 4 segonn
    }

    dots.forEach((dot, index) => {
        dot.addEventListener('click', () => {
            clearInterval(intervalId);
            goToSlide(index);
            startAutoPlay();
        });
    });

    startAutoPlay();
}

// 2. SISTÈM LECTURE DONE DEPI NAN FIREBASE (Balans, Flash Info, Gateways, Aktivite)
if (typeof firebase !== 'undefined') {
    
    firebase.auth().onAuthStateChanged((user) => {
        const balanceElement = document.getElementById('user-balance');
        const flashBar = document.getElementById('header-flash-info');
        const moncashStatus = document.getElementById('moncash-status');
        const moncashDot = document.getElementById('moncash-dot');
        const natcashStatus = document.getElementById('natcash-status');
        const natcashDot = document.getElementById('natcash-dot');
        const activityContainer = document.getElementById('home-recent-activity');

        if (user) {
            const userId = user.uid;
            const db = firebase.database();

            // A. Koute Balans Itilizatè a an tan reyèl
            db.ref(`users/${userId}/balance`).on('value', (snapshot) => {
                if (balanceElement) {
                    if (snapshot.exists()) {
                        balanceElement.textContent = parseFloat(snapshot.val()).toFixed(2);
                    } else {
                        balanceElement.textContent = "0.00";
                    }
                }
            });

            // B. Koute Flash Info Bar
            db.ref('settings/flash_message').on('value', (snapshot) => {
                if (flashBar) {
                    if (snapshot.exists() && snapshot.val().trim() !== "") {
                        flashBar.style.display = 'block';
                        flashBar.innerHTML = `<div class="flash-info-scroll"><i class="fa-solid fa-bullhorn"></i> ${snapshot.val()}</div>`;
                    } else {
                        flashBar.style.display = 'none';
                    }
                }
            });

            // C. Koute Eta Gateways (MonCash / NatCash)
            db.ref('settings/gateways').on('value', (snapshot) => {
                if (snapshot.exists()) {
                    const gateways = snapshot.val();
                    
                    if (gateways.moncash && moncashStatus && moncashDot) {
                        const isOnline = gateways.moncash.status === "online" || gateways.moncash.status === "active" || gateways.moncash.status === true;
                        moncashStatus.textContent = isOnline ? "Operasyonèl" : "Antretyen";
                        moncashStatus.style.color = isOnline ? "#16a34a" : "#dc2626";
                        moncashDot.className = isOnline ? "dot-online" : "dot-offline";
                    }

                    if (gateways.natcash && natcashStatus && natcashDot) {
                        const isOnline = gateways.natcash.status === "online" || gateways.natcash.status === "active" || gateways.natcash.status === true;
                        natcashStatus.textContent = isOnline ? "Operasyonèl" : "Antretyen";
                        natcashStatus.style.color = isOnline ? "#16a34a" : "#dc2626";
                        natcashDot.className = isOnline ? "dot-online" : "dot-offline";
                    }
                }
            });

            // D. Koute 3 Dènye Tranzaksyon yo (Dènye Aktivite)
            if (activityContainer) {
                db.ref('transactions')
                  .orderByChild('uid')
                  .equalTo(userId)
                  .on('value', (snapshot) => {
                      activityContainer.innerHTML = ''; // Retire mesaj chajman an

                      if (snapshot.exists()) {
                          const data = snapshot.val();
                          let transactionsList = [];
                          
                          for (let key in data) {
                              transactionsList.push({ id: key, ...data[key] });
                          }

                          // Triye depi sou sa ki pi resan
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

                              // Detèmine koulè ak ikòn yo
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
                      console.error("Erè Firebase Transactions:", error);
                      activityContainer.innerHTML = `
                          <p class="empty-msg-mini text-danger">Koneksyon limite. Rafrechi paj la.</p>
                      `;
                  });
            }

        } else {
            // Itilizatè a dekonekte
            if (balanceElement) balanceElement.textContent = "0.00";
            if (flashBar) flashBar.style.display = 'none';
            if (activityContainer) {
                activityContainer.innerHTML = `
                    <p class="empty-msg-mini">Tanpri konekte pou w wè aktivite w yo.</p>
                `;
            }
        }
    });
} else {
    console.error("Erè: SDK Firebase la pa chaje anvan 'akey.js'. Asire w ke 'script.js' chaje an premye.");
}

// 3. JERE KLIK SOU FAQ YO (ACCORDION)
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

// 4. LANSE CAROUSEL LA LÈ PAJ LA FINI CHAJE
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initHomeCarousel);
} else {
    initHomeCarousel();
}
