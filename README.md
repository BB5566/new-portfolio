# 🎨 BOB TSOU | 個人作品集網站

一個現代化、響應式的個人作品集網站，展示網頁開發與 UI/UX 設計專業技能。

[![線上展示](https://img.shields.io/badge/🌐_線上展示-查看作品集-4CAF50?style=for-the-badge)](https://bb5566.github.io/new-portfolio/)
[![技術棧](https://img.shields.io/badge/⚡_技術棧-HTML5_CSS3_JavaScript-1976D2?style=for-the-badge)](#-技術架構)
[![設計風格](https://img.shields.io/badge/🎨_設計風格-現代化_響應式-FF6B6B?style=for-the-badge)](#-視覺設計)

## ✨ 網站特色

### � **互動體驗**
- **智能眼睛追蹤**：獨創的眼球跟隨滑鼠效果，支援鬥雞眼等自然反應
- **流暢動畫**：基於 GSAP 的專業級動畫系統，提供滑順的視覺體驗
- **秒開體驗**：純 CSS Preloader 設計，確保視覺上的即時反饋
- **響應式設計**：完美適配桌面、平板、手機等各種設備

### � **視覺設計**
- **現代化 UI**：採用簡潔的現代設計風格，突出內容重點
- **玻璃擬態效果**：精緻的視覺層次，增強設計質感
- **自訂字體**：整合 LINE Seed 字體，提升中文閱讀體驗
- **視覺一致性**：統一的色彩系統和間距規範

### 🛠️ **技術實力展示**
- **純手工打造**：所有動畫和互動效果皆為原創設計
- **效能優化**：硬體加速、資源預載、降級支援等專業優化
- **程式碼品質**：模組化架構、錯誤處理、無障礙支援
- **全端技能**：前端展示搭配後端 API 和資料庫管理

## � 技術架構

### 前端核心
![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat-square&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=flat-square&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat-square&logo=javascript&logoColor=black)

### 動畫與互動
![GSAP](https://img.shields.io/badge/GSAP-88CE02?style=flat-square&logo=greensock&logoColor=white)
![Bootstrap](https://img.shields.io/badge/Bootstrap-7952B3?style=flat-square&logo=bootstrap&logoColor=white)
![GLightbox](https://img.shields.io/badge/GLightbox-Image_Gallery-FF9800?style=flat-square)

### 後端支援
![PHP](https://img.shields.io/badge/PHP-777BB4?style=flat-square&logo=php&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-4479A1?style=flat-square&logo=mysql&logoColor=white)

## � 專案架構

```
portfolio/
├── 🏠 index.html              # 主頁面結構
├── 🎨 style.css               # 主要樣式表 (2300+ 行)
├── ⚡ script.js               # 核心 JavaScript (1260+ 行)
├── 🛡️ error-monitor.js        # 錯誤監控系統
│
├── 📁 admin/                  # 後台管理系統
│   ├── index.php             # 管理介面
│   ├── edit.php              # 專案編輯
│   └── actions.php           # 資料操作
│
├── 📁 api/                    # RESTful API
│   ├── get_projects.php      # 專案資料 API
│   └── db_connect.php        # 資料庫連接
│
├── 📁 fonts/                  # LINE Seed 字體系列
├── 📁 uploads/                # 專案圖片資源
└── 📁 docs/                   # 技術文件
```

## 🎯 核心功能

### � **動畫系統**
```javascript
// 眼睛追蹤範例
elements.eyes.forEach(eye => {
  const angle = Math.atan2(deltaY, deltaX);
  const moveDistance = (distance / 150) * 18;
  
  gsap.to(eye, {
    x: Math.cos(angle) * moveDistance,
    y: Math.sin(angle) * moveDistance,
    duration: 0.2,
    ease: "power1.out"
  });
});
```

### 🎨 **CSS 變數系統**
```css
:root {
  --color-primary: #f8cb74;    /* 主要色調 */
  --color-accent: #4a47a3;     /* 強調色彩 */
  --color-bg: #fdfaf2;         /* 背景顏色 */
  --color-text: #2c2c2c;       /* 文字顏色 */
}
```

### � **響應式斷點**
| 設備類型 | 螢幕寬度 | 優化重點 |
|---------|---------|---------|
| 📱 手機 | < 768px | 觸控優化、垂直導航 |
| 📱 平板 | 768px - 1024px | 混合互動、彈性佈局 |
| 💻 桌機 | > 1024px | 完整功能、動畫效果 |

## 🏆 技術亮點

### ⚡ **效能優化**
- **預載入策略**：關鍵資源優先載入
- **硬體加速**：GPU 加速的動畫渲染
- **降級支援**：GSAP 載入失敗的備用方案
- **資源管理**：防止記憶體洩漏

### ♿ **無障礙設計**
- **ARIA 標籤**：完整的語意標記
- **鍵盤導航**：全站快捷鍵支援
- **對比度**：符合 WCAG 標準
- **螢幕閱讀器**：最佳化朗讀體驗

### 🛡️ **穩定性保證**
- **錯誤邊界**：自動錯誤捕獲與修復
- **漸進增強**：核心功能優先原則
- **瀏覽器相容**：現代瀏覽器完整支援

## 📈 效能表現

- ⚡ **首次內容繪製 (FCP)**：< 1.2s
- 🚀 **最大內容繪製 (LCP)**：< 2.0s
- 📊 **累積版面偏移 (CLS)**：< 0.1
- 🎯 **Lighthouse 分數**：95+ (桌面版)

## 🎨 設計理念

> **簡潔而不簡單**：每一個視覺元素都經過精心設計，既要美觀又要實用。

- **內容為王**：設計服務於內容展示
- **互動自然**：符合用戶直覺的操作邏輯
- **技術展示**：通過實際效果展現技術能力
- **品牌一致**：統一的視覺語言和用戶體驗

## 🌟 特色展示

### 👁️ **智能眼睛追蹤**
獨創的雙眼獨立追蹤系統，支援：
- 真實的眼球運動模擬
- 鬥雞眼效果（滑鼠移到兩眼中間）
- 平滑的動畫過渡
- 距離感應式移動幅度

### 🎪 **秒開 Preloader**
純 CSS 實作的載入動畫：
- 與頁面骨架同時顯示
- 品牌名稱動態效果
- 無 JavaScript 依賴
- 視覺連貫性設計

### 🎵 **手風琴式導航**
優雅的內容組織方式：
- Bootstrap 5 原生組件
- 平滑的展開/收合動畫
- 響應式適配
- 無障礙鍵盤支援

## 👨‍💻 關於作者

**Bob Tsou** - 網頁開發與 UI/UX 設計師

🔸 **設計背景**：7+ 年平面設計與電商行銷經驗  
🔸 **技術轉型**：920 小時密集網頁開發訓練  
🔸 **專業技能**：HTML、CSS、JavaScript、PHP、MySQL  
🔸 **設計工具**：Photoshop、Illustrator、Figma  

### 📞 聯絡方式
- 🌐 **個人網站**：[bb-made.com](http://bb-made.com)
- 📧 **電子郵件**：hello@bb-made.com
- 🐙 **GitHub**：[@BB5566](https://github.com/BB5566)

---

<div align="center">

**🚀 [立即查看線上作品集](https://bb5566.github.io/new-portfolio/) 🚀**

*展示現代網頁開發技術與設計美學的完美結合*

⭐ 如果您喜歡這個作品，歡迎給個星星支持！

</div>
