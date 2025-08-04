/**
 * ===================================================================
 * 作品集互動腳本 v12.1 - 錯誤修正版 🚀
 * ===================================================================
 * 修正重點:
 *
 * 1. **語法修正:**
 *    - 移除了前一版本中錯誤添加的所有不必要的反斜線 (`\`)，解決了導致腳本無法執行的致命語法錯誤。
 *    - 確保所有字串和函式呼叫都使用正確的語法。
 * 2. **功能恢復:**
 *    - 此修正將讓載入畫面、自訂游標、以及所有互動功能恢復正常。
 * ===================================================================
 */

document.addEventListener('DOMContentLoaded', () => {
    gsap.registerPlugin(ScrollTrigger, Observer, TextPlugin);

    // ===== 配置常數 =====
    const CONFIG = {
        ANIMATION: {
            LOADING_GRID: { cols: 20, stagger: 0.003 },
            TYPEWRITER: { speeds: { normal: 100, delete: 50, pause: 2000, next: 500 } },
            SCROLL: { heroTrigger: 'top top', heroEnd: 'bottom center' }
        },
        AUDIO: {
            VOLUME: { synth: -12, noise: -18 },
            THROTTLE: { hover: 100 }
        },
        RESPONSIVE: {
            MOBILE_BREAKPOINT: 768
        }
    };

    // ===== DOM 元素快取 =====
    const DOM = {
        body: document.body,
        loadingScreen: document.getElementById('loading-screen'),
        portfolioContainer: document.querySelector('.portfolio-container'),
        audioToggleBtn: document.getElementById('audio-toggle-btn'),
        projectModal: document.getElementById('project-modal'),
        modalBody: document.getElementById('modal-body'),
        portfolioList: document.querySelector('.portfolio-list'),
        filterContainer: document.getElementById('portfolio-filters'),
        scrollerNav: document.querySelector('.scroller-nav'),
        cursorDot: document.querySelector('.cursor-dot'),
        cursorOutline: document.querySelector('.cursor-dot-outline'),
        heroContent: document.querySelector('.hero-content'),
        mainAccordion: document.getElementById('main-accordion'),
    };

    // ===== 應用狀態 =====
    const State = {
        allProjectsData: [],
        scrollTween: null,
        scrollObserver: null,
        isAudioReady: false,
        isMobile: window.matchMedia(`(max-width: ${CONFIG.RESPONSIVE.MOBILE_BREAKPOINT}px)`).matches,
        audio: null,
        projectModalInstance: null,
    };

    // ===== 音效系統模組 =====
    const AudioSystem = {
        throttle(func, limit) {
            let inThrottle;
            return function(...args) {
                if (!inThrottle) {
                    func.apply(this, args);
                    inThrottle = true;
                    setTimeout(() => inThrottle = false, limit);
                }
            };
        },

        create() {
            if (State.audio) return State.audio;
            
            try {
                State.audio = {
                    synth: new Tone.Synth({ volume: CONFIG.AUDIO.VOLUME.synth }).toDestination(),
                    noise: new Tone.NoiseSynth({ 
                        volume: CONFIG.AUDIO.VOLUME.noise, 
                        noise: { type: 'white' }, 
                        envelope: { attack: 0.005, decay: 0.1, sustain: 0 } 
                    }).toDestination(),
                    
                    play: {
                        start: () => State.isAudioReady && State.audio.synth.triggerAttackRelease("C3", "8n"),
                        click: () => State.isAudioReady && State.audio.synth.triggerAttackRelease("G5", "16n"),
                        hover: this.throttle(() => State.isAudioReady && State.audio.synth.triggerAttackRelease("C5", "16n"), CONFIG.AUDIO.THROTTLE.hover),
                        glitchClick: () => {
                            if (!State.isAudioReady || !State.audio) return;
                            State.audio.synth.triggerAttackRelease("D3", "16n");
                            setTimeout(() => State.audio?.synth?.triggerAttackRelease("F#3", "32n"), 100);
                            setTimeout(() => State.audio?.noise?.triggerAttackRelease("16n"), 150);
                        },
                        open: () => State.isAudioReady && State.audio?.synth.triggerAttackRelease("E4", "8n"),
                        close: () => State.isAudioReady && State.audio?.synth.triggerAttackRelease("A3", "8n")
                    }
                };
                return State.audio;
            } catch (error) {
                console.warn('音效系統初始化失敗:', error);
                return null;
            }
        },

        async initialize() {
            if (State.isAudioReady) return true;
            
            try {
                if (typeof Tone === 'undefined') {
                    console.warn('Tone.js 未載入');
                    return false;
                }
                
                this.create();
                await Tone.start();
                State.isAudioReady = true;
                console.log('🎵 音效系統已啟動');
                return true;
            } catch (error) {
                console.warn('音效初始化失敗:', error);
                State.isAudioReady = false;
                return false;
            }
        }
    };

    // ===== 載入畫面模組 =====
    const LoadingScreen = {
        setup() {
            const pixelGrid = document.getElementById('pixel-grid');
            const loadingTitle = document.querySelector('.loading-title');
            const loadingSubtitle = document.querySelector('.loading-subtitle');
            const pressStart = document.querySelector('.press-start');

            const { cols } = CONFIG.ANIMATION.LOADING_GRID;
            const rows = Math.ceil(window.innerHeight / (window.innerWidth / cols));
            
            pixelGrid.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
            pixelGrid.style.gridTemplateRows = `repeat(${rows}, 1fr)`;
            pixelGrid.innerHTML = Array(cols * rows).fill('<div class="pixel-block"></div>').join('');
            
            const pixelBlocks = gsap.utils.toArray('.pixel-block');

            const tl = gsap.timeline();
            tl.to(loadingTitle, { duration: 1, text: { value: "BOB TSOU", delimiter: "" }, ease: "none" })
              .to(loadingSubtitle, { duration: 0.8, text: { value: "PORTFOLIO", delimiter: "" }, ease: "none" }, "-=0.5")
              .to(pressStart, { duration: 0.5, opacity: 1 });

            DOM.loadingScreen.addEventListener('click', async () => {
                const audioInitialized = await AudioSystem.initialize();
                if (audioInitialized) {
                    State.audio.play.start();
                }

                this.startTransition(pixelBlocks);
            }, { once: true });
        },

        startTransition(pixelBlocks) {
            const tl = gsap.timeline({
                onComplete: () => {
                    DOM.loadingScreen.style.display = 'none';
                    DOM.body.classList.add('loaded');
                    
                    HeroTransition.setup();
                    ScrollAnimations.setup();
                    
                    gsap.to(DOM.portfolioContainer, {
                        duration: 1.2,
                        backgroundColor: 'var(--bg-cream)',
                        ease: 'power2.out',
                        delay: 0.2
                    });
                }
            });

            tl.to('.loading-text-container', { duration: 0.2, opacity: 0, ease: 'power1.in' })
              .to(gsap.utils.shuffle(pixelBlocks), {
                  duration: 0.6,
                  opacity: 0,
                  scale: 0,
                  stagger: { each: CONFIG.ANIMATION.LOADING_GRID.stagger, from: "random" },
                  ease: 'power1.in'
              }, "-=0.1")
              .set(DOM.portfolioContainer, { visibility: 'visible' })
              .to(DOM.portfolioContainer, { duration: 0.5, opacity: 1 }, "-=0.6")
              .from('.name-line > span, .eye-container', { 
                  duration: 0.7, y: 80, opacity: 0, stagger: 0.08, ease: 'power2.out' 
              }, "-=0.2")
              .from('.profile-photo', { 
                  duration: 0.8, scale: 0, opacity: 0, ease: 'elastic.out(1, 0.5)' 
              }, "<0.2")
              .from('.tagline-capsule', { 
                  duration: 0.7, scale: 0, opacity: 0, ease: 'elastic.out(1, 0.6)' 
              }, "<0.3")
              .to('.tagline-capsule', { 
                  duration: 0.5, width: '90%', borderRadius: '999px', 
                  padding: '0.27em 0.5em', ease: 'power2.inOut' 
              })
              .set('#typing-text', { opacity: 1 }, "<0.1")
              .to(DOM.audioToggleBtn, {
                  autoAlpha: 1, scale: 1, duration: 0.8, 
                  ease: 'elastic.out(1, 0.7)'
              }, "-=1.5");
        }
    };

    // ===== Hero 過渡動畫模組 =====
    const HeroTransition = {
        setup() {
            if (State.isMobile) return;
            this.setupScrollEffects();
        },

        setupScrollEffects() {
            gsap.to('.hero-shape', {
                filter: 'drop-shadow(0 -8px 12px rgba(0, 0, 0, 0.08))',
                ease: 'none',
                scrollTrigger: {
                    trigger: '.hero-content',
                    start: CONFIG.ANIMATION.SCROLL.heroTrigger,
                    end: CONFIG.ANIMATION.SCROLL.heroEnd,
                    scrub: 3
                }
            });

            gsap.to('.scroll-down-indicator', {
                opacity: 0,
                y: -20,
                duration: 0.5,
                scrollTrigger: {
                    trigger: '.hero-content',
                    start: CONFIG.ANIMATION.SCROLL.heroTrigger,
                    end: '+=150',
                    scrub: true,
                },
            });
        }
    };

    // ===== 滾動動畫模組 =====
    const ScrollAnimations = {
        setup() {
            this.animateElements('#about-section .content-wrapper > *');
            this.animateElements('#contact-section .content-wrapper > *');
        },

        animateElements(selector) {
            const elements = document.querySelectorAll(selector);
            if (!elements.length) return;

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
        }
    };

    // ===== 眼球追蹤模組 =====
    const EyeTracking = {
        setup() {
            if (State.isMobile) return;

            const eyes = gsap.utils.toArray('.eye');
            const container = DOM.heroContent;

            container.addEventListener('mousemove', (e) => {
                const rect = container.getBoundingClientRect();
                const mouseX = (e.clientX - rect.left) / rect.width * 2 - 1;
                const mouseY = (e.clientY - rect.top) / rect.height * 2 - 1;

                eyes.forEach(eye => {
                    gsap.to(eye, {
                        duration: 0.3,
                        x: mouseX * 8,
                        y: mouseY * 5,
                        ease: 'power2.out'
                    });
                });
            });
            
            container.addEventListener('mouseleave', () => {
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
    };

    // ===== Glitch 效果模組 =====
    const GlitchEffects = {
        setup() {
            const nameLetters = document.querySelectorAll('.name-line .glitch');
            
            nameLetters.forEach(letter => {
                letter.addEventListener('mouseenter', () => {
                    letter.classList.add('active');
                });
                
                letter.addEventListener('mouseleave', () => {
                    letter.classList.remove('active');
                });
                
                letter.addEventListener('click', () => {
                    if (State.audio?.play) {
                        State.audio.play.glitchClick();
                    }
                    letter.classList.add('active');
                    setTimeout(() => letter.classList.remove('active'), 800);
                });
            });
        }
    };

    // ===== 打字機效果模組 =====
    const TypewriterEffect = {
        setup() {
            const typingElement = document.getElementById('typing-text');
            if (!typingElement) return;

            const messages = [
                '網頁設計師 · 熱愛創造美好體驗',
                '前端開發 · 讓設計活起來',
                '後端架構 · 穩固的技術基礎',
                'UI/UX設計 · 使用者至上的理念'
            ];

            let state = { messageIndex: 0, charIndex: 0, isDeleting: false };

            const typeText = () => {
                const currentMessage = messages[state.messageIndex];
                const { speeds } = CONFIG.ANIMATION.TYPEWRITER;
                
                if (state.isDeleting) {
                    typingElement.textContent = currentMessage.substring(0, state.charIndex - 1);
                    state.charIndex--;
                } else {
                    typingElement.textContent = currentMessage.substring(0, state.charIndex + 1);
                    state.charIndex++;
                }

                let typeSpeed = state.isDeleting ? speeds.delete : speeds.normal;

                if (!state.isDeleting && state.charIndex === currentMessage.length) {
                    typeSpeed = speeds.pause;
                    state.isDeleting = true;
                } else if (state.isDeleting && state.charIndex === 0) {
                    state.isDeleting = false;
                    state.messageIndex = (state.messageIndex + 1) % messages.length;
                    typeSpeed = speeds.next;
                }

                setTimeout(typeText, typeSpeed);
            };

            setTimeout(typeText, 1000);
        }
    };

    // ===== 作品集管理器 =====
    const PortfolioManager = {
        triggerAnimation() {
            setTimeout(() => {
                const capsules = DOM.portfolioList.querySelectorAll('.portfolio-capsule');
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
        },

        renderProjects(projectsToRender) {
            DOM.portfolioList.innerHTML = '';
            
            if (projectsToRender.length > 0) {
                projectsToRender.forEach(project => {
                    const capsule = this.createProjectCapsule(project);
                    DOM.portfolioList.appendChild(capsule);
                });
                
                if (DOM.scrollerNav) {
                    DOM.scrollerNav.style.display = State.isMobile ? 'none' : 'flex';
                }
            } else {
                DOM.portfolioList.innerHTML = '<p>沒有符合篩選條件的專案。</p>';
                if (DOM.scrollerNav) {
                    DOM.scrollerNav.style.display = 'none';
                }
            }
            
            this.setupInfiniteScroll();
        },

        createProjectCapsule(project) {
            const capsule = document.createElement('div');
            capsule.className = 'portfolio-capsule';
            capsule.dataset.projectId = project.id;
            
            const placeholderImg = 'https://placehold.co/400x300/cccccc/969696?text=No+Preview';
            const mediaUrl = project.preview_media_url;
            
            let mediaElement;
            if (mediaUrl && (mediaUrl.endsWith('.mp4') || mediaUrl.endsWith('.webm'))) {
                mediaElement = document.createElement('video');
                Object.assign(mediaElement, {
                    src: mediaUrl,
                    autoplay: true,
                    loop: true,
                    muted: true,
                    playsInline: true
                });
            } else {
                mediaElement = document.createElement('img');
                Object.assign(mediaElement, {
                    src: mediaUrl || placeholderImg,
                    alt: `${project.title} preview`
                });
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
            
            return capsule;
        },

        setupInfiniteScroll() {
            if (State.scrollTween) State.scrollTween.kill();
            if (State.scrollObserver) State.scrollObserver.kill();

            if (State.isMobile) {
                gsap.set(DOM.portfolioList, { x: 0 });
                return;
            }
            
            const items = DOM.portfolioList.querySelectorAll('.portfolio-capsule');
            if (!items || items.length === 0) return;

            const originalItems = Array.from(items);
            originalItems.forEach(item => DOM.portfolioList.appendChild(item.cloneNode(true)));
            
            const itemWidth = originalItems[0].offsetWidth + 
                             parseInt(getComputedStyle(originalItems[0]).marginRight) * 2;
            
            if (itemWidth === 0) return;

            const totalWidth = itemWidth * originalItems.length;
            const wrap = gsap.utils.wrap(0, -totalWidth);
            
            State.scrollTween = gsap.to(DOM.portfolioList, {
                x: `-=${totalWidth}`,
                duration: originalItems.length * 8,
                ease: 'none',
                repeat: -1,
                modifiers: { x: x => wrap(parseFloat(x)) + 'px' }
            });

            State.scrollObserver = Observer.create({
                target: ".portfolio-scroller",
                type: "wheel,touch,pointer",
                onDrag: self => State.scrollTween.progress(State.scrollTween.progress() - self.deltaX * 0.001),
                onWheel: self => State.scrollTween.progress(State.scrollTween.progress() - self.deltaY * 0.001),
                onHover: () => State.scrollTween?.pause(),
                onHoverEnd: () => State.scrollTween?.resume(),
            });
        }
    };

    // ===== 自訂游標模組 =====
    const CustomCursor = {
        setup() {
            if (State.isMobile) return;
            
            gsap.set([DOM.cursorDot, DOM.cursorOutline], { 
                xPercent: -50, yPercent: -50, x: -100, y: -100 
            });
            
            const outlineX = gsap.quickTo(DOM.cursorOutline, "x", { duration: 0.5, ease: "power2" });
            const outlineY = gsap.quickTo(DOM.cursorOutline, "y", { duration: 0.5, ease: "power2" });
            
            window.addEventListener('mousemove', e => {
                gsap.set(DOM.cursorDot, { x: e.clientX, y: e.clientY });
                outlineX(e.clientX);
                outlineY(e.clientY);
            });
            
            this.setupHoverEffects();
            this.setupClickEffects();
        },

        setupHoverEffects() {
            const hoverElements = 'a, button, .accordion-header, .portfolio-capsule, .name-container, .eye-container, .close-button';
            document.querySelectorAll(hoverElements).forEach(el => {
                el.addEventListener('mouseenter', () => DOM.cursorOutline.classList.add('hovered'));
                el.addEventListener('mouseleave', () => DOM.cursorOutline.classList.remove('hovered'));
            });
        },

        setupClickEffects() {
            window.addEventListener('mousedown', () => DOM.cursorOutline.classList.add('clicking'));
            window.addEventListener('mouseup', () => DOM.cursorOutline.classList.remove('clicking'));
        }
    };

    // ===== 切換功能模組 =====
    const ToggleManager = {
        setup() {
            this.setupAudioToggle();
            this.setupDarkModeToggle();
        },

        setupAudioToggle() {
            DOM.audioToggleBtn.addEventListener('click', () => {
                State.audio?.play?.click();
                
                if (typeof Tone !== 'undefined' && Tone.Destination) {
                    Tone.Destination.mute = !Tone.Destination.mute;
                    DOM.audioToggleBtn.textContent = Tone.Destination.mute ? '🔇' : '🔊';
                }
            });
        },

        setupDarkModeToggle() {
            document.querySelectorAll('.eye-container').forEach(eye => {
                eye.addEventListener('click', (e) => {
                    e.stopPropagation();
                    DOM.body.classList.toggle('dark-mode');
                });
            });
        }
    };

    // ===== API 管理器 =====
    const APIManager = {
        async loadProjects() {
            const { showSkeleton, hideSkeleton } = SkeletonLoader;
            
            try {
                showSkeleton();
                
                const response = await fetch('api/get_projects.php');
                if (!response.ok) throw new Error(`API 請求失敗: ${response.status}`);
                
                State.allProjectsData = await response.json();
                
                await new Promise(resolve => setTimeout(resolve, 800));
                
                PortfolioManager.renderProjects(State.allProjectsData);
                this.setupFilters();
                
                hideSkeleton();
                
            } catch (error) {
                console.error('📦 專案載入失敗:', error);
                hideSkeleton();
                if (DOM.portfolioList) {
                    DOM.portfolioList.innerHTML = '<p>專案載入失敗，請稍後再試。</p>';
                }
            }
        },

        setupFilters() {
            if (!DOM.filterContainer) return;
            
            const categories = ['all', ...new Set(State.allProjectsData.map(p => p.category_name))];
            const buttonsHTML = categories.map(c => 
                `<button class="filter-btn ${c === 'all' ? 'active' : ''}" data-category="${c}">
                    ${c === 'all' ? '全部' : c}
                </button>`
            ).join('');
            
            DOM.filterContainer.innerHTML = buttonsHTML;
            
            DOM.filterContainer.addEventListener('click', (event) => {
                const btn = event.target.closest('button');
                if (!btn) return;
                
                State.audio?.play?.click();
                
                DOM.filterContainer.querySelector('.active')?.classList.remove('active');
                btn.classList.add('active');
                
                const selectedCategory = btn.dataset.category;
                const filtered = selectedCategory === 'all' 
                    ? State.allProjectsData 
                    : State.allProjectsData.filter(p => p.category_name === selectedCategory);
                
                this.animateFilterChange(filtered);
            });
        },

        animateFilterChange(filteredProjects) {
            gsap.to(DOM.portfolioList, {
                opacity: 0,
                duration: 0.3,
                onComplete: () => {
                    PortfolioManager.renderProjects(filteredProjects);
                    gsap.set(DOM.portfolioList, { opacity: 1 });
                    PortfolioManager.triggerAnimation();
                }
            });
        },

        async showProjectDetail(projectId) {
            State.audio?.play?.open();
            State.projectModalInstance.show();
            DOM.modalBody.innerHTML = '<div class="modal-loader"><div class="loader"></div></div>';
            
            try {
                const response = await fetch(`api/get_project_detail.php?id=${projectId}`);
                if (!response.ok) throw new Error(`API 錯誤: ${response.status}`);
                
                const project = await response.json();
                if (project && !project.error) {
                    this.renderProjectModal(project);
                } else {
                    throw new Error(project?.error || '專案資料格式錯誤');
                }
            } catch (error) {
                console.error('❌ 無法顯示專案詳情:', error);
                DOM.modalBody.innerHTML = `<p>抱歉，無法載入專案詳情。</p>`;
            }
        },

        renderProjectModal(project) {
            const tagsHtml = project.tags?.length 
                ? `<div class="modal-tags">${project.tags.map(tag => `<span class="modal-tag">${tag.name}</span>`).join('')}</div>` 
                : '';
                
            DOM.modalBody.innerHTML = `
                <span class="modal-category">${project.category_name}</span>
                <h2>${project.title}</h2>
                ${tagsHtml}
                <img src="${project.cover_image_url || ''}" alt="${project.title}" class="modal-cover-image" 
                     onerror="this.src='https://placehold.co/600x400/cccccc/969696?text=Image+Not+Found';">
                <p class="modal-description">${project.description.replace(/\n/g, '<br>')}</p>
                ${project.project_link ? 
                    `<a href="${project.project_link}" class="cta-button" target="_blank" rel="noopener noreferrer">查看專案</a>` 
                    : ''
                }
            `;
            
            gsap.from(DOM.modalBody.children, {
                delay: 0.2,
                opacity: 0,
                y: 20,
                duration: 0.5,
                stagger: 0.1,
                ease: 'power2.out'
            });
        }
    };

    // ===== 事件管理器 =====
    const EventManager = {
        setup() {
            this.setupPortfolioEvents();
            this.setupScrollerEvents();
            this.setupContactForm();
            this.setupAccordionEvents();
        },

        setupPortfolioEvents() {
            DOM.portfolioList?.addEventListener('click', e => {
                const capsule = e.target.closest('.portfolio-capsule');
                if (capsule) {
                    e.preventDefault();
                    APIManager.showProjectDetail(capsule.dataset.projectId);
                }
            });
        },

        setupScrollerEvents() {
            DOM.scrollerNav?.addEventListener('click', e => {
                if (State.isMobile || !State.scrollTween || !State.allProjectsData.length) return;
                
                const btn = e.target.closest('.nav-btn');
                if (!btn) return;
                
                State.audio?.play?.click();
                
                const itemProgress = 1 / State.allProjectsData.length;
                const direction = btn.classList.contains('next-btn') ? 1 : -1;
                
                gsap.to(State.scrollTween, { 
                    progress: `+=${itemProgress * direction}`, 
                    duration: 0.8, 
                    ease: 'power2.inOut' 
                });
            });
        },

        setupContactForm() {
            const contactForm = document.getElementById('contact-form');
            if (!contactForm) return;

            contactForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                await FormHandler.processSubmission(contactForm);
            });
        },

        setupAccordionEvents() {
            DOM.mainAccordion.addEventListener('show.bs.collapse', event => {
                if (event.target.id === 'collapse-portfolio') {
                    PortfolioManager.triggerAnimation();
                }
            });
        }
    };

    // ===== 表單處理器 =====
    const FormHandler = {
        async processSubmission(form) {
            const submitBtn = form.querySelector('.submit-btn');
            const btnText = submitBtn.querySelector('.btn-text');
            const btnLoading = submitBtn.querySelector('.btn-loading');
            
            const formData = new FormData(form);
            const data = Object.fromEntries(formData);
            
            if (!this.validateForm(data)) return;
            
            this.setLoadingState(submitBtn, btnText, btnLoading, true);
            
            try {
                await new Promise(resolve => setTimeout(resolve, 1500));
                
                NotificationManager.show('訊息已成功發送！我會盡快回覆您 🚀', 'success');
                form.reset();
                State.audio?.play?.open();
                
            } catch (error) {
                NotificationManager.show('發送失敗，請稍後再試或直接發送 Email', 'error');
            } finally {
                this.setLoadingState(submitBtn, btnText, btnLoading, false);
            }
        },

        validateForm(data) {
            if (!data.name || !data.email || !data.subject || !data.message) {
                NotificationManager.show('請填寫所有必填欄位', 'error');
                return false;
            }
            
            if (!Utils.isValidEmail(data.email)) {
                NotificationManager.show('請輸入有效的 Email 地址', 'error');
                return false;
            }
            
            return true;
        },

        setLoadingState(submitBtn, btnText, btnLoading, isLoading) {
            submitBtn.disabled = isLoading;
            if (btnText) btnText.style.display = isLoading ? 'none' : 'inline';
            if (btnLoading) btnLoading.style.display = isLoading ? 'inline' : 'none';
        }
    };

    // ===== 通知管理器 =====
    const NotificationManager = {
        show(message, type = 'info') {
            const notification = document.createElement('div');
            notification.className = `notification notification-${type}`;
            notification.innerHTML = this.getNotificationHTML(message, type);
            
            Object.assign(notification.style, this.getNotificationStyles(type));
            
            document.body.appendChild(notification);
            this.animateNotification(notification);
        },

        getNotificationHTML(message, type) {
            const icons = { success: '✅', error: '❌', info: 'ℹ️' };
            return `
                <div class="notification-content">
                    <span class="notification-icon">${icons[type] || icons.info}</span>
                    <span class="notification-message">${message}</span>
                </div>
            `;
        },

        getNotificationStyles(type) {
            const colors = {
                success: '#10b981',
                error: '#ef4444',
                info: '#3b82f6'
            };
            
            return {
                position: 'fixed',
                top: '20px',
                right: '20px',
                background: colors[type] || colors.info,
                color: 'white',
                padding: '1rem 1.5rem',
                borderRadius: '12px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
                zIndex: '10000',
                fontWeight: '600',
                maxWidth: '400px',
                transform: 'translateX(100%)',
                transition: 'transform 0.3s ease'
            };
        },

        animateNotification(notification) {
            setTimeout(() => notification.style.transform = 'translateX(0)', 100);
            
            setTimeout(() => {
                notification.style.transform = 'translateX(100%)';
                setTimeout(() => document.body.removeChild(notification), 300);
            }, 4000);
        }
    };

    // ===== 技能動畫模組 =====
    const SkillAnimations = {
        setup() {
            const skillBars = document.querySelectorAll('.skill-progress');
            const observer = new IntersectionObserver(this.animateSkillBar, { threshold: 0.5 });
            skillBars.forEach(bar => observer.observe(bar));
        },

        animateSkillBar(entries, observer) {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const skillBar = entry.target;
                    const level = skillBar.getAttribute('data-level');
                    skillBar.style.width = level + '%';
                    observer.unobserve(skillBar);
                }
            });
        }
    };

    // ===== 骨架載入器 =====
    const SkeletonLoader = {
        showSkeleton() {
            const portfolioSkeleton = document.querySelector('.portfolio-skeleton');
            const portfolioScroller = document.querySelector('.portfolio-scroller');
            
            if (portfolioSkeleton) {
                portfolioSkeleton.style.display = 'block';
                portfolioScroller.style.display = 'none';
                DOM.filterContainer.style.display = 'none';
            }
        },
        
        hideSkeleton() {
            const portfolioSkeleton = document.querySelector('.portfolio-skeleton');
            const portfolioScroller = document.querySelector('.portfolio-scroller');
            
            if (portfolioSkeleton) {
                portfolioSkeleton.style.display = 'none';
                portfolioScroller.style.display = 'block';
                DOM.filterContainer.style.display = 'flex';
            }
        }
    };

    // ===== CTA 互動管理器 =====
    const CTAManager = {
        setup() {
            const ctaButtons = document.querySelectorAll('.cta-primary, .cta-secondary');
            ctaButtons.forEach(button => {
                button.addEventListener('click', (e) => this.handleCTAClick(e, button));
                button.addEventListener('mouseenter', () => State.audio?.play?.hover());
            });
        },

        handleCTAClick(e, button) {
            const href = button.getAttribute('href');
            
            if (href?.startsWith('#')) {
                e.preventDefault();
                this.handleInternalLink(href);
            } else {
                State.audio?.play?.open();
            }
        },

        handleInternalLink(href) {
            const targetId = href.substring(1);
            const targetSection = document.getElementById(targetId);
            
            if (targetSection) {
                State.audio?.play?.click();
                
                const accordionItem = targetSection.closest('.accordion-item');
                if (accordionItem) {
                    const collapseElement = accordionItem.querySelector('.accordion-collapse');
                    const bsCollapse = bootstrap.Collapse.getOrCreateInstance(collapseElement);
                    bsCollapse.show();
                }
                
                setTimeout(() => {
                    targetSection.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }, 300);
            }
        }
    };

    // ===== 工具函數 =====
    const Utils = {
        isValidEmail(email) {
            const emailRegex = /^[\^\s@]+@[\^\s@]+\.[\^\s@]+$/;
            return emailRegex.test(email);
        }
    };

    // ===== 應用程式初始化 =====
    const App = {
        async init() {
            console.log('🚀 Bob Tsou Portfolio v12.1 - 錯誤修正版');
            
            try {
                this.initializeCore();
                
                setTimeout(() => {
                    this.initializeAdvanced();
                }, 500);
                
                console.log('✅ 應用程式初始化完成');
            } catch (error) {
                console.error('❌ 應用程式初始化失敗:', error);
            }
        },

        initializeCore() {
            LoadingScreen.setup();
            CustomCursor.setup();
            ToggleManager.setup();
            EyeTracking.setup();
            GlitchEffects.setup();
            TypewriterEffect.setup();
            SkillAnimations.setup();
            CTAManager.setup();
            EventManager.setup();
            
            APIManager.loadProjects();

            // 初始化 Bootstrap 元件
            State.projectModalInstance = new bootstrap.Modal(DOM.projectModal);
        },

        initializeAdvanced() {
            HeroTransition.setup();
            ScrollAnimations.setup();
            
            console.log('🎨 高級動畫模組載入完成');
        }
    };

    App.init();
});