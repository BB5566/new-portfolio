document.addEventListener("DOMContentLoaded", () => {
  gsap.registerPlugin(ScrollTrigger, Observer, TextPlugin);

  // ---- DOM 元素選取 ----
  const body = document.querySelector("body");
  const loadingScreen = document.getElementById("loading-screen");
  const portfolioContainer = document.querySelector(".portfolio-container");
  const portfolioList = document.querySelector(".portfolio-list");
  const filterContainer = document.getElementById("portfolio-filters");
  const scrollerNav = document.querySelector(".scroller-nav");
  const heroContent = document.querySelector(".hero-content");
  const bsModal = new bootstrap.Modal(document.getElementById("projectModal"));
  const modalBody = document.getElementById("modal-body-content");
  const eyes = gsap.utils.toArray(".eye");
  const eyeContainers = gsap.utils.toArray(".eye-container");
  const particlesContainer = document.querySelector(".particles-container");

  // ---- 狀態變數 ----
  let allProjectsData = [];
  let isAudioReady = false;
  const isMobile = window.matchMedia("(max-width: 768px)").matches;
  let audio = null;
  let scrollTween, scrollObserver;

  // ---- 音效系統 ----
  function createAudioSystem() {
    if (audio) return audio;
    try {
      audio = {
        synth: new Tone.Synth({ volume: -12 }).toDestination(),
        playClick: () =>
          isAudioReady && audio.synth.triggerAttackRelease("G5", "16n"),
        playHover: throttle(
          () => isAudioReady && audio.synth.triggerAttackRelease("C5", "16n"),
          100
        ),
        playOpen: () =>
          isAudioReady && audio.synth.triggerAttackRelease("E4", "8n"),
        playClose: () =>
          isAudioReady && audio.synth.triggerAttackRelease("A3", "8n"),
      };
      return audio;
    } catch (e) {
      return null;
    }
  }
  async function initializeAudio() {
    if (isAudioReady) return true;
    try {
      if (typeof Tone === "undefined") return false;
      createAudioSystem();
      await Tone.start();
      isAudioReady = true;
      return true;
    } catch (e) {
      return false;
    }
  }
  function throttle(func, limit) {
    let inThrottle;
    return function (...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => (inThrottle = false), limit);
      }
    };
  }

  // ===============================================
  // ==== 1. 載入與開場動畫 ====
  // ===============================================
  // script.js
  // --- 新的 setupLoadingScreen 函式 (請使用此版本) ---
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

    gsap
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
      .to(pressStart, { duration: 0.5, opacity: 1 });

    loadingScreen.addEventListener(
      "click",
      async () => {
        if (!isAudioReady) await initializeAudio();
        if (isAudioReady && audio) audio.playClick();

        // 簡化並加固動畫時間軸
        const tl = gsap.timeline({
          onComplete: () => {
            loadingScreen.style.display = "none";
            body.classList.add("loaded");
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

        // 將所有元素的進場動畫改為更可靠的 .to()
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
  // ==== 2. HERO & 滾動動畫 ====
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
    gsap.utils.toArray(".skill-card").forEach((elem) => {
      gsap.from(elem, {
        scrollTrigger: {
          trigger: elem,
          start: "top 85%",
          toggleActions: "play none none none",
        },
        opacity: 0,
        y: 30,
        duration: 0.6,
        ease: "power2.out",
      });
    });
    const timeline = document.querySelector(".timeline");
    if (timeline) {
      gsap.from(timeline.querySelectorAll(".timeline-item"), {
        scrollTrigger: { trigger: timeline, start: "top 80%" },
        stagger: 0.3,
        opacity: 0,
        y: 20,
      });
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
  }

  // ===============================================
  // ==== 3. 互動效果 (眼球, 打字, 滑鼠, 粒子) ====
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
    let messageIndex = 0;
    let charIndex = 0;
    let isDeleting = false;

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
    setTimeout(typeText, 1000);
  }

  function setupCustomCursor() {
    if (isMobile) return;
    const cursorDot = document.querySelector(".cursor-dot");
    const cursorOutline = document.querySelector(".cursor-dot-outline");
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
        "a, button, .accordion-button, .portfolio-capsule, .name-container, .eye-container, .btn-close"
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
      const size = gsap.utils.random(2, 8);
      const isFar = size < 4;
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
  // ==== 5. 作品集渲染與動畫 ====
  // ===============================================
  function renderProjects(projectsToRender) {
    portfolioList.innerHTML = "";
    if (projectsToRender.length > 0) {
      projectsToRender.forEach((project) => {
        const mediaUrl = project.preview_media_url;
        let mediaElement =
          mediaUrl && (mediaUrl.endsWith(".mp4") || mediaUrl.endsWith(".webm"))
            ? `<video src="${mediaUrl}" autoplay loop muted playsinline class="capsule-media"></video>`
            : `<img src="${mediaUrl || "https://placehold.co/400x300"}" alt="${
                project.title
              } preview" class="capsule-media">`;
        const capsule = document.createElement("div");
        capsule.className = "portfolio-capsule";
        capsule.dataset.projectId = project.id;
        capsule.innerHTML = `${mediaElement}<div class="capsule-overlay"><h4 class="capsule-title">${project.title}</h4></div>`;
        portfolioList.appendChild(capsule);
      });
    } else {
      portfolioList.innerHTML = "<p>沒有符合篩選條件的專案。</p>";
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

    const items = portfolioList.querySelectorAll(".portfolio-capsule");
    if (!items || items.length < 3) {
      gsap.set(portfolioList, { x: 0 });
      scrollerNav.style.display = "none";
      return;
    }

    scrollerNav.style.display = "flex";

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
  // ==== 6. 資料獲取與事件監聽 ====
  // ===============================================
  async function loadProjectsAndSetup() {
    try {
      const response = await fetch("api/get_projects.php");
      if (!response.ok) throw new Error(`API 請求失敗`);
      allProjectsData = await response.json();
      renderProjects(allProjectsData);
      const categories = [
        "all",
        ...new Set(
          allProjectsData.map((p) => p.category_name).filter((c) => c)
        ),
      ];
      if (categories.length > 2) {
        filterContainer.innerHTML = categories
          .map(
            (c) =>
              `<button class="filter-btn ${
                c === "all" ? "active" : ""
              }" data-category="${c}">${c === "all" ? "全部" : c}</button>`
          )
          .join("");
      }
    } catch (error) {
      console.error("專案載入失敗:", error);
      if (portfolioList)
        portfolioList.innerHTML = "<p>專案載入失敗，請稍後再試。</p>";
    }
  }
  async function showProjectDetail(projectId) {
    if (audio) audio.playOpen();
    bsModal.show();
    modalBody.innerHTML =
      '<div class="d-flex justify-content-center p-5"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading...</span></div></div>';
    try {
      const response = await fetch(
        `api/get_project_detail.php?id=${projectId}`
      );
      if (!response.ok) throw new Error(`API 錯誤`);
      const project = await response.json();
      if (project && !project.error) {
        const tagsHtml = project.tags?.length
          ? `<div class="modal-tags">${project.tags
              .map((tag) => `<span class="modal-tag">${tag.name}</span>`)
              .join("")}</div>`
          : "";
        modalBody.innerHTML = `
                    <div class="project-detail-content">
                        <img src="${project.cover_image_url || ""}" alt="${
          project.title
        }" class="modal-cover-image">
                        <div class="project-detail-info">
                            <span class="modal-category">${
                              project.category_name
                            }</span>
                            <h3 class="mt-2">${project.title}</h3>
                            ${tagsHtml}
                            <p class="modal-description">${project.description.replace(
                              /\n/g,
                              "<br>"
                            )}</p>
                            ${
                              project.project_link
                                ? `<a href="${project.project_link}" class="cta-button" target="_blank" rel="noopener noreferrer">查看專案</a>`
                                : ""
                            }
                        </div>
                    </div>`;
        gsap.from(".modal-cover-image", {
          y: 30,
          opacity: 0,
          duration: 0.5,
          delay: 0.2,
        });
        gsap.from(".project-detail-info > *", {
          y: 20,
          opacity: 0,
          duration: 0.4,
          stagger: 0.1,
          delay: 0.4,
        });
      } else {
        throw new Error(project?.error || "專案資料格式錯誤");
      }
    } catch (error) {
      modalBody.innerHTML = `<p>抱歉，無法載入專案詳情。</p>`;
    }
  }

  function setupEventListeners() {
    filterContainer?.addEventListener("click", (event) => {
      const btn = event.target.closest("button");
      if (!btn || btn.classList.contains("active")) return;
      if (audio) audio.playClick();
      filterContainer.querySelector(".active")?.classList.remove("active");
      btn.classList.add("active");
      const selectedCategory = btn.dataset.category;
      const filtered =
        selectedCategory === "all"
          ? allProjectsData
          : allProjectsData.filter((p) => p.category_name === selectedCategory);
      gsap.to(portfolioList, {
        opacity: 0,
        duration: 0.4,
        onComplete: () => {
          renderProjects(filtered);
          gsap.to(portfolioList, { opacity: 1, duration: 0.4 });
        },
      });
    });
    portfolioList?.addEventListener("click", (e) => {
      const capsule = e.target.closest(".portfolio-capsule");
      if (capsule) {
        showProjectDetail(capsule.dataset.projectId);
      }
    });
    scrollerNav?.addEventListener("click", (e) => {
      if (isMobile || !scrollTween) return;
      const btn = e.target.closest(".nav-btn");
      if (!btn) return;
      const numOriginalItems =
        portfolioList.querySelectorAll(".portfolio-capsule").length / 2;
      const itemProgress = 1 / numOriginalItems;
      const direction = btn.classList.contains("next-btn") ? 1 : -1;
      gsap.to(scrollTween, {
        progress: scrollTween.progress() + itemProgress * direction,
        duration: 0.8,
        ease: "power2.inOut",
      });
    });
    document.getElementById("contact-form")?.addEventListener("submit", (e) => {
      e.preventDefault(); /* ... */
    });
    eyeContainers.forEach((container) =>
      container.addEventListener("click", () => {
        body.classList.toggle("dark-mode");
        body.classList.toggle("light-mode");
        if (audio) audio.playClick();
      })
    );
  }

  // ===============================================
  // ==== 7. 初始化 ====
  // ===============================================
  setupLoadingScreen();
  setupEyeTrackingAndBlinking();
  setupTypingEffect();
  setupCustomCursor();
  setupParticles();
  loadProjectsAndSetup();
  setupEventListeners();
});
