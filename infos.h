<!-- DIV PRENSIPAL: Pa gen <section> isit la, se sèlman div -->
<div id="infos" class="page">
    <div class="infos-wrapper">
        <div class="echanj-features-gallery">
            
            <div class="gallery-header">
                <h3 class="gallery-main-title">
                    <i class="fa-solid fa-book-open-reader"></i> Detay Sèvis Echanj Plus
                </h3>
                <p class="gallery-sub-title">Klike sou yon kat pou w wè kijan fonksyon an ap travay 👇</p>
            </div>
            
            <!-- GRIYAJ KAT YO -->
            <div class="features-poster-grid">
                
                <!-- KAT 1: KALKILATRIS -->
                <div class="feature-poster-card" onclick="openFeatureModal('modal-konveti')">
                    <div class="poster-img-wrapper">
                        <img src="https://i.postimg.cc/bsDPD5Nz/Kantite-kob-wap-konveti-a.png" alt="Kalkilatris">
                        <div class="poster-hover-hint"><i class="fas fa-eye"></i> Gade</div>
                    </div>
                    <h4 class="poster-card-title">Kalkilatris Konvèsyon</h4>
                </div>

                <!-- KAT 2: PARENAJ -->
                <div class="feature-poster-card" onclick="openFeatureModal('modal-parenaj-desc')">
                    <div class="poster-img-wrapper">
                        <img src="https://i.postimg.cc/xqdnYCwY/Parenaj.png" alt="Parenaj">
                        <div class="poster-hover-hint"><i class="fas fa-eye"></i> Gade</div>
                    </div>
                    <h4 class="poster-card-title">Sistèm Parennaj</h4>
                </div>

                <!-- KAT 3: RESI TRANZAKSYON YO -->
                <div class="feature-poster-card" onclick="openFeatureModal('modal-resi-desc')">
                    <div class="poster-img-wrapper">
                        <img src="https://i.postimg.cc/GH8R8fhb/Resi-transaction-yo.png" alt="Resi">
                        <div class="poster-hover-hint"><i class="fas fa-eye"></i> Gade</div>
                    </div>
                    <h4 class="poster-card-title">Resi Tranzaksyon</h4>
                </div>

            </div>

            <!-- POPUPS (MODALS) -->
            
            <!-- POPUP 1 -->
            <div id="modal-konveti" class="feature-overlay-modal hidden" onclick="closeFeatureModalOnOverlay(event, 'modal-konveti')">
                <div class="feature-modal-card">
                    <div class="feature-close-btn" onclick="closeFeatureModal('modal-konveti')">&times;</div>
                    <div class="feature-modal-header">
                        <i class="fas fa-calculator"></i> Kantite Kòb W ap Konvèti a
                    </div>
                    <div class="feature-modal-body">
                        <p>Seksyon sa a pèmèt ou kalkile an tan reyèl valè egzak minit w ap transfere yo an kòb kach anvan ou konfime echanj la.</p>
                        <ul>
                            <li><i class="fas fa-check"></i> Amortizasyon otomatik frè sistèm yo (16.5%).</li>
                            <li><i class="fas fa-check"></i> Afichaj klè sou kantite HTG nèt w ap resevwa sou MonCash oswa NatCash ou.</li>
                        </ul>
                    </div>
                </div>
            </div>

            <!-- POPUP 2 -->
            <div id="modal-parenaj-desc" class="feature-overlay-modal hidden" onclick="closeFeatureModalOnOverlay(event, 'modal-parenaj-desc')">
                <div class="feature-modal-card">
                    <div class="feature-close-btn" onclick="closeFeatureModal('modal-parenaj-desc')">&times;</div>
                    <div class="feature-modal-header">
                        <i class="fas fa-crown"></i> Pwogram Parennaj Echanj Plus
                    </div>
                    <div class="feature-modal-body">
                        <p>Sistèm parennaj la se yon fason entèlijan pou w fè revni pasif chak jou nan pataje kòd ARS pèsonèl ou.</p>
                        <ul>
                            <li><i class="fas fa-gift"></i> <strong>Pou Fiyèl la</strong>: Li jwenn yon rabè 9.5 HTG sou premye echanj li.</li>
                            <li><i class="fas fa-chart-line"></i> <strong>Pou Ou menm</strong>: Ou touche 4.5% komisyon sou premye tranzaksyon fiyèl la.</li>
                        </ul>
                    </div>
                </div>
            </div>

            <!-- POPUP 3 -->
            <div id="modal-resi-desc" class="feature-overlay-modal hidden" onclick="closeFeatureModalOnOverlay(event, 'modal-resi-desc')">
                <div class="feature-modal-card">
                    <div class="feature-close-btn" onclick="closeFeatureModal('modal-resi-desc')">&times;</div>
                    <div class="feature-modal-header">
                        <i class="fas fa-file-invoice-dollar"></i> Resi Tranzaksyon yo
                    </div>
                    <div class="feature-modal-body">
                        <p>Chak operasyon ou reyalize sou Echanj Plus gen yon resi dijital pwofesyonèl ki pwouve sekirite ak transparans sèvis la.</p>
                        <ul>
                            <li><i class="fas fa-check"></i> Swiv estati an dirèk: Enatant, Validé, oswa Echwe.</li>
                            <li><i class="fas fa-share-nodes"></i> Pataje rapid sou WhatsApp oswa SMS.</li>
                        </ul>
                    </div>
                </div>
            </div>

        </div>
    </div>
                            </div>
                                    
