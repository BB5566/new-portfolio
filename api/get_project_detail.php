<?php
// FILE: api/get_project_detail.php
// --- 根據 ID 獲取單一專案的詳細資訊 (最終版) ---

// 引入資料庫連線設定
include 'db_connect.php';

// --- 安全性：接收並驗證 ID ---
$id = isset($_GET['id']) ? sanitizeInput($_GET['id']) : '';

// 驗證 ID 是否為正整數
if (!is_numeric($id) || intval($id) <= 0) {
    http_response_code(400); // Bad Request
    send_json(['error' => '無效的專案 ID']);
}

$id = intval($id);

try {
    // --- 1. 獲取專案主要資訊 ---
    // 使用 LEFT JOIN 以確保即使分類被刪除，專案依然能顯示
    // 明確選取所有需要的欄位，包含新增的 github_link
    $sql = "SELECT 
                p.id, p.category_id, p.title, p.description, 
                p.cover_image_url, p.preview_media_url, 
                p.project_link, p.github_link, 
                p.sort_order, p.is_published,
                c.name as category_name 
            FROM projects p
            LEFT JOIN categories c ON p.category_id = c.id
            WHERE p.id = ? AND p.is_published = 1";

    $stmt = $pdo->prepare($sql);
    $stmt->execute([$id]);
    $project = $stmt->fetch();

    // 如果找不到專案，回傳 404 錯誤
    if (!$project) {
        http_response_code(404); // Not Found
        send_json(['error' => '找不到指定的專案，或該專案尚未發布。']);
    }

    // --- 2. 獲取相關的技能標籤 ---
    $sql_tags = "SELECT t.id, t.name, t.category 
                 FROM tags t
                 JOIN project_tag_map ptm ON t.id = ptm.tag_id
                 WHERE ptm.project_id = ?
                 ORDER BY t.category, t.name"; // 讓標籤排序更一致

    $stmt_tags = $pdo->prepare($sql_tags);
    $stmt_tags->execute([$id]);
    $project['tags'] = $stmt_tags->fetchAll();

    // --- 3. 獲取專案圖庫 ---
    // 新增選取 id 欄位，未來可能用於後台編輯
    $sql_gallery = "SELECT id, image_url, caption 
                    FROM project_galleries 
                    WHERE project_id = ? 
                    ORDER BY sort_order ASC, id ASC"; // 增加 id 排序，確保順序穩定

    $stmt_gallery = $pdo->prepare($sql_gallery);
    $stmt_gallery->execute([$id]);
    $project['gallery'] = $stmt_gallery->fetchAll();

    // --- 4. 成功，回傳完整的專案資料 ---
    send_json($project);
} catch (PDOException $e) {
    // --- 錯誤處理 ---
    // 在正式環境中，你應該將錯誤記錄到日誌檔，而不是直接顯示
    // error_log("API Error (get_project_detail.php): " . $e->getMessage());

    http_response_code(500); // Internal Server Error
    send_json(['error' => '伺服器發生內部錯誤，無法取得專案詳情。']);
}
