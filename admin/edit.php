<?php
// FILE: admin/edit.php
// --- UPDATED: 新增/編輯專案的表單 ---
include '../api/db_connect.php';

$project = [
    'id' => '',
    'category_id' => '',
    'title' => '',
    'description' => '',
    'cover_image_url' => '',
    'preview_media_url' => '',
    'project_link' => '',
    'sort_order' => 0,
    'is_published' => 1
];
$page_title = "新增專案";
$action = "create";
$project_tags = [];
$gallery_images = [];

$categories = $pdo->query("SELECT * FROM categories ORDER BY id ASC")->fetchAll();
$tags = $pdo->query("SELECT * FROM tags ORDER BY category, name ASC")->fetchAll();

if (isset($_GET['id'])) {
    $id = intval($_GET['id']);
    $stmt = $pdo->prepare("SELECT * FROM projects WHERE id = ?");
    $stmt->execute([$id]);
    $project = $stmt->fetch();

    if ($project) {
        $page_title = "編輯專案: " . htmlspecialchars($project['title']);
        $action = "update";
        $stmt_tags = $pdo->prepare("SELECT tag_id FROM project_tag_map WHERE project_id = ?");
        $stmt_tags->execute([$id]);
        $project_tags = $stmt_tags->fetchAll(PDO::FETCH_COLUMN, 0);
        $stmt_gallery = $pdo->prepare("SELECT * FROM project_galleries WHERE project_id = ? ORDER BY sort_order ASC, id ASC");
        $stmt_gallery->execute([$id]);
        $gallery_images = $stmt_gallery->fetchAll();
    } else {
        // Reset if ID not found
        $project = [
            'id' => '',
            'category_id' => '',
            'title' => '',
            'description' => '',
            'cover_image_url' => '',
            'preview_media_url' => '',
            'project_link' => '',
            'sort_order' => 0,
            'is_published' => 1
        ];
    }
}

include 'templates/header.php';
?>
<h1><?php echo $page_title; ?></h1>
<form action="actions.php" method="POST" enctype="multipart/form-data">
    <input type="hidden" name="action" value="<?php echo $action; ?>">
    <input type="hidden" name="id" value="<?php echo $project['id']; ?>">

    <!-- Project Details -->
    <div class="form-group">
        <label for="title">標題</label>
        <input type="text" id="title" name="title" value="<?php echo htmlspecialchars($project['title']); ?>" required>
    </div>
    <div class="form-group">
        <label for="category_id">分類</label>
        <select id="category_id" name="category_id" required>
            <option value="">請選擇分類</option>
            <?php foreach ($categories as $cat): ?>
                <option value="<?php echo $cat['id']; ?>" <?php echo ($project['category_id'] == $cat['id']) ? 'selected' : ''; ?>>
                    <?php echo htmlspecialchars($cat['name']); ?>
                </option>
            <?php endforeach; ?>
        </select>
    </div>
    <div class="form-group">
        <label for="description">描述</label>
        <textarea id="description" name="description" rows="10" required><?php echo htmlspecialchars($project['description']); ?></textarea>
    </div>
    <div class="form-group">
        <label for="cover_image">封面圖片 (用於彈出視窗)</label>
        <?php if (!empty($project['cover_image_url'])): ?>
            <img src="../<?php echo htmlspecialchars($project['cover_image_url']); ?>" alt="Current Cover" class="preview-image">
        <?php endif; ?>
        <input type="file" id="cover_image" name="cover_image" <?php echo empty($project['id']) ? 'required' : ''; ?>>
        <input type="hidden" name="old_cover_image" value="<?php echo htmlspecialchars($project['cover_image_url']); ?>">
    </div>

    <!-- NEW: Preview Media Upload -->
    <div class="form-group">
        <label for="preview_media">預覽媒體 (用於作品集列表的 GIF 或 MP4)</label>
        <?php if (!empty($project['preview_media_url'])): ?>
            <div class="preview-media-container">
                <?php if (str_ends_with($project['preview_media_url'], '.mp4') || str_ends_with($project['preview_media_url'], '.webm')): ?>
                    <video src="../<?php echo htmlspecialchars($project['preview_media_url']); ?>" autoplay loop muted class="preview-image"></video>
                <?php else: ?>
                    <img src="../<?php echo htmlspecialchars($project['preview_media_url']); ?>" alt="Current Preview" class="preview-image">
                <?php endif; ?>
            </div>
        <?php endif; ?>
        <input type="file" id="preview_media" name="preview_media">
        <input type="hidden" name="old_preview_media" value="<?php echo htmlspecialchars($project['preview_media_url']); ?>">
    </div>

    <div class="form-group">
        <label>技能標籤</label>
        <div class="tags-container">
            <?php foreach ($tags as $tag): ?>
                <label class="tag-label">
                    <input type="checkbox" name="tags[]" value="<?php echo $tag['id']; ?>" <?php echo in_array($tag['id'], $project_tags) ? 'checked' : ''; ?>>
                    <?php echo htmlspecialchars($tag['name']); ?>
                </label>
            <?php endforeach; ?>
        </div>
    </div>

    <!-- Gallery Management Section -->
    <?php if ($action === 'update'): ?>
        <div class="form-group">
            <label>圖庫管理</label>
            <div class="gallery-management">
                <div class="existing-gallery">
                    <?php if (empty($gallery_images)): ?>
                        <p>目前沒有圖庫圖片。</p>
                    <?php else: ?>
                        <?php foreach ($gallery_images as $img): ?>
                            <div class="existing-gallery-item">
                                <img src="../<?php echo htmlspecialchars($img['image_url']); ?>" class="preview-image-small">
                                <input type="text" name="captions[<?php echo $img['id']; ?>]" value="<?php echo htmlspecialchars($img['caption']); ?>" placeholder="圖片說明">
                                <input type="number" name="sort_orders[<?php echo $img['id']; ?>]" value="<?php echo htmlspecialchars($img['sort_order']); ?>" class="sort-order-input" title="排序">
                                <a href="actions.php?action=delete_gallery_image&id=<?php echo $img['id']; ?>&project_id=<?php echo $project['id']; ?>" class="btn btn-delete btn-small" onclick="return confirm('確定刪除這張圖片嗎？');">刪除</a>
                            </div>
                        <?php endforeach; ?>
                    <?php endif; ?>
                </div>
                <div class="form-group">
                    <label for="gallery_images">新增圖庫圖片 (可多選)</label>
                    <input type="file" id="gallery_images" name="gallery_images[]" multiple>
                </div>
            </div>
        </div>
    <?php endif; ?>

    <!-- Other Fields -->
    <div class="form-group">
        <label for="project_link">專案連結 (網址)</label>
        <input type="url" id="project_link" name="project_link" value="<?php echo htmlspecialchars($project['project_link']); ?>" placeholder="https://example.com">
    </div>
    <div class="form-group">
        <label for="github_link">GitHub 連結</label>
        <input type="url" id="github_link" name="github_link" value="<?php echo htmlspecialchars($project['github_link'] ?? ''); ?>" placeholder="https://github.com/your-username/your-repo">
    </div>
    <div class="form-group">
        <label for="sort_order">排序 (數字越小越前面)</label>
        <input type="number" id="sort_order" name="sort_order" value="<?php echo htmlspecialchars($project['sort_order']); ?>">
    </div>
    <div class="form-group">
        <label class="inline-label">
            <input type="checkbox" name="is_published" value="1" <?php echo $project['is_published'] ? 'checked' : ''; ?>>
            發布
        </label>
    </div>

    <div class="form-actions">
        <button type="submit" class="btn btn-create">儲存</button>
        <a href="index.php" class="btn">取消</a>
    </div>
</form>

<?php include 'templates/footer.php'; ?>