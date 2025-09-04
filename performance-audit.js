/**
 * @file 作品集效能稽核工具
 * @author Bob Tsou
 * @description 檢查作品集的效能和最佳化機會
 */

class PerformanceAudit {
  constructor() {
    this.results = {
      css: [],
      javascript: [],
      images: [],
      fonts: [],
      general: []
    };
  }

  // 檢查 CSS 效能
  auditCSS() {
    const styles = document.styleSheets;
    let rules = 0;
    let selectors = 0;
    let importantCount = 0;

    try {
      Array.from(styles).forEach(sheet => {
        if (sheet.cssRules) {
          Array.from(sheet.cssRules).forEach(rule => {
            rules++;
            if (rule.selectorText) {
              selectors++;
              if (rule.style && rule.style.cssText.includes('!important')) {
                importantCount++;
              }
            }
          });
        }
      });

      this.results.css.push({
        metric: 'CSS 規則數量',
        value: rules,
        status: rules < 1000 ? 'good' : rules < 2000 ? 'warning' : 'poor',
        recommendation: rules > 1000 ? '考慮分離 CSS 或移除未使用的規則' : null
      });

      this.results.css.push({
        metric: '!important 使用次數',
        value: importantCount,
        status: importantCount < 10 ? 'good' : importantCount < 25 ? 'warning' : 'poor',
        recommendation: importantCount > 10 ? '減少 !important 使用，提高選擇器權重' : null
      });

    } catch (e) {
      console.warn('CSS 分析失敗:', e);
    }
  }

  // 檢查 JavaScript 效能
  auditJavaScript() {
    const scripts = document.querySelectorAll('script');
    let totalSize = 0;
    let externalScripts = 0;

    scripts.forEach(script => {
      if (script.src) {
        externalScripts++;
      }
      // 估算腳本大小（僅內聯腳本）
      if (script.textContent) {
        totalSize += script.textContent.length;
      }
    });

    this.results.javascript.push({
      metric: '外部腳本數量',
      value: externalScripts,
      status: externalScripts < 5 ? 'good' : externalScripts < 10 ? 'warning' : 'poor',
      recommendation: externalScripts > 5 ? '考慮合併腳本或使用 HTTP/2' : null
    });

    this.results.javascript.push({
      metric: '內聯腳本大小 (KB)',
      value: Math.round(totalSize / 1024),
      status: totalSize < 50000 ? 'good' : totalSize < 100000 ? 'warning' : 'poor',
      recommendation: totalSize > 50000 ? '考慮移除 console.log 和優化代碼' : null
    });
  }

  // 檢查圖片效能
  auditImages() {
    const images = document.querySelectorAll('img');
    let largeImages = 0;
    let imagesWithoutAlt = 0;

    images.forEach(img => {
      // 檢查是否有 alt 屬性
      if (!img.alt) {
        imagesWithoutAlt++;
      }

      // 檢查圖片尺寸（需要等待載入）
      if (img.complete) {
        if (img.naturalWidth > 1920 || img.naturalHeight > 1080) {
          largeImages++;
        }
      }
    });

    this.results.images.push({
      metric: '缺少 alt 屬性的圖片',
      value: imagesWithoutAlt,
      status: imagesWithoutAlt === 0 ? 'good' : 'poor',
      recommendation: imagesWithoutAlt > 0 ? '為所有圖片添加 alt 屬性以提高可訪問性' : null
    });

    this.results.images.push({
      metric: '可能過大的圖片',
      value: largeImages,
      status: largeImages === 0 ? 'good' : largeImages < 3 ? 'warning' : 'poor',
      recommendation: largeImages > 0 ? '優化圖片尺寸和格式（考慮 WebP）' : null
    });
  }

  // 檢查字體效能
  auditFonts() {
    const fontFaces = document.fonts;
    const loadedFonts = Array.from(fontFaces).filter(font => font.status === 'loaded').length;
    const totalFonts = fontFaces.size;

    this.results.fonts.push({
      metric: '載入的字體數量',
      value: `${loadedFonts}/${totalFonts}`,
      status: totalFonts < 4 ? 'good' : totalFonts < 8 ? 'warning' : 'poor',
      recommendation: totalFonts > 4 ? '考慮減少字體變體或使用字體子集' : null
    });
  }

  // 檢查一般效能指標
  auditGeneral() {
    // 檢查動畫元素
    const animatedElements = document.querySelectorAll('[style*="will-change"], .animate-element');
    
    this.results.general.push({
      metric: '使用硬體加速的元素',
      value: animatedElements.length,
      status: animatedElements.length > 0 ? 'good' : 'warning',
      recommendation: animatedElements.length === 0 ? '為動畫元素添加 will-change 屬性' : null
    });

    // 檢查 meta 標籤
    const viewport = document.querySelector('meta[name="viewport"]');
    this.results.general.push({
      metric: '響應式 viewport 設定',
      value: viewport ? '已設定' : '未設定',
      status: viewport ? 'good' : 'poor',
      recommendation: !viewport ? '添加 viewport meta 標籤' : null
    });
  }

  // 執行完整稽核
  async runFullAudit() {
    console.log('🔍 開始效能稽核...');
    
    this.auditCSS();
    this.auditJavaScript();
    this.auditImages();
    this.auditFonts();
    this.auditGeneral();

    // 等待圖片載入完成後再次檢查
    await new Promise(resolve => {
      if (document.readyState === 'complete') {
        resolve();
      } else {
        window.addEventListener('load', resolve);
      }
    });

    this.generateReport();
  }

  // 生成報告
  generateReport() {
    console.log('\n📊 效能稽核報告');
    console.log('='.repeat(50));

    Object.entries(this.results).forEach(([category, results]) => {
      if (results.length > 0) {
        console.log(`\n📁 ${category.toUpperCase()}`);
        console.log('-'.repeat(30));
        
        results.forEach(result => {
          const icon = result.status === 'good' ? '✅' : 
                       result.status === 'warning' ? '⚠️' : '❌';
          
          console.log(`${icon} ${result.metric}: ${result.value}`);
          
          if (result.recommendation) {
            console.log(`   💡 建議: ${result.recommendation}`);
          }
        });
      }
    });

    console.log('\n🎯 總結建議:');
    console.log('- 定期運行此稽核工具');
    console.log('- 監控 Core Web Vitals 指標');
    console.log('- 使用 Chrome DevTools 進行深入分析');
    console.log('='.repeat(50));
  }
}

// 使用方式：
// const audit = new PerformanceAudit();
// audit.runFullAudit();

// 或者直接在控制台執行：
// window.runPerformanceAudit = () => new PerformanceAudit().runFullAudit();

export default PerformanceAudit;
