# 個人作品集網站

這是一個用於展示個人設計與開發作品的網站。

## 功能特色

*   **作品展示**: 以分類方式清楚呈現網頁設計、UI/UX、平面設計等不同領域的作品。
*   **後台管理**: 提供一個簡單的管理後台，可以新增、編輯或刪除作品項目。
*   **技術標籤**: 每個專案都可以被標上使用的技術（如 HTML, PHP, Figma 等）。

## 技術棧

*   **前端**: HTML, CSS, JavaScript (搭配 jQuery)
*   **後端**: PHP
*   **資料庫**: MariaDB / MySQL
*   **網頁伺服器**: Apache (使用 `.htaccess` 進行存取控制)

## 安裝與設定

1.  **環境需求**:
    *   支援 PHP 的網頁伺服器 (例如 Apache, Nginx)。
    *   MySQL 或 MariaDB 資料庫。

2.  **資料庫設定**:
    *   建立一個新的資料庫 (例如 `portfolio_db`)。
    *   將 `portfolio_db.sql` 檔案匯入到您建立的資料庫中。
    *   **注意**: `portfolio_db.sql` 檔案基於安全考量，已被列在 `.gitignore` 中，不會上傳到 Git 儲存庫。請確保您有此檔案的本地備份。

3.  **後台登入**:
    *   後台位於 `/admin` 路徑。
    *   登入的帳號密碼儲存於 `admin/.htpasswd` 檔案中。此檔案同樣基於安全考量被 `.gitignore` 忽略。

## 檔案結構

```
.
├── admin/            # 後台管理介面
├── api/              # API 端點 (可擴充)
├── fonts/            # 網頁字型
├── uploads/          # 上傳的圖片 (已被 gitignore)
├── index.html        # 前台首頁
├── script.js         # 前台 JavaScript
├── style.css         # 前台樣式表
├── portfolio_db.sql  # 資料庫結構與資料 (已被 gitignore)
└── README.md         # 專案說明檔案
```
