<?php
// FILE: api/get_projects.php

include 'db_connect.php';

// 使用 PDO 執行查詢
$stmt = $pdo->query("SELECT id, title FROM projects WHERE is_published = 1 ORDER BY sort_order ASC, id DESC");
$projects = $stmt->fetchAll();

send_json($projects);
