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
        $sql = "SELECT p.id, p.title, p.sort_order, p.is_published, p.cover_image_url, c.name as category_name 
                FROM projects p
                LEFT JOIN categories c ON p.category_id = c.id
                ORDER BY p.sort_order ASC, p.id DESC";
        $stmt = $pdo->query($sql);
        $projects = $stmt->fetchAll();

        if (count($projects) > 0):
            foreach($projects as $row):
        ?>
        <tr>
            <td><?php echo htmlspecialchars($row['sort_order']); ?></td>
            <td>
                <?php if (!empty($row['cover_image_url'])): ?>
                    <img src="../<?php echo htmlspecialchars($row['cover_image_url']); ?>" alt="<?php echo htmlspecialchars($row['title']); ?>" class="thumbnail-image">
                <?php endif; ?>
            </td>
            <td><?php echo htmlspecialchars($row['category_name']); ?></td>
            <td><?php echo htmlspecialchars($row['title']); ?></td>
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
