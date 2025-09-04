/**
 * @file 作品集錯誤監控與修復工具
 * @author Bob Tsou
 * @description 監控和自動修復常見的作品集錯誤
 */

class PortfolioErrorMonitor {
  constructor() {
    this.errors = [];
    this.fixes = [];
    this.init();
  }

  init() {
    // 監控 GSAP 錯誤
    this.monitorGSAPErrors();
    
    // 監控音頻錯誤
    this.monitorAudioErrors();
    
    // 監控 DOM 錯誤
    this.monitorDOMErrors();
    
    // 全域錯誤捕獲
    this.setupGlobalErrorHandler();
    
    console.log('🛡️ Portfolio Error Monitor initialized');
  }

  monitorGSAPErrors() {
    // 覆寫 GSAP 的錯誤處理
    if (typeof gsap !== 'undefined') {
      const originalFromTo = gsap.fromTo;
      const originalTo = gsap.to;
      const originalSet = gsap.set;

      gsap.fromTo = (...args) => {
        try {
          const [target] = args;
          if (typeof target === 'string' && !document.querySelector(target)) {
            this.logError('GSAP_TARGET_NOT_FOUND', `Target "${target}" not found`, 'warning');
            return { kill: () => {} }; // 返回假動畫對象
          }
          return originalFromTo.apply(gsap, args);
        } catch (error) {
          this.logError('GSAP_ANIMATION_ERROR', error.message, 'error');
          return { kill: () => {} };
        }
      };

      gsap.to = (...args) => {
        try {
          const [target] = args;
          if (typeof target === 'string' && !document.querySelector(target)) {
            this.logError('GSAP_TARGET_NOT_FOUND', `Target "${target}" not found`, 'warning');
            return { kill: () => {} };
          }
          return originalTo.apply(gsap, args);
        } catch (error) {
          this.logError('GSAP_ANIMATION_ERROR', error.message, 'error');
          return { kill: () => {} };
        }
      };

      gsap.set = (...args) => {
        try {
          const [target] = args;
          if (typeof target === 'string' && !document.querySelector(target)) {
            this.logError('GSAP_TARGET_NOT_FOUND', `Target "${target}" not found`, 'warning');
            return;
          }
          return originalSet.apply(gsap, args);
        } catch (error) {
          this.logError('GSAP_ANIMATION_ERROR', error.message, 'error');
        }
      };
    }
  }

  monitorAudioErrors() {
    // 覆寫 console 錯誤以捕獲音頻相關錯誤
    const originalError = console.error;
    console.error = (...args) => {
      const message = args.join(' ');
      
      if (message.includes('AudioContext') || message.includes('user gesture')) {
        this.logError('AUDIO_CONTEXT_ERROR', 'Audio requires user interaction', 'info');
        this.suggestFix('audio', 'Audio will be enabled after first user interaction');
        return; // 不顯示這些預期的錯誤
      }
      
      if (message.includes('ScriptProcessorNode is deprecated')) {
        this.logError('AUDIO_DEPRECATED_API', 'Using deprecated audio API', 'warning');
        this.suggestFix('audio', 'Consider updating to newer audio libraries');
        return; // 不顯示這個警告
      }
      
      // 其他錯誤正常顯示
      originalError.apply(console, args);
    };
  }

  monitorDOMErrors() {
    // 監控 DOM 操作錯誤
    document.addEventListener('click', (e) => {
      if (e.target && typeof e.target.matches !== 'function') {
        this.logError('DOM_METHOD_ERROR', 'Element missing matches method', 'warning');
        this.suggestFix('dom', 'Adding polyfill for matches method');
        this.addMatchesPolyfill();
      }
    }, true);
  }

  setupGlobalErrorHandler() {
    window.addEventListener('error', (event) => {
      this.logError('JAVASCRIPT_ERROR', event.message, 'error', {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      });
    });

    window.addEventListener('unhandledrejection', (event) => {
      this.logError('PROMISE_REJECTION', event.reason, 'error');
    });
  }

  logError(type, message, level = 'error', details = {}) {
    const error = {
      type,
      message,
      level,
      timestamp: new Date().toISOString(),
      details
    };
    
    this.errors.push(error);
    
    // 在開發模式下顯示詳細信息
    if (this.isDevelopment()) {
      const icon = level === 'error' ? '❌' : level === 'warning' ? '⚠️' : 'ℹ️';
      console.log(`${icon} [Portfolio Monitor] ${type}: ${message}`, details);
    }
  }

  suggestFix(category, suggestion) {
    this.fixes.push({
      category,
      suggestion,
      timestamp: new Date().toISOString()
    });
  }

  addMatchesPolyfill() {
    if (!Element.prototype.matches) {
      Element.prototype.matches = 
        Element.prototype.matchesSelector || 
        Element.prototype.mozMatchesSelector ||
        Element.prototype.msMatchesSelector || 
        Element.prototype.oMatchesSelector || 
        Element.prototype.webkitMatchesSelector ||
        function(s) {
          const matches = (this.document || this.ownerDocument).querySelectorAll(s);
          let i = matches.length;
          while (--i >= 0 && matches.item(i) !== this) {}
          return i > -1;            
        };
    }
  }

  isDevelopment() {
    return location.hostname === 'localhost' || 
           location.hostname === '127.0.0.1' || 
           location.hostname.includes('local');
  }

  generateReport() {
    console.group('📊 Portfolio Error Report');
    console.log(`Total errors: ${this.errors.length}`);
    console.log(`Total fixes applied: ${this.fixes.length}`);
    
    if (this.errors.length > 0) {
      console.group('🐛 Errors by type:');
      const errorsByType = this.errors.reduce((acc, error) => {
        acc[error.type] = (acc[error.type] || 0) + 1;
        return acc;
      }, {});
      console.table(errorsByType);
      console.groupEnd();
    }
    
    if (this.fixes.length > 0) {
      console.group('🔧 Applied fixes:');
      this.fixes.forEach(fix => {
        console.log(`${fix.category}: ${fix.suggestion}`);
      });
      console.groupEnd();
    }
    
    console.groupEnd();
  }

  // 手動觸發報告
  getReport() {
    return {
      errors: this.errors,
      fixes: this.fixes,
      summary: {
        totalErrors: this.errors.length,
        totalFixes: this.fixes.length,
        errorsByType: this.errors.reduce((acc, error) => {
          acc[error.type] = (acc[error.type] || 0) + 1;
          return acc;
        }, {})
      }
    };
  }
}

// 自動初始化
document.addEventListener('DOMContentLoaded', () => {
  window.portfolioMonitor = new PortfolioErrorMonitor();
  
  // 在頁面載入完成後生成報告
  setTimeout(() => {
    if (window.portfolioMonitor.isDevelopment()) {
      window.portfolioMonitor.generateReport();
    }
  }, 5000);
});

// 讓用戶可以手動檢查
window.getPortfolioReport = () => window.portfolioMonitor?.getReport();
