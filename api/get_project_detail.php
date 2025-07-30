<?php
// FILE: api/get_project_detail.php
// --- 根據 ID 獲取單一專案的詳細資訊 (PDO 版本) ---

include 'db_connect.php';

$id = isset($_GET['id']) ? intval($_GET['id']) : 0;

if ($id <= 0) {
    http_response_code(400); // Bad Request
    send_json(['error' => '無效的專案 ID']);
}

// 1. 獲取專案主要資訊，並同時 JOIN 分類名稱
$sql = "SELECT p.*, c.name as category_name 
        FROM projects p
        JOIN categories c ON p.category_id = c.id
        WHERE p.id = ? AND p.is_published = 1";
$stmt = $pdo->prepare($sql);
$stmt->execute([$id]);
$project = $stmt->fetch();

if (!$project) {
    http_response_code(404); // Not Found
    send_json(['error' => '找不到專案或尚未發布']);
}

// 2. 獲取相關的技能標籤
$sql_tags = "SELECT t.name, t.category 
             FROM tags t
             JOIN project_tag_map ptm ON t.id = ptm.tag_id
             WHERE ptm.project_id = ?";
$stmt_tags = $pdo->prepare($sql_tags);
$stmt_tags->execute([$id]);
$project['tags'] = $stmt_tags->fetchAll();

// 3. 獲取專案圖庫
$sql_gallery = "SELECT image_url, caption 
                FROM project_galleries 
                WHERE project_id = ? 
                ORDER BY sort_order ASC";
$stmt_gallery = $pdo->prepare($sql_gallery);
$stmt_gallery->execute([$id]);
$project['gallery'] = $stmt_gallery->fetchAll();

send_json($project);