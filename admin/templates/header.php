<?php
// FILE: admin/templates/header.php
// --- 後台共用頁首 ---
session_start();
?>
<!DOCTYPE html>
<html lang="zh-TW">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?php echo isset($page_title) ? htmlspecialchars($page_title) . ' - ' : ''; ?>管理後台</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <header class="admin-header">
        <div class="admin-container">
            <nav class="admin-nav">
                <a href="../index.html" class="brand" target="_blank">我的作品集</a>
                <ul>
                    <li><a href="index.php">專案管理</a></li>
                    <!-- <li><a href="categories.php">分類管理</a></li> -->
                    <!-- <li><a href="tags.php">標籤管理</a></li> -->
                </ul>
            </nav>
        </div>
    </header>
    <main class="admin-main">
        <div class="admin-container">
            <?php if (isset($_SESSION['message'])): ?>
                <div class="message <?php echo isset($_SESSION['message_type']) ? $_SESSION['message_type'] : 'success'; ?>">
                    <?php echo $_SESSION['message']; unset($_SESSION['message']); unset($_SESSION['message_type']); ?>
                </div>
            <?php endif; ?>
