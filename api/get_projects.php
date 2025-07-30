<?php
// FILE: api/get_projects.php
// --- FIXED: 獲取所有已發布專案的列表，並正確包含其分類名稱 ---

include 'db_connect.php';

// 使用 JOIN 來同時獲取分類名稱
$sql = "
    SELECT 
        p.id, 
        p.title, 
        p.preview_media_url,
        c.name AS category_name
    FROM 
        projects p
    JOIN 
        categories c ON p.category_id = c.id
    WHERE 
        p.is_published = 1 
    ORDER BY 
        p.sort_order ASC, p.id DESC
";

$stmt = $pdo->query($sql);
$projects = $stmt->fetchAll();

send_json($projects);
