<?php
// FILE: admin/index.php
// --- UPDATED: 後台管理首頁 ---
$page_title = "專案管理";
include '../api/db_connect.php';
include 'templates/header.php';
?>

<h1><?php echo $page_title; ?></h1>
<a href="edit.php" class="btn btn-create">新增專案</a>

<table>
    <thead>
        <tr>
            <th>排序</th>
            <th>封面</th>
            <th>分類</th>
            <th>標題</th>
            <th>狀態</th>
            <th>操作</th>
        </tr>
    </thead>
    <tbody>
        <?php
        // 查詢所有必要欄位，包括預覽媒體
        $sql = "SELECT p.id, p.title, p.sort_order, p.is_published, p.cover_image_url, p.preview_media_url, p.github_link, c.name as category_name 
                FROM projects p
                LEFT JOIN categories c ON p.category_id = c.id
                ORDER BY p.sort_order ASC, p.id DESC";
        $stmt = $pdo->query($sql);
        $projects = $stmt->fetchAll();

        if (count($projects) > 0):
            foreach ($projects as $row):
        ?>
                <tr>
                    <td><?php echo htmlspecialchars($row['sort_order']); ?></td>
                    <td>
                        <?php 
                        // 檢查兩個圖片欄位的檔案狀態
                        $previewPath = '../' . $row['preview_media_url'];
                        $coverPath = '../' . $row['cover_image_url'];
                        $previewExists = !empty($row['preview_media_url']) && file_exists($previewPath);
                        $coverExists = !empty($row['cover_image_url']) && file_exists($coverPath);
                        
                        // 決定要顯示的媒體（優先顯示存在的預覽媒體）
                        $displayMedia = '';
                        $displayType = '';
                        $displayExists = false;
                        
                        if ($previewExists) {
                            $displayMedia = $row['preview_media_url'];
                            $displayType = 'preview';
                            $displayExists = true;
                        } elseif ($coverExists) {
                            $displayMedia = $row['cover_image_url'];
                            $displayType = 'cover';
                            $displayExists = true;
                        }
                        
                        if ($displayExists && !empty($displayMedia)):
                            // 檢查檔案類型
                            $extension = strtolower(pathinfo($displayMedia, PATHINFO_EXTENSION));
                            $isVideo = in_array($extension, ['mp4', 'webm', 'mov']);
                        ?>
                            <!-- 顯示可用的媒體 -->
                            <?php if ($isVideo): ?>
                                <video class="thumbnail-image" controls muted style="max-width: 100px; max-height: 60px;">
                                    <source src="../<?php echo htmlspecialchars($displayMedia); ?>" type="video/mp4">
                                    無法播放影片
                                </video>
                            <?php else: ?>
                                <img src="../<?php echo htmlspecialchars($displayMedia); ?>" 
                                     alt="<?php echo htmlspecialchars($row['title']); ?>" 
                                     class="thumbnail-image" 
                                     style="max-width: 100px; max-height: 60px; object-fit: cover;">
                            <?php endif; ?>
                            
                            <!-- 狀態指示 -->
                            <div class="image-status">
                                <?php if ($previewExists): ?>
                                    <span class="image-status-success">✓ 使用預覽媒體</span>
                                <?php else: ?>
                                    <span class="image-status-warning">⚠ 使用封面圖片</span>
                                <?php endif; ?>
                            </div>
                        <?php else: ?>
                            <!-- 沒有可用的媒體 -->
                            <div class="text-center">
                                <div class="missing-image-placeholder">
                                    <span class="missing-image-icon">⚠</span>
                                </div>
                                <small class="image-status-error">圖片遺失</small>
                            </div>
                        <?php endif; ?>
                        
                        <!-- 詳細檔案狀態 -->
                        <div class="file-status-detail">
                            <?php if (!empty($row['preview_media_url'])): ?>
                                <div class="<?php echo $previewExists ? 'image-status-success' : 'image-status-error'; ?>">
                                    <?php echo $previewExists ? '✓' : '✗'; ?> 預覽: <?php echo basename($row['preview_media_url']); ?>
                                </div>
                            <?php endif; ?>
                            <?php if (!empty($row['cover_image_url'])): ?>
                                <div class="<?php echo $coverExists ? 'image-status-success' : 'image-status-error'; ?>">
                                    <?php echo $coverExists ? '✓' : '✗'; ?> 封面: <?php echo basename($row['cover_image_url']); ?>
                                </div>
                            <?php endif; ?>
                        </div>
                    </td>
                    <td><?php echo htmlspecialchars($row['category_name']); ?></td>
                    <td>
                        <?php echo htmlspecialchars($row['title']); ?>
                        <?php
                        // ▼▼▼ 在標題下方，如果 github_link 存在，就顯示一個小小的 GitHub icon ▼▼▼
                        if (!empty($row['github_link'])):
                        ?>
                            <a href="<?php echo htmlspecialchars($row['github_link']); ?>" target="_blank" style="text-decoration: none; font-size: 0.8em; color: #0366d6;">🔗 GitHub</a>
                        <?php endif; ?>
                    </td>
                    <td><?php echo $row['is_published'] ? '已發布' : '<span class="unpublished">未發布</span>'; ?></td>
                    <td class="actions">
                        <a href="edit.php?id=<?php echo $row['id']; ?>" class="btn btn-edit">編輯</a>
                        <a href="actions.php?action=delete&id=<?php echo $row['id']; ?>" class="btn btn-delete" onclick="return confirm('確定要刪除「<?php echo htmlspecialchars($row['title']); ?>」這個專案嗎？此操作無法復原。');">刪除</a>
                    </td>
                </tr>
            <?php
            endforeach;
        else:
            ?>
            <tr>
                <td colspan="6">目前沒有任何專案。</td>
            </tr>
        <?php endif; ?>
    </tbody>
</table>

<?php include 'templates/footer.php'; ?>