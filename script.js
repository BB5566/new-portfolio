/**
 * @file Portfolio 主要腳本 - 發佈就緒版本
 * @author Bob Tsou
 * @version 9.0.0 (Production Ready)
 * @description 精簡優化的模組化作品集腳本，移除所有冗餘代碼，優化性能與可讀性
 * @lastModified 2025-09-05
 */

document.addEventListener("DOMContentLoaded", () => {
  // ===============================================
  // ==== 0. GSAP 載入檢測與 Fallback 機制 ====
  // ===============================================
  
  // 檢查 GSAP 是否載入完成
  const checkGsapReady = () => {
    return typeof gsap !== 'undefined' && 
           typeof ScrollTrigger !== 'undefined' && 
           typeof Observer !== 'undefined' && 
           typeof TextPlugin !== 'undefined';
  };

  // 設置 fallback 機制，如果 GSAP 載入失敗，2 秒後顯示內容
  const fallbackTimeout = setTimeout(() => {
    if (!document.body.classList.contains('gsap-ready')) {
      document.body.classList.add('gsap-fallback');
      console.log('GSAP fallback activated - content displayed without animation');
    }
  }, 2000);

  // 當 GSAP 準備就緒時執行動畫
  const initializeWithGsap = () => {
    clearTimeout(fallbackTimeout);
    document.body.classList.add('gsap-ready');
    
    // 註冊 GSAP 插件
    gsap.registerPlugin(ScrollTrigger, Observer, TextPlugin);
    
    // 立即執行 hero 動畫 - 直接內聯執行避免 hoisting 問題
    setupHeroAnimation();
    
    console.log('GSAP initialized successfully');
  };

  // Hero 動畫函數 - 在 initializeWithGsap 中使用
  const setupHeroAnimation = () => {
    // 姓名文字和眼睛動畫 - 改進的時序和緩動
    gsap.to(".name-line > span, .eye-container", {
      delay: 0.2,
      duration: 0.8,
      y: 0,
      opacity: 1,
      scale: 1,
      stagger: 0.06,
      ease: "back.out(1.2)",
    });

    // 個人照片 - 更自然的彈性效果
    gsap.to(".profile-photo", {
      delay: 0.4,
      duration: 0.9,
      y: 0,
      scale: 1,
      opacity: 1,
      ease: "elastic.out(1, 0.6)",
    });

    // 標語膠囊 - 流暢的出現效果
    gsap.to(".tagline-capsule", {
      delay: 0.6,
      duration: 0.8,
      y: 0,
      scale: 1,
      opacity: 1,
      ease: "power3.out",
    });

    // 操作按鈕 - 精緻的錯開動畫
    gsap.to(".profile-actions a", {
      delay: 0.8,
      duration: 0.6,
      y: 0,
      opacity: 1,
      scale: 1,
      stagger: 0.08,
      ease: "power2.out",
    });

    // 滾動指示器 - 最後優雅出現並添加呼吸動畫
    gsap.set(".scroll-down-indicator", { y: 0, opacity: 0 }); // 設置初始狀態
    gsap.to(".scroll-down-indicator", {
      delay: 1.2,
      duration: 0.8,
      opacity: 1,
      ease: "power3.out",
      onComplete: () => {
        // 添加持續的呼吸動畫
        gsap.to(".scroll-down-indicator", {
          y: -8,
          duration: 1.5,
          ease: "sine.inOut",
          repeat: -1,
          yoyo: true
        });
      }
    });
  };

  // 立即檢查 GSAP 是否已載入
  if (checkGsapReady()) {
    initializeWithGsap();
  } else {
    // 等待 GSAP 載入，每 50ms 檢查一次
    const checkInterval = setInterval(() => {
      if (checkGsapReady()) {
        clearInterval(checkInterval);
        initializeWithGsap();
      }
    }, 50);
    
    // 最多等待 3 秒
    setTimeout(() => {
      clearInterval(checkInterval);
      if (!document.body.classList.contains('gsap-ready')) {
        console.error('GSAP failed to load within 3 seconds');
        document.body.classList.add('gsap-fallback');
      }
    }, 3000);
  }

  // ===============================================
  // ==== 2. 全域變數與DOM元素 ====
  // ===============================================
  const DOM = {
    body: document.querySelector("body"),
    portfolioContainer: document.querySelector(".portfolio-container"),
    mainAccordion: document.getElementById("mainAccordion"),
    heroContent: document.querySelector(".hero-content"),
    projectModalElement: document.getElementById("projectModal"),
    eyes: gsap.utils.toArray(".eye"),
    eyeContainers: gsap.utils.toArray(".eye-container"),
    particlesContainer: document.querySelector(".particles-container")
  };

  const STATE = {
    allProjectsData: [],
    isAudioReady: false,
    isMobile: window.matchMedia("(max-width: 768px)").matches, // 調整為更標準的 768px 斷點
    audio: null,
    scrollTween: null,
    scrollObserver: null,
    lightbox: null
  };

  // UI 組件引用
  const UIComponents = {
    progressFill: null
  };

  const bsModal = new bootstrap.Modal(DOM.projectModalElement);

  // ===============================================
  // ==== 3. 核心工具函數 ====
  // ===============================================
  const DEBUG = false; // 關閉調試模式

  const Utils = {
    // 優化的節流函數，使用 requestAnimationFrame
    throttle: (func, limit = 16) => {
      let inThrottle = false;
      return function (...args) {
        if (!inThrottle) {
          func.apply(this, args);
          inThrottle = true;
          requestAnimationFrame(() => (inThrottle = false));
        }
      };
    },

    // 調試函數
    log: (...args) => DEBUG && console.log(...args),
    warn: (...args) => DEBUG && console.warn(...args),
    error: (...args) => DEBUG && console.error(...args),

    // DOM 安全檢查
    safeQuerySelector: (selector) => {
      try {
        const elements = document.querySelectorAll(selector);
        if (elements.length === 0) {
          Utils.warn(`No elements found for selector: ${selector}`);
        }
        return elements;
      } catch (error) {
        Utils.error(`Invalid selector: ${selector}`, error);
        return [];
      }
    },

    // 安全的 GSAP 動畫
    safeGsap: (method, selector, ...args) => {
      const elements = Utils.safeQuerySelector(selector);
      if (elements.length > 0) {
        return gsap[method](selector, ...args);
      } else {
        Utils.warn(`Skipping GSAP ${method} for ${selector} - no elements found`);
        return null;
      }
    },

    // URL編碼與安全處理
    toAbsEncodedUrl: (url) => {
      if (!url) return "";
      try {
        const trimmed = String(url).trim();
        let urlObj;
        
        if (/^https?:\/\//i.test(trimmed)) {
          urlObj = new URL(trimmed);
        } else {
          urlObj = new URL(trimmed.replace(/^\/+/, '/'), window.location.origin);
        }

        if (urlObj.host !== window.location.host && urlObj.pathname.startsWith('/uploads/')) {
          urlObj = new URL(urlObj.pathname + urlObj.search + urlObj.hash, window.location.origin);
        }

        const encodedPath = urlObj.pathname.split('/').map((seg) => 
          encodeURIComponent(decodeURIComponent(seg))
        ).join('/');
        urlObj.pathname = encodedPath;
        return urlObj.toString();
      } catch (e) {
        return encodeURI(url);
      }
    },

    // 用戶行為追蹤
    trackUserInteraction: (action, element) => {
      Utils.log(`User action: ${action} on ${element}`);
      // 可以在這裡整合 Google Analytics 或其他分析工具
      if (typeof gtag !== 'undefined') {
        gtag('event', action, {
          'custom_parameter': element
        });
      }
    },

    // HTML 轉義函數防止 XSS
    escapeHtml: (text) => {
      if (!text) return '';
      const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
      };
      return text.replace(/[&<>"']/g, (m) => map[m]);
    }
  };

  // ===============================================
  // ==== 4. 通知系統 ====
  // ===============================================
  const Notifications = {
    showError: (message) => {
      const errorDiv = document.createElement('div');
      errorDiv.className = 'notification notification--error';
      errorDiv.innerHTML = `
        <div class="notification__content">
          <span class="notification__icon">⚠️</span>
          <span class="notification__text">${message}</span>
          <button class="notification__close">&times;</button>
        </div>
      `;
      document.body.appendChild(errorDiv);
      
      errorDiv.querySelector('.notification__close').addEventListener('click', () => {
        errorDiv.remove();
      });
      
      // 使用更精確的延遲，5秒後自動移除
      setTimeout(() => {
        if (errorDiv.parentNode) {
          errorDiv.remove();
        }
      }, 5000);
    },

    showSuccess: (message) => {
      const successDiv = document.createElement('div');
      successDiv.className = 'notification notification--success';
      successDiv.innerHTML = `
        <div class="notification__content">
          <span class="notification__icon">✅</span>
          <span class="notification__text">${message}</span>
          <button class="notification__close">&times;</button>
        </div>
      `;
      document.body.appendChild(successDiv);

      successDiv.querySelector('.notification__close').addEventListener('click', () => {
        successDiv.remove();
      });

      setTimeout(() => {
        if (successDiv.parentNode) {
          successDiv.remove();
        }
      }, 4000);
    }
  };

  // ===============================================
  // ==== 5. 主題管理系統 ====
  // ===============================================
  const ThemeManager = {
    initialize: () => {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const savedTheme = localStorage.getItem('portfolio-theme');
      
      if (savedTheme) {
        DOM.body.className = savedTheme;
      } else if (prefersDark) {
        DOM.body.className = 'dark-mode';
      } else {
        DOM.body.className = 'light-mode';
      }
    },

    toggle: () => {
      const newTheme = DOM.body.classList.contains('light-mode') ? 'dark-mode' : 'light-mode';
      DOM.body.className = newTheme;
      localStorage.setItem('portfolio-theme', newTheme);
      if (STATE.audio) STATE.audio.playClick();
    }
  };

  // ===============================================
  // ==== 6. 音頻系統 ====
  // ===============================================
  const AudioSystem = {
    create: () => {
      if (STATE.audio) return STATE.audio;
      try {
        STATE.audio = {
          synth: null,
          isInitialized: false,
          userInteracted: false,
          
          // 等待用戶交互後才初始化音頻
          async initialize() {
            if (this.isInitialized) return;
            if (!this.userInteracted) return; // 必須等待用戶交互
            
            try {
              // 檢查 Tone.js 是否可用且音頻上下文需要啟動
              if (typeof Tone !== 'undefined' && Tone.context.state !== 'running') {
                await Tone.start();
                if (DEBUG) console.log('Audio context started successfully');
              }
              if (typeof Tone !== 'undefined') {
                this.synth = new Tone.Synth({ volume: -12 }).toDestination();
                this.isInitialized = true;
                STATE.isAudioReady = true;
                Utils.log('Audio initialized successfully');
              }
            } catch (e) {
              Utils.warn("Failed to initialize audio:", e);
              STATE.isAudioReady = false;
            }
          },

          // 標記用戶已交互
          markUserInteraction() {
            this.userInteracted = true;
            if (!this.isInitialized) {
              this.initialize();
            }
          },

          async playClick() {
            if (!this.userInteracted) return;
            if (!this.isInitialized) await this.initialize();
            if (STATE.isAudioReady && this.synth) {
              this.synth.triggerAttackRelease("G5", "16n");
            }
          },

          playHover: Utils.throttle(async function() {
            if (!this.userInteracted) return;
            if (!this.isInitialized) await this.initialize();
            if (STATE.isAudioReady && this.synth) {
              this.synth.triggerAttackRelease("C5", "16n");
            }
          }, 100),

          async playOpen() {
            if (!this.userInteracted) return;
            if (!this.isInitialized) await this.initialize();
            if (STATE.isAudioReady && this.synth) {
              this.synth.triggerAttackRelease("E4", "8n");
            }
          },

          async playClose() {
            if (!this.isInitialized) await this.initialize();
            if (STATE.isAudioReady && this.synth) {
              this.synth.triggerAttackRelease("A3", "8n");
            }
          }
        };
        return STATE.audio;
      } catch (e) {
        Utils.warn("Tone.js is not available:", e);
        return null;
      }
    },

    async initialize() {
      if (STATE.isAudioReady) return true;
      try {
        if (typeof Tone === "undefined") return false;
        
        // 不立即創建音頻上下文，等待用戶互動
        if (DEBUG) console.log("Audio system ready, waiting for user interaction");
        return true;
      } catch (e) {
        Utils.warn("Audio initialization failed:", e);
        STATE.isAudioReady = false;
        return false;
      }
    }
  };

  // ===============================================
  // ==== 7. 滾動管理 ====
  // ===============================================
  const ScrollManager = {
    forceEnable: () => {
      setTimeout(() => {
        DOM.body.style.overflowY = 'auto';
        document.documentElement.style.overflowY = 'auto';
        DOM.body.style.height = 'auto';
        DOM.body.style.minHeight = '100vh';
      }, 100);
    },

    setupProgressBar: () => {
      const progressBar = document.createElement('div');
      progressBar.className = 'scroll-progress';
      progressBar.innerHTML = '<div class="scroll-progress__bar"></div>';
      document.body.appendChild(progressBar);

      const progressFill = progressBar.querySelector('.scroll-progress__bar');
      
      // 合併的滾動事件處理器會在 setupFloatingActions 中設置
      UIComponents.progressFill = progressFill; // 儲存引用以供後續使用
    },

    setupFloatingActions: () => {
      const floatingActions = document.createElement('div');
      floatingActions.className = 'floating-actions';
      floatingActions.innerHTML = `
        <button class="floating-btn floating-btn--pulse" id="backToTop" title="回到頂部">
          ↑
        </button>
        <button class="floating-btn" id="toggleTheme" title="切換主題">
          🌙
        </button>
      `;
      document.body.appendChild(floatingActions);

      // 事件綁定
      document.getElementById('backToTop').addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        Utils.trackUserInteraction('back_to_top', 'floating_button');
        if (STATE.audio) STATE.audio.playClick();
      });

      document.getElementById('toggleTheme').addEventListener('click', () => {
        ThemeManager.toggle();
        Utils.trackUserInteraction('theme_toggle', 'floating_button');
        
        const themeBtn = document.getElementById('toggleTheme');
        themeBtn.textContent = DOM.body.classList.contains('dark-mode') ? '☀️' : '🌙';
      });

      // 優化：合併的滾動事件監聽器
      window.addEventListener('scroll', Utils.throttle(() => {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
        
        // 進度條更新
        if (UIComponents.progressFill) {
          const progress = (scrollTop / scrollHeight) * 100;
          UIComponents.progressFill.style.width = `${Math.min(progress, 100)}%`;
        }
        
        // 返回頂部按鈕顯示/隱藏
        const backToTopBtn = document.getElementById('backToTop');
        if (backToTopBtn) {
          if (scrollTop > 300) {
            backToTopBtn.style.opacity = '1';
            backToTopBtn.style.visibility = 'visible';
          } else {
            backToTopBtn.style.opacity = '0';
            backToTopBtn.style.visibility = 'hidden';
          }
        }
      }, 16)); // 60fps throttling
    }
  };

  // ===============================================
  // ==== 9. Hero區塊 ====
  // ===============================================
  const HeroSection = {
    setupTransition: () => {
      const wave = document.querySelector("#wave-path");
      if (!wave) {
        Utils.warn("Hero wave element not found");
        return;
      }
      
      Utils.log("Setting up hero wave transition animation");
      
      ScrollTrigger.create({
        trigger: ".hero-content",
        start: "top top",
        end: "bottom top",
        scrub: 1.2,
        onUpdate: (self) => {
          // 簡潔的圓弧變化，保持優雅
          const progress = self.progress;
          const curve = 100 - progress * 40; // 向下凹的弧度變化（從100到60）
          
          // 簡單的三控制點圓弧
          const pathData = `M0,${60 + progress * 20} 
                           C400,${curve} 800,${curve} 1200,${60 + progress * 20} 
                           L1200,120 L0,120 Z`;
          
          gsap.to(wave, {
            attr: { d: pathData },
            ease: "power1.out",
            duration: 0.1,
          });
        },
      });

      gsap.to(".scroll-down-indicator", {
        scrollTrigger: {
          trigger: ".hero-content",
          start: "top top",
          end: "+=150",
          onUpdate: (self) => {
            const progress = self.progress;
            // 根據滾動進度控制透明度和位置
            gsap.to(".scroll-down-indicator", {
              opacity: 1 - progress,
              y: progress * -20,
              duration: 0.1,
              ease: "none"
            });
          },
          onLeave: () => {
            // 當離開觸發區域時確保隱藏
            gsap.to(".scroll-down-indicator", {
              opacity: 0,
              y: -20,
              duration: 0.3
            });
          },
          onEnterBack: () => {
            // 當回到觸發區域時重新顯示
            gsap.to(".scroll-down-indicator", {
              opacity: 1,
              y: 0,
              duration: 0.5,
              ease: "power2.out"
            });
          }
        },
      });
    }
  };

  // ===============================================
  // ==== 10. 互動效果 ====
  // ===============================================
  const InteractiveEffects = {
    setupEyeTracking: () => {
      if (STATE.isMobile) return;
      
      const xTo = gsap.quickTo(DOM.eyes, "x", { duration: 0.4, ease: "power2" });
      const yTo = gsap.quickTo(DOM.eyes, "y", { duration: 0.4, ease: "power2" });
      
      DOM.heroContent.addEventListener("mousemove", (e) => {
        const { clientX, clientY } = e;
        xTo((clientX / window.innerWidth) * 20 - 10);
        yTo((clientY / window.innerHeight) * 10 - 5);
      });

      InteractiveEffects.setupBlinking();
    },

    setupBlinking: () => {
      function blink() {
        gsap.to(DOM.eyes, {
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
    },

    setupTypingEffect: () => {
      const typingElement = document.getElementById("typing-text");
      if (!typingElement) return;
      
      const messages = [
        "Web & UI/UX Designer",
        "Front-End Developer",
        "雙重優勢，雙倍價值",
        "熱衷於打造商業產品",
      ];
      
      let messageIndex = 0, charIndex = 0, isDeleting = false;
      
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
    },

    setupCustomCursor: () => {
      if (STATE.isMobile) return;
      
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
      
      document.querySelectorAll(
        "a, button, .accordion-button, .portfolio-capsule, .name-container, .eye-container, .btn-close, .glightbox, .filmstrip-capsule"
      ).forEach((el) => {
        el.addEventListener("mouseenter", () =>
          cursorOutline.classList.add("hovered")
        );
        el.addEventListener("mouseleave", () =>
          cursorOutline.classList.remove("hovered")
        );
      });
    },

    setupParticles: () => {
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
        
        DOM.particlesContainer.appendChild(particle);
        
        gsap.to(particle, {
          y: -window.innerHeight,
          duration: gsap.utils.random(15, 30),
          repeat: -1,
          ease: "none",
          delay: -15,
        });
      }
    }
  };

  // ===============================================
  // ==== 11. 動畫管理 ====
  // ===============================================
  const AnimationManager = {
    setupScrollAnimations: () => {
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
        scale: 0.8,
        rotation: -5
      }, {
        opacity: 1,
        y: 0,
        scale: 1,
        rotation: 0,
        duration: 0.8,
        stagger: {
          amount: 1.2,
          from: "random"
        },
        ease: 'back.out(1.7)',
        scrollTrigger: {
          trigger: '.skills-grid',
          start: 'top 80%',
          toggleActions: 'play none none reverse'
        }
      });

      // 作品集項目3D翻轉動畫 - 添加元素存在檢查
      const portfolioCapsules = document.querySelectorAll('.portfolio-capsule');
      if (portfolioCapsules.length > 0) {
        gsap.fromTo('.portfolio-capsule', {
          opacity: 0,
          y: 50,
          rotationX: 45,
          rotationY: 45,
          scale: 0.8
        }, {
          opacity: 1,
          y: 0,
          rotationX: 0,
          rotationY: 0,
          scale: 1,
          duration: 1,
          stagger: 0.2,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: '.portfolio-list',
            start: 'top 85%',
            toggleActions: 'play none none reverse'
          }
        });
      }

      // 時間軸項目彈跳動畫
      gsap.fromTo('.timeline-item', {
        opacity: 0,
        x: -50,
        scale: 0.9
      }, {
        opacity: 1,
        x: 0,
        scale: 1,
        duration: 0.8,
        stagger: 0.15,
        ease: 'elastic.out(1, 0.8)',
        scrollTrigger: {
          trigger: '.timeline',
          start: 'top 80%',
          toggleActions: 'play none none reverse'
        }
      });

      // 浮動效果
      AnimationManager.setupFloatingEffects();

      // 視差滾動效果
      AnimationManager.setupParallaxEffects();

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
    },

    setupFloatingEffects: () => {
      // 為技能膠囊添加隨機浮動效果
      gsap.utils.toArray('.skill-capsule').forEach((capsule, index) => {
        gsap.to(capsule, {
          y: `random(-10, 10)`,
          rotation: `random(-2, 2)`,
          duration: `random(2, 4)`,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
          delay: index * 0.1
        });
      });

      // 粒子浮動效果
      gsap.utils.toArray('.particle').forEach(particle => {
        gsap.set(particle, {
          x: gsap.utils.random(0, window.innerWidth),
          y: gsap.utils.random(window.innerHeight, window.innerHeight + 100)
        });
        
        gsap.to(particle, {
          y: -100,
          x: `+=${gsap.utils.random(-50, 50)}`,
          duration: gsap.utils.random(8, 15),
          repeat: -1,
          ease: "none",
          delay: gsap.utils.random(0, 5)
        });
      });
    },

    setupParallaxEffects: () => {
      // 視差滾動效果
      gsap.utils.toArray('.hero-content .particle').forEach(particle => {
        gsap.to(particle, {
          y: -200,
          scrollTrigger: {
            trigger: '.hero-content',
            start: 'top bottom',
            end: 'bottom top',
            scrub: true,
            onUpdate: self => {
              const velocity = self.getVelocity();
              gsap.to(particle, {
                rotation: velocity / 10,
                duration: 0.3
              });
            }
          }
        });
      });
    },

    setupTimelineAnimation: () => {
      const timelineItems = document.querySelectorAll('.timeline-item');
      
      // 添加作品集卡片的3D滑鼠跟蹤效果
      const portfolioCapsules = document.querySelectorAll('.portfolio-capsule');
      portfolioCapsules.forEach(capsule => {
        capsule.addEventListener('mousemove', (e) => {
          const rect = capsule.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;
          const centerX = rect.width / 2;
          const centerY = rect.height / 2;
          
          const rotateX = (y - centerY) / centerY * -5;
          const rotateY = (x - centerX) / centerX * 5;
          
          gsap.to(capsule, {
            transform: `translateY(-8px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
            duration: 0.3,
            ease: "power2.out"
          });
        });
        
        capsule.addEventListener('mouseleave', () => {
          gsap.to(capsule, {
            transform: `translateY(0) rotateX(0deg) rotateY(0deg)`,
            duration: 0.5,
            ease: "power2.out"
          });
        });
      });
      
      const checkVisibility = (item) => {
        const rect = item.getBoundingClientRect();
        const windowHeight = window.innerHeight || document.documentElement.clientHeight;
        return rect.top < windowHeight * 0.8;
      };
      
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
            
            // 添加彈跳效果
            gsap.fromTo(entry.target, {
              scale: 0.8,
              opacity: 0
            }, {
              scale: 1,
              opacity: 1,
              duration: 0.6,
              ease: "back.out(1.7)"
            });
          }
        });
      }, { 
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
      });

      timelineItems.forEach(item => {
        observer.observe(item);
      });
    },

    // Contact區域動畫
    setupContactAnimations: () => {
      // Contact卡片進入動畫
      const contactCards = document.querySelectorAll('.contact-card');
      contactCards.forEach((card, index) => {
        gsap.fromTo(card, {
          opacity: 0,
          y: 30,
          rotationY: -15
        }, {
          opacity: 1,
          y: 0,
          rotationY: 0,
          duration: 0.6,
          delay: index * 0.1,
          ease: "back.out(1.7)",
          scrollTrigger: {
            trigger: card,
            start: "top 85%",
            end: "bottom 15%",
            toggleActions: "play none none reverse"
          }
        });
      });

      // Social links hover效果
      const socialLinks = document.querySelectorAll('.social-link, .footer-social-link');
      socialLinks.forEach(link => {
        link.addEventListener('mouseenter', () => {
          gsap.to(link, {
            scale: 1.1,
            rotation: 5,
            duration: 0.3,
            ease: "power2.out"
          });
        });
        
        link.addEventListener('mouseleave', () => {
          gsap.to(link, {
            scale: 1,
            rotation: 0,
            duration: 0.3,
            ease: "power2.out"
          });
        });
      });
    },

    // Footer動畫
    setupFooterAnimations: () => {
      // Footer進入動畫
      const footerElements = document.querySelectorAll('.footer-info, .footer-links');
      footerElements.forEach((element, index) => {
        gsap.fromTo(element, {
          opacity: 0,
          y: 40
        }, {
          opacity: 1,
          y: 0,
          duration: 0.8,
          delay: index * 0.2,
          ease: "power3.out",
          scrollTrigger: {
            trigger: '.main-footer',
            start: "top 90%",
            end: "bottom 10%",
            toggleActions: "play none none reverse"
          }
        });
      });

      // 浮動形狀動畫增強
      const shapes = document.querySelectorAll('.floating-shape');
      shapes.forEach((shape, index) => {
        gsap.set(shape, {
          scale: 0,
          rotation: 0
        });
        
        gsap.to(shape, {
          scale: 1,
          rotation: 360,
          duration: 2,
          delay: index * 0.5,
          ease: "back.out(1.7)",
          scrollTrigger: {
            trigger: '.main-footer',
            start: "top 90%"
          }
        });
      });
    }
  };

  // ===============================================
  // ==== 12. 作品集管理 ====
  // ===============================================
  const PortfolioManager = {
    async loadAndSetup() {
      try {
        const response = await fetch("api/get_projects.php");
        if (!response.ok) throw new Error(`API請求失敗，狀態碼: ${response.status}`);
        
        STATE.allProjectsData = await response.json();
        await new Promise(resolve => setTimeout(resolve, 800));
        
        PortfolioManager.renderProjects(STATE.allProjectsData);
        PortfolioManager.setupFilters();
      } catch (error) {
        Utils.error("專案載入失敗:", error);
        const portfolioList = document.querySelector(".portfolio-list");
        if (portfolioList) {
          portfolioList.innerHTML = "<p>專案載入失敗，請稍後再試。</p>";
        }
      }
    },

    renderProjects(projectsToRender) {
      const portfolioList = document.querySelector(".portfolio-list");
      if (!portfolioList) return;
      
      portfolioList.innerHTML = "";
      
      if (projectsToRender.length > 0) {
        projectsToRender.forEach((project) => {
          const rawUrl = (project.preview_media_url || "").trim();
          const urlForExt = rawUrl.split('?')[0].toLowerCase();
          const isVideo = urlForExt.endsWith('.mp4') || urlForExt.endsWith('.webm') || urlForExt.startsWith('data:video');
          const safeUrl = rawUrl ? Utils.toAbsEncodedUrl(rawUrl) : Utils.toAbsEncodedUrl("uploads/placeholder.svg");

          let mediaElement = isVideo
            ? `<video src="${safeUrl}" autoplay loop muted playsinline class="capsule-media" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';"></video><div class="missing-media" style="display:none; width:100%; height:200px; background:#f8f9fa; border:2px dashed #dee2e6; justify-content:center; align-items:center; color:#6c757d;">媒體載入失敗</div>`
            : `<img src="${safeUrl}" alt="${project.title} preview" class="capsule-media" referrerpolicy="no-referrer" decoding="async" onerror="this.src='uploads/placeholder.svg'; this.alt='圖片載入失敗';">`;
          
          const capsule = document.createElement("div");
          capsule.className = "portfolio-capsule";
          capsule.dataset.projectId = project.id;
          capsule.setAttribute('role', 'button');
          capsule.setAttribute('tabindex', '0');
          capsule.setAttribute('aria-label', `查看 ${project.title} 專案詳情`);
          capsule.innerHTML = `${mediaElement}<div class="capsule-overlay"><h4 class="capsule-title">${
            Utils.escapeHtml(project.title)
          }</h4><span class="capsule-category">${
            Utils.escapeHtml(project.category_name || "")
          }</span></div>`;
          portfolioList.appendChild(capsule);
          
          capsule.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              Utils.trackUserInteraction('project_view', capsule.dataset.projectId);
              ProjectModal.show(capsule.dataset.projectId);
            }
          });
        });
      } else {
        portfolioList.innerHTML = "<p>沒有符合篩選條件的專案。</p>";
      }
      
      PortfolioManager.setupInfiniteScroll();
    },

    setupFilters() {
      const filterContainer = document.getElementById("portfolio-filters");
      const categories = [
        "all",
        ...new Set(STATE.allProjectsData.map((p) => p.category_name).filter((c) => c)),
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
    },

    setupInfiniteScroll() {
      const portfolioList = document.querySelector(".portfolio-list");
      const scrollerNav = document.querySelector(".scroller-nav");
      
      if (STATE.scrollTween) STATE.scrollTween.kill();
      if (STATE.scrollObserver) STATE.scrollObserver.kill();
      
      if (STATE.isMobile || !portfolioList) {
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
      
      STATE.scrollTween = gsap.to(portfolioList, {
        x: `-=${totalWidth}`,
        duration: originalItems.length * 8,
        ease: "none",
        repeat: -1,
        modifiers: { x: (x) => wrap(parseFloat(x)) + "px" },
      });
      
      STATE.scrollObserver = Observer.create({
        target: ".portfolio-scroller",
        type: "touch,pointer",
        onDrag: (self) =>
          STATE.scrollTween.progress(STATE.scrollTween.progress() - self.deltaX * 0.0015),
        onHover: () => STATE.scrollTween?.pause(),
        onHoverEnd: () => STATE.scrollTween?.resume(),
      });
    }
  };

  // ===============================================
  // ==== 13. 專案模態框 ====
  // ===============================================
  const ProjectModal = {
    async show(projectId) {
      Utils.trackUserInteraction('project_detail_view', projectId);
      
      if (STATE.audio) STATE.audio.playOpen();
      const modalContent = DOM.projectModalElement.querySelector(".modal-content");
      modalContent.innerHTML = `
        <div class="modal-loading">
          <div class="spinner"></div>
          <div class="loading-text">載入專案資料中...</div>
        </div>
      `;
      
      DOM.projectModalElement.removeAttribute('aria-hidden');
      DOM.projectModalElement.setAttribute('aria-modal', 'true');
      
      bsModal.show();
      
      try {
        const response = await fetch(`api/get_project_detail.php?id=${projectId}`);
        if (!response.ok) throw new Error(`API請求失敗`);
        
        const project = await response.json();
        if (project && !project.error) {
          ProjectModal.renderContent(project, modalContent);
        } else {
          throw new Error(project?.error || "專案資料格式錯誤");
        }
      } catch (error) {
        Utils.error("無法載入專案詳情:", error);
        modalContent.innerHTML = `<div class="p-4 text-center d-flex flex-column justify-content-center align-items-center" style="height:100%"><p>抱歉，無法載入專案詳情。<br>${Utils.escapeHtml(error.message)}</p><button type="button" class="btn btn-secondary mt-3" data-bs-dismiss="modal">關閉</button></div>`;
      }
    },

    renderContent(project, modalContent) {
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
            `<img src="${Utils.toAbsEncodedUrl(img.url)}" alt="${img.caption}" class="stage-media ${
              index === 0 ? "is-active" : ""
            }" data-index="${index}" data-caption="${(img.caption || '').replace(/\"/g, '&quot;')}" onerror="this.src='uploads/placeholder.svg'; this.alt='圖片載入失敗';">`
        )
        .join("");

      const filmstripHTML =
        allImages.length > 1
          ? `<div class="showcase-filmstrip"><div class="filmstrip-nav">${allImages
              .map(
                (img, index) =>
                  `<div class="filmstrip-capsule ${
                    index === 0 ? "is-active" : ""
                  }" data-index="${index}" role="button" tabindex="0" aria-selected="${index === 0 ? "true" : "false"}"><img src="${
                    Utils.toAbsEncodedUrl(img.url)
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
            <div class="showcase-stage">
              ${stageHTML}
              <button class="stage-nav stage-nav-prev" aria-label="上一張" title="上一張" type="button">&#10094;</button>
              <button class="stage-nav stage-nav-next" aria-label="下一張" title="下一張" type="button">&#10095;</button>
              <button class="stage-fit-toggle" aria-label="切換填滿/等比" title="切換顯示模式" type="button">⤢</button>
              <div class="stage-caption" aria-live="polite"></div>
            </div>
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
      ProjectModal.setupInteractions(modalContent, allImages);
    },

    setupInteractions(modalContent, allImages) {
      const stage = modalContent.querySelector(".showcase-stage");
      const thumbnails = modalContent.querySelectorAll(".filmstrip-capsule");
      const prevBtn = modalContent.querySelector('.stage-nav-prev');
      const nextBtn = modalContent.querySelector('.stage-nav-next');
      const fitToggle = modalContent.querySelector('.stage-fit-toggle');
      const captionEl = modalContent.querySelector('.stage-caption');

      if (!thumbnails || thumbnails.length < 2) {
        if (prevBtn) prevBtn.style.display = 'none';
        if (nextBtn) nextBtn.style.display = 'none';
      }

      // 更新舞台比例
      const updateStageToActive = () => {
        const isSmallScreen = window.matchMedia('(max-width: 768px)').matches;
        if (isSmallScreen) {
          stage.style.aspectRatio = '';
          return;
        }
        const activeImg = stage.querySelector('.stage-media.is-active');
        if (!activeImg) return;
        const applyRatio = () => {
          const w = activeImg.naturalWidth;
          const h = activeImg.naturalHeight;
          if (w > 0 && h > 0) {
            stage.style.aspectRatio = `${w} / ${h}`;
          }
        };
        if (activeImg.complete && activeImg.naturalWidth) {
          applyRatio();
        } else {
          activeImg.addEventListener('load', applyRatio, { once: true });
        }
      };

      // 更新圖說
      const updateCaption = () => {
        const activeImg = stage.querySelector('.stage-media.is-active');
        const text = activeImg?.dataset?.caption || '';
        if (captionEl) captionEl.textContent = text;
      };

      // 預載相鄰圖片
      const preloadNeighbor = () => {
        const activeImg = stage.querySelector('.stage-media.is-active');
        if (!activeImg) return;
        const allStageImgs = Array.from(stage.querySelectorAll('.stage-media'));
        const idx = parseInt(activeImg.dataset.index, 10);
        const prevIdx = (idx - 1 + allStageImgs.length) % allStageImgs.length;
        const nextIdx = (idx + 1) % allStageImgs.length;
        [prevIdx, nextIdx].forEach(i => { 
          const src = allStageImgs[i].getAttribute('src'); 
          const img = new Image(); 
          img.src = src; 
        });
      };

      // 縮圖點擊事件
      thumbnails.forEach((thumb) => {
        const activateThumb = () => {
          const activeIndex = thumb.dataset.index;
          const currentActive = stage.querySelector(".stage-media.is-active");
          const newActive = stage.querySelector(`.stage-media[data-index="${activeIndex}"]`);
          
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
          
          const currentThumb = modalContent.querySelector(".filmstrip-capsule.is-active");
          if (currentThumb) {
            currentThumb.classList.remove("is-active");
            currentThumb.setAttribute('aria-selected', 'false');
          }
          thumb.classList.add("is-active");
          thumb.setAttribute('aria-selected', 'true');

          thumb.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
          
          updateStageToActive();
          updateCaption();
          preloadNeighbor();

          if (STATE.audio) STATE.audio.playClick();
        };
        
        thumb.addEventListener("click", activateThumb);
        thumb.addEventListener("keydown", (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            activateThumb();
          }
        });
      });

      // 左右箭頭事件
      if (prevBtn) prevBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        ProjectModal.navigateGallery('prev');
      });
      if (nextBtn) nextBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        ProjectModal.navigateGallery('next');
      });

      // 填滿/等比切換
      if (fitToggle) {
        fitToggle.addEventListener('click', () => {
          const activeImg = stage.querySelector('.stage-media.is-active');
          if (!activeImg) return;
          const isContain = getComputedStyle(activeImg).objectFit === 'contain';
          activeImg.style.objectFit = isContain ? 'cover' : 'contain';
        });
      }

      // 觸控手勢
      let touchStartX = null;
      stage.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].clientX;
      }, { passive: true });
      stage.addEventListener('touchend', (e) => {
        if (touchStartX == null) return;
        const dx = e.changedTouches[0].clientX - touchStartX;
        if (Math.abs(dx) > 40) {
          if (dx > 0) ProjectModal.navigateGallery('prev');
          else ProjectModal.navigateGallery('next');
        }
        touchStartX = null;
      });

      updateStageToActive();
      updateCaption();
      preloadNeighbor();

      // 初始化 GLightbox
      if (STATE.lightbox) STATE.lightbox.destroy();
      STATE.lightbox = GLightbox({
        selector: ".stage-media",
        skin: "custom-dark-skin",
        loop: true,
      });

      ProjectModal.setupKeyboardNavigation(modalContent);
    },

    setupKeyboardNavigation(modalContent) {
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
      
      document.addEventListener('keydown', handleKeyNavigation);
      
      DOM.projectModalElement.addEventListener('hidden.bs.modal', () => {
        document.removeEventListener('keydown', handleKeyNavigation);
      }, { once: true });
    },

    navigateGallery(direction) {
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
  };

  // ===============================================
  // ==== 14. 事件監聽器 ====
  // ===============================================
  const EventListeners = {
    setup() {
      // 首次用戶交互時初始化音頻
      const initAudioOnFirstInteraction = async () => {
        if (STATE.audio && !STATE.audio.userInteracted) {
          STATE.audio.markUserInteraction();
        } else if (!STATE.audio) {
          try {
            await AudioSystem.create();
            if (STATE.audio) {
              STATE.audio.markUserInteraction();
            }
          } catch (error) {
            Utils.warn("Audio initialization failed:", error);
          }
        }
      };

      // 在首次點擊、觸摸或鍵盤操作時初始化音頻
      document.addEventListener('click', initAudioOnFirstInteraction, { once: true });
      document.addEventListener('touchstart', initAudioOnFirstInteraction, { once: true });
      document.addEventListener('keydown', initAudioOnFirstInteraction, { once: true });
      
      // 作品集篩選器
      document.body.addEventListener("click", (e) => {
        if (e.target.closest(".filter-btn")) {
          const btn = e.target.closest(".filter-btn");
          if (!btn || btn.classList.contains("active")) return;
          
          if (STATE.audio) STATE.audio.playClick();
          
          const filterContainer = document.getElementById("portfolio-filters");
          if (filterContainer && filterContainer.querySelector(".active")) {
            filterContainer.querySelector(".active").classList.remove("active");
          }
          btn.classList.add("active");
          
          const selectedCategory = btn.dataset.category;
          const filtered = selectedCategory === "all"
            ? STATE.allProjectsData
            : STATE.allProjectsData.filter((p) => p.category_name === selectedCategory);
          
          gsap.to(".portfolio-list", {
            opacity: 0,
            duration: 0.4,
            onComplete: () => {
              PortfolioManager.renderProjects(filtered);
              gsap.to(".portfolio-list", { opacity: 1, duration: 0.4 });
            },
          });
        }

        // 作品膠囊點擊
        if (e.target.closest(".portfolio-capsule")) {
          const capsule = e.target.closest(".portfolio-capsule");
          if (capsule) {
            Utils.trackUserInteraction('project_view', capsule.dataset.projectId);
            ProjectModal.show(capsule.dataset.projectId);
          }
        }
      });

      // 滾動導航
      const scrollerNav = document.querySelector(".scroller-nav");
      if (scrollerNav) {
        scrollerNav.addEventListener("click", (e) => {
          if (STATE.isMobile || !STATE.scrollTween) return;
          const btn = e.target.closest(".nav-btn");
          if (!btn) return;
          
          const numOriginalItems = document.querySelectorAll(".portfolio-list .portfolio-capsule").length / 2;
          const itemProgress = 1 / numOriginalItems;
          const direction = btn.classList.contains("next-btn") ? 1 : -1;
          
          gsap.to(STATE.scrollTween, {
            progress: STATE.scrollTween.progress() + itemProgress * direction,
            duration: 0.8,
            ease: "power2.inOut",
          });
        });
      }

      // 聯絡表單
      document.body.addEventListener("submit", (e) => {
        if (e.target.matches("#contact-form")) {
          e.preventDefault();
          
          const submitBtn = e.target.querySelector('.modern-submit-btn');
          const btnText = submitBtn.querySelector('.btn-text');
          const btnIcon = submitBtn.querySelector('.btn-icon');
          
          // 提交動畫
          submitBtn.disabled = true;
          btnText.textContent = '發送中...';
          
          gsap.to(btnIcon, {
            rotation: 360,
            duration: 1,
            ease: "power2.inOut",
            repeat: 2
          });
          
          // 模擬發送過程
          setTimeout(() => {
            btnText.textContent = '發送成功！';
            gsap.to(submitBtn, {
              scale: 1.05,
              duration: 0.3,
              yoyo: true,
              repeat: 1
            });
            
            // 重置表單
            setTimeout(() => {
              e.target.reset();
              btnText.textContent = '發送訊息';
              submitBtn.disabled = false;
              
              // 重置表單標籤位置
              const formGroups = e.target.querySelectorAll('.form-group');
              formGroups.forEach(group => {
                const label = group.querySelector('label');
                const input = group.querySelector('input, textarea, select');
                if (label && input) {
                  gsap.to(label, {
                    y: 0,
                    fontSize: '0.85rem',
                    color: 'var(--color-text-light)',
                    duration: 0.3
                  });
                }
              });
            }, 2000);
          }, 2000);
          
          // 顯示成功通知而非 alert
          Notifications.showSuccess("感謝您的訊息！我會儘快回覆您。");
        }
      });

      // 表單輸入動畫
      document.querySelectorAll('.form-group input, .form-group textarea, .form-group select').forEach(input => {
        input.addEventListener('focus', () => {
          const label = input.nextElementSibling;
          if (label && label.tagName === 'LABEL') {
            gsap.to(label, {
              y: -20,
              fontSize: '0.75rem',
              color: 'var(--color-primary)',
              duration: 0.3,
              ease: "power2.out"
            });
          }
        });
        
        input.addEventListener('blur', () => {
          if (input.value === '') {
            const label = input.nextElementSibling;
            if (label && label.tagName === 'LABEL') {
              gsap.to(label, {
                y: 0,
                fontSize: '0.85rem',
                color: 'var(--color-text-light)',
                duration: 0.3,
                ease: "power2.out"
              });
            }
          }
        });
      });

      // 眼睛點擊切換主題
      DOM.eyeContainers.forEach((container) =>
        container.addEventListener("click", () => {
          ThemeManager.toggle();
          Utils.trackUserInteraction('theme_toggle', 'eye');
        })
      );

      // 鍵盤快捷鍵
      document.addEventListener('keydown', (e) => {
        switch(e.key) {
          case 'Escape':
            if (DOM.projectModalElement.classList.contains('show')) {
              bsModal.hide();
            }
            break;
          case 'ArrowLeft':
            if (DOM.projectModalElement.classList.contains('show')) {
              ProjectModal.navigateGallery('prev');
            }
            break;
          case 'ArrowRight':
            if (DOM.projectModalElement.classList.contains('show')) {
              ProjectModal.navigateGallery('next');
            }
            break;
          case 't':
          case 'T':
            if (e.ctrlKey || e.metaKey) {
              e.preventDefault();
              ThemeManager.toggle();
              Utils.trackUserInteraction('theme_toggle', 'keyboard');
            }
            break;
        }
      });

      // 模態框事件
      DOM.projectModalElement.addEventListener("hide.bs.modal", () => {
        if (STATE.audio) STATE.audio.playClose();
        if (STATE.lightbox) {
          STATE.lightbox.destroy();
          STATE.lightbox = null;
        }
        
        // 延遲設置 aria-hidden 以避免焦點問題
        setTimeout(() => {
          DOM.projectModalElement.setAttribute('aria-hidden', 'true');
          DOM.projectModalElement.removeAttribute('aria-modal');
        }, 100);
      });
    }
  };

  // ===============================================
  // ==== 16. 資源管理與清理 ====
  // ===============================================
  const ResourceManager = {
    cleanup: () => {
      // 清理事件監聽器
      if (STATE.scrollObserver) {
        STATE.scrollObserver.disconnect();
      }
      
      // 清理 GSAP 動畫
      ScrollTrigger.getAll().forEach(trigger => trigger.kill());
      gsap.killTweensOf("*");
      
      // 清理音頻資源
      if (STATE.audio) {
        STATE.audio.destroy();
        STATE.audio = null;
      }
      
      // 清理 lightbox
      if (STATE.lightbox) {
        STATE.lightbox.destroy();
        STATE.lightbox = null;
      }
      
      // 重置狀態
      Object.keys(STATE).forEach(key => {
        if (typeof STATE[key] === 'boolean') STATE[key] = false;
        if (Array.isArray(STATE[key])) STATE[key] = [];
        if (typeof STATE[key] === 'object' && STATE[key] !== null) STATE[key] = null;
      });
      
      Utils.log('Resources cleaned up');
    },

    // 頁面卸載時清理
    beforeUnload: () => {
      ResourceManager.cleanup();
    }
  };

  // 註冊清理事件
  window.addEventListener('beforeunload', ResourceManager.beforeUnload);

  // ===============================================
  // ==== 17. 錯誤邊界與初始化保護 ====
  // ===============================================
  const ErrorBoundary = {
    wrapFunction: (fn, context = 'Anonymous') => {
      return async (...args) => {
        try {
          return await fn(...args);
        } catch (error) {
          Utils.error(`Error in ${context}:`, error);
          // 不阻止其他初始化繼續執行
        }
      };
    },

    safeInitialize: async (initFunctions) => {
      const results = [];
      for (const [name, fn] of Object.entries(initFunctions)) {
        try {
          Utils.log(`Initializing ${name}...`);
          await fn();
          results.push({ name, success: true });
        } catch (error) {
          Utils.error(`Failed to initialize ${name}:`, error);
          results.push({ name, success: false, error });
        }
      }
      return results;
    }
  };

  // ===============================================
  // ==== 18. 主初始化函數 ====
  // ===============================================
  async function init() {
    try {
      Utils.log('Portfolio initialization started...');
      
      // 使用安全初始化方式
      const initFunctions = {
        'Theme Manager': () => ThemeManager.initialize(),
        'Scroll Manager': () => {
          ScrollManager.forceEnable();
          ScrollManager.setupProgressBar();
          ScrollManager.setupFloatingActions();
        },
        'Interactive Effects': () => {
          InteractiveEffects.setupCustomCursor();
          InteractiveEffects.setupParticles();
          InteractiveEffects.setupEyeTracking();
          InteractiveEffects.setupTypingEffect();
        },
        'Animation Manager': () => {
          AnimationManager.setupScrollAnimations();
          AnimationManager.setupTimelineAnimation();
          AnimationManager.setupContactAnimations();
          AnimationManager.setupFooterAnimations();
        },
        'Event Listeners': () => EventListeners.setup(),
        'Portfolio Manager': () => PortfolioManager.loadAndSetup()
      };

      const results = await ErrorBoundary.safeInitialize(initFunctions);
      
      // 顯示頁面內容
      DOM.body.classList.add("loaded");
      DOM.portfolioContainer.style.visibility = "visible";
      DOM.portfolioContainer.style.opacity = "1";
      HeroSection.setupTransition();
      // Hero 動畫已經在 GSAP 載入時執行，不需要重複調用
      
      // 記錄初始化結果
      const successful = results.filter(r => r.success).length;
      const total = results.length;
      Utils.log(`Portfolio initialization completed: ${successful}/${total} modules loaded successfully`);
      
      if (successful < total) {
        Utils.warn('Some modules failed to initialize, but the portfolio should still be functional');
      }

    } catch (error) {
      Utils.error('Critical portfolio initialization failed:', error);
      Notifications.showError('作品集載入時發生嚴重錯誤，請重新整理頁面。');
      
      // 即使出錯也要顯示基本內容
      DOM.body.classList.add("loaded");
      DOM.portfolioContainer.style.visibility = "visible";
      DOM.portfolioContainer.style.opacity = "1";
    }
  }  // 啟動應用程式
  init();
});
