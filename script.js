/**
 * ===================================================================
 * 作品集互動腳本 v10.0 - 最終完美版 (大師級拋光)
 * ===================================================================
 * 本次更新重點:
 *
 * 1.  **眼球追蹤功能完美回歸 (核心功能):**
 * -   新增 `setupEyeTracking` 函式，恢復並優化了您最初的眼球追蹤
 * 功能，讓網站更具生命力。
 *
 * 2.  **全新 Hero 過渡動畫 (視覺升級):**
 * -   `setupHeroTransition` 函式現在使用 GSAP 直接對 SVG 的 `d` 路徑
 * 進行動畫，創造出流暢、自然的布料/波浪拉扯效果，並徹底解決了
 * SVG 頂部橫線 Bug。
 *
 * 3.  **新增滾動觸發動畫 & 提示:**
 * -   新增 `setupScrollAnimations` 函式，為 About 和 Contact 區塊內的
 * 元素加入滾動觸發的進場動畫，增加頁面活力。
 * -   新增「向下滾動」提示動畫，並在使用者滾動後自動淡出。
 *
 * 4.  **精緻的互動細節:**
 * -   **游標點擊回饋**: 新增了滑鼠按下時的游標狀態。
 * -   **Modal 動畫**: 為 Modal 彈窗內的元素新增了錯落的進場動畫。
 * -   **Loading 加速 & 轉場**: 加速了 Loading 動畫並新增金色轉場效果。
 *
 * 5.  **保留所有成功的邏輯與優化:**
 * -   此版本是您原始碼穩定性與所有優化功能的最終結合體。
 * ===================================================================
 */
document.addEventListener('DOMContentLoaded', () => {
    gsap.registerPlugin(ScrollTrigger, Observer, TextPlugin);

    // ---- DOM 元素選取 ----
    const body = document.querySelector('body');
    const loadingScreen = document.getElementById('loading-screen');
    const portfolioContainer = document.querySelector('.portfolio-container');
    const audioToggleBtn = document.getElementById('audio-toggle-btn');
    const projectModal = document.getElementById('project-modal');
    const modalBody = document.getElementById('modal-body');
    const closeButton = document.querySelector('.close-button');
    const portfolioList = document.querySelector('.portfolio-list');
    const filterContainer = document.getElementById('portfolio-filters');
    const scrollerNav = document.querySelector('.scroller-nav');
    const cursorDot = document.querySelector('.cursor-dot');
    const cursorOutline = document.querySelector('.cursor-dot-outline');
    const accordionHeaders = document.querySelectorAll('.accordion-header');
    const heroContent = document.querySelector('.hero-content');

    // ---- 狀態變數 ----
    let allProjectsData = [];
    let scrollTween;
    let scrollObserver;
    let isAudioReady = false;
    const isMobile = window.matchMedia("(max-width: 768px)").matches;

    // ---- 音效合成器 ----
    const audio = {
        synth: new Tone.Synth({ volume: -12 }).toDestination(),
        noise: new Tone.NoiseSynth({ volume: -18, noise: { type: 'white' }, envelope: { attack: 0.005, decay: 0.1, sustain: 0 } }).toDestination(),
        playStart: () => isAudioReady && audio.synth.triggerAttackRelease("C3", "8n"),
        playClick: () => isAudioReady && audio.synth.triggerAttackRelease("G5", "16n"),
        playHover: throttle(() => isAudioReady && audio.synth.triggerAttackRelease("C5", "16n"), 100),
        playOpen: () => isAudioReady && audio.synth.triggerAttackRelease("E4", "8n"),
        playClose: () => isAudioReady && audio.synth.triggerAttackRelease("A3", "8n"),
    };

    // 音效初始化
    async function initializeAudio() {
        if (isAudioReady) return;
        try {
            await Tone.start();
            isAudioReady = true;
        } catch (e) {
            isAudioReady = false;
        }
    }

    // 節流函式
    function throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        }
    }

    // ===============================================
    // ==== 1. 載入與開場動畫 (加速並增加轉場色) ====
    // ===============================================
    function setupLoadingScreen() {
        const pixelGrid = document.getElementById('pixel-grid');
        const loadingTitle = document.querySelector('.loading-title');
        const loadingSubtitle = document.querySelector('.loading-subtitle');
        const pressStart = document.querySelector('.press-start');

        const cols = 20;
        const rows = Math.ceil(window.innerHeight / (window.innerWidth / cols));
        pixelGrid.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
        pixelGrid.style.gridTemplateRows = `repeat(${rows}, 1fr)`;
        pixelGrid.innerHTML = Array(cols * rows).fill('<div class="pixel-block"></div>').join('');
        const pixelBlocks = gsap.utils.toArray('.pixel-block');

        gsap.timeline()
            .to(loadingTitle, { duration: 1, text: { value: "BOB TSOU", delimiter: "" }, ease: "none" })
            .to(loadingSubtitle, { duration: 0.8, text: { value: "PORTFOLIO", delimiter: "" }, ease: "none" }, "-=0.5")
            .to(pressStart, { duration: 0.5, opacity: 1 });

        loadingScreen.addEventListener('click', async () => {
            await initializeAudio();
            audio.playStart();

            const tl = gsap.timeline({
                onComplete: () => {
                    loadingScreen.style.display = 'none';
                    body.classList.add('loaded');
                    initializeOpenAccordion();
                    setupHeroTransition();
                    setupScrollAnimations();
                    gsap.to('.portfolio-container', {
                        duration: 1.2,
                        backgroundColor: 'var(--bg-cream)',
                        ease: 'power2.out',
                        delay: 0.2
                    });
                }
            });

            tl.to('.loading-text-container', {
                duration: 0.2,
                opacity: 0,
                ease: 'power1.in'
            })
            .to(gsap.utils.shuffle(pixelBlocks), {
                duration: 0.6,
                opacity: 0,
                scale: 0,
                stagger: { each: 0.003, from: "random" },
                ease: 'power1.in'
            }, "-=0.1")
            .set(portfolioContainer, { visibility: 'visible' })
            .to(portfolioContainer, { duration: 0.5, opacity: 1 }, "-=0.6")
            .from('.name-line > span, .eye-container', { duration: 0.7, y: 80, opacity: 0, stagger: 0.08, ease: 'power2.out' }, "-=0.2")
            .from('.profile-photo', { duration: 0.8, scale: 0, opacity: 0, ease: 'elastic.out(1, 0.5)' }, "<0.2")
            .from('.tagline-capsule', { duration: 0.7, scale: 0, opacity: 0, ease: 'elastic.out(1, 0.6)' }, "<0.3")
            .to('.tagline-capsule', { duration: 0.5, width: '90%', borderRadius: '999px', padding: '0.27em 0.5em', ease: 'power2.inOut' })
            .to('.tagline-capsule p', { duration: 0.4, opacity: 1 }, "<0.1")
            .to(audioToggleBtn, {
                autoAlpha: 1,
                scale: 1,
                duration: 0.8,
                ease: 'elastic.out(1, 0.7)'
            }, "-=1.5");

        }, { once: true });
    }
    
    // ===============================================
    // ==== 2. Hero 過渡 & 滾動動畫 (最終優化) ====
    // ===============================================
    function setupHeroTransition() {
        const wave = document.querySelector("#wave-path");
        if (!wave || isMobile) return;
        
        const startPath = "M0,64 C300,64 400,32 600,32 C800,32 900,64 1200,64 L1200,150 L0,150 Z";
        const endPath =   "M0,64 C300,128 400,32 600,32 C800,32 900,128 1200,64 L1200,150 L0,150 Z";
        
        gsap.set(wave, { attr: { d: startPath } });

        ScrollTrigger.create({
            trigger: ".hero-content",
            start: "top top",
            end: "bottom top",
            scrub: true,
            onUpdate: self => {
                const morph = gsap.utils.interpolate(startPath, endPath);
                wave.setAttribute("d", morph(self.progress));
            }
        });
        
        gsap.to('.hero-content::after', {
            backgroundPosition: '50% 100%',
            ease: 'none',
            scrollTrigger: {
                trigger: '.hero-content',
                start: 'top top',
                end: 'bottom top',
                scrub: true
            }
        });

        gsap.to('.scroll-down-indicator', {
            opacity: 0,
            scrollTrigger: {
                trigger: '.hero-content',
                start: 'top top',
                end: '+=100',
                scrub: true,
            },
        });
    }

    function setupScrollAnimations() {
        const animateIn = (elements) => {
            gsap.from(elements, {
                scrollTrigger: {
                    trigger: elements,
                    start: 'top 85%',
                    toggleActions: 'play none none none',
                },
                opacity: 0,
                y: 25,
                stagger: 0.1,
                duration: 0.6,
                ease: 'power2.out'
            });
        };
        
        animateIn(document.querySelectorAll('#about-section .content-wrapper > *'));
        animateIn(document.querySelectorAll('#contact-section .content-wrapper > *'));
    }
    
    // ===============================================
    // ==== 3. 眼球追蹤功能 (回歸) ====
    // ===============================================
    function setupEyeTracking() {
        if (isMobile) return;

        const eyes = gsap.utils.toArray('.eye');

        heroContent.addEventListener('mousemove', (e) => {
            const heroRect = heroContent.getBoundingClientRect();
            const mouseX = (e.clientX - heroRect.left) / heroRect.width * 2 - 1;
            const mouseY = (e.clientY - heroRect.top) / heroRect.height * 2 - 1;

            eyes.forEach(eye => {
                gsap.to(eye, {
                    duration: 0.3,
                    x: mouseX * 8,
                    y: mouseY * 5,
                    ease: 'power2.out'
                });
            });
        });
        
        heroContent.addEventListener('mouseleave', () => {
             eyes.forEach(eye => {
                gsap.to(eye, {
                    duration: 0.5,
                    x: 0,
                    y: 0,
                    ease: 'elastic.out(1, 0.5)'
                });
            });
        });
    }


    // ===============================================
    // ==== 4. 手風琴區塊 (還原核心邏輯) ====
    // ===============================================
    function initializeOpenAccordion() {
        const openItem = document.querySelector('.accordion-item.is-open');
        if (openItem) {
            const content = openItem.querySelector('.accordion-content');
            if (content) {
                setTimeout(() => {
                     gsap.set(content, { maxHeight: content.scrollHeight + 'px' });
                }, 100);
            }
        }
    }
    
    accordionHeaders.forEach(header => {
        const title = header.querySelector('h3');
        
        if (title) {
            title.dataset.text = title.textContent;
            header.addEventListener('mouseenter', () => {
                audio.playHover();
                title.classList.add('glitch');
            });
            header.addEventListener('mouseleave', () => {
                 title.classList.remove('glitch');
            });
        }
        
        header.addEventListener('click', () => {
            audio.playClick();
            const item = header.parentElement;
            const content = item.querySelector('.accordion-content');
            const wasOpen = item.classList.contains('is-open');

            document.querySelectorAll('.accordion-item.is-open').forEach(openItem => {
                if (openItem !== item) {
                    openItem.classList.remove('is-open');
                    gsap.to(openItem.querySelector('.accordion-content'), { maxHeight: 0, duration: 0.5, ease: 'power2.inOut' });
                }
            });
            
            item.classList.toggle('is-open');

            if (item.classList.contains('is-open')) {
                gsap.to(content, { maxHeight: content.scrollHeight + 'px', duration: 0.7, ease: 'power3.out' });

                if (item.id === 'portfolio-section' && !wasOpen) {
                   triggerPortfolioAnimation();
                }
            } else {
                 gsap.to(content, { maxHeight: 0, duration: 0.5, ease: 'power2.inOut' });
            }
            
            setTimeout(() => ScrollTrigger.refresh(), 500);
        });
    });

    // ===============================================
    // ==== 5. 作品集渲染與動畫 (邏輯修正) ====
    // ===============================================
    
    function triggerPortfolioAnimation() {
         setTimeout(() => {
            const capsules = portfolioList.querySelectorAll('.portfolio-capsule');
            if (capsules.length > 0) {
                 gsap.fromTo(capsules,
                    { opacity: 0, y: 30 },
                    {
                        opacity: 1,
                        y: 0,
                        duration: 0.5,
                        stagger: 0.08,
                        ease: 'power2.out',
                    }
                );
            }
        }, 50);
    }

    function renderProjects(projectsToRender) {
        portfolioList.innerHTML = '';
        if (projectsToRender.length > 0) {
            projectsToRender.forEach(project => {
                const capsule = document.createElement('div');
                capsule.className = 'portfolio-capsule';
                capsule.dataset.projectId = project.id;
                const placeholderImg = 'https://placehold.co/400x300/cccccc/969696?text=No+Preview';
                let mediaElement;
                const mediaUrl = project.preview_media_url;
                if (mediaUrl && (mediaUrl.endsWith('.mp4') || mediaUrl.endsWith('.webm'))) {
                    mediaElement = document.createElement('video');
                    mediaElement.src = mediaUrl;
                    mediaElement.autoplay = true;
                    mediaElement.loop = true;
                    mediaElement.muted = true;
                    mediaElement.playsInline = true;
                } else {
                    mediaElement = document.createElement('img');
                    mediaElement.src = mediaUrl || placeholderImg;
                    mediaElement.alt = `${project.title} preview`;
                }
                mediaElement.onerror = function() {
                    this.onerror = null;
                    this.replaceWith(Object.assign(document.createElement('img'), {
                        src: placeholderImg,
                        alt: `${project.title} preview`,
                        className: 'capsule-media'
                    }));
                };
                mediaElement.className = 'capsule-media';
                const overlay = `<div class="capsule-overlay"><h4 class="capsule-title">${project.title}</h4></div>`;
                capsule.appendChild(mediaElement);
                capsule.innerHTML += overlay;
                portfolioList.appendChild(capsule);
            });
            scrollerNav.style.display = isMobile ? 'none' : 'flex';
        } else {
            portfolioList.innerHTML = '<p>沒有符合篩選條件的專案。</p>';
            scrollerNav.style.display = 'none';
        }
        setupInfiniteScroll();
    }
    
    function setupInfiniteScroll() {
        if (scrollTween) scrollTween.kill();
        if (scrollObserver) scrollObserver.kill();

        if (isMobile) {
            gsap.set(portfolioList, { x: 0 });
            return;
        }
        
        const items = portfolioList.querySelectorAll('.portfolio-capsule');
        if (!items || items.length === 0) return;

        const originalItems = Array.from(items);
        originalItems.forEach(item => portfolioList.appendChild(item.cloneNode(true)));
        
        const itemWidth = originalItems[0].offsetWidth + parseInt(getComputedStyle(originalItems[0]).marginRight) * 2;
        if (itemWidth === 0) return;

        const totalWidth = itemWidth * originalItems.length;
        const wrap = gsap.utils.wrap(0, -totalWidth);
        
        scrollTween = gsap.to(portfolioList, {
            x: `-=${totalWidth}`,
            duration: originalItems.length * 8,
            ease: 'none',
            repeat: -1,
            modifiers: { x: x => wrap(parseFloat(x)) + 'px' }
        });

        scrollObserver = Observer.create({
            target: ".portfolio-scroller",
            type: "wheel,touch,pointer",
            onDrag: self => scrollTween.progress(scrollTween.progress() - self.deltaX * 0.001),
            onWheel: self => scrollTween.progress(scrollTween.progress() - self.deltaY * 0.001),
            onHover: () => scrollTween?.pause(),
            onHoverEnd: () => scrollTween?.resume(),
        });
    }

    // ===============================================
    // ==== (其餘函式與之前版本相同) ====
    // ===============================================

    function setupCustomCursor() {
        if (isMobile) return;
        gsap.set([cursorDot, cursorOutline], { xPercent: -50, yPercent: -50, x: -100, y: -100 });
        const outlineX = gsap.quickTo(cursorOutline, "x", { duration: 0.5, ease: "power2" });
        const outlineY = gsap.quickTo(cursorOutline, "y", { duration: 0.5, ease: "power2" });
        window.addEventListener('mousemove', e => {
            gsap.set(cursorDot, { x: e.clientX, y: e.clientY });
            outlineX(e.clientX);
            outlineY(e.clientY);
        });
        document.querySelectorAll('a, button, .accordion-header, .portfolio-capsule, .name-container, .eye-container, .close-button').forEach(el => {
            el.addEventListener('mouseenter', () => cursorOutline.classList.add('hovered'));
            el.addEventListener('mouseleave', () => cursorOutline.classList.remove('hovered'));
        });
        window.addEventListener('mousedown', () => cursorOutline.classList.add('clicking'));
        window.addEventListener('mouseup', () => cursorOutline.classList.remove('clicking'));
    }

    function setupToggles() {
        audioToggleBtn.addEventListener('click', () => {
            audio.playClick();
            Tone.Destination.mute = !Tone.Destination.mute;
            audioToggleBtn.textContent = Tone.Destination.mute ? '🔇' : '🔊';
        });
        document.querySelectorAll('.eye-container').forEach(eye => {
            eye.addEventListener('click', (e) => {
                e.stopPropagation();
                body.classList.toggle('dark-mode');
            });
        });
    }

    async function loadProjectsAndSetupFilters() {
        try {
            const response = await fetch('api/get_projects.php');
            if (!response.ok) throw new Error(`API 請求失敗`);
            allProjectsData = await response.json();
            renderProjects(allProjectsData);
            
            if (filterContainer) {
                const categories = ['all', ...new Set(allProjectsData.map(p => p.category_name))];
                filterContainer.innerHTML = categories.map(c => `<button class="filter-btn ${c === 'all' ? 'active' : ''}" data-category="${c}">${c === 'all' ? '全部' : c}</button>`).join('');
                
                filterContainer.addEventListener('click', (event) => {
                    const btn = event.target.closest('button');
                    if (!btn) return;
                    audio.playClick();
                    filterContainer.querySelector('.active')?.classList.remove('active');
                    btn.classList.add('active');
                    const selectedCategory = btn.dataset.category;
                    const filtered = selectedCategory === 'all' ? allProjectsData : allProjectsData.filter(p => p.category_name === selectedCategory);
                    
                    gsap.to(portfolioList, {
                        opacity: 0,
                        duration: 0.3,
                        onComplete: () => {
                            renderProjects(filtered);
                            gsap.set(portfolioList, { opacity: 1 });
                            triggerPortfolioAnimation();
                        }
                    });
                });
            }
        } catch (error) {
            console.error('專案載入失敗:', error);
            if (portfolioList) portfolioList.innerHTML = '<p>專案載入失敗，請稍後再試。</p>';
        }
    }

    async function showProjectDetail(projectId) {
        audio.playOpen();
        projectModal.classList.add('is-open');
        modalBody.innerHTML = '<div class="modal-loader"><div class="loader"></div></div>';
        try {
            const response = await fetch(`api/get_project_detail.php?id=${projectId}`);
            if (!response.ok) throw new Error(`API 錯誤`);
            const project = await response.json();
            if (project && !project.error) {
                const tagsHtml = project.tags?.length ? `<div class="modal-tags">${project.tags.map(tag => `<span class="modal-tag">${tag.name}</span>`).join('')}</div>` : '';
                modalBody.innerHTML = `
                    <span class="modal-category">${project.category_name}</span>
                    <h2>${project.title}</h2>
                    ${tagsHtml}
                    <img src="${project.cover_image_url || ''}" alt="${project.title}" class="modal-cover-image" onerror="this.src='https://placehold.co/600x400/cccccc/969696?text=Image+Not+Found';">
                    <p class="modal-description">${project.description.replace(/\n/g, '<br>')}</p>
                    ${project.project_link ? `<a href="${project.project_link}" class="cta-button" target="_blank" rel="noopener noreferrer">查看專案</a>` : ''}
                `;
                gsap.from(modalBody.children, {
                    delay: 0.2,
                    opacity: 0,
                    y: 20,
                    duration: 0.5,
                    stagger: 0.1,
                    ease: 'power2.out'
                });

            } else {
                throw new Error(project?.error || '專案資料格式錯誤');
            }
        } catch (error) {
            console.error('無法顯示專案詳情:', error);
            modalBody.innerHTML = `<p>抱歉，無法載入專案詳情。</p>`;
        }
    }

    function closeModal() {
        if (!projectModal.classList.contains('is-open')) return;
        audio.playClose();
        projectModal.classList.remove('is-open');
    }

    function setupEventListeners() {
        portfolioList?.addEventListener('click', e => {
            const capsule = e.target.closest('.portfolio-capsule');
            if (capsule) {
                e.preventDefault();
                showProjectDetail(capsule.dataset.projectId);
            }
        });
        closeButton?.addEventListener('click', closeModal);
        window.addEventListener('click', e => (e.target === projectModal) && closeModal());
        document.addEventListener('keydown', e => (e.key === "Escape") && closeModal());
        scrollerNav?.addEventListener('click', e => {
            if (isMobile || !scrollTween || !allProjectsData.length) return;
            const btn = e.target.closest('.nav-btn');
            if (!btn) return;
            audio.playClick();
            const itemProgress = 1 / (allProjectsData.length);
            const direction = btn.classList.contains('next-btn') ? 1 : -1;
            gsap.to(scrollTween, { progress: `+=${itemProgress * direction}`, duration: 0.8, ease: 'power2.inOut' });
        });
    }

    // ===============================================
    // ==== 11. 初始化執行 ====
    // ===============================================
    setupLoadingScreen();
    setupCustomCursor();
    setupToggles();
    setupEyeTracking();
    loadProjectsAndSetupFilters();
    setupEventListeners();
});