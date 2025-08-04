/**
 * @file Main script for the portfolio website.
 * @author Bob Tsou
 * @version 7.0.0 (Pure Focus Final)
 */
document.addEventListener("DOMContentLoaded", () => {
  // --- 註冊 GSAP 插件 ---
  gsap.registerPlugin(ScrollTrigger, Observer, TextPlugin);

  // ===============================================
  // ==== 1. 全域變數與 DOM 元素選取 ====
  // ===============================================
  const body = document.querySelector("body");
  const loadingScreen = document.getElementById("loading-screen");
  const portfolioContainer = document.querySelector(".portfolio-container");
  const mainAccordion = document.getElementById("mainAccordion");
  const heroContent = document.querySelector(".hero-content");
  const projectModalElement = document.getElementById("projectModal");
  const bsModal = new bootstrap.Modal(projectModalElement);
  const eyes = gsap.utils.toArray(".eye");
  const eyeContainers = gsap.utils.toArray(".eye-container");
  const particlesContainer = document.querySelector(".particles-container");

  // --- 狀態變數 ---
  let allProjectsData = [];
  let isAudioReady = false;
  const isMobile = window.matchMedia("(max-width: 992px)").matches;
  let audio = null;
  let scrollTween, scrollObserver, lightbox;

  // ===============================================
  // ==== 2. 核心模組 ====
  // ===============================================
  const throttle = (func, limit) => { let inThrottle; return function(...args) { if (!inThrottle) { func.apply(this, args); inThrottle = true; setTimeout(() => inThrottle = false, limit); }}};
  function createAudioSystem() { if (audio) return audio; try { audio = { synth: new Tone.Synth({ volume: -12 }).toDestination(), playClick: () => isAudioReady && audio.synth.triggerAttackRelease("G5", "16n"), playHover: throttle(() => isAudioReady && audio.synth.triggerAttackRelease("C5", "16n"), 100), playOpen: () => isAudioReady && audio.synth.triggerAttackRelease("E4", "8n"), playClose: () => isAudioReady && audio.synth.triggerAttackRelease("A3", "8n"), }; return audio; } catch (e) { console.warn("Tone.js is not available."); return null; } }
  async function initializeAudio() { if (isAudioReady) return true; try { if (typeof Tone === "undefined") return false; createAudioSystem(); await Tone.start(); isAudioReady = true; return true; } catch (e) { isAudioReady = false; return false; } }

  // ===============================================
  // ==== 3. 載入與開場動畫 ====
  // ===============================================
  function setupLoadingScreen() {
    const pixelGrid = document.getElementById("pixel-grid");
    const loadingTitle = document.querySelector(".loading-title");
    const loadingSubtitle = document.querySelector(".loading-subtitle");
    const pressStart = document.querySelector(".press-start");
    const cols = 20; const rows = Math.ceil(window.innerHeight / (window.innerWidth / cols));
    pixelGrid.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
    pixelGrid.innerHTML = Array(cols * Math.ceil(rows)).fill('<div class="pixel-block"></div>').join("");
    const pixelBlocks = gsap.utils.toArray(".pixel-block");
    gsap.timeline().to(loadingTitle, { duration: 1, text: { value: "BOB TSOU", delimiter: "" }, ease: "none" }).to(loadingSubtitle, { duration: 0.8, text: { value: "PORTFOLIO", delimiter: "" }, ease: "none" }, "-=0.5").to(pressStart, { duration: 0.5, opacity: 1 });
    loadingScreen.addEventListener("click", async () => {
      if (!isAudioReady) await initializeAudio();
      if (isAudioReady && audio) audio.playClick();
      const tl = gsap.timeline({ onComplete: () => { loadingScreen.style.display = "none"; body.classList.add("loaded"); setupHeroTransition(); setupScrollAnimations(); }, });
      tl.to(".loading-text-container", { duration: 0.2, opacity: 0, ease: "power1.in" }).to(gsap.utils.shuffle(pixelBlocks), { duration: 0.6, opacity: 0, scale: 0, stagger: { each: 0.003, from: "random" }, ease: "power1.in" }, "-=0.1").set(portfolioContainer, { visibility: "visible" }).to(portfolioContainer, { duration: 0.5, opacity: 1 }, "-=0.6");
      gsap.set(".name-line > span, .eye-container", { y: 30, opacity: 0 }); gsap.set(".profile-photo", { scale: 0.5, opacity: 0 }); gsap.set(".tagline-capsule", { scale: 0.5, opacity: 0 }); gsap.set(".profile-actions a", { y: 20, opacity: 0 });
      gsap.to(".name-line > span, .eye-container", { delay: 0.8, duration: 0.7, y: 0, opacity: 1, stagger: 0.08, ease: "power2.out" });
      gsap.to(".profile-photo", { delay: 1.0, duration: 0.8, scale: 1, opacity: 1, ease: "elastic.out(1, 0.5)" });
      gsap.to(".tagline-capsule", { delay: 1.1, duration: 0.7, scale: 1, opacity: 1, ease: "elastic.out(1, 0.6)" });
      gsap.to(".profile-actions a", { delay: 1.2, duration: 0.5, y: 0, opacity: 1, stagger: 0.1 });
    }, { once: true });
  }

  // ===============================================
  // ==== 4. HERO & 滾動動畫 ====
  // ===============================================
  function setupHeroTransition() { const wave = document.querySelector("#wave-path"); if (!wave || isMobile) return; ScrollTrigger.create({ trigger: ".hero-content", start: "top top", end: "bottom top", scrub: 1.5, onUpdate: (self) => { gsap.to(wave, { attr: { d: `M0,${40+self.progress*60} Q600,${80+self.progress*70} 1200,${40+self.progress*60} L1200,120 L0,120 Z` }, ease: "power1.out" }); }, }); gsap.to(".scroll-down-indicator", { opacity: 0, y: -20, duration: 0.5, scrollTrigger: { trigger: ".hero-content", start: "top top", end: "+=150", scrub: true }}); }
  function setupScrollAnimations() { 
      const animatedElements = gsap.utils.toArray('.skill-card, .timeline-item, .skill-group');
      animatedElements.forEach(el => {
        gsap.from(el, {
            scrollTrigger: {
                trigger: el,
                start: "top 90%",
                toggleActions: "play none none none",
            },
            opacity: 0,
            y: 40,
            duration: 0.6,
            ease: "power2.out",
        });
      });
      
      const timeline = document.querySelector(".timeline"); 
      if (timeline) { 
        gsap.to(timeline, { 
            scrollTrigger: { 
                trigger: timeline, 
                start: "top 80%", 
                end: "bottom 80%", 
                scrub: true 
            }, 
            "--timeline-progress": 1 
        }); 
      } 
  }

  // ===============================================
  // ==== 5. 互動效果 ====
  // ===============================================
  function setupEyeTrackingAndBlinking() { if(isMobile) return; const xTo = gsap.quickTo(eyes, "x", {duration: 0.4, ease: "power2"}); const yTo = gsap.quickTo(eyes, "y", {duration: 0.4, ease: "power2"}); heroContent.addEventListener("mousemove", (e) => { const {clientX, clientY} = e; xTo((clientX / window.innerWidth) * 20 - 10); yTo((clientY / window.innerHeight) * 10 - 5); }); function blink() { gsap.to(eyes, { duration: 0.05, scaleY: 0.1, repeat: 1, yoyo: true, ease: "power2.inOut", onComplete: () => { gsap.delayedCall(gsap.utils.random(2, 8), blink); }});} gsap.delayedCall(gsap.utils.random(2,5), blink); }
  function setupTypingEffect() { const typingElement = document.getElementById("typing-text"); if (!typingElement) return; const messages = ["Web & UI/UX Designer", "Front-End Developer", "雙重優勢，雙倍價值", "熱衷於打造商業產品"]; let messageIndex = 0, charIndex = 0, isDeleting = false; function typeText() { const currentMessage = messages[messageIndex]; if (isDeleting) { typingElement.textContent = currentMessage.substring(0, charIndex - 1); } else { typingElement.textContent = currentMessage.substring(0, charIndex + 1); } if (!isDeleting) { charIndex++; } else { charIndex--; } let typeSpeed = isDeleting ? 40 : 100; if (!isDeleting && charIndex === currentMessage.length) { typeSpeed = 2000; isDeleting = true; } else if (isDeleting && charIndex === 0) { isDeleting = false; messageIndex = (messageIndex + 1) % messages.length; typeSpeed = 500; } setTimeout(typeText, typeSpeed); } setTimeout(typeText, 1500); }
  function setupCustomCursor() { if (isMobile) return; const cursorDot = document.querySelector(".cursor-dot"), cursorOutline = document.querySelector(".cursor-dot-outline"); gsap.set([cursorDot, cursorOutline], { xPercent: -50, yPercent: -50, x: -100, y: -100 }); const outlineX = gsap.quickTo(cursorOutline, "x", { duration: 0.5, ease: "power2" }); const outlineY = gsap.quickTo(cursorOutline, "y", { duration: 0.5, ease: "power2" }); window.addEventListener("mousemove", (e) => { gsap.to(cursorDot, { x: e.clientX, y: e.clientY, duration: 0.1 }); outlineX(e.clientX); outlineY(e.clientY); }); document.querySelectorAll("a, button, .accordion-button, .portfolio-capsule, .name-container, .eye-container, .btn-close, .glightbox, .filmstrip-capsule").forEach((el) => { el.addEventListener("mouseenter", () => cursorOutline.classList.add("hovered")); el.addEventListener("mouseleave", () => cursorOutline.classList.remove("hovered")); }); }
  function setupParticles() { for (let i = 0; i < 30; i++) { const size = gsap.utils.random(2, 8), isFar = size < 4; const particle = document.createElement("div"); particle.classList.add("particle"); gsap.set(particle, { width: size, height: size, x: gsap.utils.random(0, window.innerWidth), y: gsap.utils.random(0, window.innerHeight), opacity: isFar ? 0.3 : 0.6, scale: isFar ? 0.8 : 1.2 }); particlesContainer.appendChild(particle); gsap.to(particle, { y: -window.innerHeight, duration: gsap.utils.random(15, 30), repeat: -1, ease: "none", delay: -15 }); } }

  // ===============================================
  // ==== 6. 動態內容生成 ====
  // ===============================================
  function generateAccordionContent() {
      if (!mainAccordion) return;
      mainAccordion.innerHTML = `
        <div class="accordion-item">
            <h2 class="accordion-header" id="headingAbout">
              <button class="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target="#collapseAbout" aria-expanded="true" aria-controls="collapseAbout">
                ABOUT
                <div class="accordion-icon-plus"><span></span><span></span></div>
              </button>
            </h2>
            <div id="collapseAbout" class="accordion-collapse collapse show" aria-labelledby="headingAbout" data-bs-parent="#mainAccordion">
              <div class="accordion-body">
                <p class="highlight-intro">擁有超過7年平面設計與電商行銷經驗，擅長商品視覺規劃、促銷活動設計與廣告素材製作，具備跨平台整合行銷實績(蝦皮、Momo、Shopline)。為進一步結合設計與開發能力，我投入920小時密集網頁開發訓練，已熟悉HTML、CSS、JavaScript、Bootstrap、Git 等前端技能。熱衷於打造具商業價值與良好使用者體驗的數位產品。</p>
                <h4 class="section-title">SKILLS</h4>
                <div class="skills-grid">
                  <div class="skill-group"><h5>設計 (Design)</h5><div class="skill-cloud"><span class="skill-capsule">Photoshop</span><span class="skill-capsule">Illustrator</span><span class="skill-capsule">Figma</span></div></div>
                  <div class="skill-group"><h5>開發 (Development)</h5><div class="skill-cloud"><span class="skill-capsule">HTML</span><span class="skill-capsule">CSS</span><span class="skill-capsule">JavaScript</span><span class="skill-capsule">Bootstrap</span><span class="skill-capsule">PHP</span><span class="skill-capsule">MySQL</span><span class="skill-capsule">Git</span></div></div>
                </div>
                <div class="about-grid">
                  <div>
                    <h4 class="section-title">WORK EXPERIENCE</h4>
                    <div class="timeline">
                      <div class="timeline-item"><div class="timeline-meta"><span class="timeline-year">2024 - 2025</span><span class="timeline-company">東城國際</span></div><div class="timeline-content"><h5 class="timeline-role">行銷美編專員</h5><p>主導 PChome24h 活動頁面設計與動線優化，創下單檔活動頁面轉換率提升15%-25%的紀錄。並設計社群廣告圖文，成功提升互動率20%-30%。</p></div></div>
                      <div class="timeline-item"><div class="timeline-meta"><span class="timeline-year">2023 - 2024</span><span class="timeline-company">品鞋公司</span></div><div class="timeline-content"><h5 class="timeline-role">電商行銷專員</h5><p>獨立營運 momo 與蝦皮賣場，創下月營業額穩定維持在80-100萬元的成績。執行廣告投放，成功帶動品牌曝光與業績成長。</p></div></div>
                    </div>
                  </div>
                  <div>
                    <h4 class="section-title">EDUCATION</h4>
                    <div class="timeline">
                      <div class="timeline-item"><div class="timeline-meta"><span class="timeline-year">2025</span><span class="timeline-company">泰山職訓局</span></div><div class="timeline-content"><h5 class="timeline-role">PHP資料庫網頁設計 (920小時)</h5><p>學習內容包含: PHP程式設計、MySQL 資料庫管理、API串接等。</p></div></div>
                      <div class="timeline-item"><div class="timeline-meta"><span class="timeline-year">2012 - 2014</span><span class="timeline-company">輔仁大學</span></div><div class="timeline-content"><h5 class="timeline-role">應用美術系 (肄業)</h5></div></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="accordion-item">
            <h2 class="accordion-header" id="headingPortfolio">
              <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapsePortfolio" aria-expanded="false" aria-controls="collapsePortfolio">
                PORTFOLIO
                <div class="accordion-icon-plus"><span></span><span></span></div>
              </button>
            </h2>
            <div id="collapsePortfolio" class="accordion-collapse collapse" aria-labelledby="headingPortfolio" data-bs-parent="#mainAccordion">
              <div class="accordion-body">
                <p>這裡是我的作品集展示區。點擊下方的按鈕來篩選專案。</p>
                <div id="portfolio-filters" class="portfolio-filters"></div>
                <div class="portfolio-scroller"><div class="portfolio-list"></div></div>
                <div class="scroller-nav"><button class="nav-btn prev-btn">&lt;</button><button class="nav-btn next-btn">&gt;</button></div>
              </div>
            </div>
          </div>
          <div class="accordion-item">
            <h2 class="accordion-header" id="headingContact">
              <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapseContact" aria-expanded="false" aria-controls="collapseContact">
                CONTACT
                <div class="accordion-icon-plus"><span></span><span></span></div>
              </button>
            </h2>
            <div id="collapseContact" class="accordion-collapse collapse" aria-labelledby="headingContact" data-bs-parent="#mainAccordion">
              <div class="accordion-body">
                 <div class="contact-intro"><h4>🚀 準備開始合作了嗎？</h4><p>我熱衷於發揮設計與技術的雙重優勢，期待與您一同打造出色的數位產品！</p></div>
                 <div class="container-fluid"><div class="row g-4"><div class="col-lg-5"><div class="contact-info">
                   <div class="contact-method"><div class="contact-icon">📧</div><div class="contact-details"><h5>Email</h5><p><a href="mailto:hello@bb-made.com">hello@bb-made.com</a></p></div></div>
                   <div class="contact-method"><div class="contact-icon">📱</div><div class="contact-details"><h5>手機</h5><p>0912-345-678</p></div></div>
                   <div class="contact-method"><div class="contact-icon">🌐</div><div class="contact-details"><h5>個人網站</h5><p><a href="http://bb-made.com" target="_blank">bb-made.com</a></p></div></div>
                 </div></div><div class="col-lg-7"><form class="contact-form" id="contact-form">
                   <div class="form-group floating-label-group"><input type="text" id="contact-name" name="name" required placeholder=" " /><label for="contact-name">姓名 *</label></div>
                   <div class="form-group floating-label-group"><input type="email" id="contact-email" name="email" required placeholder=" " /><label for="contact-email">Email *</label></div>
                   <div class="form-group"><label for="contact-subject" class="static-label">主旨 *</label><select id="contact-subject" name="subject" required><option value="">請選擇合作類型</option><option value="website">網站開發</option><option value="design">UI/UX 設計</option><option value="fullstack">全端開發</option></select></div>
                   <div class="form-group floating-label-group"><textarea id="contact-message" name="message" rows="4" required placeholder=" "></textarea><label for="contact-message">訊息 *</label></div>
                   <button type="submit" class="submit-btn"><span class="btn-text">發送訊息</span></button>
                 </form></div></div></div>
              </div>
            </div>
          </div>`;
  }
  function renderProjects(projectsToRender) {
    const portfolioList = document.querySelector(".portfolio-list");
    if(!portfolioList) return;
    portfolioList.innerHTML = "";
    if (projectsToRender.length > 0) {
      projectsToRender.forEach((project) => {
        const mediaUrl = project.preview_media_url;
        let mediaElement = mediaUrl && (mediaUrl.endsWith(".mp4") || mediaUrl.endsWith(".webm")) ? `<video src="${mediaUrl}" autoplay loop muted playsinline class="capsule-media"></video>` : `<img src="${mediaUrl || "https://placehold.co/400x300/F8CB74/2c2c2c?text=Project"}" alt="${project.title} preview" class="capsule-media">`;
        const capsule = document.createElement("div");
        capsule.className = "portfolio-capsule";
        capsule.dataset.projectId = project.id;
        capsule.innerHTML = `${mediaElement}<div class="capsule-overlay"><h4 class="capsule-title">${project.title}</h4><span class="capsule-category">${project.category_name || ''}</span></div>`;
        portfolioList.appendChild(capsule);
      });
    } else {
      portfolioList.innerHTML = "<p>沒有符合篩選條件的專案。</p>";
    }
    setupInfiniteScroll();
  }
  function setupInfiniteScroll() { const portfolioList = document.querySelector(".portfolio-list"); const scrollerNav = document.querySelector(".scroller-nav"); if (scrollTween) scrollTween.kill(); if (scrollObserver) scrollObserver.kill(); if (isMobile || !portfolioList) { if(portfolioList) gsap.set(portfolioList, { x: 0 }); return; } const items = portfolioList.querySelectorAll(".portfolio-capsule"); if (!items || items.length < 3) { gsap.set(portfolioList, { x: 0 }); if(scrollerNav) scrollerNav.style.display = "none"; return; } if(scrollerNav) scrollerNav.style.display = "flex"; const originalItems = Array.from(items); originalItems.forEach((item) => portfolioList.appendChild(item.cloneNode(true))); const itemWidth = originalItems[0].offsetWidth + parseInt(getComputedStyle(originalItems[0]).marginRight) * 2; if (itemWidth === 0) return; const totalWidth = itemWidth * originalItems.length; const wrap = gsap.utils.wrap(0, -totalWidth); scrollTween = gsap.to(portfolioList, { x: `-=${totalWidth}`, duration: originalItems.length * 8, ease: "none", repeat: -1, modifiers: { x: (x) => wrap(parseFloat(x)) + "px" }}); scrollObserver = Observer.create({ target: ".portfolio-scroller", type: "touch,pointer", onDrag: (self) => scrollTween.progress(scrollTween.progress() - self.deltaX * 0.0015), onHover: () => scrollTween?.pause(), onHoverEnd: () => scrollTween?.resume() }); }

  // ===============================================
  // ==== 7. 資料獲取與事件監聽 ====
  // ===============================================
  async function loadProjectsAndSetup() {
    try {
      const response = await fetch("api/get_projects.php");
      if (!response.ok) throw new Error(`API 請求失敗，狀態碼: ${response.status}`);
      allProjectsData = await response.json();
      renderProjects(allProjectsData);
      const filterContainer = document.getElementById("portfolio-filters");
      const categories = ["all", ...new Set(allProjectsData.map((p) => p.category_name).filter((c) => c))];
      if (filterContainer && categories.length > 2) {
        filterContainer.innerHTML = categories.map((c) =>`<button class="filter-btn ${c === "all" ? "active" : ""}" data-category="${c}">${c === "all" ? "全部專案" : c}</button>`).join("");
      }
    } catch (error) {
      console.error("專案載入失敗:", error);
      const portfolioList = document.querySelector(".portfolio-list");
      if (portfolioList) portfolioList.innerHTML = "<p>專案載入失敗，請稍後再試。</p>";
    }
  }
  async function showProjectDetail(projectId) {
    if (audio) audio.playOpen();
    const modalContent = projectModalElement.querySelector('.modal-content');
    modalContent.innerHTML = '<div class="d-flex justify-content-center align-items-center" style="height: 100%;"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading...</span></div></div>';
    bsModal.show();
    try {
      const response = await fetch(`api/get_project_detail.php?id=${projectId}`);
      if (!response.ok) throw new Error(`API 請求失敗`);
      const project = await response.json();
      if (project && !project.error) {
        let allImages = [];
        const coverMediaUrl = project.cover_image_url || '';
        if (coverMediaUrl) { allImages.push({ url: coverMediaUrl, caption: '封面主圖' }); }
        if (project.gallery?.length) { project.gallery.forEach(img => { allImages.push({ url: img.image_url, caption: img.caption || '' }); }); }
        const stageHTML = allImages.map((img, index) => `<img src="${img.url}" alt="${img.caption}" class="stage-media ${index === 0 ? 'is-active' : ''}" data-index="${index}">`).join('');
        const filmstripHTML = allImages.length > 1 ? `<div class="showcase-filmstrip"><div class="filmstrip-nav">${allImages.map((img, index) => `<div class="filmstrip-capsule ${index === 0 ? 'is-active' : ''}" data-index="${index}"><img src="${img.url}" alt="thumbnail ${index+1}"></div>`).join('')}</div></div>` : '';
        const ctaHTML = (project.project_link || project.github_link) ? `<div class="info-module"><h5 class="module-title">相關連結</h5><div class="modal-cta-buttons">${project.project_link ? `<a href="${project.project_link}" class="cta-button" target="_blank" rel="noopener noreferrer"><span>🚀</span> Live Demo</a>` : ''}${project.github_link ? `<a href="${project.github_link}" class="cta-button secondary" target="_blank" rel="noopener noreferrer"><span>💻</span> GitHub Repo</a>` : ''}</div></div>` : '';
        const tagsHTML = project.tags?.length ? `<div class="info-module"><h5 class="module-title">技術與工具</h5><div class="modal-tags">${project.tags.map(tag => `<span class="modal-tag">${tag.name}</span>`).join("")}</div></div>` : "";
        const finalHTML = `<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close" style="position: absolute; top: 1rem; right: 1.5rem; z-index: 10;"></button><div class="modal-body-content"><div class="interactive-showcase"><div class="showcase-stage">${stageHTML}</div>${filmstripHTML}<div class="showcase-info-panel"><div class="info-header"><span class="category-badge">${project.category_name || '分類'}</span><h3 class="main-title">${project.title}</h3></div><div class="info-grid"><div class="info-module modal-description">${project.description.replace(/\n/g, "<br>")}</div><div class="info-module-group">${ctaHTML}${tagsHTML}</div></div></div></div></div>`;
        modalContent.innerHTML = finalHTML;
        const stage = modalContent.querySelector('.showcase-stage');
        const thumbnails = modalContent.querySelectorAll('.filmstrip-capsule');
        thumbnails.forEach(thumb => {
            thumb.addEventListener('click', () => {
                const activeIndex = thumb.dataset.index;
                const currentActive = stage.querySelector('.stage-media.is-active');
                if (currentActive) currentActive.classList.remove('is-active');
                stage.querySelector(`.stage-media[data-index="${activeIndex}"]`).classList.add('is-active');
                const currentThumb = modalContent.querySelector('.filmstrip-capsule.is-active');
                if(currentThumb) currentThumb.classList.remove('is-active');
                thumb.classList.add('is-active');
            });
        });
        if (lightbox) lightbox.destroy();
        lightbox = GLightbox({ selector: '.stage-media', skin: 'custom-dark-skin', loop: true });
      } else { throw new Error(project?.error || "專案資料格式錯誤"); }
    } catch (error) {
      console.error('無法載入專案詳情:', error);
      modalContent.innerHTML = `<div class="p-4 text-center d-flex flex-column justify-content-center align-items-center" style="height:100%"><p>抱歉，無法載入專案詳情。<br>${error.message}</p><button type="button" class="btn btn-secondary mt-3" data-bs-dismiss="modal">關閉</button></div>`;
    }
  }
  
  function setupEventListeners() {
    document.body.addEventListener('click', (e) => {
        if (e.target.closest('.filter-btn')) {
            const btn = e.target.closest('.filter-btn');
            if (!btn || btn.classList.contains("active")) return;
            if (audio) audio.playClick();
            const filterContainer = document.getElementById("portfolio-filters");
            if(filterContainer && filterContainer.querySelector(".active")) filterContainer.querySelector(".active").classList.remove("active");
            btn.classList.add("active");
            const selectedCategory = btn.dataset.category;
            const filtered = selectedCategory === "all" ? allProjectsData : allProjectsData.filter((p) => p.category_name === selectedCategory);
            gsap.to(".portfolio-list", { opacity: 0, duration: 0.4, onComplete: () => { renderProjects(filtered); gsap.to(".portfolio-list", { opacity: 1, duration: 0.4 }); }});
        }
        if (e.target.closest('.portfolio-capsule')) {
            const capsule = e.target.closest(".portfolio-capsule");
            if (capsule) showProjectDetail(capsule.dataset.projectId);
        }
    });
    const scrollerNav = document.querySelector(".scroller-nav");
    if(scrollerNav) scrollerNav.addEventListener("click", (e) => {
      if (isMobile || !scrollTween) return;
      const btn = e.target.closest(".nav-btn"); if (!btn) return;
      const numOriginalItems = document.querySelectorAll(".portfolio-list .portfolio-capsule").length / 2;
      const itemProgress = 1 / numOriginalItems;
      const direction = btn.classList.contains("next-btn") ? 1 : -1;
      gsap.to(scrollTween, { progress: scrollTween.progress() + itemProgress * direction, duration: 0.8, ease: "power2.inOut" });
    });
    
    document.body.addEventListener('submit', e => {
        if(e.target.matches('#contact-form')) {
            e.preventDefault();
            alert('感謝您的訊息！');
        }
    });

    eyeContainers.forEach((container) => container.addEventListener("click", () => {
        body.classList.toggle("dark-mode"); body.classList.toggle("light-mode");
        if (audio) audio.playClick();
    }));
    projectModalElement.addEventListener('hide.bs.modal', () => {
        if (audio) audio.playClose();
        if (lightbox) { lightbox.destroy(); lightbox = null; }
    });
  }

  // ===============================================
  // ==== 8. 初始化 ====
  // ===============================================
  async function init() {
    setupLoadingScreen();
    generateAccordionContent();
    setupCustomCursor();
    setupParticles();
    setupEyeTrackingAndBlinking();
    setupTypingEffect();
    setupEventListeners();
    await loadProjectsAndSetup();
  }

  init();
});