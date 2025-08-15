<?php
// FILE: api/get_projects.php
// --- FIXED: 獲取所有已發布專案的列表，並正確包含其分類名稱 ---

include 'db_connect.php';

// 清理輸入參數
$category = isset($_GET['category']) ? sanitizeInput($_GET['category']) : null;
$limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 50;
$offset = isset($_GET['offset']) ? (int)$_GET['offset'] : 0;

// 限制結果數量
$limit = min($limit, 100); // 最多100項

// 構建查詢
$whereClause = "p.is_published = 1";
$params = [];

if ($category && $category !== 'all') {
    $whereClause .= " AND c.name = :category";
    $params[':category'] = $category;
}

// 使用 JOIN 來同時獲取分類名稱
$sql = "
    SELECT 
        p.id, 
        p.title, 
        TRIM(COALESCE(NULLIF(TRIM(p.preview_media_url), ''), p.cover_image_url)) AS preview_media_url,
        c.name AS category_name
    FROM 
        projects p
    JOIN 
        categories c ON p.category_id = c.id
    WHERE 
        {$whereClause}
    ORDER BY 
        p.sort_order ASC, p.id DESC
    LIMIT :limit OFFSET :offset
";

// 添加分頁參數
$params[':limit'] = $limit;
$params[':offset'] = $offset;

try {
    $stmt = $pdo->prepare($sql);
    
    // 綁定參數
    foreach ($params as $key => $value) {
        if ($key === ':limit' || $key === ':offset') {
            $stmt->bindValue($key, $value, PDO::PARAM_INT);
        } else {
            $stmt->bindValue($key, $value, PDO::PARAM_STR);
        }
    }
    
    $stmt->execute();
    $projects = $stmt->fetchAll();
    send_json($projects);
} catch (PDOException $e) {
    error_log("Database error in get_projects.php: " . $e->getMessage());
    http_response_code(500);
    send_json(['error' => '獲取專案列表時發生錯誤']);
}
