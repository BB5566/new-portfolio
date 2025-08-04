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
  const throttle = (func, limit) => {
    let inThrottle;
    return function (...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => (inThrottle = false), limit);
      }
    };
  };

  // 錯誤處理系統
  function showErrorMessage(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-toast';
    errorDiv.innerHTML = `
      <div class="error-content">
        <span class="error-icon">⚠️</span>
        <span class="error-text">${message}</span>
        <button class="error-close">&times;</button>
      </div>
    `;
    document.body.appendChild(errorDiv);
    
    // 點擊關閉按鈕
    errorDiv.querySelector('.error-close').addEventListener('click', () => {
      errorDiv.remove();
    });
    
    // 自動消失
    setTimeout(() => {
      if (errorDiv.parentNode) {
        errorDiv.remove();
      }
    }, 5000);
  }

  // 用戶行為追蹤
  function trackUserInteraction(action, element) {
    console.log(`User action: ${action} on ${element}`);
    // 可以在這裡整合 Google Analytics 或其他分析工具
  }

  // 主題管理系統
  function initializeTheme() {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const savedTheme = localStorage.getItem('portfolio-theme');
    
    if (savedTheme) {
      body.className = savedTheme;
    } else if (prefersDark) {
      body.className = 'dark-mode';
    } else {
      body.className = 'light-mode';
    }
  }

  function toggleTheme() {
    const newTheme = body.classList.contains('light-mode') ? 'dark-mode' : 'light-mode';
    body.className = newTheme;
    localStorage.setItem('portfolio-theme', newTheme);
    if (audio) audio.playClick();
  }

  function createAudioSystem() {
    if (audio) return audio;
    try {
      // 延遲初始化 Tone.js，避免自動啟動
      audio = {
        synth: null,
        isInitialized: false,
        playClick: async () => {
          if (!audio.isInitialized) await audio.initialize();
          if (isAudioReady && audio.synth) {
            audio.synth.triggerAttackRelease("G5", "16n");
          }
        },
        playHover: throttle(async () => {
          if (!audio.isInitialized) await audio.initialize();
          if (isAudioReady && audio.synth) {
            audio.synth.triggerAttackRelease("C5", "16n");
          }
        }, 100),
        playOpen: async () => {
          if (!audio.isInitialized) await audio.initialize();
          if (isAudioReady && audio.synth) {
            audio.synth.triggerAttackRelease("E4", "8n");
          }
        },
        playClose: async () => {
          if (!audio.isInitialized) await audio.initialize();
          if (isAudioReady && audio.synth) {
            audio.synth.triggerAttackRelease("A3", "8n");
          }
        },
        initialize: async () => {
          if (audio.isInitialized) return;
          try {
            if (Tone.context.state !== 'running') {
              await Tone.start();
            }
            audio.synth = new Tone.Synth({ volume: -12 }).toDestination();
            audio.isInitialized = true;
            isAudioReady = true;
          } catch (e) {
            console.warn("Failed to initialize audio:", e);
            isAudioReady = false;
          }
        }
      };
      return audio;
    } catch (e) {
      console.warn("Tone.js is not available:", e);
      return null;
    }
  }
  async function initializeAudio() {
    if (isAudioReady) return true;
    try {
      if (typeof Tone === "undefined") return false;
      createAudioSystem();
      // 不在這裡啟動 Tone，而是在用戶第一次互動時啟動
      return true;
    } catch (e) {
      console.warn("Audio initialization failed:", e);
      isAudioReady = false;
      return false;
    }
  }

  // ===============================================
  // ==== 3. 載入與開場動畫 ====
  // ===============================================
  function setupLoadingScreen() {
    const pixelGrid = document.getElementById("pixel-grid");
    const loadingTitle = document.querySelector(".loading-title");
    const loadingSubtitle = document.querySelector(".loading-subtitle");
    const pressStart = document.querySelector(".press-start");
    const cols = 20;
    const rows = Math.ceil(window.innerHeight / (window.innerWidth / cols));
    pixelGrid.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
    pixelGrid.innerHTML = Array(cols * Math.ceil(rows))
      .fill('<div class="pixel-block"></div>')
      .join("");
    const pixelBlocks = gsap.utils.toArray(".pixel-block");
    
    // 加入載入進度條
    const progressBar = document.createElement('div');
    progressBar.className = 'loading-progress';
    progressBar.innerHTML = '<div class="progress-fill"></div>';
    document.querySelector('.loading-text-container').appendChild(progressBar);
    
    const tl = gsap
      .timeline()
      .to(loadingTitle, {
        duration: 1,
        text: { value: "BOB TSOU", delimiter: "" },
        ease: "none",
      })
      .to(
        loadingSubtitle,
        {
          duration: 0.8,
          text: { value: "PORTFOLIO", delimiter: "" },
          ease: "none",
        },
        "-=0.5"
      )
      .to('.progress-fill', {
        width: '100%',
        duration: 1.5,
        ease: 'power2.out'
      }, "-=1")
      .to(pressStart, { duration: 0.5, opacity: 1 });
    loadingScreen.addEventListener(
      "click",
      async () => {
        // 初始化音頻系統（用戶手勢觸發）
        if (!isAudioReady) {
          await initializeAudio();
          if (audio && !audio.isInitialized) {
            await audio.initialize();
          }
        }
        if (audio) await audio.playClick();
        
        const tl = gsap.timeline({
          onComplete: () => {
            loadingScreen.style.display = "none";
            body.classList.add("loaded");
            // 確保滾動可用
            setTimeout(() => {
              body.style.overflowY = 'auto';
              document.documentElement.style.overflowY = 'auto';
            }, 100);
            setupHeroTransition();
            setupScrollAnimations();
          },
        });
        tl.to(".loading-text-container", {
          duration: 0.2,
          opacity: 0,
          ease: "power1.in",
        })
          .to(
            gsap.utils.shuffle(pixelBlocks),
            {
              duration: 0.6,
              opacity: 0,
              scale: 0,
              stagger: { each: 0.003, from: "random" },
              ease: "power1.in",
            },
            "-=0.1"
          )
          .set(portfolioContainer, { visibility: "visible" })
          .to(portfolioContainer, { duration: 0.5, opacity: 1 }, "-=0.6");
        gsap.set(".name-line > span, .eye-container", { y: 30, opacity: 0 });
        gsap.set(".profile-photo", { scale: 0.5, opacity: 0 });
        gsap.set(".tagline-capsule", { scale: 0.5, opacity: 0 });
        gsap.set(".profile-actions a", { y: 20, opacity: 0 });
        gsap.to(".name-line > span, .eye-container", {
          delay: 0.8,
          duration: 0.7,
          y: 0,
          opacity: 1,
          stagger: 0.08,
          ease: "power2.out",
        });
        gsap.to(".profile-photo", {
          delay: 1.0,
          duration: 0.8,
          scale: 1,
          opacity: 1,
          ease: "elastic.out(1, 0.5)",
        });
        gsap.to(".tagline-capsule", {
          delay: 1.1,
          duration: 0.7,
          scale: 1,
          opacity: 1,
          ease: "elastic.out(1, 0.6)",
        });
        gsap.to(".profile-actions a", {
          delay: 1.2,
          duration: 0.5,
          y: 0,
          opacity: 1,
          stagger: 0.1,
        });
      },
      { once: true }
    );
  }

  // ===============================================
  // ==== 4. HERO & 滾動動畫 ====
  // ===============================================
  function setupHeroTransition() {
    const wave = document.querySelector("#wave-path");
    if (!wave || isMobile) return;
    ScrollTrigger.create({
      trigger: ".hero-content",
      start: "top top",
      end: "bottom top",
      scrub: 1.5,
      onUpdate: (self) => {
        gsap.to(wave, {
          attr: {
            d: `M0,${40 + self.progress * 60} Q600,${
              80 + self.progress * 70
            } 1200,${40 + self.progress * 60} L1200,120 L0,120 Z`,
          },
          ease: "power1.out",
        });
      },
    });
    gsap.to(".scroll-down-indicator", {
      opacity: 0,
      y: -20,
      duration: 0.5,
      scrollTrigger: {
        trigger: ".hero-content",
        start: "top top",
        end: "+=150",
        scrub: true,
      },
    });
  }
  function setupScrollAnimations() {
    const animatedElements = gsap.utils.toArray(".skill-group, .timeline-item");
    animatedElements.forEach((el) => {
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

    // 技能膠囊交錯動畫
    gsap.fromTo('.skill-capsule', {
      opacity: 0,
      y: 20,
      scale: 0.8
    }, {
      opacity: 1,
      y: 0,
      scale: 1,
      duration: 0.6,
      stagger: 0.1,
      ease: 'back.out(1.7)',
      scrollTrigger: {
        trigger: '.skills-grid',
        start: 'top 80%',
        toggleActions: 'play none none reverse'
      }
    });

    // 作品集項目動畫
    gsap.fromTo('.portfolio-capsule', {
      opacity: 0,
      y: 30,
      scale: 0.9
    }, {
      opacity: 1,
      y: 0,
      scale: 1,
      duration: 0.8,
      stagger: 0.15,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: '.portfolio-list',
        start: 'top 85%',
        toggleActions: 'play none none reverse'
      }
    });

    const timelines = gsap.utils.toArray(".timeline");
    timelines.forEach((timeline) => {
      if (timeline) {
        gsap.to(timeline, {
          scrollTrigger: {
            trigger: timeline,
            start: "top 80%",
            end: "bottom 80%",
            scrub: true,
          },
          "--timeline-progress": 1,
        });
      }
    });
  }

  // ===============================================
  // ==== 5. 互動效果 ====
  // ===============================================
  function setupEyeTrackingAndBlinking() {
    if (isMobile) return;
    const xTo = gsap.quickTo(eyes, "x", { duration: 0.4, ease: "power2" });
    const yTo = gsap.quickTo(eyes, "y", { duration: 0.4, ease: "power2" });
    heroContent.addEventListener("mousemove", (e) => {
      const { clientX, clientY } = e;
      xTo((clientX / window.innerWidth) * 20 - 10);
      yTo((clientY / window.innerHeight) * 10 - 5);
    });
    function blink() {
      gsap.to(eyes, {
        duration: 0.05,
        scaleY: 0.1,
        repeat: 1,
        yoyo: true,
        ease: "power2.inOut",
        onComplete: () => {
          gsap.delayedCall(gsap.utils.random(2, 8), blink);
        },
      });
    }
    gsap.delayedCall(gsap.utils.random(2, 5), blink);
  }
  function setupTypingEffect() {
    const typingElement = document.getElementById("typing-text");
    if (!typingElement) return;
    const messages = [
      "Web & UI/UX Designer",
      "Front-End Developer",
      "雙重優勢，雙倍價值",
      "熱衷於打造商業產品",
    ];
    let messageIndex = 0,
      charIndex = 0,
      isDeleting = false;
    function typeText() {
      const currentMessage = messages[messageIndex];
      if (isDeleting) {
        typingElement.textContent = currentMessage.substring(0, charIndex - 1);
      } else {
        typingElement.textContent = currentMessage.substring(0, charIndex + 1);
      }
      if (!isDeleting) {
        charIndex++;
      } else {
        charIndex--;
      }
      let typeSpeed = isDeleting ? 40 : 100;
      if (!isDeleting && charIndex === currentMessage.length) {
        typeSpeed = 2000;
        isDeleting = true;
      } else if (isDeleting && charIndex === 0) {
        isDeleting = false;
        messageIndex = (messageIndex + 1) % messages.length;
        typeSpeed = 500;
      }
      setTimeout(typeText, typeSpeed);
    }
    setTimeout(typeText, 1500);
  }
  function setupCustomCursor() {
    if (isMobile) return;
    const cursorDot = document.querySelector(".cursor-dot"),
      cursorOutline = document.querySelector(".cursor-dot-outline");
    gsap.set([cursorDot, cursorOutline], {
      xPercent: -50,
      yPercent: -50,
      x: -100,
      y: -100,
    });
    const outlineX = gsap.quickTo(cursorOutline, "x", {
      duration: 0.5,
      ease: "power2",
    });
    const outlineY = gsap.quickTo(cursorOutline, "y", {
      duration: 0.5,
      ease: "power2",
    });
    window.addEventListener("mousemove", (e) => {
      gsap.to(cursorDot, { x: e.clientX, y: e.clientY, duration: 0.1 });
      outlineX(e.clientX);
      outlineY(e.clientY);
    });
    document
      .querySelectorAll(
        "a, button, .accordion-button, .portfolio-capsule, .name-container, .eye-container, .btn-close, .glightbox, .filmstrip-capsule"
      )
      .forEach((el) => {
        el.addEventListener("mouseenter", () =>
          cursorOutline.classList.add("hovered")
        );
        el.addEventListener("mouseleave", () =>
          cursorOutline.classList.remove("hovered")
        );
      });
  }
  function setupParticles() {
    for (let i = 0; i < 30; i++) {
      const size = gsap.utils.random(2, 8),
        isFar = size < 4;
      const particle = document.createElement("div");
      particle.classList.add("particle");
      gsap.set(particle, {
        width: size,
        height: size,
        x: gsap.utils.random(0, window.innerWidth),
        y: gsap.utils.random(0, window.innerHeight),
        opacity: isFar ? 0.3 : 0.6,
        scale: isFar ? 0.8 : 1.2,
      });
      particlesContainer.appendChild(particle);
      gsap.to(particle, {
        y: -window.innerHeight,
        duration: gsap.utils.random(15, 30),
        repeat: -1,
        ease: "none",
        delay: -15,
      });
    }
  }

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
    if (!portfolioList) return;
    portfolioList.innerHTML = "";
    if (projectsToRender.length > 0) {
      projectsToRender.forEach((project) => {
        const mediaUrl = project.preview_media_url;
        let mediaElement =
          mediaUrl && (mediaUrl.endsWith(".mp4") || mediaUrl.endsWith(".webm"))
            ? `<video src="${mediaUrl}" autoplay loop muted playsinline class="capsule-media" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';"></video><div class="missing-media" style="display:none; width:100%; height:200px; background:#f8f9fa; border:2px dashed #dee2e6; justify-content:center; align-items:center; color:#6c757d;">媒體載入失敗</div>`
            : `<img src="${
                mediaUrl ||
                "uploads/placeholder.svg"
              }" alt="${project.title} preview" class="capsule-media" onerror="this.src='uploads/placeholder.svg'; this.alt='圖片載入失敗';">`;
        const capsule = document.createElement("div");
        capsule.className = "portfolio-capsule";
        capsule.dataset.projectId = project.id;
        capsule.setAttribute('role', 'button');
        capsule.setAttribute('tabindex', '0');
        capsule.setAttribute('aria-label', `查看 ${project.title} 專案詳情`);
        capsule.innerHTML = `${mediaElement}<div class="capsule-overlay"><h4 class="capsule-title">${
          project.title
        }</h4><span class="capsule-category">${
          project.category_name || ""
        }</span></div>`;
        portfolioList.appendChild(capsule);
        
        // 為新建立的元素添加鍵盤事件監聽器
        capsule.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            trackUserInteraction('project_view', capsule.dataset.projectId);
            showProjectDetail(capsule.dataset.projectId);
          }
        });
      });
    } else {
      portfolioList.innerHTML = "<p>沒有符合篩選條件的專案。</p>";
    }
    setupInfiniteScroll();
  }
  function setupInfiniteScroll() {
    const portfolioList = document.querySelector(".portfolio-list");
    const scrollerNav = document.querySelector(".scroller-nav");
    if (scrollTween) scrollTween.kill();
    if (scrollObserver) scrollObserver.kill();
    if (isMobile || !portfolioList) {
      if (portfolioList) gsap.set(portfolioList, { x: 0 });
      return;
    }
    const items = portfolioList.querySelectorAll(".portfolio-capsule");
    if (!items || items.length < 3) {
      gsap.set(portfolioList, { x: 0 });
      if (scrollerNav) scrollerNav.style.display = "none";
      return;
    }
    if (scrollerNav) scrollerNav.style.display = "flex";
    const originalItems = Array.from(items);
    originalItems.forEach((item) =>
      portfolioList.appendChild(item.cloneNode(true))
    );
    const itemWidth =
      originalItems[0].offsetWidth +
      parseInt(getComputedStyle(originalItems[0]).marginRight) * 2;
    if (itemWidth === 0) return;
    const totalWidth = itemWidth * originalItems.length;
    const wrap = gsap.utils.wrap(0, -totalWidth);
    scrollTween = gsap.to(portfolioList, {
      x: `-=${totalWidth}`,
      duration: originalItems.length * 8,
      ease: "none",
      repeat: -1,
      modifiers: { x: (x) => wrap(parseFloat(x)) + "px" },
    });
    scrollObserver = Observer.create({
      target: ".portfolio-scroller",
      type: "touch,pointer",
      onDrag: (self) =>
        scrollTween.progress(scrollTween.progress() - self.deltaX * 0.0015),
      onHover: () => scrollTween?.pause(),
      onHoverEnd: () => scrollTween?.resume(),
    });
  }

  // ===============================================
  // ==== 7. 資料獲取與事件監聽 ====
  // ===============================================
  async function loadProjectsAndSetup() {
    try {
      // 顯示載入骨架屏
      if (window.addLoadingSkeleton) {
        window.addLoadingSkeleton();
      }
      
      const response = await fetch("api/get_projects.php");
      if (!response.ok)
        throw new Error(`API 請求失敗，狀態碼: ${response.status}`);
      allProjectsData = await response.json();
      
      // 延遲一點讓用戶看到載入效果
      await new Promise(resolve => setTimeout(resolve, 800));
      
      renderProjects(allProjectsData);
      const filterContainer = document.getElementById("portfolio-filters");
      const categories = [
        "all",
        ...new Set(
          allProjectsData.map((p) => p.category_name).filter((c) => c)
        ),
      ];
      if (filterContainer && categories.length > 2) {
        filterContainer.innerHTML = categories
          .map(
            (c) =>
              `<button class="filter-btn ${
                c === "all" ? "active" : ""
              }" data-category="${c}">${c === "all" ? "全部專案" : c}</button>`
          )
          .join("");
      }
    } catch (error) {
      console.error("專案載入失敗:", error);
      const portfolioList = document.querySelector(".portfolio-list");
      if (portfolioList)
        portfolioList.innerHTML = "<p>專案載入失敗，請稍後再試。</p>";
    }
  }
  async function showProjectDetail(projectId) {
    // 追蹤用戶行為
    trackUserInteraction('project_detail_view', projectId);
    
    if (audio) audio.playOpen();
    const modalContent = projectModalElement.querySelector(".modal-content");
    modalContent.innerHTML = `
      <div class="modal-loading">
        <div class="spinner"></div>
        <div class="loading-text">載入專案資料中...</div>
      </div>
    `;
    
    // 修正 ARIA 問題
    projectModalElement.removeAttribute('aria-hidden');
    projectModalElement.setAttribute('aria-modal', 'true');
    
    bsModal.show();
    try {
      const response = await fetch(
        `api/get_project_detail.php?id=${projectId}`
      );
      if (!response.ok) throw new Error(`API 請求失敗`);
      const project = await response.json();
      if (project && !project.error) {
        let allImages = [];
        const coverMediaUrl = project.cover_image_url || "";
        if (coverMediaUrl) {
          allImages.push({ url: coverMediaUrl, caption: "封面主圖" });
        }
        if (project.gallery?.length) {
          project.gallery.forEach((img) => {
            allImages.push({ url: img.image_url, caption: img.caption || "" });
          });
        }
        const stageHTML = allImages
          .map(
            (img, index) =>
              `<img src="${img.url}" alt="${img.caption}" class="stage-media ${
                index === 0 ? "is-active" : ""
              }" data-index="${index}" onerror="this.src='uploads/placeholder.svg'; this.alt='圖片載入失敗';"`
          )
          .join("");
        const filmstripHTML =
          allImages.length > 1
            ? `<div class="showcase-filmstrip"><div class="filmstrip-nav">${allImages
                .map(
                  (img, index) =>
                    `<div class="filmstrip-capsule ${
                      index === 0 ? "is-active" : ""
                    }" data-index="${index}"><img src="${
                      img.url
                    }" alt="thumbnail ${index + 1}" onerror="this.src='uploads/placeholder.svg';"></div>`
                )
                .join("")}</div></div>`
            : "";
        const ctaHTML =
          project.project_link || project.github_link
            ? `<div class="info-module"><h5 class="module-title">相關連結</h5><div class="modal-cta-buttons">${
                project.project_link
                  ? `<a href="${project.project_link}" class="cta-button" target="_blank" rel="noopener noreferrer"><span>🚀</span> Live Demo</a>`
                  : ""
              }${
                project.github_link
                  ? `<a href="${project.github_link}" class="cta-button secondary" target="_blank" rel="noopener noreferrer"><span>💻</span> GitHub Repo</a>`
                  : ""
              }</div></div>`
            : "";
        const tagsHTML = project.tags?.length
          ? `<div class="info-module"><h5 class="module-title">技術與工具</h5><div class="modal-tags">${project.tags
              .map((tag, index) => `<span class="modal-tag" style="animation-delay: ${0.1 + index * 0.1}s">${tag.name}</span>`)
              .join("")}</div></div>`
          : "";
        const finalHTML = `
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="關閉"></button>
          <div class="modal-body-content">
            <div class="interactive-showcase">
              <div class="showcase-stage">${stageHTML}</div>
              ${filmstripHTML}
              <div class="showcase-info-panel">
                <div class="info-header">
                  <span class="category-badge">${project.category_name || "分類"}</span>
                  <h3 class="main-title">${project.title}</h3>
                </div>
                <div class="info-grid">
                  <div class="info-module modal-description">${project.description.replace(/\n/g, "<br>")}</div>
                  <div class="info-module-group">
                    ${ctaHTML}
                    ${tagsHTML}
                  </div>
                </div>
              </div>
            </div>
          </div>
        `;
        modalContent.innerHTML = finalHTML;
        const stage = modalContent.querySelector(".showcase-stage");
        const thumbnails = modalContent.querySelectorAll(".filmstrip-capsule");
        thumbnails.forEach((thumb) => {
          thumb.addEventListener("click", () => {
            const activeIndex = thumb.dataset.index;
            const currentActive = stage.querySelector(".stage-media.is-active");
            const newActive = stage.querySelector(`.stage-media[data-index="${activeIndex}"]`);
            
            // 添加淡出動畫
            if (currentActive && currentActive !== newActive) {
              currentActive.style.opacity = '0';
              setTimeout(() => {
                currentActive.classList.remove("is-active");
                newActive.classList.add("is-active");
                newActive.style.opacity = '1';
              }, 200);
            } else if (!currentActive) {
              newActive.classList.add("is-active");
              newActive.style.opacity = '1';
            }
            
            // 更新縮圖狀態
            const currentThumb = modalContent.querySelector(".filmstrip-capsule.is-active");
            if (currentThumb) currentThumb.classList.remove("is-active");
            thumb.classList.add("is-active");
            
            // 播放音效
            if (audio) audio.playClick();
          });
        });
        // 初始化 GLightbox
        if (lightbox) lightbox.destroy();
        lightbox = GLightbox({
          selector: ".stage-media",
          skin: "custom-dark-skin",
          loop: true,
        });
        
        // 添加鍵盤導覽支援
        const handleKeyNavigation = (e) => {
          if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
            e.preventDefault();
            const currentActive = modalContent.querySelector(".filmstrip-capsule.is-active");
            if (!currentActive) return;
            
            const thumbnails = Array.from(modalContent.querySelectorAll(".filmstrip-capsule"));
            const currentIndex = thumbnails.indexOf(currentActive);
            let nextIndex;
            
            if (e.key === 'ArrowLeft') {
              nextIndex = currentIndex > 0 ? currentIndex - 1 : thumbnails.length - 1;
            } else {
              nextIndex = currentIndex < thumbnails.length - 1 ? currentIndex + 1 : 0;
            }
            
            thumbnails[nextIndex].click();
          }
        };
        
        // 當 modal 顯示時綁定鍵盤事件
        document.addEventListener('keydown', handleKeyNavigation);
        
        // 當 modal 隱藏時解除綁定
        projectModalElement.addEventListener('hidden.bs.modal', () => {
          document.removeEventListener('keydown', handleKeyNavigation);
        }, { once: true });
      } else {
        throw new Error(project?.error || "專案資料格式錯誤");
      }
    } catch (error) {
      console.error("無法載入專案詳情:", error);
      modalContent.innerHTML = `<div class="p-4 text-center d-flex flex-column justify-content-center align-items-center" style="height:100%"><p>抱歉，無法載入專案詳情。<br>${error.message}</p><button type="button" class="btn btn-secondary mt-3" data-bs-dismiss="modal">關閉</button></div>`;
    }
  }

  // 圖片庫導航函數
  function navigateGallery(direction) {
    const filmstripCapsules = document.querySelectorAll('.filmstrip-capsule');
    const activeIndex = Array.from(filmstripCapsules).findIndex(capsule => 
      capsule.classList.contains('is-active')
    );
    
    let newIndex;
    if (direction === 'next') {
      newIndex = (activeIndex + 1) % filmstripCapsules.length;
    } else {
      newIndex = activeIndex === 0 ? filmstripCapsules.length - 1 : activeIndex - 1;
    }
    
    if (filmstripCapsules[newIndex]) {
      filmstripCapsules[newIndex].click();
    }
  }

  function setupEventListeners() {
    document.body.addEventListener("click", (e) => {
      if (e.target.closest(".filter-btn")) {
        const btn = e.target.closest(".filter-btn");
        if (!btn || btn.classList.contains("active")) return;
        if (audio) audio.playClick();
        const filterContainer = document.getElementById("portfolio-filters");
        if (filterContainer && filterContainer.querySelector(".active"))
          filterContainer.querySelector(".active").classList.remove("active");
        btn.classList.add("active");
        const selectedCategory = btn.dataset.category;
        const filtered =
          selectedCategory === "all"
            ? allProjectsData
            : allProjectsData.filter(
                (p) => p.category_name === selectedCategory
              );
        gsap.to(".portfolio-list", {
          opacity: 0,
          duration: 0.4,
          onComplete: () => {
            renderProjects(filtered);
            gsap.to(".portfolio-list", { opacity: 1, duration: 0.4 });
          },
        });
      }
      if (e.target.closest(".portfolio-capsule")) {
        const capsule = e.target.closest(".portfolio-capsule");
        if (capsule) {
          trackUserInteraction('project_view', capsule.dataset.projectId);
          showProjectDetail(capsule.dataset.projectId);
        }
      }
    });
    const scrollerNav = document.querySelector(".scroller-nav");
    if (scrollerNav)
      scrollerNav.addEventListener("click", (e) => {
        if (isMobile || !scrollTween) return;
        const btn = e.target.closest(".nav-btn");
        if (!btn) return;
        const numOriginalItems =
          document.querySelectorAll(".portfolio-list .portfolio-capsule")
            .length / 2;
        const itemProgress = 1 / numOriginalItems;
        const direction = btn.classList.contains("next-btn") ? 1 : -1;
        gsap.to(scrollTween, {
          progress: scrollTween.progress() + itemProgress * direction,
          duration: 0.8,
          ease: "power2.inOut",
        });
      });

    document.body.addEventListener("submit", (e) => {
      if (e.target.matches("#contact-form")) {
        e.preventDefault();
        alert("感謝您的訊息！");
      }
    });

    // 更新主題切換事件監聽器
    eyeContainers.forEach((container) =>
      container.addEventListener("click", () => {
        toggleTheme();
        trackUserInteraction('theme_toggle', 'eye');
      })
    );

    // 加入鍵盤快捷鍵
    document.addEventListener('keydown', (e) => {
      switch(e.key) {
        case 'Escape':
          if (projectModalElement.classList.contains('show')) {
            bsModal.hide();
          }
          break;
        case 'ArrowLeft':
          if (projectModalElement.classList.contains('show')) {
            navigateGallery('prev');
          }
          break;
        case 'ArrowRight':
          if (projectModalElement.classList.contains('show')) {
            navigateGallery('next');
          }
          break;
        case 't':
        case 'T':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            toggleTheme();
            trackUserInteraction('theme_toggle', 'keyboard');
          }
          break;
      }
    });

    projectModalElement.addEventListener("hide.bs.modal", () => {
      if (audio) audio.playClose();
      if (lightbox) {
        lightbox.destroy();
        lightbox = null;
      }
      // 修正 ARIA 問題
      projectModalElement.setAttribute('aria-hidden', 'true');
      projectModalElement.removeAttribute('aria-modal');
    });
  }

  // ===============================================
  // ==== 8. 初始化 ====
  // ===============================================
  async function init() {
    try {
      // 初始化主題
      initializeTheme();
      
      // 修復滾動問題
      setupScrollFix();
      
      // UI/UX 增強功能
      setupScrollProgress();
      setupFloatingActions();
      setupTimelineAnimation();
      enhanceLoadingStates();
      
      setupLoadingScreen();
      generateAccordionContent();
      setupCustomCursor();
      setupParticles();
      setupEyeTrackingAndBlinking();
      setupTypingEffect();
      setupEventListeners();
      await loadProjectsAndSetup();
      
      // 在專案載入完成後設置搜索
      setupSearch();
      
    } catch (error) {
      console.error('Portfolio initialization failed:', error);
      showErrorMessage('作品集載入時發生錯誤，請重新整理頁面。');
    }
  }

  // 修復滾動問題
  function setupScrollFix() {
    // 確保滾動始終可用
    let scrollTimer;
    
    // 強制滾動修復函數
    const forceScrollFix = () => {
      if (body.classList.contains('loaded')) {
        body.style.overflowY = 'auto';
        document.documentElement.style.overflowY = 'auto';
        // 移除可能阻止滾動的樣式
        body.style.height = 'auto';
        body.style.minHeight = '100vh';
      }
    };

    // 監聽滾動事件，確保body保持loaded狀態
    window.addEventListener('scroll', () => {
      if (!body.classList.contains('loaded')) {
        body.classList.add('loaded');
      }
      
      // 清除之前的計時器
      clearTimeout(scrollTimer);
      
      // 設置新的計時器，確保滾動後body狀態正確
      scrollTimer = setTimeout(() => {
        forceScrollFix();
      }, 100);
    }, { passive: true });

    // 強制啟用滾動
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(forceScrollFix, 1000);
    });

    // 監聽wheel事件，確保滾動響應
    document.addEventListener('wheel', (e) => {
      if (body.classList.contains('loaded')) {
        forceScrollFix();
      }
    }, { passive: true });
    
    // 觸摸滾動支援（移動設備）
    document.addEventListener('touchmove', () => {
      if (body.classList.contains('loaded')) {
        forceScrollFix();
      }
    }, { passive: true });
    
    // 鍵盤滾動支援
    document.addEventListener('keydown', (e) => {
      if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', 'Space'].includes(e.key)) {
        if (body.classList.contains('loaded') && !e.target.closest('.modal')) {
          forceScrollFix();
        }
      }
    });

    // 窗口大小改變時修復滾動
    window.addEventListener('resize', forceScrollFix);
    
    // 定期檢查滾動狀態（作為最後的保險）
    setInterval(() => {
      if (body.classList.contains('loaded') && window.innerHeight > 0) {
        if (body.style.overflowY === 'hidden' || body.style.overflowY === '') {
          forceScrollFix();
        }
      }
    }, 2000);
  }

  // 滾動進度條
  function setupScrollProgress() {
    const progressBar = document.createElement('div');
    progressBar.className = 'scroll-progress';
    progressBar.innerHTML = '<div class="scroll-progress-bar"></div>';
    document.body.appendChild(progressBar);

    const progressFill = progressBar.querySelector('.scroll-progress-bar');

    window.addEventListener('scroll', () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = (scrollTop / scrollHeight) * 100;
      
      progressFill.style.width = `${Math.min(progress, 100)}%`;
    });
  }

  // 懸浮操作按鈕
  function setupFloatingActions() {
    const floatingActions = document.createElement('div');
    floatingActions.className = 'floating-actions';
    floatingActions.innerHTML = `
      <button class="floating-btn pulse" id="backToTop" title="回到頂部">
        ↑
      </button>
      <button class="floating-btn" id="toggleTheme" title="切換主題">
        🌙
      </button>
    `;
    document.body.appendChild(floatingActions);

    // 回到頂部功能
    document.getElementById('backToTop').addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      trackUserInteraction('back_to_top', 'floating_button');
      if (audio) audio.playClick();
    });

    // 主題切換
    document.getElementById('toggleTheme').addEventListener('click', () => {
      toggleTheme();
      trackUserInteraction('theme_toggle', 'floating_button');
      
      // 更新按鈕圖示
      const themeBtn = document.getElementById('toggleTheme');
      themeBtn.textContent = body.classList.contains('dark-mode') ? '☀️' : '🌙';
    });

    // 滾動時顯示/隱藏回到頂部按鈕
    window.addEventListener('scroll', () => {
      const backToTopBtn = document.getElementById('backToTop');
      if (window.pageYOffset > 300) {
        backToTopBtn.style.opacity = '1';
        backToTopBtn.style.visibility = 'visible';
      } else {
        backToTopBtn.style.opacity = '0';
        backToTopBtn.style.visibility = 'hidden';
      }
    });
  }

  // 成功通知
  function showSuccessMessage(message) {
    const successDiv = document.createElement('div');
    successDiv.className = 'success-toast';
    successDiv.innerHTML = `
      <div class="error-content">
        <span class="error-icon">✅</span>
        <span class="error-text">${message}</span>
        <button class="error-close">&times;</button>
      </div>
    `;
    document.body.appendChild(successDiv);

    // 關閉按鈕
    successDiv.querySelector('.error-close').addEventListener('click', () => {
      successDiv.remove();
    });

    // 自動消失
    setTimeout(() => {
      if (successDiv.parentNode) {
        successDiv.remove();
      }
    }, 4000);
  }

  // 時間軸動畫
  function setupTimelineAnimation() {
    const timelineItems = document.querySelectorAll('.timeline-item');
    
    // 檢查是否在視口中
    const checkVisibility = (item) => {
      const rect = item.getBoundingClientRect();
      const windowHeight = window.innerHeight || document.documentElement.clientHeight;
      return rect.top < windowHeight * 0.8;
    };
    
    // 初始化時立即檢查可見項目
    timelineItems.forEach(item => {
      if (checkVisibility(item)) {
        item.classList.add('animate-in');
      } else {
        item.classList.add('fade-in');
      }
    });
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.remove('fade-in');
          entry.target.classList.add('animate-in');
        }
      });
    }, { 
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    });

    timelineItems.forEach(item => {
      observer.observe(item);
    });
  }

  // 搜索功能
  function setupSearch() {
    const searchContainer = document.createElement('div');
    searchContainer.className = 'search-container';
    searchContainer.innerHTML = `
      <div style="position: relative;">
        <span class="search-icon">🔍</span>
        <input type="text" class="search-input" placeholder="搜索專案..." id="projectSearch">
      </div>
    `;

    const portfolioSection = document.querySelector('.portfolio-filters');
    if (portfolioSection) {
      portfolioSection.parentNode.insertBefore(searchContainer, portfolioSection);
    }

    // 搜索功能
    let searchTimeout;
    document.getElementById('projectSearch').addEventListener('input', (e) => {
      const searchTerm = e.target.value.toLowerCase();
      
      // 防抖處理
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        const projects = document.querySelectorAll('.portfolio-capsule');
        let visibleCount = 0;
        
        projects.forEach(project => {
          const title = project.querySelector('.capsule-title')?.textContent.toLowerCase() || '';
          const category = project.querySelector('.capsule-category')?.textContent.toLowerCase() || '';
          
          if (title.includes(searchTerm) || category.includes(searchTerm)) {
            project.style.display = 'block';
            project.style.opacity = '1';
            visibleCount++;
          } else {
            project.style.display = 'none';
            project.style.opacity = '0';
          }
        });

        // 顯示空狀態
        const portfolioList = document.querySelector('.portfolio-list');
        let emptyState = document.querySelector('.empty-state');
        
        if (visibleCount === 0 && searchTerm.length > 0) {
          if (!emptyState) {
            emptyState = document.createElement('div');
            emptyState.className = 'empty-state';
            emptyState.innerHTML = `
              <div class="empty-state-icon">🔍</div>
              <h3>沒有找到相關專案</h3>
              <p>請嘗試使用其他關鍵字搜索</p>
            `;
            portfolioList.parentNode.appendChild(emptyState);
          }
          emptyState.style.display = 'block';
        } else if (emptyState) {
          emptyState.style.display = 'none';
        }

        trackUserInteraction('search', searchTerm);
      }, 300);
    });
  }

  // 改善的載入動畫
  function enhanceLoadingStates() {
    // 為專案載入添加骨架屏
    const portfolioList = document.querySelector('.portfolio-list');
    if (portfolioList) {
      const addLoadingSkeleton = () => {
        portfolioList.innerHTML = '';
        for (let i = 0; i < 6; i++) {
          const skeleton = document.createElement('div');
          skeleton.className = 'portfolio-capsule loading-skeleton';
          skeleton.innerHTML = `
            <div style="width: 100%; height: 200px; background: #f0f0f0;"></div>
            <div style="padding: 1rem;">
              <div style="height: 20px; background: #e0e0e0; margin-bottom: 10px; border-radius: 4px;"></div>
              <div style="height: 16px; background: #e0e0e0; border-radius: 4px; width: 60%;"></div>
            </div>
          `;
          portfolioList.appendChild(skeleton);
        }
      };

      // 在專案載入時顯示骨架屏
      window.addLoadingSkeleton = addLoadingSkeleton;
    }
  }

  init();
});
