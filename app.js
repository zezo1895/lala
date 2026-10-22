// ==========================================
// YARA ARMY APP - MAIN ENGINE
// ==========================================

// Global state
let appData = null;
let countdownInterval = null;
let pomodoroTimer = null;
let pomodoroSecondsLeft = 25 * 60;
let isPomodoroRunning = false;
let currentQuoteIndex = 0;
let lastShakeTime = 0;
let titleTapCount = 0;
let titleTapTimer = null;

// Voice State
let currentVoiceIndex = 0;
let isPlayingVoice = false;
let activeRecordingIndex = null;
let mediaRecorder = null;
let audioChunks = [];
let recordInterval = null;
let recordSeconds = 0;

// Initialize when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
    initData();
    initCanvasHearts();
    initUI();
    initNavigation();
    initCountdown();
    initVoicePlayer();
    initTimeline();
    initReceipt();
    initPharmacyAndHug();
    initLockedLetters();
    initThanaweya();
    initGames();
    initAdminSystem();
    initShakeSensor();
    fetchRemoteGitHubData();
});

// ==========================================
// 1. DATA INITIALIZATION & SYNC
// ==========================================
function initData() {
    // 1. Check if URL contains shared data hash (#data=...)
    if (window.location.hash && window.location.hash.startsWith("#data=")) {
        try {
            const rawHash = window.location.hash.substring(6);
            const decodedJson = decodeURIComponent(escape(atob(rawHash)));
            const parsedData = JSON.parse(decodedJson);
            if (parsedData && parsedData.settings) {
                appData = parsedData;
                localStorage.setItem("yara_army_app_data", JSON.stringify(appData));
                showToast("تم تحميل وتحديث كل البيانات والرسايل الجديدة! ❤️");
                history.replaceState(null, document.title, window.location.pathname + window.location.search);
                return;
            }
        } catch (e) {
            console.error("Failed to parse URL hash data:", e);
        }
    }

    // 2. Load from LocalStorage
    const stored = localStorage.getItem("yara_army_app_data");
    if (stored) {
        try {
            appData = JSON.parse(stored);
            // Ensure newly added structures exist if migrating from older state
            if (!appData.timeline) appData.timeline = JSON.parse(JSON.stringify(DEFAULT_APP_DATA.timeline));
            if (!appData.voiceNotes || !Array.isArray(appData.voiceNotes)) {
                if (appData.voiceNote && appData.voiceNote.audioSrc) {
                    appData.voiceNotes = [appData.voiceNote];
                } else {
                    appData.voiceNotes = JSON.parse(JSON.stringify(DEFAULT_APP_DATA.voiceNotes));
                }
            }
            // Migrate partner name to Zizo & add military rank
            if (appData.settings) {
                if (!appData.settings.partnerName || appData.settings.partnerName === "حبيبك البطل" || appData.settings.partnerName === "أحمد") {
                    appData.settings.partnerName = "زيزو";
                }
                if (!appData.settings.militaryRank) {
                    appData.settings.militaryRank = "officer";
                }
            }
        } catch (e) {
            console.error("Failed to parse localStorage data:", e);
        }
    }

    // 3. Fallback to DEFAULT_APP_DATA
    if (!appData) {
        appData = JSON.parse(JSON.stringify(DEFAULT_APP_DATA));
        localStorage.setItem("yara_army_app_data", JSON.stringify(appData));
    }
}

function saveData(notify = true) {
    localStorage.setItem("yara_army_app_data", JSON.stringify(appData));
    if (notify) showToast("تم حفظ التعديلات بنجاح! ❤️");
    refreshAllUI();
}

function showToast(msg) {
    const toast = document.getElementById("toast");
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add("show");
    setTimeout(() => {
        toast.classList.remove("show");
    }, 2800);
}

// ==========================================
// 2. UI REFRESH
// ==========================================
function refreshAllUI() {
    initUI();
    initCountdown();
    initVoicePlayer();
    renderTimeline();
    renderEmergencyCards();
    renderLockedLetters();
    renderThanaweyaQuotes();
    renderReceiptTable();
}

function getPartnerDisplayTitle() {
    const rank = (appData.settings && appData.settings.militaryRank) || "officer";
    const name = (appData.settings && appData.settings.partnerName) || "زيزو";
    if (rank === "soldier") {
        return `العسكري ${name}`;
    }
    return `الظابط ${name}`;
}

function initUI() {
    const partnerTitle = getPartnerDisplayTitle();
    const partnerName = appData.settings.partnerName || "زيزو";
    const yaraName = appData.settings.yaraName || "يارا";
    const nicknames = appData.settings.nicknames || "لالا / يويو";

    document.title = `حبيبة ${partnerTitle} | ${yaraName} (لالا) ❤️`;
    document.getElementById("titleYaraName").textContent = yaraName;
    document.getElementById("titlePartnerName").textContent = partnerTitle;
    document.getElementById("headerBadge").textContent = `خاص بـ ${yaraName} (${nicknames}) - حبيبة ${partnerTitle} 👑`;
    document.getElementById("leaveMessageDisplay").textContent = appData.settings.leaveCountdownMessage;

    // Game labels
    document.getElementById("gamePartnerName").textContent = `${partnerName} (حبيبك) ❤️`;
    const nickSnippet = nicknames ? nicknames.split('/')[0].trim() : "لالا";
    document.getElementById("gameYaraName").textContent = `${yaraName} (${nickSnippet}) 😜`;
}

// ==========================================
// 3. NAVIGATION (5 TABS)
// ==========================================
function initNavigation() {
    const navTabs = document.querySelectorAll(".nav-tab");
    const viewSections = document.querySelectorAll(".view-section");

    navTabs.forEach(tab => {
        tab.addEventListener("click", () => {
            const targetId = tab.getAttribute("data-tab");

            navTabs.forEach(t => t.classList.remove("active"));
            viewSections.forEach(s => s.classList.remove("active"));

            tab.classList.add("active");
            const targetSection = document.getElementById(targetId);
            if (targetSection) {
                targetSection.classList.add("active");
                window.scrollTo({ top: 0, behavior: "smooth" });
            }
        });
    });
}

// ==========================================
// 4. COUNTDOWN TIMER
// ==========================================
function initCountdown() {
    if (countdownInterval) clearInterval(countdownInterval);

    function update() {
        const targetDate = new Date(appData.settings.armyLeaveDate).getTime();
        const now = new Date().getTime();
        const diff = targetDate - now;

        if (diff <= 0) {
            document.getElementById("cd-days").textContent = "00";
            document.getElementById("cd-hours").textContent = "00";
            document.getElementById("cd-minutes").textContent = "00";
            document.getElementById("cd-seconds").textContent = "00";
            document.getElementById("leaveMessageDisplay").innerHTML = "🎉 مبروك يا لالا! حبيبك نزل الإجازة وهو معاكي دلوقتي بالسلامة ❤️";
            return;
        }

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        document.getElementById("cd-days").textContent = String(days).padStart(2, "0");
        document.getElementById("cd-hours").textContent = String(hours).padStart(2, "0");
        document.getElementById("cd-minutes").textContent = String(minutes).padStart(2, "0");
        document.getElementById("cd-seconds").textContent = String(seconds).padStart(2, "0");
    }

    update();
    countdownInterval = setInterval(update, 1000);
}

// ==========================================
// 5. MULTI-VOICE RANDOM PLAYER (صوت حبيبك 🎙️)
// ==========================================
function initVoicePlayer() {
    const titleEl = document.getElementById("voiceCardTitle");
    const subEl = document.getElementById("voiceCardSubtitle");
    const counterBadge = document.getElementById("voiceCounterBadge");
    const playBtn = document.getElementById("btnPlayVoice");
    const playIcon = document.getElementById("voicePlayIcon");
    const prevBtn = document.getElementById("btnPrevVoice");
    const nextBtn = document.getElementById("btnNextVoice");
    const shuffleBtn = document.getElementById("btnShuffleVoice");
    const soundWaves = document.getElementById("soundWaveBars");
    const audioElement = document.getElementById("mainAudioElement");
    const emptyHint = document.getElementById("voiceEmptyHint");

    // Interactive timeline & controls elements
    const seekBackBtn = document.getElementById("btnSeekBack");
    const seekForwardBtn = document.getElementById("btnSeekForward");
    const speedBtn = document.getElementById("btnVoiceSpeed");
    const seekSlider = document.getElementById("voiceSeekSlider");
    const sliderFill = document.getElementById("voiceSliderFill");
    const currentTimeEl = document.getElementById("voiceCurrentTime");
    const totalTimeEl = document.getElementById("voiceTotalTime");

    const speeds = [1, 1.25, 1.5, 2];
    let currentSpeedIdx = 0;
    let isUserScrubbing = false;

    function formatVoiceTime(sec) {
        if (isNaN(sec) || sec < 0) return "00:00";
        const m = Math.floor(sec / 60);
        const s = Math.floor(sec % 60);
        return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
    }

    const voices = appData.voiceNotes || [];

    function loadVoice(index, autoPlay = false) {
        if (!voices || voices.length === 0) {
            emptyHint.style.display = "block";
            titleEl.textContent = "فويس نوت من حبيبك 🎙️❤️";
            subEl.textContent = "اسمعي صوتي لما توحشيني";
            if (counterBadge) counterBadge.textContent = "0 من 0";
            audioElement.src = "";
            if (currentTimeEl) currentTimeEl.textContent = "00:00";
            if (totalTimeEl) totalTimeEl.textContent = "00:00";
            if (seekSlider) seekSlider.value = 0;
            if (sliderFill) sliderFill.style.width = "0%";
            return;
        }

        currentVoiceIndex = (index + voices.length) % voices.length;
        const currentVoice = voices[currentVoiceIndex];

        titleEl.textContent = currentVoice.title || `فويس رقم ${currentVoiceIndex + 1} 🎙️❤️`;
        subEl.textContent = currentVoice.subtitle || "اسمعي صوتي لما توحشيني والدنيا تقفل";
        if (counterBadge) {
            counterBadge.textContent = `${currentVoiceIndex + 1} من ${voices.length}`;
        }

        if (seekSlider) seekSlider.value = 0;
        if (sliderFill) sliderFill.style.width = "0%";
        if (currentTimeEl) currentTimeEl.textContent = "00:00";

        if (currentVoice.audioSrc) {
            audioElement.src = currentVoice.audioSrc;
            audioElement.playbackRate = speeds[currentSpeedIdx];
            emptyHint.style.display = "none";
            if (autoPlay) {
                audioElement.play().then(() => {
                    isPlayingVoice = true;
                    playIcon.textContent = "❚❚";
                    soundWaves.classList.add("playing");
                }).catch(console.error);
            } else {
                isPlayingVoice = false;
                playIcon.textContent = "▶";
                soundWaves.classList.remove("playing");
            }
        } else {
            audioElement.src = "";
            emptyHint.style.display = "block";
            if (totalTimeEl) totalTimeEl.textContent = "00:00";
            isPlayingVoice = false;
            playIcon.textContent = "▶";
            soundWaves.classList.remove("playing");
        }
    }

    function pickRandomVoice(autoPlay = true) {
        if (!voices || voices.length === 0) return;
        if (voices.length === 1) {
            loadVoice(0, autoPlay);
            return;
        }
        let nextIdx;
        do {
            nextIdx = Math.floor(Math.random() * voices.length);
        } while (nextIdx === currentVoiceIndex);
        loadVoice(nextIdx, autoPlay);
        if (navigator.vibrate) navigator.vibrate(30);
    }

    // Audio metadata
    audioElement.onloadedmetadata = () => {
        const dur = audioElement.duration || 0;
        if (totalTimeEl) totalTimeEl.textContent = formatVoiceTime(dur);
        if (currentTimeEl) currentTimeEl.textContent = formatVoiceTime(audioElement.currentTime);
        if (seekSlider) {
            seekSlider.value = 0;
            if (sliderFill) sliderFill.style.width = "0%";
        }
    };

    audioElement.ontimeupdate = () => {
        if (isUserScrubbing) return;
        const cur = audioElement.currentTime || 0;
        const dur = audioElement.duration || 0;
        if (currentTimeEl) currentTimeEl.textContent = formatVoiceTime(cur);
        if (dur > 0 && seekSlider) {
            const pct = (cur / dur) * 100;
            seekSlider.value = pct;
            if (sliderFill) sliderFill.style.width = `${pct}%`;
        }
    };

    // Timeline Drag / Scrubbing Handlers
    if (seekSlider) {
        const applySeek = (commit) => {
            const dur = audioElement.duration || 0;
            if (dur > 0) {
                const targetTime = (parseFloat(seekSlider.value) / 100) * dur;
                if (currentTimeEl) currentTimeEl.textContent = formatVoiceTime(targetTime);
                if (sliderFill) sliderFill.style.width = `${seekSlider.value}%`;
                if (commit) {
                    audioElement.currentTime = targetTime;
                }
            }
        };

        seekSlider.addEventListener("input", () => {
            isUserScrubbing = true;
            applySeek(false);
        });

        seekSlider.addEventListener("change", () => {
            applySeek(true);
            isUserScrubbing = false;
        });

        seekSlider.addEventListener("touchend", () => {
            setTimeout(() => { isUserScrubbing = false; }, 100);
        });
    }

    // Rewind 5 seconds
    if (seekBackBtn) {
        seekBackBtn.onclick = () => {
            if (!audioElement.duration) return;
            audioElement.currentTime = Math.max(0, audioElement.currentTime - 5);
            if (navigator.vibrate) navigator.vibrate(20);
        };
    }

    // Forward 5 seconds
    if (seekForwardBtn) {
        seekForwardBtn.onclick = () => {
            if (!audioElement.duration) return;
            audioElement.currentTime = Math.min(audioElement.duration, audioElement.currentTime + 5);
            if (navigator.vibrate) navigator.vibrate(20);
        };
    }

    // Playback Speed Toggle (1x, 1.25x, 1.5x, 2x)
    if (speedBtn) {
        speedBtn.onclick = () => {
            currentSpeedIdx = (currentSpeedIdx + 1) % speeds.length;
            const chosen = speeds[currentSpeedIdx];
            audioElement.playbackRate = chosen;
            speedBtn.textContent = `${chosen}x`;
            if (navigator.vibrate) navigator.vibrate(20);
        };
    }

    // When audio finishes, automatically shuffle to another random voice!
    audioElement.onended = () => {
        if (voices.length > 1) {
            pickRandomVoice(true);
        } else {
            isPlayingVoice = false;
            playIcon.textContent = "▶";
            soundWaves.classList.remove("playing");
            if (seekSlider) seekSlider.value = 0;
            if (sliderFill) sliderFill.style.width = "0%";
            if (currentTimeEl) currentTimeEl.textContent = "00:00";
        }
    };

    playBtn.onclick = () => {
        const currentVoice = voices[currentVoiceIndex];
        if (!currentVoice || !currentVoice.audioSrc) {
            showToast("حبيبك لسه مسجلش الفويس ده.. يقدر يسجله من لوحة التحكم ⚙️");
            if (navigator.vibrate) navigator.vibrate(50);
            return;
        }

        if (isPlayingVoice) {
            audioElement.pause();
            isPlayingVoice = false;
            playIcon.textContent = "▶";
            soundWaves.classList.remove("playing");
        } else {
            audioElement.playbackRate = speeds[currentSpeedIdx];
            audioElement.play().then(() => {
                isPlayingVoice = true;
                playIcon.textContent = "❚❚";
                soundWaves.classList.add("playing");
                if (navigator.vibrate) navigator.vibrate(40);
            }).catch(e => {
                console.error("Playback error:", e);
                showToast("تعذر تشغيل الصوت، تأكد من صحة التسجيل");
            });
        }
    };

    // Shuffle & Next / Prev controls
    if (shuffleBtn) {
        shuffleBtn.onclick = () => {
            pickRandomVoice(isPlayingVoice);
            showToast("تم اختيار فويس عشوائي جديد! 🔀");
        };
    }

    if (nextBtn) {
        nextBtn.onclick = () => {
            pickRandomVoice(isPlayingVoice);
        };
    }

    if (prevBtn) {
        prevBtn.onclick = () => {
            loadVoice(currentVoiceIndex - 1, isPlayingVoice);
        };
    }

    // Pick random voice note on startup
    if (voices.length > 0) {
        currentVoiceIndex = Math.floor(Math.random() * voices.length);
        loadVoice(currentVoiceIndex, false);
    } else {
        loadVoice(0, false);
    }
}

// ==========================================
// 6. TIMELINE ROADMAP (ركن التواريخ والذكريات 📅)
// ==========================================
function initTimeline() {
    renderTimeline();
}

function renderTimeline() {
    const container = document.getElementById("timelineItemsContainer");
    if (!container) return;
    container.innerHTML = "";

    const items = appData.timeline || [];
    if (items.length === 0) {
        container.innerHTML = `<p style="text-align: center; color: #999; padding: 20px;">لسه مفيش تواريخ مضافة.. تقدر تضيف تواريخ حكايتكم من لوحة التحكم ⚙️</p>`;
        return;
    }

    items.forEach(item => {
        const div = document.createElement("div");
        div.className = "timeline-item";

        const formattedDate = new Date(item.date).toLocaleDateString('ar-EG', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        div.innerHTML = `
            <div class="timeline-node">${item.icon || '❤️'}</div>
            <div class="timeline-card">
                <span class="timeline-date-tag">${formattedDate}</span>
                <h3 class="timeline-title">${item.title}</h3>
                <p class="timeline-story">${item.story}</p>
                <span style="font-size: 11px; color: var(--primary); font-weight: 800; display: inline-block; margin-top: 6px;">
                    اضغطي لقراءة الموقف بالكامل ✨
                </span>
            </div>
        `;

        div.addEventListener("click", () => {
            if (navigator.vibrate) navigator.vibrate(30);
            triggerConfetti();
            openReadModal(item.title, formattedDate, item.story);
        });

        container.appendChild(div);
    });
}

// ==========================================
// 7. LOVE RECEIPT (فاتورة الحب)
// ==========================================
function initReceipt() {
    const btnPrint = document.getElementById("btnPrintReceipt");
    const container = document.getElementById("receiptContainer");

    renderReceiptTable();

    btnPrint.addEventListener("click", () => {
        if (navigator.vibrate) navigator.vibrate(80);
        triggerConfetti();

        container.style.display = "block";
        container.scrollIntoView({ behavior: "smooth", block: "center" });

        btnPrint.innerHTML = "<span>تمت طباعة الفاتورة بنجاح ❤️</span> <i>✓</i>";
    });
}

function renderReceiptTable() {
    const r = appData.receipt;
    document.getElementById("recReceiptNo").textContent = `رقم الفاتورة: ${r.receiptNo}`;
    let cashierDisplay = r.cashier || "";
    if (!cashierDisplay || cashierDisplay.includes("عسكري مشتاق") || cashierDisplay.includes("الظابط")) {
        cashierDisplay = `${getPartnerDisplayTitle()} مشتاق في الكتيبة بس بيعشقك`;
    }
    document.getElementById("recCashier").textContent = `الكاشير: ${cashierDisplay}`;
    document.getElementById("recCustomer").textContent = `العميل: ${r.customer}`;
    document.getElementById("recDate").textContent = `التاريخ: ${r.date}`;
    document.getElementById("recSubtotal").textContent = r.subtotal;
    document.getElementById("recTax").textContent = r.tax;
    document.getElementById("recTotal").textContent = r.total;
    document.getElementById("recFooterNote").textContent = r.note;

    const tbody = document.getElementById("receiptTableBody");
    tbody.innerHTML = "";
    r.items.forEach(item => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td style="font-weight: 700;">${item.name}</td>
            <td style="text-align: center;">${item.qty}</td>
            <td style="text-align: left; font-weight: bold; color: #d62d55;">${item.price}</td>
        `;
        tbody.appendChild(tr);
    });
}

// ==========================================
// 8. EMERGENCY PHARMACY & HUG
// ==========================================
function initPharmacyAndHug() {
    const hugBtn = document.getElementById("btnEmergencyHug");
    hugBtn.addEventListener("click", () => {
        if (navigator.vibrate) {
            navigator.vibrate([120, 80, 120, 80, 250]);
        }

        triggerConfetti(true);

        const hugModal = document.getElementById("hugModal");
        const hugCard = appData.emergencyCards.find(c => c.actionType === "hug") || appData.emergencyCards[0];
        document.getElementById("hugModalMessage").textContent = hugCard.content;
        hugModal.classList.add("active");
    });

    document.getElementById("btnCloseHugModal").addEventListener("click", () => {
        document.getElementById("hugModal").classList.remove("active");
    });
    document.getElementById("btnAckHugModal").addEventListener("click", () => {
        document.getElementById("hugModal").classList.remove("active");
    });

    renderEmergencyCards();

    // Read Modal Close handlers
    document.getElementById("btnCloseReadModal").addEventListener("click", () => {
        document.getElementById("readModal").classList.remove("active");
    });
    document.getElementById("btnAckReadModal").addEventListener("click", () => {
        document.getElementById("readModal").classList.remove("active");
    });
}

function renderEmergencyCards() {
    const list = document.getElementById("emergencyCardsList");
    list.innerHTML = "";

    appData.emergencyCards.forEach(card => {
        if (card.actionType === "hug") return;

        const div = document.createElement("div");
        div.className = "open-card-item";
        div.innerHTML = `
            <div class="open-card-info">
                <div class="open-card-title">${card.title}</div>
                <div class="open-card-desc">${card.desc || ''}</div>
            </div>
            <span class="open-card-tag">${card.badge || 'دعم'}</span>
        `;

        div.addEventListener("click", () => {
            if (navigator.vibrate) navigator.vibrate(40);
            openReadModal(card.title, card.badge || "صيدلية لالا", card.content);
        });

        list.appendChild(div);
    });
}

function openReadModal(title, badge, content) {
    document.getElementById("readModalTitle").textContent = title;
    document.getElementById("readModalBadge").textContent = badge;
    document.getElementById("readModalBody").textContent = content;
    document.getElementById("readModal").classList.add("active");
}

// ==========================================
// 9. TIME CAPSULES (LOCKED LETTERS)
// ==========================================
function initLockedLetters() {
    renderLockedLetters();

    document.getElementById("btnCloseLockedModal").addEventListener("click", () => {
        document.getElementById("lockedModal").classList.remove("active");
    });
    document.getElementById("btnAckLockedModal").addEventListener("click", () => {
        document.getElementById("lockedModal").classList.remove("active");
    });
}

function renderLockedLetters() {
    const list = document.getElementById("lockedLettersList");
    list.innerHTML = "";

    const now = new Date().getTime();

    appData.lockedLetters.forEach(letter => {
        const unlockTime = new Date(letter.unlockDate).getTime();
        const isUnlocked = now >= unlockTime;

        const item = document.createElement("div");
        item.className = `letter-item ${isUnlocked ? 'unlocked' : 'locked'}`;

        const formattedDate = new Date(letter.unlockDate).toLocaleDateString('ar-EG', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        item.innerHTML = `
            <div class="letter-header">
                <span class="letter-title">${isUnlocked ? '💌' : '🔒'} ${letter.title}</span>
                <span class="letter-status-badge">${isUnlocked ? 'مفتوح الآن 🔓' : 'مقفول ⏳'}</span>
            </div>
            <div class="letter-date-hint">تاريخ الفتح: ${formattedDate}</div>
            <div class="letter-preview-text">${isUnlocked ? 'تم فتح الرسالة! اضغطي للقراءة ❤️' : (letter.preview || 'جواب سري ومفاجأة.. 🔒')}</div>
            <button class="${isUnlocked ? 'btn-primary' : 'btn-secondary'}" style="width: 100%; padding: 8px;">
                <span>${isUnlocked ? 'قراءة الجواب بالكامل 📖' : 'حاولي فتح الجواب 🤫'}</span>
            </button>
        `;

        item.querySelector("button").addEventListener("click", () => {
            if (isUnlocked) {
                triggerConfetti();
                openReadModal(letter.title, "جواب خاص", letter.content);
            } else {
                if (navigator.vibrate) navigator.vibrate(100);
                showLockedLetterModal(letter, unlockTime);
            }
        });

        list.appendChild(item);
    });
}

function showLockedLetterModal(letter, unlockTime) {
    const now = new Date().getTime();
    const diff = unlockTime - now;

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    const formattedDate = new Date(letter.unlockDate).toLocaleDateString('ar-EG', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    document.getElementById("lockedModalDateText").textContent = `الجواب ده مقفول ومش هيتفتح غير يوم ${formattedDate}!`;
    document.getElementById("lockedModalTimeRemaining").textContent = `باقي على الفتح: ${days} يوم و ${hours} ساعة ⏳`;
    document.getElementById("lockedModal").classList.add("active");
}

// ==========================================
// 10. THANAWEYA AMMA (ركن الدحيحة)
// ==========================================
function initThanaweya() {
    renderThanaweyaQuotes();

    document.getElementById("btnNextQuote").addEventListener("click", () => {
        currentQuoteIndex = (currentQuoteIndex + 1) % appData.thanaweya.studyQuotes.length;
        document.getElementById("studyQuoteDisplay").textContent = appData.thanaweya.studyQuotes[currentQuoteIndex];
        if (navigator.vibrate) navigator.vibrate(30);
    });

    // Pomodoro Timer
    const playBtn = document.getElementById("btnStartTimer");
    const resetBtn = document.getElementById("btnResetTimer");
    const display = document.getElementById("pomodoroDisplay");

    function updatePomodoroDisplay() {
        const mins = Math.floor(pomodoroSecondsLeft / 60);
        const secs = pomodoroSecondsLeft % 60;
        display.textContent = `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
    }

    playBtn.addEventListener("click", () => {
        if (!isPomodoroRunning) {
            isPomodoroRunning = true;
            document.getElementById("timerPlayIcon").textContent = "⏸️";
            document.getElementById("timerPlayText").textContent = "إيقاف مؤقت";
            pomodoroTimer = setInterval(() => {
                if (pomodoroSecondsLeft > 0) {
                    pomodoroSecondsLeft--;
                    updatePomodoroDisplay();
                } else {
                    clearInterval(pomodoroTimer);
                    isPomodoroRunning = false;
                    document.getElementById("timerPlayIcon").textContent = "▶️";
                    document.getElementById("timerPlayText").textContent = "ابدأي تركيز";
                    if (navigator.vibrate) navigator.vibrate([200, 100, 200, 100, 400]);
                    triggerConfetti();
                    openReadModal(
                        "عاش يا شطورة زيزو! 🎓🎉",
                        "إنجاز مذاكرة",
                        "خلصتي 25 دقيقة تركيز عالي! برافو عليكي يا بطلة، قومي خدي استراحة 5 دقايق اشربي حاجة وكلي شوكولاتة وارجعي كملي وانتي فخورة بنفسك!"
                    );
                    pomodoroSecondsLeft = 25 * 60;
                    updatePomodoroDisplay();
                }
            }, 1000);
        } else {
            clearInterval(pomodoroTimer);
            isPomodoroRunning = false;
            document.getElementById("timerPlayIcon").textContent = "▶️";
            document.getElementById("timerPlayText").textContent = "استكمال التركيز";
        }
    });

    resetBtn.addEventListener("click", () => {
        clearInterval(pomodoroTimer);
        isPomodoroRunning = false;
        pomodoroSecondsLeft = 25 * 60;
        updatePomodoroDisplay();
        document.getElementById("timerPlayIcon").textContent = "▶️";
        document.getElementById("timerPlayText").textContent = "ابدأي تركيز";
    });
}

function renderThanaweyaQuotes() {
    if (appData.thanaweya.studyQuotes.length > 0) {
        document.getElementById("studyQuoteDisplay").textContent = appData.thanaweya.studyQuotes[0];
    }

    const breakList = document.getElementById("studyBreakList");
    breakList.innerHTML = "";
    appData.thanaweya.breakActivities.forEach(act => {
        const item = document.createElement("div");
        item.style.cssText = "background: #fff; padding: 10px 14px; border-radius: 12px; border: 1px solid rgba(255,182,193,0.5); font-size: 13px; font-weight: 700;";
        item.textContent = act;
        breakList.appendChild(item);
    });
}

// ==========================================
// 11. GAMES & INTERACTIVE FUN
// ==========================================
function initGames() {
    const btnEscape = document.getElementById("btnYaraEscape");
    const btnLover = document.getElementById("btnHeLoves");
    const arena = document.getElementById("arenaBox");

    const evasiveTexts = [
        "مش هتلحقيني! 😜",
        "حاولي تاني يا لالا! 😂",
        "مستحيل تدوسي عليا!",
        "اعترفي بالحق أحسن! 🏃‍♂️",
        `${appData.settings.partnerName || 'زيزو'} بيحبك أكتر خلاص! ❤️`,
        "سرعتي خارقة! ⚡"
    ];

    function moveEscapeButton() {
        const arenaRect = arena.getBoundingClientRect();
        const btnRect = btnEscape.getBoundingClientRect();

        const availableWidth = arenaRect.width > 0 ? arenaRect.width : 280;
        const availableHeight = arenaRect.height > 0 ? arenaRect.height : 140;
        const btnWidth = btnRect.width > 0 ? btnRect.width : 110;
        const btnHeight = btnRect.height > 0 ? btnRect.height : 45;

        const maxX = Math.max(20, availableWidth - btnWidth - 16);
        const maxY = Math.max(20, availableHeight - btnHeight - 16);

        const randomX = Math.max(10, Math.floor(Math.random() * maxX));
        const randomY = Math.max(10, Math.floor(Math.random() * maxY));

        btnEscape.style.left = `${randomX}px`;
        btnEscape.style.top = `${randomY}px`;

        const randomText = evasiveTexts[Math.floor(Math.random() * evasiveTexts.length)];
        btnEscape.querySelector("span").textContent = randomText;

        if (navigator.vibrate) navigator.vibrate(30);
    }

    btnEscape.addEventListener("mouseenter", moveEscapeButton);
    btnEscape.addEventListener("touchstart", (e) => {
        e.preventDefault();
        moveEscapeButton();
    });
    btnEscape.addEventListener("click", (e) => {
        e.preventDefault();
        moveEscapeButton();
    });

    btnLover.addEventListener("click", () => {
        if (navigator.vibrate) navigator.vibrate([100, 50, 150]);
        triggerConfetti(true);
        openReadModal(
            "أيوا كده اعترفي بالحق يا لالا! ❤️",
            "اعتراف رسمي",
            `عارف ومؤكد إنك بتحبيني، بس حبي ليكي معدي كل الحدود ومفيش حد في الكون يقدر يحبك قدي.. دبستي في راجل بيعشقك للأبد يا يويو!`
        );
    });

    document.getElementById("btnManualShake").addEventListener("click", triggerShakeAction);
}

// ==========================================
// 12. SHAKE SENSOR
// ==========================================
function initShakeSensor() {
    function startMotionListener() {
        if (window.DeviceMotionEvent) {
            let lastX = null, lastY = null, lastZ = null;
            window.addEventListener("devicemotion", (event) => {
                const acc = event.accelerationIncludingGravity;
                if (!acc) return;

                const now = Date.now();
                if (now - lastShakeTime < 1500) return;

                if (lastX !== null && lastY !== null && lastZ !== null) {
                    const deltaX = Math.abs(acc.x - lastX);
                    const deltaY = Math.abs(acc.y - lastY);
                    const deltaZ = Math.abs(acc.z - lastZ);

                    if (deltaX + deltaY + deltaZ > 24) {
                        lastShakeTime = now;
                        triggerShakeAction();
                    }
                }

                lastX = acc.x;
                lastY = acc.y;
                lastZ = acc.z;
            });
        }
    }

    if (typeof DeviceMotionEvent !== "undefined" && typeof DeviceMotionEvent.requestPermission !== "function") {
        startMotionListener();
    }

    document.getElementById("btnManualShake").addEventListener("click", () => {
        if (typeof DeviceMotionEvent !== "undefined" && typeof DeviceMotionEvent.requestPermission === "function") {
            DeviceMotionEvent.requestPermission()
                .then(response => {
                    if (response === 'granted') {
                        startMotionListener();
                    }
                })
                .catch(console.error);
        }
    });
}

function triggerShakeAction() {
    if (navigator.vibrate) navigator.vibrate([80, 60, 100]);
    triggerConfetti();

    const messages = appData.shakeMessages;
    if (!messages || messages.length === 0) return;

    const randomMsg = messages[Math.floor(Math.random() * messages.length)];
    const bubble = document.getElementById("shakeBubble");
    bubble.textContent = randomMsg;
    bubble.style.display = "block";
    bubble.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

// ==========================================
// 13. CONFETTI & CANVAS HEARTS
// ==========================================
function triggerConfetti(massive = false) {
    if (typeof confetti === "function") {
        if (massive) {
            confetti({ particleCount: 80, spread: 90, origin: { x: 0.1, y: 0.7 } });
            confetti({ particleCount: 80, spread: 90, origin: { x: 0.9, y: 0.7 } });
        } else {
            confetti({ particleCount: 50, spread: 60, origin: { y: 0.8 } });
        }
    } else {
        const count = massive ? 20 : 10;
        for (let i = 0; i < count; i++) {
            const el = document.createElement("div");
            el.textContent = "💖";
            el.style.cssText = `
                position: fixed;
                bottom: 20%;
                left: ${Math.random() * 80 + 10}%;
                font-size: ${Math.random() * 20 + 16}px;
                pointer-events: none;
                z-index: 9999;
                transition: transform 1s ease-out, opacity 1s ease-out;
            `;
            document.body.appendChild(el);
            setTimeout(() => {
                el.style.transform = `translateY(-${Math.random() * 200 + 100}px) scale(1.4)`;
                el.style.opacity = "0";
            }, 20);
            setTimeout(() => el.remove(), 1100);
        }
    }
}

function initCanvasHearts() {
    const canvas = document.getElementById("heartsCanvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;

    window.addEventListener("resize", () => {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
    });

    const hearts = [];
    const maxHearts = 16;

    for (let i = 0; i < maxHearts; i++) {
        hearts.push({
            x: Math.random() * width,
            y: Math.random() * height,
            size: Math.random() * 12 + 8,
            speedY: Math.random() * 0.6 + 0.3,
            opacity: Math.random() * 0.4 + 0.15,
            wiggle: Math.random() * 10
        });
    }

    function draw() {
        ctx.clearRect(0, 0, width, height);
        hearts.forEach(h => {
            h.y -= h.speedY;
            h.wiggle += 0.02;
            const x = h.x + Math.sin(h.wiggle) * 1.5;

            if (h.y < -20) {
                h.y = height + 20;
                h.x = Math.random() * width;
            }

            ctx.fillStyle = `rgba(255, 45, 85, ${h.opacity})`;
            ctx.font = `${h.size}px serif`;
            ctx.fillText("❤️", x, h.y);
        });
        requestAnimationFrame(draw);
    }

    draw();
}

// ==========================================
// 14. SECRET ADMIN DASHBOARD & RECORDER
// ==========================================
function initAdminSystem() {
    const pinModal = document.getElementById("pinModal");
    const adminModal = document.getElementById("adminModal");
    const inputPin = document.getElementById("inputPinCode");
    const pinError = document.getElementById("pinErrorMsg");

    function openPinModal() {
        inputPin.value = "";
        pinError.style.display = "none";
        pinModal.classList.add("active");
        setTimeout(() => inputPin.focus(), 200);
    }

    document.getElementById("secretIconBtn").addEventListener("click", openPinModal);
    document.getElementById("footerAdminTrigger").addEventListener("click", openPinModal);

    document.getElementById("headerTitleTrigger").addEventListener("click", () => {
        titleTapCount++;
        clearTimeout(titleTapTimer);
        titleTapTimer = setTimeout(() => { titleTapCount = 0; }, 800);
        if (titleTapCount >= 3) {
            titleTapCount = 0;
            openPinModal();
        }
    });

    document.getElementById("btnClosePinModal").addEventListener("click", () => {
        pinModal.classList.remove("active");
    });

    document.getElementById("btnSubmitPin").addEventListener("click", () => {
        const enteredPin = inputPin.value.trim();
        const expectedPin = appData.settings.adminPin || "1234";

        if (enteredPin === expectedPin) {
            pinModal.classList.remove("active");
            openAdminDashboard();
        } else {
            pinError.style.display = "block";
            if (navigator.vibrate) navigator.vibrate(120);
        }
    });

    inputPin.addEventListener("keyup", (e) => {
        if (e.key === "Enter") {
            document.getElementById("btnSubmitPin").click();
        }
    });

    document.getElementById("btnCloseAdminModal").addEventListener("click", () => {
        adminModal.classList.remove("active");
    });

    // Horizontal Scrollable Tabs Switch
    const adminTabs = document.querySelectorAll(".admin-tab-btn");
    const adminSections = document.querySelectorAll(".admin-section");

    adminTabs.forEach(tab => {
        tab.addEventListener("click", () => {
            const targetId = tab.getAttribute("data-admin-tab");
            adminTabs.forEach(t => t.classList.remove("active"));
            adminSections.forEach(s => s.style.display = "none");

            tab.classList.add("active");
            const targetSection = document.getElementById(targetId);
            if (targetSection) targetSection.style.display = "block";

            // Scroll tab smoothly into view
            tab.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
        });
    });

    // Save Admin Data
    document.getElementById("btnSaveAdminData").addEventListener("click", () => {
        collectAdminData();
        saveData(true);
        const ghCfg = getGitHubConfig();
        if (ghCfg.autoSync && ghCfg.token && ghCfg.owner && ghCfg.repo) {
            syncDataToGitHub(false);
        }
        adminModal.classList.remove("active");
    });

    // Quick Sync to GitHub Button
    const btnQuickSync = document.getElementById("btnQuickSyncGithub");
    if (btnQuickSync) {
        btnQuickSync.addEventListener("click", () => {
            collectAdminData();
            syncDataToGitHub(true);
        });
    }

    // Direct GitHub Sync inside GitHub Tab
    const btnSyncGhNow = document.getElementById("btnSyncGhNow");
    if (btnSyncGhNow) {
        btnSyncGhNow.addEventListener("click", () => {
            collectAdminData();
            syncDataToGitHub(true);
        });
    }

    // Fetch Remote GitHub Data Manually
    const btnFetchGhNow = document.getElementById("btnFetchGhNow");
    if (btnFetchGhNow) {
        btnFetchGhNow.addEventListener("click", async () => {
            showToast("⏳ جاري جلب أحدث بيانات من GitHub...");
            await fetchRemoteGitHubData(true);
            openAdminDashboard();
        });
    }

    // Toggle GitHub Token Visibility
    const btnToggleToken = document.getElementById("btnToggleGhToken");
    if (btnToggleToken) {
        btnToggleToken.addEventListener("click", () => {
            const tokenInput = document.getElementById("admGhToken");
            if (tokenInput) {
                tokenInput.type = tokenInput.type === "password" ? "text" : "password";
            }
        });
    }

    // Share Admin URL
    document.getElementById("btnShareAdminUrl").addEventListener("click", () => {
        collectAdminData();
        saveData(false);

        const jsonStr = JSON.stringify(appData);
        const encodedData = btoa(unescape(encodeURIComponent(jsonStr)));
        const shareUrl = `${window.location.origin}${window.location.pathname}#data=${encodedData}`;

        navigator.clipboard.writeText(shareUrl).then(() => {
            showToast("تم نسخ رابط الموقع بالتعديلات! ابعته لـ يارا على الواتساب ❤️");
        }).catch(() => {
            prompt("انسخ هذا الرابط وابعته لـ يارا:", shareUrl);
        });
    });

    // Export Data to default-data.js for GitHub
    const btnExport = document.getElementById("btnExportDataJs");
    if (btnExport) {
        btnExport.addEventListener("click", () => {
            collectAdminData();
            saveData(false);
            const content = `// البيانات الافتراضية للموقع - تم تصديرها من لوحة التحكم\nconst DEFAULT_APP_DATA = ${JSON.stringify(appData, null, 4)};\n`;
            const blob = new Blob([content], { type: "application/javascript;charset=utf-8" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "default-data.js";
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            showToast("تم تحميل ملف default-data.js بنجاح! استبدله في المجلد قبل الرفع على جيت هاب ❤️");
        });
    }

    // Reset Default Data
    document.getElementById("btnResetDefaultData").addEventListener("click", () => {
        if (confirm("هل أنت متأكد من استعادة البيانات الافتراضية؟ سيتم مسح أي تعديلات قمت بها.")) {
            appData = JSON.parse(JSON.stringify(DEFAULT_APP_DATA));
            saveData(true);
            adminModal.classList.remove("active");
        }
    });

    // Add Voice Note Button
    const btnAddVoice = document.getElementById("btnAddVoiceBtn");
    if (btnAddVoice) {
        btnAddVoice.addEventListener("click", () => {
            if (!appData.voiceNotes) appData.voiceNotes = [];
            appData.voiceNotes.unshift({
                id: `vn_${Date.now()}`,
                title: "فويس جديد 🎙️❤️",
                subtitle: "رسالة من قلب الكتيبة",
                audioSrc: "",
                recordedDate: "تسجيل جديد"
            });
            populateAdminVoice();
        });
    }

    // Add Timeline Button
    document.getElementById("btnAddTimelineBtn").addEventListener("click", () => {
        if (!appData.timeline) appData.timeline = [];
        appData.timeline.unshift({
            id: `tl_${Date.now()}`,
            date: new Date().toISOString().slice(0, 10),
            title: "تاريخ جديد في حكايتنا ❤️",
            icon: "💖",
            story: "اكتب هنا تفاصيل وذكريات اليوم ده..."
        });
        populateAdminTimeline();
    });

    // Add Letter Button
    document.getElementById("btnAddLetterBtn").addEventListener("click", () => {
        appData.lockedLetters.push({
            id: `letter_${Date.now()}`,
            title: "جواب جديد",
            unlockDate: new Date(Date.now() + 86400000 * 7).toISOString().slice(0, 16),
            preview: "جواب سري ومفاجأة لـ لالا.. 🔒",
            content: "اكتب هنا رسالتك وكلامك من القلب..."
        });
        populateAdminLetters();
    });

    // Add Emergency Card Button
    document.getElementById("btnAddPharmacyCardBtn").addEventListener("click", () => {
        appData.emergencyCards.push({
            id: `card_${Date.now()}`,
            title: "افتحي لما...",
            badge: "دعم دافي",
            desc: "وصف سريع للكرت",
            content: "اكتب هنا الكلام اللي يطمنها لما تفتح الكرت ده...",
            actionType: "text"
        });
        populateAdminPharmacy();
    });

    // Add Shake Message Button
    document.getElementById("btnAddShakeBtn").addEventListener("click", () => {
        appData.shakeMessages.push("رسالة هزار جديدة هنا... 😂");
        populateAdminShake();
    });

    // Add Study Quote Button
    document.getElementById("btnAddStudyQuoteBtn").addEventListener("click", () => {
        appData.thanaweya.studyQuotes.push("عافري عشان حلمك يا لالا.. أنا فخور بيكي دايماً! 🎓");
        populateAdminStudy();
    });
}

function openAdminDashboard() {
    populateAdminGeneral();
    populateAdminVoice();
    populateAdminTimeline();
    populateAdminLetters();
    populateAdminPharmacy();
    populateAdminShake();
    populateAdminStudy();
    populateAdminReceipt();
    populateAdminGitHub();
    document.getElementById("adminModal").classList.add("active");
}

function populateAdminGeneral() {
    const s = appData.settings;
    document.getElementById("admLeaveDate").value = s.armyLeaveDate ? s.armyLeaveDate.slice(0, 16) : "";
    const startInput = document.getElementById("admArmyStartDate");
    if (startInput) startInput.value = s.armyStartDate ? s.armyStartDate.slice(0, 16) : "2026-10-15T00:00";
    document.getElementById("admLeaveMsg").value = s.leaveCountdownMessage || "";
    document.getElementById("admYaraName").value = s.yaraName || "";
    document.getElementById("admNicknames").value = s.nicknames || "";
    document.getElementById("admPartnerName").value = s.partnerName || "زيزو";
    const rankSelect = document.getElementById("admMilitaryRank");
    if (rankSelect) rankSelect.value = s.militaryRank || "officer";
    document.getElementById("admPinCode").value = s.adminPin || "1234";
}

function populateAdminVoice() {
    const container = document.getElementById("admVoiceList");
    if (!container) return;
    container.innerHTML = "";

    const voices = appData.voiceNotes || [];
    if (voices.length === 0) {
        container.innerHTML = `<p style="text-align: center; color: #999; padding: 14px;">مفيش فويسات مسجلة حالياً.. اضغط على "+ إضافة فويس جديد" بالأعلى لإضافة أول فويس!</p>`;
        return;
    }

    voices.forEach((vn, index) => {
        const div = document.createElement("div");
        div.className = "admin-item-box";
        div.innerHTML = `
            <div class="admin-item-header">
                <span style="font-weight: 800; font-size: 13px;">🎙️ فويس رقم ${index + 1}</span>
                <button class="btn-delete-voice" data-index="${index}" style="background: none; border: none; color: red; font-size: 13px; cursor: pointer;">🗑️ حذف الفويس</button>
            </div>
            <div class="admin-input-group">
                <label>عنوان الفويس (مثلاً: فويس الصباح، تشجيع مذاكرة):</label>
                <input type="text" class="admin-input vn-title-input" value="${vn.title || ''}">
            </div>
            <div class="admin-input-group">
                <label>الوصف / الجملة تحت العنوان:</label>
                <input type="text" class="admin-input vn-sub-input" value="${vn.subtitle || ''}">
            </div>

            <!-- Recorder Box for this voice -->
            <div class="recorder-box" style="margin-bottom: 12px; padding: 12px;">
                <button class="record-btn-action vn-rec-btn" data-index="${index}" type="button">
                    <span class="vn-rec-icon">🎙️</span>
                </button>
                <p class="vn-rec-status" style="font-weight: 800; font-size: 12px; color: var(--primary); margin: 4px 0;">
                    ${vn.audioSrc ? '✅ يحتوي على تسجيل صوتي - اضغط لإعادة التسجيل' : 'اضغط لتسجيل هذا الفويس بالمايكروفون'}
                </p>
                <div class="vn-rec-timer" style="font-size: 16px; font-weight: 900; display: none;">00:00</div>
                <audio class="vn-audio-preview" controls src="${vn.audioSrc || ''}" style="width: 100%; margin-top: 8px; display: ${vn.audioSrc ? 'block' : 'none'};"></audio>
            </div>

            <div class="admin-input-group">
                <label>أو ارفع ملف صوتي من الموبايل (MP3 / فويس مسجل):</label>
                <input type="file" accept="audio/*" class="admin-input vn-file-input" data-index="${index}">
            </div>
            <div class="admin-input-group">
                <label>أو الصق رابط مباشر للتسجيل الصوتي (URL):</label>
                <input type="text" class="admin-input vn-url-input" value="${vn.audioSrc && !vn.audioSrc.startsWith('data:') ? vn.audioSrc : ''}" placeholder="https://example.com/voice.mp3">
            </div>
        `;

        // File upload handler
        const fileInput = div.querySelector(".vn-file-input");
        fileInput.addEventListener("change", (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onloadend = () => {
                    vn.audioSrc = reader.result;
                    const preview = div.querySelector(".vn-audio-preview");
                    preview.src = reader.result;
                    preview.style.display = "block";
                    div.querySelector(".vn-rec-status").textContent = "✅ تم رفع الملف الصوتي بنجاح!";
                };
                reader.readAsDataURL(file);
            }
        });

        // Record handler
        const recBtn = div.querySelector(".vn-rec-btn");
        const recIcon = div.querySelector(".vn-rec-icon");
        const statusText = div.querySelector(".vn-rec-status");
        const timerText = div.querySelector(".vn-rec-timer");
        const preview = div.querySelector(".vn-audio-preview");

        recBtn.onclick = async () => {
            if (activeRecordingIndex === null) {
                // Start
                try {
                    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                    mediaRecorder = new MediaRecorder(stream);
                    audioChunks = [];
                    activeRecordingIndex = index;

                    mediaRecorder.ondataavailable = ev => {
                        if (ev.data.size > 0) audioChunks.push(ev.data);
                    };

                    mediaRecorder.onstop = () => {
                        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
                        const reader = new FileReader();
                        reader.readAsDataURL(audioBlob);
                        reader.onloadend = () => {
                            vn.audioSrc = reader.result;
                            preview.src = reader.result;
                            preview.style.display = "block";
                            statusText.textContent = "✅ تم التسجيل بنجاح! اضغط تشغيل للمعاينة.";
                        };
                    };

                    mediaRecorder.start();
                    recBtn.classList.add("recording");
                    recIcon.textContent = "⏹️";
                    statusText.textContent = "🔴 جاري التسجيل الآن.. تحدث بوضوح...";
                    timerText.style.display = "block";
                    recordSeconds = 0;

                    recordInterval = setInterval(() => {
                        recordSeconds++;
                        const m = Math.floor(recordSeconds / 60);
                        const s = recordSeconds % 60;
                        timerText.textContent = `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
                    }, 1000);

                } catch (err) {
                    console.error("Microphone error:", err);
                    alert("تعذر الوصول للمايكروفون. تأكد من إعطاء إذن المايك في المتصفح أو اختر ملف صوتي.");
                }
            } else if (activeRecordingIndex === index) {
                // Stop
                if (mediaRecorder && mediaRecorder.state !== "inactive") {
                    mediaRecorder.stop();
                    mediaRecorder.stream.getTracks().forEach(track => track.stop());
                }
                clearInterval(recordInterval);
                activeRecordingIndex = null;
                recBtn.classList.remove("recording");
                recIcon.textContent = "🎙️";
                timerText.style.display = "none";
            } else {
                alert("يوجد تسجيل آخر قيد العمل، أوقفه أولاً.");
            }
        };

        // Delete handler
        div.querySelector(".btn-delete-voice").addEventListener("click", () => {
            appData.voiceNotes.splice(index, 1);
            populateAdminVoice();
        });

        container.appendChild(div);
    });
}

function populateAdminTimeline() {
    const container = document.getElementById("admTimelineList");
    container.innerHTML = "";

    const items = appData.timeline || [];
    items.forEach((item, index) => {
        const div = document.createElement("div");
        div.className = "admin-item-box";
        div.innerHTML = `
            <div class="admin-item-header">
                <span style="font-weight: 800; font-size: 13px;">ذكرى رقم ${index + 1}</span>
                <button class="btn-delete-timeline" data-index="${index}" style="background: none; border: none; color: red; font-size: 13px; cursor: pointer;">🗑️ حذف الذكرى</button>
            </div>
            <div class="admin-input-group">
                <label>تاريخ الموقف:</label>
                <input type="date" class="admin-input tl-date-input" value="${item.date}">
            </div>
            <div class="admin-input-group">
                <label>عنوان الموقف:</label>
                <input type="text" class="admin-input tl-title-input" value="${item.title}">
            </div>
            <div class="admin-input-group">
                <label>الأيقونة / الإيموجي (مثل ✨، 💖، 💍):</label>
                <input type="text" class="admin-input tl-icon-input" value="${item.icon || '❤️'}">
            </div>
            <div class="admin-input-group">
                <label>قصة وحكاية اليوم ده بالتفصيل:</label>
                <textarea class="admin-textarea tl-story-input" rows="3">${item.story}</textarea>
            </div>
        `;

        div.querySelector(".btn-delete-timeline").addEventListener("click", () => {
            appData.timeline.splice(index, 1);
            populateAdminTimeline();
        });

        container.appendChild(div);
    });
}

function populateAdminLetters() {
    const container = document.getElementById("admLettersList");
    container.innerHTML = "";

    appData.lockedLetters.forEach((letter, index) => {
        const div = document.createElement("div");
        div.className = "admin-item-box";
        div.innerHTML = `
            <div class="admin-item-header">
                <span style="font-weight: 800; font-size: 13px;">جواب رقم ${index + 1}</span>
                <button class="btn-delete-letter" data-index="${index}" style="background: none; border: none; color: red; font-size: 13px; cursor: pointer;">🗑️ حذف الجواب</button>
            </div>
            <div class="admin-input-group">
                <label>عنوان الجواب:</label>
                <input type="text" class="admin-input letter-title-input" value="${letter.title}">
            </div>
            <div class="admin-input-group">
                <label>تاريخ ووقت فتح الجواب تلقائياً:</label>
                <input type="datetime-local" class="admin-input letter-date-input" value="${letter.unlockDate ? letter.unlockDate.slice(0, 16) : ''}">
            </div>
            <div class="admin-input-group">
                <label>الجملة التشويقية قبل الفتح:</label>
                <input type="text" class="admin-input letter-preview-input" value="${letter.preview || ''}">
            </div>
            <div class="admin-input-group">
                <label>محتوى الجواب بالكامل:</label>
                <textarea class="admin-textarea letter-content-input" rows="3">${letter.content}</textarea>
            </div>
        `;

        div.querySelector(".btn-delete-letter").addEventListener("click", () => {
            appData.lockedLetters.splice(index, 1);
            populateAdminLetters();
        });

        container.appendChild(div);
    });
}

function populateAdminPharmacy() {
    const container = document.getElementById("admPharmacyList");
    container.innerHTML = "";

    appData.emergencyCards.forEach((card, index) => {
        const div = document.createElement("div");
        div.className = "admin-item-box";
        div.innerHTML = `
            <div class="admin-item-header">
                <span style="font-weight: 800; font-size: 13px; color: var(--primary);">${card.title}</span>
                ${card.actionType !== "hug" ? `<button class="btn-delete-pharmacy" data-index="${index}" style="background: none; border: none; color: red; font-size: 12px; cursor: pointer;">🗑️ حذف</button>` : `<span style="font-size: 11px; color: #888;">(الزرار الرئيسي)</span>`}
            </div>
            <div class="admin-input-group">
                <label>عنوان الكرت:</label>
                <input type="text" class="admin-input pharmacy-title-input" value="${card.title}">
            </div>
            <div class="admin-input-group">
                <label>الوصف القصير:</label>
                <input type="text" class="admin-input pharmacy-desc-input" value="${card.desc || ''}">
            </div>
            <div class="admin-input-group">
                <label>الوسم (Badge):</label>
                <input type="text" class="admin-input pharmacy-badge-input" value="${card.badge || 'دعم'}">
            </div>
            <div class="admin-input-group">
                <label>نص الرسالة التي تظهر لها عند الفتح:</label>
                <textarea class="admin-textarea pharmacy-content-input" rows="3">${card.content}</textarea>
            </div>
        `;

        if (card.actionType !== "hug") {
            div.querySelector(".btn-delete-pharmacy").addEventListener("click", () => {
                appData.emergencyCards.splice(index, 1);
                populateAdminPharmacy();
            });
        }

        container.appendChild(div);
    });
}

function populateAdminShake() {
    const container = document.getElementById("admShakeList");
    container.innerHTML = "";

    appData.shakeMessages.forEach((msg, index) => {
        const div = document.createElement("div");
        div.style.cssText = "display: flex; gap: 6px; align-items: center;";
        div.innerHTML = `
            <input type="text" class="admin-input shake-msg-input" data-index="${index}" value="${msg}" style="flex: 1;">
            <button class="btn-delete-shake" data-index="${index}" style="background: none; border: none; color: red; font-size: 14px; cursor: pointer;">🗑️</button>
        `;

        div.querySelector(".btn-delete-shake").addEventListener("click", () => {
            appData.shakeMessages.splice(index, 1);
            populateAdminShake();
        });

        container.appendChild(div);
    });
}

function populateAdminStudy() {
    const container = document.getElementById("admStudyList");
    container.innerHTML = "";

    appData.thanaweya.studyQuotes.forEach((quote, index) => {
        const div = document.createElement("div");
        div.style.cssText = "display: flex; gap: 6px; align-items: center;";
        div.innerHTML = `
            <textarea class="admin-textarea study-quote-input" data-index="${index}" rows="2" style="flex: 1;">${quote}</textarea>
            <button class="btn-delete-study" data-index="${index}" style="background: none; border: none; color: red; font-size: 14px; cursor: pointer;">🗑️</button>
        `;

        div.querySelector(".btn-delete-study").addEventListener("click", () => {
            appData.thanaweya.studyQuotes.splice(index, 1);
            populateAdminStudy();
        });

        container.appendChild(div);
    });
}

function populateAdminReceipt() {
    const r = appData.receipt;
    document.getElementById("admRecCashier").value = r.cashier || "";
    document.getElementById("admRecCustomer").value = r.customer || "";
    document.getElementById("admRecTotal").value = r.total || "";
    document.getElementById("admRecNote").value = r.note || "";
}

function collectAdminData() {
    // 1. General
    appData.settings.armyLeaveDate = document.getElementById("admLeaveDate").value;
    const startInput = document.getElementById("admArmyStartDate");
    if (startInput) appData.settings.armyStartDate = startInput.value || "2026-10-15T00:00:00";
    appData.settings.leaveCountdownMessage = document.getElementById("admLeaveMsg").value;
    appData.settings.yaraName = document.getElementById("admYaraName").value;
    appData.settings.nicknames = document.getElementById("admNicknames").value;
    appData.settings.partnerName = document.getElementById("admPartnerName").value || "زيزو";
    const rankSelect = document.getElementById("admMilitaryRank");
    if (rankSelect) {
        appData.settings.militaryRank = rankSelect.value;
    }
    appData.settings.adminPin = document.getElementById("admPinCode").value || "1234";

    // 2. Voice Notes
    const voiceCards = document.querySelectorAll("#admVoiceList > .admin-item-box");
    voiceCards.forEach((card, index) => {
        if (appData.voiceNotes && appData.voiceNotes[index]) {
            appData.voiceNotes[index].title = card.querySelector(".vn-title-input").value;
            appData.voiceNotes[index].subtitle = card.querySelector(".vn-sub-input").value;
            const urlVal = card.querySelector(".vn-url-input").value.trim();
            if (urlVal && (!appData.voiceNotes[index].audioSrc || !appData.voiceNotes[index].audioSrc.startsWith("data:"))) {
                appData.voiceNotes[index].audioSrc = urlVal;
            }
        }
    });

    // 3. Timeline
    const tlCards = document.querySelectorAll("#admTimelineList > .admin-item-box");
    tlCards.forEach((card, index) => {
        if (appData.timeline[index]) {
            appData.timeline[index].date = card.querySelector(".tl-date-input").value;
            appData.timeline[index].title = card.querySelector(".tl-title-input").value;
            appData.timeline[index].icon = card.querySelector(".tl-icon-input").value;
            appData.timeline[index].story = card.querySelector(".tl-story-input").value;
        }
    });

    // 4. Letters
    const letterCards = document.querySelectorAll("#admLettersList > .admin-item-box");
    letterCards.forEach((card, index) => {
        if (appData.lockedLetters[index]) {
            appData.lockedLetters[index].title = card.querySelector(".letter-title-input").value;
            appData.lockedLetters[index].unlockDate = card.querySelector(".letter-date-input").value;
            appData.lockedLetters[index].preview = card.querySelector(".letter-preview-input").value;
            appData.lockedLetters[index].content = card.querySelector(".letter-content-input").value;
        }
    });

    // 5. Pharmacy
    const pharmacyCards = document.querySelectorAll("#admPharmacyList > .admin-item-box");
    pharmacyCards.forEach((card, index) => {
        if (appData.emergencyCards[index]) {
            appData.emergencyCards[index].title = card.querySelector(".pharmacy-title-input").value;
            appData.emergencyCards[index].desc = card.querySelector(".pharmacy-desc-input").value;
            appData.emergencyCards[index].badge = card.querySelector(".pharmacy-badge-input").value;
            appData.emergencyCards[index].content = card.querySelector(".pharmacy-content-input").value;
        }
    });

    // 6. Shake
    const shakeInputs = document.querySelectorAll(".shake-msg-input");
    appData.shakeMessages = Array.from(shakeInputs).map(inp => inp.value.trim()).filter(Boolean);

    // 7. Study
    const studyInputs = document.querySelectorAll(".study-quote-input");
    appData.thanaweya.studyQuotes = Array.from(studyInputs).map(inp => inp.value.trim()).filter(Boolean);

    // 8. Receipt
    appData.receipt.cashier = document.getElementById("admRecCashier").value;
    appData.receipt.customer = document.getElementById("admRecCustomer").value;
    appData.receipt.total = document.getElementById("admRecTotal").value;
    appData.receipt.note = document.getElementById("admRecNote").value;

    // 9. GitHub Sync Config
    const ghOwner = document.getElementById("admGhOwner");
    const ghRepo = document.getElementById("admGhRepo");
    const ghBranch = document.getElementById("admGhBranch");
    const ghToken = document.getElementById("admGhToken");
    const ghAutoSync = document.getElementById("admGhAutoSync");
    if (ghOwner && ghRepo) {
        const cfg = getGitHubConfig();
        if (ghOwner.value.trim()) cfg.owner = ghOwner.value.trim();
        if (ghRepo.value.trim()) cfg.repo = ghRepo.value.trim();
        if (ghBranch && ghBranch.value.trim()) cfg.branch = ghBranch.value.trim();
        if (ghToken) cfg.token = ghToken.value.trim();
        if (ghAutoSync) cfg.autoSync = ghAutoSync.checked;
        saveGitHubConfig(cfg);
    }
}

// ==========================================
// 15. GITHUB AUTO-SYNC & DATA.JSON ENGINE
// ==========================================

function getGitHubConfig() {
    let cfg = {
        owner: "zezo1895",
        repo: "lala",
        branch: "main",
        token: "",
        autoSync: true,
        lastSync: null
    };

    try {
        const stored = localStorage.getItem("yara_gh_config");
        if (stored) {
            cfg = Object.assign(cfg, JSON.parse(stored));
        }
    } catch (e) {
        console.error("Error reading GH config:", e);
    }

    // Auto-detect from GitHub Pages hostname & pathname if not explicitly filled
    if ((!cfg.owner || !cfg.repo) && window.location.hostname.includes("github.io")) {
        const parts = window.location.pathname.split("/").filter(Boolean);
        if (!cfg.owner) cfg.owner = window.location.hostname.split(".")[0];
        if (!cfg.repo && parts.length > 0) cfg.repo = parts[0];
    }

    return cfg;
}

function saveGitHubConfig(cfg) {
    try {
        localStorage.setItem("yara_gh_config", JSON.stringify(cfg));
    } catch (e) {
        console.error("Error saving GH config:", e);
    }
}

function utf8ToBase64(str) {
    return window.btoa(unescape(encodeURIComponent(str)));
}

function base64ToUtf8(b64) {
    return decodeURIComponent(escape(window.atob(b64)));
}

function populateAdminGitHub() {
    const cfg = getGitHubConfig();
    const ownerInp = document.getElementById("admGhOwner");
    const repoInp = document.getElementById("admGhRepo");
    const branchInp = document.getElementById("admGhBranch");
    const tokenInp = document.getElementById("admGhToken");
    const autoSyncInp = document.getElementById("admGhAutoSync");
    const statusBox = document.getElementById("admGhStatusBox");
    const statusText = document.getElementById("admGhStatusText");

    if (ownerInp) ownerInp.value = cfg.owner || "";
    if (repoInp) repoInp.value = cfg.repo || "";
    if (branchInp) branchInp.value = cfg.branch || "main";
    if (tokenInp) tokenInp.value = cfg.token || "";
    if (autoSyncInp) autoSyncInp.checked = !!cfg.autoSync;

    if (statusBox && statusText) {
        if (cfg.lastSync) {
            statusBox.style.background = "#dafbe1";
            statusBox.style.borderColor = "#4ac26b";
            statusBox.style.color = "#1a7f37";
            const dateStr = new Date(cfg.lastSync).toLocaleString('ar-EG');
            statusText.innerHTML = `✅ <strong>تم الربط بنجاح!</strong><br><span style="font-size: 10px;">آخر مزامنة مع GitHub كانت: ${dateStr}</span>`;
        } else if (cfg.owner && cfg.repo && cfg.token) {
            statusBox.style.background = "#ddf4ff";
            statusBox.style.borderColor = "#54aeff";
            statusBox.style.color = "#0969da";
            statusText.innerHTML = `⚡ <strong>جاهز للمزامنة:</strong> مستودع (${cfg.owner}/${cfg.repo}) جاهز للحفظ المباشر.`;
        } else {
            statusBox.style.background = "#f6f8fa";
            statusBox.style.borderColor = "#d0d7de";
            statusBox.style.color = "#57606a";
            statusText.innerHTML = `حالة الربط: بانتظار إدخال اسم المستخدم والمستودع والتوكن.`;
        }
    }
}

// Fetch Remote Data on startup or manual refresh
async function fetchRemoteGitHubData(manual = false) {
    const cfg = getGitHubConfig();
    let owner = cfg.owner;
    let repo = cfg.repo;
    let branch = cfg.branch || "main";

    if ((!owner || !repo) && window.location.hostname.includes("github.io")) {
        owner = window.location.hostname.split(".")[0];
        const parts = window.location.pathname.split("/").filter(Boolean);
        if (parts.length > 0) repo = parts[0];
    }

    const candidateUrls = [];
    // 1. Raw GitHub (Instant, bypasses static deploy cache)
    if (owner && repo) {
        candidateUrls.push(`https://raw.githubusercontent.com/${owner}/${repo}/${branch}/data.json?_t=${Date.now()}`);
    }
    // 2. Relative file
    candidateUrls.push(`./data.json?_t=${Date.now()}`);

    for (const url of candidateUrls) {
        try {
            const res = await fetch(url, { cache: "no-store" });
            if (res.ok) {
                const remote = await res.json();
                if (remote && remote.settings) {
                    const localTime = appData && appData.updatedAt ? new Date(appData.updatedAt).getTime() : 0;
                    const remoteTime = remote.updatedAt ? new Date(remote.updatedAt).getTime() : 1;

                    if (remoteTime >= localTime || manual) {
                        const localStr = JSON.stringify(appData);
                        const remoteStr = JSON.stringify(remote);
                        if (localStr !== remoteStr || manual) {
                            appData = remote;
                            localStorage.setItem("yara_army_app_data", JSON.stringify(appData));
                            refreshAllUI();
                            if (manual) {
                                showToast("✅ تم سحب أحدث نسخة بنجاح من GitHub! ❤️");
                            } else {
                                showToast("✨ تم استلام أحدث الرسايل والتحديثات من زيزو! ❤️");
                            }
                        }
                    }
                    return true;
                }
            }
        } catch (e) {
            // Silently fall back to next candidate URL
        }
    }

    if (manual) {
        showToast("⚠️ لم يتم العثور على تحديثات جديدة على GitHub.");
    }
    return false;
}

// Synchronize Current Data to GitHub data.json via REST API
async function syncDataToGitHub(interactive = true) {
    const cfg = getGitHubConfig();
    const statusBox = document.getElementById("admGhStatusBox");
    const statusText = document.getElementById("admGhStatusText");

    const owner = (document.getElementById("admGhOwner")?.value || cfg.owner || "").trim();
    const repo = (document.getElementById("admGhRepo")?.value || cfg.repo || "").trim();
    const branch = (document.getElementById("admGhBranch")?.value || cfg.branch || "main").trim();
    const token = (document.getElementById("admGhToken")?.value || cfg.token || "").trim();
    const autoSync = !!document.getElementById("admGhAutoSync")?.checked;

    cfg.owner = owner;
    cfg.repo = repo;
    cfg.branch = branch;
    cfg.token = token;
    cfg.autoSync = autoSync;
    saveGitHubConfig(cfg);

    if (!owner || !repo || !token) {
        if (statusBox && statusText) {
            statusBox.style.background = "#fff8c5";
            statusBox.style.borderColor = "#d4a72c";
            statusBox.style.color = "#6e5400";
            statusText.innerHTML = "⚠️ برجاء ملء اسم المستخدم والمستودع والتوكن في تبويب (🐙 ربط GitHub) لإتمام المزامنة.";
        }
        const ghTabBtn = document.querySelector('[data-admin-tab="adm-github"]');
        if (ghTabBtn) ghTabBtn.click();
        showToast("⚠️ برجاء كتابة بيانات GitHub والتوكن أولاً!");
        return false;
    }

    if (statusBox && statusText) {
        statusBox.style.background = "#ddf4ff";
        statusBox.style.borderColor = "#54aeff";
        statusBox.style.color = "#0969da";
        statusText.innerHTML = "⏳ جاري الاتصال بـ GitHub وفحص ملف data.json...";
    }
    if (interactive) showToast("⏳ جاري المزامنة مع GitHub...");

    // Update timestamp
    appData.updatedAt = new Date().toISOString();
    saveData(false);

    try {
        const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/data.json`;
        const headers = {
            "Accept": "application/vnd.github.v3+json",
            "Authorization": `Bearer ${token}`
        };

        // 1. Fetch current file sha if it exists
        let sha = null;
        try {
            const checkRes = await fetch(`${apiUrl}?ref=${branch}`, { headers, cache: "no-store" });
            if (checkRes.status === 200) {
                const existingData = await checkRes.json();
                sha = existingData.sha;
            } else if (checkRes.status === 401) {
                throw new Error("التوكن غير صحيح أو منتهي الصلاحية (Bad credentials). برجاء التأكد من التوكن.");
            } else if (checkRes.status === 404) {
                sha = null; // New file will be created
            }
        } catch (checkErr) {
            if (checkErr.message.includes("التوكن")) throw checkErr;
            console.warn("Could not retrieve SHA, attempting commit anyway:", checkErr);
        }

        // 2. Prepare PUT payload
        const jsonContent = JSON.stringify(appData, null, 2);
        const b64Content = utf8ToBase64(jsonContent);

        const rankTitle = getPartnerDisplayTitle();
        const payload = {
            message: `💖 تحديث بيانات ورسائل ${rankTitle} ويارا - ${new Date().toLocaleString('ar-EG')}`,
            content: b64Content,
            branch: branch
        };
        if (sha) payload.sha = sha;

        const putRes = await fetch(apiUrl, {
            method: "PUT",
            headers: {
                ...headers,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });

        if (!putRes.ok) {
            const errData = await putRes.json().catch(() => ({}));
            let msg = errData.message || `رمز الخطأ ${putRes.status}`;
            if (putRes.status === 401) msg = "التوكن غير صحيح أو انتهت صلاحيته.";
            if (putRes.status === 404) msg = `المستودع (${owner}/${repo}) غير موجود أو التوكن لا يمتلك صلاحية الوصول له.`;
            throw new Error(msg);
        }

        const commitData = await putRes.json();
        cfg.lastSync = new Date().toISOString();
        saveGitHubConfig(cfg);

        if (statusBox && statusText) {
            statusBox.style.background = "#dafbe1";
            statusBox.style.borderColor = "#4ac26b";
            statusBox.style.color = "#1a7f37";
            const timeStr = new Date().toLocaleTimeString('ar-EG');
            statusText.innerHTML = `✅ <strong>تم التحديث بنجاح على GitHub!</strong><br>
            <span style="font-size: 10px;">التوقيت: ${timeStr} | ملف data.json تم تحديثه أونلاين.</span>`;
        }

        if (window.confetti) {
            try { window.confetti({ particleCount: 35, spread: 60, origin: { y: 0.7 } }); } catch (e) {}
        }

        showToast("🚀 تم تحديث data.json على GitHub بنجاح! يارا هتشوف التعديلات أوتوماتيك ❤️");
        return true;
    } catch (err) {
        console.error("GitHub Sync error:", err);
        if (statusBox && statusText) {
            statusBox.style.background = "#ffebe9";
            statusBox.style.borderColor = "#ff8182";
            statusBox.style.color = "#cf222e";
            statusText.innerHTML = `❌ <strong>فشلت المزامنة:</strong> ${err.message}`;
        }
        showToast("❌ خطأ في المزامنة: " + err.message);
        return false;
    }
}
