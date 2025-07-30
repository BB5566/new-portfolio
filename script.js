// FILE: script.js
// --- FINAL ULTIMATE VERSION (v11): 最終膠囊動畫微調 ---
document.addEventListener('DOMContentLoaded', () => {
    gsap.registerPlugin(ScrollTrigger, Observer);

    // ---- DOM 元素選取 ----
    const body = document.querySelector('body');
    const nameContainer = document.querySelector('.name-container');
    const projectModal = document.getElementById('project-modal');
    const modalBody = document.getElementById('modal-body');
    const modalContent = document.querySelector('.modal-content');
    const closeButton = document.querySelector('.close-button');
    const portfolioList = document.querySelector('.portfolio-list');
    const filterContainer = document.getElementById('portfolio-filters');
    const scrollerNav = document.querySelector('.scroller-nav');
    const eyes = document.querySelectorAll('.eye');

    let allProjectsData = [];
    let scrollTween;
    let scrollObserver;

    // ===============================================
    // ==== 1. 開場動畫 (Hero Section) - 全新編排 ====
    // ===============================================
    const heroTimeline = gsap.timeline({ defaults: { ease: 'power3.out' } });

    // 設定膠囊的初始狀態（在動畫開始前）
    gsap.set('.tagline-capsule', {
        height: '50px', // 固定初始高度
        width: '50px'   // 初始寬度與高度相同，形成正圓
    });

    heroTimeline
        .from('.name-line > span, .eye-container', { 
            duration: 0.8,
            y: 100, 
            opacity: 0, 
            stagger: 0.1
        })
        .from('.profile-photo', {
            duration: 1,
            scale: 0,
            opacity: 0,
            ease: 'elastic.out(1, 0.5)'
        }, "<0.2")
        
        // **** NEW: 全新的膠囊動畫序列 ****
        // 階段一：膠囊像照片一樣，以一個點的形式Q彈放大進場
        .from('.tagline-capsule', {
            duration: 0.8, // 加快速度 (原為 1s)
            scale: 0,
            opacity: 0,
            ease: 'elastic.out(1, 0.6)'
        }, "<0.4")
        
        // 階段二：在保持高度不變的情況下，水平拉長
        .to('.tagline-capsule', {
            duration: 0.5, // 加快速度 (原為 0.8s)
            width: '90%',
            borderRadius: '999px',
            padding: '0.27em 0.5em',
            ease: 'power2.inOut'
        })
        // 階段三：文字在膠囊拉長時浮現
        .to('.tagline-capsule p', {
            duration: 0.4,
            opacity: 1
        }, "<0.1"); // 在拉長動畫開始後 0.1 秒時浮現


    // ===============================================
    // ==== 2. 全新字母 Hover 效果 ====
    // ===============================================
    function setupNameHoverEffects() {
        const letters = gsap.utils.toArray('.name-line > span, .name-line > .eye-container');
        letters.forEach(el => {
            el.addEventListener('mouseenter', () => {
                gsap.to(el, {
                    rotation: gsap.utils.random(-15, 15),
                    scale: 1.1,
                    color: '#4a47a3',
                    duration: 0.3,
                    ease: 'power2.out'
                });
            });
            el.addEventListener('mouseleave', () => {
                gsap.to(el, {
                    rotation: 0,
                    scale: 1,
                    color: '#2c2c2c',
                    duration: 0.6,
                    ease: 'elastic.out(1, 0.5)'
                });
            });
        });
    }
    setupNameHoverEffects();


    // ===============================================
    // ==== 3. 磁吸按鈕 & 互動效果 ====
    // ===============================================
    function setupMagneticEffect(elements) {
        elements.forEach(el => {
            el.addEventListener('mousemove', e => {
                const { clientX, clientY } = e;
                const { left, top, width, height } = el.getBoundingClientRect();
                const moveX = (clientX - (left + width / 2)) * 0.5;
                const moveY = (clientY - (top + height / 2)) * 0.5;
                gsap.to(el, { x: moveX, y: moveY, duration: 0.8, ease: "power3.out" });
            });
            el.addEventListener('mouseleave', () => {
                gsap.to(el, { x: 0, y: 0, duration: 1.2, ease: "elastic.out(1, 0.4)" });
            });
        });
    }
    const accordionIcons = gsap.utils.toArray('.accordion-icon');
    setupMagneticEffect(accordionIcons);
    
    // ===============================================
    // ==== 4. 手風琴開合邏輯 ====
    // ===============================================
    const accordionHeaders = document.querySelectorAll('.accordion-header');
    accordionHeaders.forEach(header => {
        header.addEventListener('click', () => {
            const item = header.parentElement;

            document.querySelectorAll('.accordion-item.is-open').forEach(openItem => {
                if (openItem !== item) {
                   openItem.classList.remove('is-open');
                }
            });

            item.classList.toggle('is-open');

            setTimeout(() => {
                ScrollTrigger.refresh();
            }, 500);
        });
    });

    // ---- 通用工具函式 ----
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
        allItems.forEach(item => portfolioList.appendChild(item));
        
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

    // ---- 功能函式 ----
    function renderProjects(projectsToRender) {
        if (!portfolioList) return;
        
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
                    console.warn(`無法載入媒體: ${this.src}. 已用預設圖片取代。`);
                    this.onerror = null;
                    if (this.tagName === 'IMG') {
                        this.src = placeholderImg;
                    } else {
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
            portfolioList.innerHTML = '<p>沒有符合篩選條件的專案。</p>';
        }
        
        setupInfiniteScroll(originalItems);
    }

    function setupFilters(projects) {
        if (!filterContainer) return;
        const allCategories = new Set(projects.map(p => p.category_name));
        let buttonsHtml = '<button class="filter-btn active" data-category="all">全部</button>';
        allCategories.forEach(c => buttonsHtml += `<button class="filter-btn" data-category="${c}">${c}</button>`);
        filterContainer.innerHTML = buttonsHtml;
        
        const filterButtons = gsap.utils.toArray('.filter-btn');
        setupMagneticEffect(filterButtons);

        filterContainer.addEventListener('click', (event) => {
            if (event.target.tagName !== 'BUTTON') return;
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

    async function showProjectDetail(projectId) {
        const API_URL = `api/get_project_detail.php?id=${projectId}`;
        if (!projectModal || !modalBody) return;
        modalBody.innerHTML = '<p>載入中...</p>';
        gsap.to(projectModal, { autoAlpha: 1, duration: 0.3 });
        gsap.from(modalContent, { y: -30, opacity: 0, scale: 0.95, duration: 0.4, ease: 'power2.out' });
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
        gsap.to(projectModal, { autoAlpha: 0, duration: 0.3 });
    }

    // ---- 事件監聽器設定 ----
    nameContainer?.addEventListener('click', () => body.classList.toggle('dark-mode'));
    portfolioList?.addEventListener('click', (event) => {
        const capsule = event.target.closest('.portfolio-capsule');
        if (capsule) {
            event.preventDefault();
            showProjectDetail(capsule.dataset.projectId);
        }
    });
    closeButton?.addEventListener('click', closeModal);
    window.addEventListener('click', (event) => (event.target === projectModal) && closeModal());
    document.addEventListener('keydown', (event) => (event.key === "Escape") && closeModal());

    scrollerNav?.addEventListener('click', (e) => {
        if (!scrollTween || !allProjectsData.length) return;
        const itemProgress = 1 / allProjectsData.length;
        const direction = e.target.classList.contains('next-btn') ? 1 : -1;
        gsap.to(scrollTween, {
            progress: `+=${itemProgress * direction}`,
            duration: 0.8,
            ease: 'power2.inOut'
        });
    });

    const handleMouseMove = (e) => {
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
    window.addEventListener('mousemove', throttle(handleMouseMove, 50));
    
    // ---- 初始化執行 ----
    loadProjectsAndSetupFilters();
});