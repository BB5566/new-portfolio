/**
 * ===================================================================
 * 作品集互動腳本 v3.9 - Modal 動畫優化
 * ===================================================================
 * 本次更新根據您的需求，為 Modal 彈窗增加了更流暢的進出場動畫。
 *
 * 1.  **Modal 開啟動畫 (核心):**
 * -   當點擊一個作品時，Modal 背景會先淡入，接著內容框會以「放大且淡入」的效果出現，創造出優雅的層次感。
 *
 * 2.  **Modal 關閉動畫 (核心):**
 * -   當點擊關閉按鈕或背景時，內容框會先「縮小且淡出」，然後背景才會淡出，完成離場動畫，避免畫面突兀地消失。
 *
 * 3.  **動畫實現方式:**
 * -   動畫主要由 CSS 的 transition 和 transform 屬性控制。
 * -   JavaScript 的職責是透過新增/移除一個 'is-open' class 來觸發這些預先定義好的 CSS 動畫，讓程式碼結構更清晰。
 *
 * ===================================================================
 */
document.addEventListener('DOMContentLoaded', () => {
    gsap.registerPlugin(ScrollTrigger, Observer);

    // ---- DOM 元素選取 ----
    const body = document.querySelector('body');
    const loadingScreen = document.getElementById('loading-screen');
    const pixelGrid = document.getElementById('pixel-grid');
    const portfolioContainer = document.querySelector('.portfolio-container');
    const audioToggleBtn = document.getElementById('audio-toggle-btn');
    const heroContent = document.querySelector('.hero-content');
    const nameContainer = document.querySelector('.name-container');
    const nameLetters = gsap.utils.toArray('.name-line > span');
    const projectModal = document.getElementById('project-modal');
    const modalBody = document.getElementById('modal-body');
    const modalContent = document.querySelector('.modal-content');
    const closeButton = document.querySelector('.close-button');
    const portfolioList = document.querySelector('.portfolio-list');
    const filterContainer = document.getElementById('portfolio-filters');
    const scrollerNav = document.querySelector('.scroller-nav');
    const eyes = document.querySelectorAll('.eye');
    const eyeContainers = document.querySelectorAll('.eye-container');
    const accordionHeaders = document.querySelectorAll('.accordion-header');


    let allProjectsData = [];
    let scrollTween;
    let scrollObserver;
    let isAudioReady = false;
    let keyboardFocusIndex = 0;

    // ---- 音效合成器 (Tone.js) ----
    const audio = {
        synth: null,
        noise: null,
        playStart: () => isAudioReady && audio.synth && audio.synth.triggerAttackRelease("C3", "8n"),
        playHover: () => isAudioReady && audio.synth && audio.synth.triggerAttackRelease("C5", "16n"),
        playClick: () => isAudioReady && audio.synth && audio.synth.triggerAttackRelease("G5", "16n"),
        playOpen: () => isAudioReady && audio.synth && audio.synth.triggerAttackRelease("C4", "8n"),
        playClose: () => isAudioReady && audio.synth && audio.synth.triggerAttackRelease("A3", "8n"),
        playGlitch: () => isAudioReady && audio.noise && audio.noise.triggerAttackRelease("0.05")
    };
    
    async function initializeAudio() {
        if (isAudioReady) return;
        try {
            await Tone.start();
            const synthVolume = -12;
            const noiseVolume = -18;
            audio.synth = new Tone.Synth({ volume: synthVolume }).toDestination();
            audio.noise = new Tone.NoiseSynth({
                volume: noiseVolume,
                noise: { type: 'white' },
                envelope: { attack: 0.005, decay: 0.1, sustain: 0 }
            }).toDestination();
            isAudioReady = true;
            console.log('音效已成功初始化');
        } catch (e) {
            isAudioReady = false;
            console.error("音效初始化失敗:", e);
        }
    }
    
    function throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        }
    }

    // ===============================================
    // ==== 1. 載入與開場動畫 (像素化轉場) ====
    // ===============================================
    function setupLoadingScreen() {
        const cols = 10;
        const rows = Math.ceil(window.innerHeight / (window.innerWidth / cols));
        pixelGrid.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
        pixelGrid.style.gridTemplateRows = `repeat(${rows}, 1fr)`;

        for (let i = 0; i < cols * rows; i++) {
            const block = document.createElement('div');
            block.classList.add('pixel-block');
            pixelGrid.appendChild(block);
        }

        loadingScreen.addEventListener('click', async () => {
            await initializeAudio();
            audio.playStart();

            const tl = gsap.timeline({
                onComplete: () => {
                    loadingScreen.style.display = 'none';
                    body.classList.add('loaded');
                }
            });
            
            const pixelBlocks = gsap.utils.toArray(pixelGrid.children);

            tl.to('.loading-text-container', {
                duration: 0.3,
                opacity: 0,
                ease: 'power1.in'
            })
            .to(gsap.utils.shuffle(pixelBlocks), {
                duration: 0.8,
                opacity: 0,
                scale: 0,
                stagger: {
                    each: 0.01,
                    from: "random"
                },
                ease: 'power2.in'
            }, "-=0.2")
            .set(portfolioContainer, { visibility: 'visible' })
            .to(portfolioContainer, { duration: 0.5, opacity: 1 }, "-=0.8")
            .to(audioToggleBtn, {
                autoAlpha: 1,
                scale: 1,
                duration: 0.5,
                ease: 'back.out(1.7)'
            }, "-=0.5")
            .add(playHeroAnimations);

        }, { once: true });
    }

    function playHeroAnimations() {
        const heroTimeline = gsap.timeline({ defaults: { ease: 'power3.out' } });
        gsap.set('.tagline-capsule', { height: '50px', width: '50px' });
        heroTimeline
            .from('.name-line > span, .eye-container', { duration: 0.8, y: 100, opacity: 0, stagger: 0.1 })
            .from('.profile-photo', { duration: 1, scale: 0, opacity: 0, ease: 'elastic.out(1, 0.5)' }, "<0.2")
            .from('.tagline-capsule', { duration: 0.8, scale: 0, opacity: 0, ease: 'elastic.out(1, 0.6)' }, "<0.4")
            .to('.tagline-capsule', { duration: 0.5, width: '90%', borderRadius: '999px', padding: '0.27em 0.5em', ease: 'power2.inOut' })
            .to('.tagline-capsule p', { duration: 0.4, opacity: 1 }, "<0.1");
    }

    // ===============================================
    // ==== 2. 3D 懸浮與 Glitch 特效 ====
    // ===============================================
     function setupHeroEffects() {
        if (window.matchMedia("(max-width: 768px)").matches) return;

        let rotateX = 0, rotateY = 0;
        let targetRotateX = 0, targetRotateY = 0;
        const rotateSpeed = 0.1;

        window.addEventListener('mousemove', e => {
            const rect = heroContent.getBoundingClientRect();
             if (e.clientX > rect.left && e.clientX < rect.right && e.clientY > rect.top && e.clientY < rect.bottom) {
                const xPercent = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
                const yPercent = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
                targetRotateY = xPercent * 15;
                targetRotateX = -yPercent * 15;
            } else {
                targetRotateY = 0;
                targetRotateX = 0;
            }
        });

        const animate = () => {
            rotateY += (targetRotateY - rotateY) * rotateSpeed;
            rotateX += (targetRotateX - rotateX) * rotateSpeed;
            gsap.set(nameContainer, {
                rotationY: rotateY,
                rotationX: rotateX,
            });
            requestAnimationFrame(animate);
        };
        
        animate();

        nameContainer.addEventListener('mouseenter', () => {
            audio.playGlitch();
            nameLetters.forEach(el => el.classList.add('glitch'));
            eyeContainers.forEach(el => el.classList.add('is-glitching'));
        });
        nameContainer.addEventListener('mouseleave', () => {
            nameLetters.forEach(el => el.classList.remove('glitch'));
            eyeContainers.forEach(el => el.classList.remove('is-glitching'));
        });
    }

    // ===============================================
    // ==== 3. 音效開關 & 黑暗模式 ====
    // ===============================================
    function setupToggles() {
        audioToggleBtn.addEventListener('click', () => {
            Tone.Destination.mute = !Tone.Destination.mute;
            audioToggleBtn.textContent = Tone.Destination.mute ? '🔇' : '🔊';
            if(audio.synth) audio.synth.triggerAttackRelease("G4", "16n");
        });

        eyeContainers.forEach(eye => {
            eye.addEventListener('click', (e) => {
                e.stopPropagation();
                body.classList.toggle('dark-mode');
            });
        });
    }

    // ===============================================
    // ==== 4. 手風琴開合邏輯 ====
    // ===============================================
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
            const wasOpen = item.classList.contains('is-open');

            document.querySelectorAll('.accordion-item.is-open').forEach(openItem => {
                if (openItem !== item) {
                   openItem.classList.remove('is-open');
                }
            });
            
            item.classList.toggle('is-open');

            if (item.id === 'portfolio-section' && !wasOpen && item.classList.contains('is-open')) {
                setTimeout(() => {
                    const capsules = item.querySelectorAll('.portfolio-list .portfolio-capsule');
                    if (capsules.length) {
                         gsap.fromTo(capsules,
                            { opacity: 0, y: 30, scale: 0.95 },
                            {
                                opacity: 1,
                                y: 0,
                                scale: 1,
                                duration: 0.5,
                                stagger: 0.08,
                                ease: 'power2.out',
                                onComplete: () => {
                                    gsap.set(capsules, { clearProps: "all" });
                                }
                            }
                        );
                    }
                }, 50);
            }
            setTimeout(() => ScrollTrigger.refresh(), 500);
        });
    });

    // ===============================================
    // ==== 5. 無限輪播核心邏輯 ====
    // ===============================================
    function setupInfiniteScroll(items) {
        if (!items || !items.length) {
            portfolioList.innerHTML = '<p>沒有符合篩選條件的專案。</p>';
            scrollerNav.style.display = 'none';
            if (scrollTween) scrollTween.kill();
            if (scrollObserver) scrollObserver.kill();
            return;
        }

        if (scrollTween) scrollTween.kill();
        if (scrollObserver) scrollObserver.kill();

        portfolioList.innerHTML = '';
        const allItems = [...items, ...items.map(item => item.cloneNode(true))];
        allItems.forEach(item => {
            item.addEventListener('mouseenter', audio.playHover);
            portfolioList.appendChild(item);
        });
        
        updateKeyboardFocus();

        setTimeout(() => {
            if (items.length === 0) return;
            const itemWidth = items[0].offsetWidth + parseInt(getComputedStyle(items[0]).marginRight) * 2;
            const totalWidth = itemWidth * items.length;
            const wrap = gsap.utils.wrap(0, -totalWidth);
            
            gsap.set(portfolioList, { x: 0 });

            scrollTween = gsap.to(portfolioList, {
                x: `-=${totalWidth}`, duration: items.length * 8,
                ease: 'none', repeat: -1,
                paused: false,
                modifiers: { x: x => wrap(parseFloat(x)) + 'px' }
            });
            
            scrollObserver = Observer.create({
                target: ".portfolio-scroller", type: "wheel,touch,pointer", wheelSpeed: -1,
                onDragStart: () => scrollTween.pause(),
                onWheelStart: () => scrollTween.pause(),
                onDragEnd: () => scrollTween.resume(),
                onWheelEnd: () => scrollTween.resume(),
                onDrag: self => {
                    const currentProgress = scrollTween.progress();
                    scrollTween.progress(currentProgress - self.deltaX * 0.001);
                },
                onWheel: self => {
                    const currentProgress = scrollTween.progress();
                    scrollTween.progress(currentProgress - self.deltaY * 0.001);
                }
            });
        }, 100);
    }

    // ===============================================
    // ==== 6. 專案渲染與篩選 ====
    // ===============================================
    function renderProjects(projectsToRender) {
        if (!portfolioList) return;
        
        gsap.to(portfolioList, {
            opacity: 0,
            duration: 0.2,
            onComplete: () => {
                const originalItems = [];
                if (projectsToRender.length > 0) {
                    projectsToRender.forEach(project => {
                        const capsule = document.createElement('div');
                        capsule.className = 'portfolio-capsule';
                        capsule.dataset.projectId = project.id;
                        
                        let mediaElement;
                        const mediaUrl = project.preview_media_url;
                        const placeholderImg = 'https://placehold.co/400x300/cccccc/969696?text=No+Preview';

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
                            mediaElement.alt = project.title + " preview";
                        }

                        mediaElement.onerror = function() {
                            this.onerror = null;
                            if (this.tagName === 'IMG') this.src = placeholderImg;
                            else {
                                const img = document.createElement('img');
                                img.src = placeholderImg;
                                img.alt = project.title + " preview";
                                img.className = 'capsule-media';
                                this.replaceWith(img);
                            }
                        };
                        mediaElement.className = 'capsule-media';
                        
                        const overlay = document.createElement('div');
                        overlay.className = 'capsule-overlay';
                        const title = document.createElement('h4');
                        title.className = 'capsule-title';
                        title.textContent = project.title;
            
                        overlay.appendChild(title);
                        capsule.appendChild(mediaElement);
                        capsule.appendChild(overlay);
                        originalItems.push(capsule);
                    });
                    scrollerNav.style.display = 'flex';
                } else {
                    scrollerNav.style.display = 'none';
                }
                
                setupInfiniteScroll(originalItems);
                gsap.to(portfolioList, { opacity: 1, duration: 0.2 });
            }
        });
    }

    function setupFilters(projects) {
        if (!filterContainer) return;
        const allCategories = new Set(projects.map(p => p.category_name));
        let buttonsHtml = '<button class="filter-btn active" data-category="all">全部</button>';
        allCategories.forEach(c => buttonsHtml += `<button class="filter-btn" data-category="${c}">${c}</button>`);
        filterContainer.innerHTML = buttonsHtml;
        
        const filterButtons = gsap.utils.toArray('.filter-btn');
        filterButtons.forEach(btn => {
            btn.addEventListener('mouseenter', audio.playHover);
        });

        filterContainer.addEventListener('click', (event) => {
            if (event.target.tagName !== 'BUTTON') return;
            audio.playClick();
            filterContainer.querySelector('.active')?.classList.remove('active');
            event.target.classList.add('active');
            const selectedCategory = event.target.dataset.category;
            const filteredProjects = selectedCategory === 'all'
                ? allProjectsData
                : allProjectsData.filter(p => p.category_name === selectedCategory);
            renderProjects(filteredProjects);
        });
    }

    async function loadProjectsAndSetupFilters() {
        const API_URL = 'api/get_projects.php';
        try {
            const response = await fetch(API_URL);
            if (!response.ok) throw new Error(`API 錯誤`);
            allProjectsData = await response.json();
            renderProjects(allProjectsData);
            setupFilters(allProjectsData);
        } catch (error) {
            console.error('專案載入失敗:', error);
            if (portfolioList) portfolioList.innerHTML = '<p>專案載入失敗。</p>';
        }
    }

    // ===============================================
    // ==== 7. 彈窗 (Modal) 邏輯 (核心更新) ====
    // ===============================================
    async function showProjectDetail(projectId) {
        audio.playOpen();
        const API_URL = `api/get_project_detail.php?id=${projectId}`;
        if (!projectModal || !modalBody) return;
        
        // 先顯示 Loading 動畫，並觸發 Modal 開啟動畫
        modalBody.innerHTML = '<div class="modal-loader"><div class="loader"></div></div>';
        projectModal.classList.add('is-open');

        try {
            const response = await fetch(API_URL);
            if (!response.ok) throw new Error(`API 錯誤`);
            const project = await response.json();
            if (project && !project.error) {
                let tagsHtml = project.tags && project.tags.length ? `<div class="modal-tags">${project.tags.map(tag => `<span class="modal-tag">${tag.name}</span>`).join('')}</div>` : '';
                let galleryHtml = project.gallery && project.gallery.length ? `<div class="modal-gallery">${project.gallery.map(img => `
                    <div class="gallery-item">
                        <img src="${img.image_url}" alt="${img.caption || project.title}">
                        ${img.caption ? `<p class="caption">${img.caption}</p>` : ''}
                    </div>`).join('')}</div>` : '';
                
                modalBody.innerHTML = `
                    <span class="modal-category">${project.category_name}</span>
                    <h2>${project.title}</h2>
                    ${tagsHtml}
                    <img src="${project.cover_image_url || 'https://placehold.co/400x200/cccccc/969696?text=No+Image'}" alt="${project.title}" class="modal-cover-image">
                    <p class="modal-description">${project.description}</p>
                    ${galleryHtml}
                    ${project.project_link ? `<a href="${project.project_link}" class="cta-button" target="_blank" rel="noopener noreferrer">查看專案</a>` : ''}
                `;
            } else {
                throw new Error(project?.error || '專案資料格式錯誤');
            }
        } catch (error) {
            console.error('無法顯示專案詳情:', error);
            modalBody.innerHTML = `<p>找不到專案詳情。</p>`;
        }
    }
    
    function closeModal() {
        if (!projectModal.classList.contains('is-open')) return;
        audio.playClose();
        projectModal.classList.remove('is-open');
    }

    // ===============================================
    // ==== 8. 鍵盤導覽 ====
    // ===============================================
    function updateKeyboardFocus() {
        const capsules = portfolioList.querySelectorAll('.portfolio-capsule');
        capsules.forEach((cap, index) => {
            if (index < allProjectsData.length) {
                if (index === keyboardFocusIndex) {
                    cap.classList.add('keyboard-focus');
                } else {
                    cap.classList.remove('keyboard-focus');
                }
            }
        });
    }

    function setupKeyboardNavigation() {
        document.addEventListener('keydown', (e) => {
            const portfolioSection = document.getElementById('portfolio-section');
            if (!portfolioSection.classList.contains('is-open') || !allProjectsData.length) return;

            if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
                e.preventDefault();
                audio.playHover();
                const direction = e.key === 'ArrowRight' ? 1 : -1;
                keyboardFocusIndex = (keyboardFocusIndex + direction + allProjectsData.length) % allProjectsData.length;
                
                if (scrollTween) {
                    const itemProgress = 1 / allProjectsData.length;
                    const currentProgress = scrollTween.progress();
                    const targetProgress = itemProgress * keyboardFocusIndex;
                    
                    const diff = targetProgress - (currentProgress % 1);
                    let move = diff;
                    if (Math.abs(diff) > 0.5) {
                        move = (diff > 0) ? diff - 1 : diff + 1;
                    }
                    
                    gsap.to(scrollTween, {
                        progress: `+=${move}`,
                        duration: 0.5,
                        ease: 'power2.inOut'
                    });
                }
                updateKeyboardFocus();
            }

            if (e.key === 'Enter') {
                e.preventDefault();
                const focusedCapsule = portfolioList.querySelectorAll('.portfolio-capsule')[keyboardFocusIndex];
                if (focusedCapsule) {
                    showProjectDetail(focusedCapsule.dataset.projectId);
                }
            }
        });
    }

    // ===============================================
    // ==== 9. 事件監聽器設定 ====
    // ===============================================
    portfolioList?.addEventListener('click', (event) => {
        const capsule = event.target.closest('.portfolio-capsule');
        if (capsule) {
            event.preventDefault();
            showProjectDetail(capsule.dataset.projectId);
        }
    });
    closeButton?.addEventListener('click', closeModal);
    closeButton?.addEventListener('mouseenter', audio.playHover);
    window.addEventListener('click', (event) => (event.target === projectModal) && closeModal());
    document.addEventListener('keydown', (event) => (event.key === "Escape") && closeModal());

    scrollerNav?.addEventListener('click', (e) => {
        if (!scrollTween || !allProjectsData.length) return;
        const navButton = e.target.closest('.nav-btn');
        if (!navButton) return;
        
        audio.playClick();
        const itemProgress = 1 / allProjectsData.length;
        const direction = navButton.classList.contains('next-btn') ? 1 : -1;
        gsap.to(scrollTween, {
            progress: `+=${itemProgress * direction}`,
            duration: 0.8,
            ease: 'power2.inOut'
        });
    });
    scrollerNav?.querySelectorAll('.nav-btn').forEach(btn => btn.addEventListener('mouseenter', audio.playHover));


    const handleEyeMouseMove = (e) => {
        if (!eyes.length) return;
        const { clientX, clientY } = e;
        eyes.forEach(eye => {
            const { left, top, width, height } = eye.parentElement.getBoundingClientRect();
            const eyeCenterX = left + width / 2;
            const eyeCenterY = top + height / 2;
            const deltaX = clientX - eyeCenterX;
            const deltaY = clientY - eyeCenterY;
            const angle = Math.atan2(deltaY, deltaX);
            const maxMove = eye.parentElement.offsetWidth / 4;
            const moveX = Math.cos(angle) * maxMove;
            const moveY = Math.sin(angle) * maxMove;
            gsap.to(eye, { x: moveX, y: moveY, duration: 0.4, ease: 'power2.out' });
        });
    };
    window.addEventListener('mousemove', throttle(handleEyeMouseMove, 50));
    
    // ===============================================
    // ==== 10. 初始化執行 ====
    // ===============================================
    setupLoadingScreen();
    setupHeroEffects();
    setupToggles();
    loadProjectsAndSetupFilters();
    setupKeyboardNavigation();
});