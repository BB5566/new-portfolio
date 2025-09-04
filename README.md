# 🚀 BOB TSOU | 個人作品集網站

一個現代化、響應式的個人作品集網站，展示網頁開發與 UI/UX 設計作品。

[![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-Live%20Demo-brightgreen)](https://bb5566.github.io/new-portfolio/)
[![HTML](https://img.shields.io/badge/HTML5-E34F26?logo=html5&logoColor=white)](https://developer.mozilla.org/docs/Web/HTML)
[![CSS](https://img.shields.io/badge/CSS3-1572B6?logo=css3&logoColor=white)](https://developer.mozilla.org/docs/Web/CSS)
[![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript&logoColor=black)](https://developer.mozilla.org/docs/Web/JavaScript)
[![GSAP](https://img.shields.io/badge/GSAP-88CE02?logo=greensock&logoColor=white)](https://greensock.com/gsap/)

## ✨ 功能特色

### 🎨 **視覺設計**
- **現代化 UI**: 採用玻璃擬態（Glassmorphism）設計風格
- **深色/淺色模式**: 自動主題切換系統
- **響應式設計**: 完美適配桌面、平板、手機
- **自訂游標**: 互動式鼠標跟隨效果

### 🎬 **動畫效果**
- **GSAP 動畫**: 流暢的滾動觸發動畫
- **3D 變換**: 作品卡片 3D 翻轉效果  
- **粒子系統**: 動態背景粒子動畫
- **打字效果**: 動態文字展示

### 🎵 **音效系統**
- **互動音效**: 點擊、懸停音效回饋
- **Tone.js 整合**: 專業音頻處理
- **用戶友善**: 符合瀏覽器自動播放政策

### ♿ **可訪問性**
- **ARIA 標籤**: 完整的無障礙支援
- **鍵盤導航**: 全站鍵盤操作支援
- **螢幕閱讀器**: 最佳化語音導航體驗

### 🛡️ **穩定性**
- **錯誤監控**: 自動錯誤檢測與修復
- **性能優化**: 硬體加速與資源管理
- **漸進增強**: 核心功能降級支援

## 🛠️ 技術棧

### 前端核心
- ![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
- ![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white) 
- ![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)

### 框架與庫
- ![Bootstrap](https://img.shields.io/badge/Bootstrap-7952B3?style=for-the-badge&logo=bootstrap&logoColor=white)
- ![GSAP](https://img.shields.io/badge/GSAP-88CE02?style=for-the-badge&logo=greensock&logoColor=white)
- ![Tone.js](https://img.shields.io/badge/Tone.js-000000?style=for-the-badge&logo=javascript&logoColor=white)

### 後端支援
- ![PHP](https://img.shields.io/badge/PHP-777BB4?style=for-the-badge&logo=php&logoColor=white)
- ![MySQL](https://img.shields.io/badge/MySQL-4479A1?style=for-the-badge&logo=mysql&logoColor=white)

### 開發工具
- ![Git](https://img.shields.io/badge/Git-F05032?style=for-the-badge&logo=git&logoColor=white)
- ![GitHub](https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=github&logoColor=white)
- ![VS Code](https://img.shields.io/badge/VS%20Code-007ACC?style=for-the-badge&logo=visual-studio-code&logoColor=white)

## 📁 專案結構

```
new-portfolio/
├── 📄 index.html              # 主要 HTML 結構
├── 🎨 style.css               # 主要樣式表 (2500+ 行)
├── ⚡ script.js               # 核心 JavaScript (1800+ 行)
├── 🛡️ error-monitor.js        # 錯誤監控系統
├── 📊 performance-audit.js    # 性能稽核工具
├── 📝 ERROR_FIX_REPORT.md     # 錯誤修復報告
├── 🎵 Tone.js                 # 音頻庫 (CDN)
├── 🎬 GSAP                    # 動畫庫 (CDN)
│
├── 📁 admin/                  # 後台管理系統
│   ├── index.php             # 管理首頁
│   ├── edit.php              # 編輯介面
│   ├── actions.php           # 後台操作
│   └── style.css             # 後台樣式
│
├── 📁 api/                    # API 端點
│   ├── db_connect.php        # 資料庫連接
│   ├── get_projects.php      # 獲取專案列表
│   └── get_project_detail.php # 專案詳情
│
├── 📁 fonts/                  # 自訂字體
│   └── LINESeedTW_*.woff*    # LINE Seed 字體家族
│
├── 📁 uploads/                # 專案圖片
├── 📁 logs/                   # 系統日誌
└── 📄 portfolio_db.sql        # 資料庫結構
```

## 🚀 快速開始

### 環境需求
- 🌐 **Web Server**: Apache/Nginx (支援 PHP)
- 🐘 **PHP**: 7.4+ 
- 🗄️ **MySQL**: 5.7+ 或 MariaDB 10.3+
- 🌍 **瀏覽器**: Chrome 90+, Firefox 90+, Safari 14+

### 本地安裝

1. **克隆專案**
   ```bash
   git clone https://github.com/BB5566/new-portfolio.git
   cd new-portfolio
   ```

2. **設置資料庫**
   ```sql
   # 建立資料庫
   CREATE DATABASE portfolio_db;
   
   # 匯入資料結構
   mysql -u your_username -p portfolio_db < portfolio_db.sql
   ```

3. **配置資料庫連接**
   ```php
   # 編輯 api/db_connect.php
   $host = 'localhost';
   $dbname = 'portfolio_db';
   $username = 'your_username';
   $password = 'your_password';
   ```

4. **啟動本地服務器**
   ```bash
   # 使用 PHP 內建服務器
   php -S localhost:8000
   
   # 或配置 Apache/Nginx 虛擬主機
   ```

5. **訪問網站**
   - 前台: `http://localhost:8000`
   - 後台: `http://localhost:8000/admin`

### GitHub Pages 部署

```bash
# 推送到 GitHub
git add .
git commit -m "🚀 Portfolio website ready for deployment"
git push origin main

# 啟用 GitHub Pages
# Repository Settings → Pages → Source: Deploy from a branch → main
```

## 🎯 使用指南

### 🎨 自訂主題
```css
:root {
  --color-primary: #f8cb74;    /* 主要顏色 */
  --color-accent: #4a47a3;     /* 強調顏色 */
  --color-bg: #fdfaf2;         /* 背景顏色 */
}
```

### 🔧 開發模式
```javascript
// script.js 中設置
const DEBUG = true;  // 開啟調試模式

// 控制台執行性能稽核
new PerformanceAudit().runFullAudit();

// 查看錯誤報告
getPortfolioReport();
```

### 📊 後台管理
1. 訪問 `/admin` 進入管理後台
2. 新增、編輯、刪除作品項目
3. 管理專案分類和技術標籤
4. 查看訪問日誌

## 🌟 核心特色

### 🎭 動畫系統
- **ScrollTrigger**: 滾動觸發動畫
- **Timeline**: 時間軸動畫控制
- **Morphing**: 形狀變形效果
- **Parallax**: 視差滾動效果

### 🎵 音頻系統
- **Tone.js**: 專業音頻合成
- **Web Audio API**: 低延遲音效
- **用戶交互**: 符合現代瀏覽器政策

### 🛡️ 穩定性
- **錯誤邊界**: 自動錯誤捕獲
- **資源管理**: 記憶體洩漏防護
- **漸進增強**: 向下兼容

## 📱 響應式支援

| 設備 | 解析度 | 支援狀態 |
|------|--------|----------|
| 📱 Mobile | < 768px | ✅ 完全支援 |
| 📱 Tablet | 768px - 1024px | ✅ 完全支援 |
| 💻 Desktop | > 1024px | ✅ 完全支援 |
| 🖥️ Large Screen | > 1440px | ✅ 最佳化 |

## 🔧 故障排除

### 常見問題

**Q: 動畫不流暢？**
```javascript
// 檢查硬體加速
.animate-element {
  will-change: transform;
  transform: translate3d(0, 0, 0);
}
```

**Q: 音效無法播放？**
```javascript
// 確保用戶交互後才初始化
document.addEventListener('click', initAudio, { once: true });
```

**Q: 圖片載入緩慢？**
```html
<!-- 使用預載入 -->
<link rel="preload" href="your-photo.png" as="image">
```

## 📈 性能指標

- ⚡ **Lighthouse 分數**: 95+
- 🚀 **First Contentful Paint**: < 1.5s
- 📊 **Largest Contentful Paint**: < 2.5s
- 🎯 **Cumulative Layout Shift**: < 0.1

## 🤝 貢獻指南

1. **Fork** 此專案
2. **建立** 功能分支 (`git checkout -b feature/AmazingFeature`)
3. **提交** 更改 (`git commit -m 'Add some AmazingFeature'`)
4. **推送** 分支 (`git push origin feature/AmazingFeature`)
5. **開啟** Pull Request

## 📄 授權

此專案採用 MIT 授權 - 詳見 [LICENSE](LICENSE) 檔案

## 👨‍💻 作者

**Bob Tsou**
- 🌐 Website: [bb-made.com](http://bb-made.com)
- 📧 Email: hello@bb-made.com
- 💼 LinkedIn: [連結待補充]
- 🐙 GitHub: [@BB5566](https://github.com/BB5566)

## 🙏 致謝

- 🎨 設計靈感來自現代 Web 設計趨勢
- 🎬 動畫技術感謝 [GSAP](https://greensock.com/) 團隊
- 🎵 音頻處理感謝 [Tone.js](https://tonejs.github.io/) 社群
- 🌈 色彩設計參考 [Coolors](https://coolors.co/)

---

⭐ 如果這個專案對你有幫助，請給一個星星！

🚀 **Live Demo**: [https://bb5566.github.io/new-portfolio/](https://bb5566.github.io/new-portfolio/)
