/**
 * @file 作品集網站主要腳本 - 重構版本
 * @author Bob Tsou
 * @version 10.0.0 (重構版本)
 * @description 學生友善的簡化版本，使用 GSAP 動畫庫，採用函式結構
 * @lastModified 2025-09-06
 */

// ================================================
// 1. 全域變數與 DOM 元素引用
// ================================================

let allProjectsData = []; // 儲存所有作品資料
let projectModal = null; // Bootstrap 模態框實例
let lightbox = null; // GLightbox 實例
let isMobile = window.matchMedia("(max-width: 768px)").matches; // 判斷是否為手機螢幕

// DOM 元素引用
const elements = {
  body: document.querySelector("body"),
  heroContent: document.querySelector(".hero-content"),
  particlesContainer: document.querySelector(".particles-container"),
  eyes: document.querySelectorAll(".eye"),
  eyeContainers: document.querySelectorAll(".eye-container"),
  projectModalElement: document.getElementById("projectModal"),
  typingText: document.getElementById("typing-text"),
  portfolioList: document.querySelector(".portfolio-list"),
  portfolioFilters: document.getElementById("portfolio-filters")
};

// ================================================
// 2. 工具函數
// ================================================

/**
 * 防抖函數 - 用於限制函數執行頻率
 * @param {Function} func - 要執行的函數
 * @param {number} delay - 延遲時間(毫秒)
 */
function debounce(func, delay = 250) {
  let timeoutId;
  return function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(this, args), delay);
  };
}

/**
 * 節流函數 - 用於控制高頻事件
 * @param {Function} func - 要執行的函數
 * @param {number} limit - 限制間隔(毫秒)
 */
function throttle(func, limit = 16) {
  let inThrottle = false;
  return function (...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      requestAnimationFrame(() => inThrottle = false);
    }
  };
}

/**
 * 安全的 URL 編碼處理
 * @param {string} url - 要處理的 URL
 */
function safeEncodeUrl(url) {
  if (!url) return "";
  try {
    return encodeURI(url.trim());
  } catch (e) {
    return url;
  }
}

/**
 * HTML 轉義 - 防止 XSS 攻擊
 * @param {string} text - 要轉義的文字
 */
function escapeHtml(text) {
  if (!text) return "";
  const map = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}

// ================================================
// 3. GSAP 初始化與 Hero 動畫
// ================================================

/**
 * 檢查 GSAP 是否準備就緒
 */
function checkGsapReady() {
  return (
    typeof gsap !== "undefined" &&
    typeof ScrollTrigger !== "undefined" &&
    typeof TextPlugin !== "undefined"
  );
}

/**
 * Hero 區塊動畫 - 使用 GSAP 製作入場動畫
 */
function animateHero() {
  console.log("開始播放 Hero 區塊動畫");

  // 姓名文字動畫 - 使用 stagger 屬性來產生錯開效果
  gsap.to(".name-line > span, .eye-container", {
    delay: 0.2, // 延遲 0.2 秒開始
    duration: 0.8, // 動畫持續 0.8 秒
    y: 0, // 垂直位移歸零
    opacity: 1, // 透明度變為完全不透明
    scale: 1, // 縮放恢復正常
    stagger: 0.06, // stagger: 每個元素之間間隔 0.06 秒播放
    ease: "back.out(1.2)" // ease: 回彈效果的緩動曲線
  });

  // 個人照片動畫 - 使用彈性效果
  gsap.to(".profile-photo", {
    delay: 0.4,
    duration: 0.9,
    y: 0,
    scale: 1,
    opacity: 1,
    ease: "elastic.out(1, 0.6)" // elastic: 彈性緩動，數值越大彈性越強
  });

  // 標語容器動畫
  gsap.to(".tagline-capsule", {
    delay: 0.6,
    duration: 0.8,
    y: 0,
    scale: 1,
    opacity: 1,
    ease: "power3.out" // power3: 三次方緩動，out 表示結尾放慢
  });

  // 操作按鈕動畫 - 錯開顯示
  gsap.to(".profile-actions a", {
    delay: 0.8,
    duration: 0.6,
    y: 0,
    opacity: 1,
    scale: 1,
    stagger: 0.08, // 每個按鈕間隔 0.08 秒
    ease: "power2.out"
  });

  // 滾動指示器動畫，完成後啟動呼吸動畫
  gsap.to(".scroll-down-indicator", {
    delay: 1.2,
    duration: 0.8,
    opacity: 1,
    ease: "power3.out",
    onComplete: () => {
      // 呼吸動畫 - 持續上下浮動
      gsap.to(".scroll-down-indicator", {
        y: -8,
        duration: 1.5,
        ease: "sine.inOut", // sine: 正弦波緩動，讓動畫更自然
        repeat: -1, // repeat: -1 表示無限重複
        yoyo: true // yoyo: 動畫來回播放，像溜溜球一樣
      });
    }
  });
}

/**
 * 初始化 GSAP 與插件
 */
function initializeGsap() {
  if (!checkGsapReady()) {
    console.error("GSAP 載入失敗");
    return;
  }

  // 註冊 GSAP 插件
  gsap.registerPlugin(ScrollTrigger, TextPlugin);
  
  // 立即播放 Hero 動畫
  animateHero();
  
  console.log("GSAP 初始化成功");
}

// ================================================
// 4. 主題切換功能
// ================================================

/**
 * 設定主題 - 讀取儲存的主題或使用系統偏好
 */
function setupTheme() {
  // 檢查用戶的系統主題偏好
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  
  // 從本地儲存讀取之前儲存的主題
  const savedTheme = localStorage.getItem("portfolio-theme");

  if (savedTheme) {
    elements.body.className = savedTheme;
  } else if (prefersDark) {
    elements.body.className = "dark-mode";
  } else {
    elements.body.className = "light-mode";
  }
}

/**
 * 切換主題 - 在明亮與深色模式間切換
 */
function toggleTheme() {
  const newTheme = elements.body.classList.contains("light-mode") 
    ? "dark-mode" 
    : "light-mode";
  
  elements.body.className = newTheme;
  localStorage.setItem("portfolio-theme", newTheme);
  
  console.log(`主題已切換為: ${newTheme}`);
}

// ================================================
// 5. 視窗高度修正 (行動裝置優化)
// ================================================

/**
 * 修正行動裝置視窗高度問題
 */
function fixViewportHeight() {
  const setViewportHeight = () => {
    // 獲取真實的視窗高度
    const windowHeight = window.innerHeight;
    const vh = windowHeight * 0.01;

    // 設置 CSS 自定義屬性 - 用於替代 100vh
    document.documentElement.style.setProperty("--vh", `${vh}px`);

    // 直接設置 hero 區塊高度
    if (elements.heroContent) {
      elements.heroContent.style.height = `${windowHeight}px`;
      elements.heroContent.style.minHeight = `${windowHeight}px`;
    }

    // 當視窗高度變化時，重新計算 ScrollTrigger
    if (typeof ScrollTrigger !== "undefined") {
      ScrollTrigger.refresh();
    }
  };

  // 初始設置
  setViewportHeight();

  // 監聽視窗變化事件
  window.addEventListener("resize", debounce(setViewportHeight, 50));
  
  // 監聽螢幕方向變化
  window.addEventListener("orientationchange", () => {
    setTimeout(setViewportHeight, 150);
  });
}

// ================================================
// 6. 滾動相關功能
// ================================================

/**
 * 設定滾動進度條
 */
function setupScrollProgress() {
  // 創建進度條元素
  const progressBar = document.createElement("div");
  progressBar.className = "scroll-progress";
  progressBar.innerHTML = '<div class="scroll-progress__bar"></div>';
  document.body.appendChild(progressBar);

  const progressFill = progressBar.querySelector(".scroll-progress__bar");

  // 滾動事件處理 - 使用節流來提升性能
  window.addEventListener("scroll", throttle(() => {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
    
    // 計算滾動進度百分比
    const progress = (scrollTop / scrollHeight) * 100;
    progressFill.style.width = `${Math.min(progress, 100)}%`;
  }, 16)); // 16ms ≈ 60fps
}

/**
 * 設定浮動操作按鈕
 */
function setupFloatingActions() {
  // 創建浮動按鈕容器
  const floatingActions = document.createElement("div");
  floatingActions.className = "floating-actions";
  floatingActions.innerHTML = `
    <button class="floating-btn" id="backToTop" title="回到頂部">
      ↑
    </button>
    <button class="floating-btn" id="toggleTheme" title="切換主題">
      🌙
    </button>
  `;
  document.body.appendChild(floatingActions);

  // 回到頂部按鈕功能
  document.getElementById("backToTop").addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    console.log("用戶點擊回到頂部");
  });

  // 主題切換按鈕功能
  document.getElementById("toggleTheme").addEventListener("click", () => {
    toggleTheme();
    
    // 更新按鈕圖示
    const themeBtn = document.getElementById("toggleTheme");
    themeBtn.textContent = elements.body.classList.contains("dark-mode") ? "☀️" : "🌙";
  });

  // 滾動時顯示/隱藏按鈕
  window.addEventListener("scroll", throttle(() => {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const backToTopBtn = document.getElementById("backToTop");
    
    if (scrollTop > 300) {
      backToTopBtn.style.opacity = "1";
      backToTopBtn.style.visibility = "visible";
    } else {
      backToTopBtn.style.opacity = "0";
      backToTopBtn.style.visibility = "hidden";
    }
  }, 16));
}

// ================================================
// 7. 互動效果
// ================================================

/**
 * 設定眼睛跟隨滑鼠效果 (僅限桌面版)
 */
function setupEyeTracking() {
  if (isMobile) return; // 手機跳過此效果

  // 使用 GSAP 的 quickTo 提升性能
  const xTo = gsap.quickTo(elements.eyes, "x", {
    duration: 0.4,
    ease: "power2"
  });
  const yTo = gsap.quickTo(elements.eyes, "y", {
    duration: 0.4,
    ease: "power2"
  });

  // 滑鼠移動事件
  elements.heroContent.addEventListener("mousemove", (e) => {
    const { clientX, clientY } = e;
    
    // 計算眼球移動範圍 (-10 到 10 像素)
    xTo((clientX / window.innerWidth) * 20 - 10);
    yTo((clientY / window.innerHeight) * 10 - 5);
  });

  // 設定眨眼動畫
  setupBlinking();
}

/**
 * 設定眨眼動畫
 */
function setupBlinking() {
  function blink() {
    gsap.to(elements.eyes, {
      duration: 0.05,
      scaleY: 0.1, // 垂直壓縮模擬眨眼
      repeat: 1, // 重複一次 (一開一合)
      yoyo: true, // 來回播放
      ease: "power2.inOut",
      onComplete: () => {
        // 隨機間隔 2-8 秒後再次眨眼
        gsap.delayedCall(gsap.utils.random(2, 8), blink);
      }
    });
  }
  
  // 首次眨眼延遲 2-5 秒
  gsap.delayedCall(gsap.utils.random(2, 5), blink);
}

/**
 * 設定打字機效果
 */
function setupTypingEffect() {
  if (!elements.typingText) return;

  const messages = [
    "Web & UI/UX Designer",
    "Front-End Developer", 
    "雙重優勢，雙倍價值",
    "熱衷於打造商業產品"
  ];

  let messageIndex = 0;
  let charIndex = 0;
  let isDeleting = false;

  function typeText() {
    const currentMessage = messages[messageIndex];

    if (isDeleting) {
      // 刪除字符
      elements.typingText.textContent = currentMessage.substring(0, charIndex - 1);
      charIndex--;
    } else {
      // 添加字符
      elements.typingText.textContent = currentMessage.substring(0, charIndex + 1);
      charIndex++;
    }

    // 決定下次執行的時間間隔
    let typeSpeed = isDeleting ? 40 : 100;

    if (!isDeleting && charIndex === currentMessage.length) {
      // 打完一句，暫停 2 秒後開始刪除
      typeSpeed = 2000;
      isDeleting = true;
    } else if (isDeleting && charIndex === 0) {
      // 刪完了，切換到下一句
      isDeleting = false;
      messageIndex = (messageIndex + 1) % messages.length;
      typeSpeed = 500;
    }

    setTimeout(typeText, typeSpeed);
  }

  // 延遲 1.5 秒開始打字
  setTimeout(typeText, 1500);
}

/**
 * 設定粒子背景動畫
 */
function setupParticles() {
  if (!elements.particlesContainer) return;

  // 創建 30 個粒子
  for (let i = 0; i < 30; i++) {
    const size = gsap.utils.random(2, 8); // 隨機大小
    const isFar = size < 4; // 小粒子視為遠景
    
    const particle = document.createElement("div");
    particle.classList.add("particle");

    // 設定粒子初始位置和樣式
    gsap.set(particle, {
      width: size,
      height: size,
      x: gsap.utils.random(0, window.innerWidth),
      y: gsap.utils.random(0, window.innerHeight),
      opacity: isFar ? 0.3 : 0.6, // 遠景粒子較透明
      scale: isFar ? 0.8 : 1.2
    });

    elements.particlesContainer.appendChild(particle);

    // 粒子向上飄動動畫
    gsap.to(particle, {
      y: -window.innerHeight, // 移動到螢幕上方
      duration: gsap.utils.random(15, 30), // 隨機持續時間
      repeat: -1, // 無限重複
      ease: "none", // 線性運動
      delay: -15 // 負延遲讓粒子立即開始，避免空白期
    });
  }
}

// ================================================
// 8. Hero 區塊波浪過渡效果
// ================================================

/**
 * 設定 Hero 區塊的波浪過渡動畫
 */
function setupHeroTransition() {
  const wave = document.querySelector("#wave-path");
  if (!wave) return;

  // 定義波浪的初始路徑
  const initialPath = "M0,60 C400,100 800,100 1200,60 L1200,120 L0,120 Z";

  // 使用 ScrollTrigger 創建滾動驅動的波浪變形
  ScrollTrigger.create({
    trigger: ".hero-content",
    start: "top top",
    end: "bottom top",
    scrub: 1.2, // scrub: 數值越大，動畫與滾動的同步越平滑
    onUpdate: (self) => {
      const progress = self.progress; // 滾動進度 (0-1)
      const curve = 100 - progress * 40; // 計算曲線彎曲度
      
      // 動態生成 SVG 路徑
      const pathData = `M0,60 C400,${curve} 800,${curve} 1200,60 L1200,120 L0,120 Z`;
      
      // 使用 GSAP 平滑更新路徑
      gsap.to(wave, {
        attr: { d: pathData },
        ease: "power1.out",
        duration: 0.1
      });
    },
    // 重要: 向上滾動時恢復原始狀態
    onLeaveBack: () => {
      gsap.to(wave, {
        attr: { d: initialPath },
        duration: 0.3,
        ease: "power2.out"
      });
    }
  });

  // 滾動指示器淡出效果
  gsap.to(".scroll-down-indicator", {
    scrollTrigger: {
      trigger: ".hero-content",
      start: "top top",
      end: "+=150",
      onUpdate: (self) => {
        // 根據滾動進度調整透明度和位置
        gsap.set(".scroll-down-indicator", {
          opacity: 1 - self.progress,
          y: self.progress * -20
        });
      }
    }
  });
}

// ================================================
// 9. 滾動觸發動畫
// ================================================

/**
 * 設定 ScrollTrigger 動畫
 */
function setupScrollTriggers() {
  // 技能區塊和時間軸項目的入場動畫
  const animatedElements = gsap.utils.toArray(".skill-group, .timeline-item");
  
  animatedElements.forEach((el) => {
    gsap.from(el, {
      scrollTrigger: {
        trigger: el,
        start: "top 90%", // 當元素頂部滾動到視窗 90% 位置時觸發
        toggleActions: "play none none none" // 只播放一次，不重複
      },
      opacity: 0,
      y: 40, // 從下方 40px 滑入
      duration: 0.6,
      ease: "power2.out"
    });
  });

  // 技能膠囊的錯開動畫
  gsap.fromTo(".skill-capsule", 
    {
      opacity: 0,
      y: 20,
      scale: 0.8,
      rotation: -5 // 初始旋轉角度
    },
    {
      opacity: 1,
      y: 0,
      scale: 1,
      rotation: 0,
      duration: 0.8,
      stagger: {
        amount: 1.2, // 總錯開時間
        from: "random" // 隨機順序出現
      },
      ease: "back.out(1.7)", // 回彈效果
      scrollTrigger: {
        trigger: ".skills-grid",
        start: "top 80%",
        toggleActions: "play none none reverse"
      }
    }
  );

  // 作品集項目的 3D 翻轉動畫
  const portfolioCapsules = document.querySelectorAll(".portfolio-capsule");
  if (portfolioCapsules.length > 0) {
    gsap.fromTo(".portfolio-capsule",
      {
        opacity: 0,
        y: 50,
        rotationX: 45, // X 軸旋轉
        rotationY: 45, // Y 軸旋轉
        scale: 0.8
      },
      {
        opacity: 1,
        y: 0,
        rotationX: 0,
        rotationY: 0,
        scale: 1,
        duration: 1,
        stagger: 0.2, // 每個項目間隔 0.2 秒
        ease: "power3.out",
        scrollTrigger: {
          trigger: ".portfolio-list",
          start: "top 85%",
          toggleActions: "play none none reverse"
        }
      }
    );
  }

  // 時間軸項目的彈跳動畫
  gsap.fromTo(".timeline-item",
    {
      opacity: 0,
      x: -50,
      scale: 0.9
    },
    {
      opacity: 1,
      x: 0,
      scale: 1,
      duration: 0.8,
      stagger: 0.15,
      ease: "elastic.out(1, 0.8)", // 彈性緩動
      scrollTrigger: {
        trigger: ".timeline",
        start: "top 80%",
        toggleActions: "play none none reverse"
      }
    }
  );
}

// ================================================
// 10. 作品集功能
// ================================================

/**
 * 載入並設定作品集
 */
async function loadPortfolio() {
  try {
    console.log("開始載入作品集資料...");
    
    const response = await fetch("api/get_projects.php");
    if (!response.ok) {
      throw new Error(`API 請求失敗，狀態碼: ${response.status}`);
    }

    allProjectsData = await response.json();
    
    // 渲染作品集項目
    renderProjects(allProjectsData);
    
    // 設定篩選器
    setupFilters();
    
    console.log(`成功載入 ${allProjectsData.length} 個作品`);
    
  } catch (error) {
    console.error("作品集載入失敗:", error);
    
    if (elements.portfolioList) {
      elements.portfolioList.innerHTML = "<p>作品集載入失敗，請稍後再試。</p>";
    }
  }
}

/**
 * 渲染作品集項目 (Grid 佈局)
 * @param {Array} projectsToRender - 要渲染的作品陣列
 */
function renderProjects(projectsToRender) {
  if (!elements.portfolioList) return;

  elements.portfolioList.innerHTML = "";

  if (projectsToRender.length > 0) {
    projectsToRender.forEach((project) => {
      // 處理預覽媒體 URL
      const rawUrl = (project.preview_media_url || "").trim();
      const urlForExt = rawUrl.split("?")[0].toLowerCase();
      const isVideo = urlForExt.endsWith(".mp4") || 
                     urlForExt.endsWith(".webm") || 
                     urlForExt.startsWith("data:video");
      const safeUrl = rawUrl ? safeEncodeUrl(rawUrl) : safeEncodeUrl("uploads/placeholder.svg");

      // 生成媒體元素 HTML
      let mediaElement = isVideo
        ? `<video src="${safeUrl}" autoplay loop muted playsinline class="capsule-media"></video>`
        : `<img src="${safeUrl}" alt="${project.title} preview" class="capsule-media" loading="lazy">`;

      // 創建作品膠囊
      const capsule = document.createElement("div");
      capsule.className = "portfolio-capsule";
      capsule.dataset.projectId = project.id;
      capsule.innerHTML = `
        ${mediaElement}
        <div class="capsule-overlay">
          <h4 class="capsule-title">${escapeHtml(project.title)}</h4>
          <span class="capsule-category">${escapeHtml(project.category_name || "")}</span>
        </div>
      `;

      elements.portfolioList.appendChild(capsule);

      // 移除重複的事件綁定 - 統一由事件委託處理
      // capsule.addEventListener("click", () => {
      //   showProjectModal(capsule.dataset.projectId);
      // });
    });
  } else {
    elements.portfolioList.innerHTML = "<p>沒有符合篩選條件的作品。</p>";
  }
}

/**
 * 設定作品集篩選器
 */
function setupFilters() {
  if (!elements.portfolioFilters) return;

  // 取得所有不重複的分類
  const categories = ["all", ...new Set(allProjectsData.map(p => p.category_name).filter(c => c))];

  if (categories.length > 2) {
    elements.portfolioFilters.innerHTML = categories
      .map(c => `
        <button class="filter-btn ${c === "all" ? "active" : ""}" data-category="${c}">
          ${c === "all" ? "全部作品" : c}
        </button>
      `)
      .join("");
  }
}

/**
 * 處理篩選器點擊
 * @param {Event} event - 點擊事件
 */
function handleFilterClick(event) {
  const btn = event.target.closest(".filter-btn");
  if (!btn || btn.classList.contains("active")) return;

  // 更新按鈕狀態
  const currentActive = elements.portfolioFilters.querySelector(".active");
  if (currentActive) currentActive.classList.remove("active");
  btn.classList.add("active");

  // 篩選作品
  const selectedCategory = btn.dataset.category;
  const filtered = selectedCategory === "all" 
    ? allProjectsData 
    : allProjectsData.filter(p => p.category_name === selectedCategory);

  // 使用 GSAP 動畫切換
  gsap.to(elements.portfolioList, {
    opacity: 0,
    duration: 0.4,
    onComplete: () => {
      renderProjects(filtered);
      gsap.to(elements.portfolioList, { opacity: 1, duration: 0.4 });
    }
  });

  console.log(`篩選分類: ${selectedCategory}, 顯示 ${filtered.length} 個作品`);
}

// ================================================
// 11. 專案模態框
// ================================================

// 防止重複請求的變數
let isModalLoading = false;
let lastRequestTime = 0;

/**
 * 顯示專案詳情模態框
 * @param {string} projectId - 專案 ID
 */
async function showProjectModal(projectId) {
  // 防止重複快速點擊
  if (isModalLoading) {
    console.log("專案詳情載入中，請稍候...");
    return;
  }

  // 限制請求頻率（至少間隔 500ms）
  const currentTime = Date.now();
  const timeSinceLastRequest = currentTime - lastRequestTime;
  if (timeSinceLastRequest < 500) {
    console.log("請求過於頻繁，請稍後再試");
    return;
  }

  // 檢查模態框是否已經顯示，如果是則先關閉
  if (projectModal && elements.projectModalElement.classList.contains('show')) {
    console.log("模態框已開啟，先關閉再重新開啟");
    projectModal.hide();
    await new Promise(resolve => setTimeout(resolve, 300)); // 等待關閉動畫完成
  }

  console.log(`顯示專案詳情: ${projectId}`);
  isModalLoading = true;
  lastRequestTime = currentTime;

  const modalContent = elements.projectModalElement.querySelector(".modal-content");
  
  // 顯示載入狀態
  modalContent.innerHTML = `
    <div class="modal-loading">
      <div class="spinner"></div>
      <div class="loading-text">載入專案資料中...</div>
    </div>
  `;

  projectModal.show();

  try {
    // 添加延遲避免 API 429 錯誤
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const response = await fetch(`api/get_project_detail.php?id=${projectId}`, {
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });
    
    if (!response.ok) {
      if (response.status === 429) {
        throw new Error("請求過於頻繁，請稍後再試");
      }
      throw new Error(`API 請求失敗 (${response.status})`);
    }

    const project = await response.json();
    if (project && !project.error) {
      renderModalContent(project, modalContent);
    } else {
      throw new Error(project?.error || "專案資料格式錯誤");
    }
  } catch (error) {
    console.error("無法載入專案詳情:", error);
    modalContent.innerHTML = `
      <div class="p-4 text-center">
        <h5>載入失敗</h5>
        <p>抱歉，無法載入專案詳情。</p>
        <p class="text-muted small">${escapeHtml(error.message)}</p>
        <button type="button" class="btn btn-primary mt-3" onclick="showProjectModal('${projectId}')">重試</button>
        <button type="button" class="btn btn-secondary mt-3 ms-2" data-bs-dismiss="modal">關閉</button>
      </div>
    `;
  } finally {
    isModalLoading = false;
  }
}

/**
 * 渲染模態框內容
 * @param {Object} project - 專案資料
 * @param {Element} modalContent - 模態框內容容器
 */
function renderModalContent(project, modalContent) {
  // 處理圖片資料
  let allImages = [];
  if (project.cover_image_url) {
    allImages.push({ url: project.cover_image_url, caption: "封面主圖" });
  }
  if (project.gallery?.length) {
    project.gallery.forEach(img => {
      allImages.push({ url: img.image_url, caption: img.caption || "" });
    });
  }

  // 生成圖片展示 HTML
  const stageHTML = allImages
    .map((img, index) => `
      <img src="${safeEncodeUrl(img.url)}" 
           alt="${img.caption}" 
           class="stage-media ${index === 0 ? "is-active" : ""}" 
           data-index="${index}" 
           data-caption="${escapeHtml(img.caption)}"
           loading="lazy">
    `)
    .join("");

  // 生成縮圖導航 HTML
  const filmstripHTML = allImages.length > 1 ? `
    <div class="showcase-filmstrip">
      <div class="filmstrip-nav">
        ${allImages.map((img, index) => `
          <div class="filmstrip-capsule ${index === 0 ? "is-active" : ""}" 
               data-index="${index}">
            <img src="${safeEncodeUrl(img.url)}" alt="thumbnail ${index + 1}" loading="lazy">
          </div>
        `).join("")}
      </div>
    </div>
  ` : "";

  // 生成連結按鈕 HTML
  const ctaHTML = (project.project_link || project.github_link) ? `
    <div class="info-module">
      <h5 class="module-title">相關連結</h5>
      <div class="modal-cta-buttons">
        ${project.project_link ? `
          <a href="${project.project_link}" class="cta-button" target="_blank" rel="noopener noreferrer">
            <span>🚀</span> Live Demo
          </a>
        ` : ""}
        ${project.github_link ? `
          <a href="${project.github_link}" class="cta-button secondary" target="_blank" rel="noopener noreferrer">
            <span>💻</span> GitHub Repo
          </a>
        ` : ""}
      </div>
    </div>
  ` : "";

  // 生成技術標籤 HTML
  const tagsHTML = project.tags?.length ? `
    <div class="info-module">
      <h5 class="module-title">技術與工具</h5>
      <div class="modal-tags">
        ${project.tags.map(tag => `
          <span class="modal-tag">${tag.name}</span>
        `).join("")}
      </div>
    </div>
  ` : "";

  // 組合完整的模態框 HTML
  const finalHTML = `
    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="關閉"></button>
    <div class="modal-body-content">
      <div class="interactive-showcase">
        <div class="showcase-stage">
          ${stageHTML}
          ${allImages.length > 1 ? `
            <button class="stage-nav stage-nav-prev" type="button">&#10094;</button>
            <button class="stage-nav stage-nav-next" type="button">&#10095;</button>
          ` : ""}
          <div class="stage-caption"></div>
        </div>
        ${filmstripHTML}
        <div class="showcase-info-panel">
          <div class="info-header">
            <span class="category-badge">${project.category_name || "分類"}</span>
            <h3 class="main-title">${project.title}</h3>
          </div>
          <div class="info-grid">
            <div class="info-module modal-description">
              ${project.description.replace(/\n/g, "<br>")}
            </div>
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
  setupModalInteractions(modalContent, allImages);
}

/**
 * 設定模態框互動功能
 * @param {Element} modalContent - 模態框內容容器
 * @param {Array} allImages - 所有圖片資料
 */
function setupModalInteractions(modalContent, allImages) {
  const thumbnails = modalContent.querySelectorAll(".filmstrip-capsule");
  const prevBtn = modalContent.querySelector(".stage-nav-prev");
  const nextBtn = modalContent.querySelector(".stage-nav-next");

  // 縮圖點擊事件
  thumbnails.forEach(thumb => {
    thumb.addEventListener("click", () => {
      const activeIndex = thumb.dataset.index;
      
      // 更新舞台圖片
      const currentActive = modalContent.querySelector(".stage-media.is-active");
      const newActive = modalContent.querySelector(`.stage-media[data-index="${activeIndex}"]`);
      
      if (currentActive) currentActive.classList.remove("is-active");
      newActive.classList.add("is-active");

      // 更新縮圖狀態
      const currentThumb = modalContent.querySelector(".filmstrip-capsule.is-active");
      if (currentThumb) currentThumb.classList.remove("is-active");
      thumb.classList.add("is-active");

      // 更新圖說
      const captionEl = modalContent.querySelector(".stage-caption");
      if (captionEl) {
        captionEl.textContent = newActive.dataset.caption || "";
      }
    });
  });

  // 左右箭頭事件
  if (prevBtn) {
    prevBtn.addEventListener("click", () => navigateGallery("prev"));
  }
  if (nextBtn) {
    nextBtn.addEventListener("click", () => navigateGallery("next"));
  }

  // 導航函數
  function navigateGallery(direction) {
    const activeIndex = Array.from(thumbnails).findIndex(thumb => 
      thumb.classList.contains("is-active")
    );

    let newIndex;
    if (direction === "next") {
      newIndex = (activeIndex + 1) % thumbnails.length;
    } else {
      newIndex = activeIndex === 0 ? thumbnails.length - 1 : activeIndex - 1;
    }

    if (thumbnails[newIndex]) {
      thumbnails[newIndex].click();
    }
  }

  // 初始化 GLightbox
  if (lightbox) lightbox.destroy();
  lightbox = GLightbox({
    selector: ".stage-media",
    loop: true
  });
}

// ================================================
// 12. 事件監聽器設定
// ================================================

/**
 * 設定所有事件監聽器
 */
function setupEventListeners() {
  // 作品集篩選器點擊
  if (elements.portfolioFilters) {
    elements.portfolioFilters.addEventListener("click", handleFilterClick);
  }

  // 作品膠囊點擊（使用事件委託避免重複綁定）
  document.body.addEventListener("click", (e) => {
    const capsule = e.target.closest(".portfolio-capsule");
    if (capsule && !isModalLoading) {
      e.preventDefault(); // 阻止默認行為
      e.stopPropagation(); // 阻止事件冒泡
      
      const projectId = capsule.dataset.projectId;
      if (projectId) {
        console.log(`點擊作品膠囊，專案ID: ${projectId}`);
        showProjectModal(projectId);
      }
    }
  });

  // 眼睛容器點擊 - 切換主題
  elements.eyeContainers.forEach(container => {
    container.addEventListener("click", toggleTheme);
  });

  // 鍵盤快捷鍵
  document.addEventListener("keydown", (e) => {
    switch (e.key) {
      case "Escape":
        if (elements.projectModalElement.classList.contains("show")) {
          projectModal.hide();
        }
        break;
      case "t":
      case "T":
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          toggleTheme();
        }
        break;
    }
  });

  // 聯絡表單提交
  const contactForm = document.getElementById("contact-form");
  if (contactForm) {
    contactForm.addEventListener("submit", handleContactForm);
  }

  console.log("所有事件監聽器設定完成");
}

/**
 * 處理聯絡表單提交
 * @param {Event} event - 表單提交事件
 */
function handleContactForm(event) {
  event.preventDefault();

  const submitBtn = event.target.querySelector(".modern-submit-btn");
  const btnText = submitBtn.querySelector(".btn-text");

  // 提交動畫
  submitBtn.disabled = true;
  btnText.textContent = "發送中...";

  // 模擬發送過程
  setTimeout(() => {
    btnText.textContent = "發送成功！";
    
    setTimeout(() => {
      event.target.reset();
      btnText.textContent = "發送訊息";
      submitBtn.disabled = false;
    }, 2000);
  }, 2000);

  console.log("聯絡表單已提交");
}

// ================================================
// 13. 主初始化函數
// ================================================

/**
 * 初始化所有功能
 */
async function initializePortfolio() {
  console.log("開始初始化作品集網站...");

  try {
    // 1. 基礎設定
    setupTheme();
    fixViewportHeight();

    // 2. 滾動相關功能
    setupScrollProgress();
    setupFloatingActions();

    // 3. 互動效果
    setupEyeTracking();
    setupTypingEffect();
    setupParticles();

    // 4. GSAP 動畫
    if (checkGsapReady()) {
      initializeGsap();
      setupHeroTransition();
      setupScrollTriggers();
    } else {
      console.warn("GSAP 未載入，跳過動畫設定");
    }

    // 5. 作品集功能
    await loadPortfolio();

    // 6. 事件監聽器
    setupEventListeners();

    // 7. Bootstrap 模態框初始化
    if (elements.projectModalElement) {
      projectModal = new bootstrap.Modal(elements.projectModalElement);
      
      // 修復 aria-hidden 無障礙性問題
      elements.projectModalElement.addEventListener('show.bs.modal', function () {
        // Modal 顯示時移除 aria-hidden
        this.removeAttribute('aria-hidden');
      });
      
      elements.projectModalElement.addEventListener('hide.bs.modal', function () {
        // Modal 隱藏時添加 aria-hidden
        this.setAttribute('aria-hidden', 'true');
      });
    }

    // 8. 顯示頁面內容
    elements.body.classList.add("loaded");
    
    console.log("作品集網站初始化完成！");

  } catch (error) {
    console.error("初始化過程中發生錯誤:", error);
    
    // 即使出錯也要顯示基本內容
    elements.body.classList.add("loaded");
  }
}

// ================================================
// 14. 啟動應用程式
// ================================================

document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM 載入完成，開始初始化...");
  
  // 檢查 GSAP 是否準備就緒
  if (checkGsapReady()) {
    initializePortfolio();
  } else {
    // 等待 GSAP 載入
    const checkInterval = setInterval(() => {
      if (checkGsapReady()) {
        clearInterval(checkInterval);
        initializePortfolio();
      }
    }, 50);

    // 最多等待 3 秒
    setTimeout(() => {
      clearInterval(checkInterval);
      console.warn("GSAP 載入超時，使用降級模式");
      initializePortfolio();
    }, 3000);
  }
});
