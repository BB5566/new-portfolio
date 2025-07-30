<?php
// FILE: admin/actions.php
// --- 處理後台所有資料庫操作 (PDO 版本) ---
session_start();
include '../api/db_connect.php';

// (此函式無變動)
function handle_upload($file_input_name, $old_file_path = '') {
    if (isset($_FILES[$file_input_name]) && $_FILES[$file_input_name]['error'] === UPLOAD_ERR_OK) {
        $upload_dir = '../uploads/';
        if (!is_dir($upload_dir)) { mkdir($upload_dir, 0755, true); }
        $file = $_FILES[$file_input_name];
        $allowed_types = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (!in_array($file['type'], $allowed_types)) {
            $_SESSION['message'] = '錯誤：只允許上傳 JPG, PNG, GIF, WEBP 格式的圖片。';
            $_SESSION['message_type'] = 'error';
            return false;
        }
        $file_extension = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
        $new_filename = uniqid('proj_', true) . '.' . $file_extension;
        $destination = $upload_dir . $new_filename;
        if (move_uploaded_file($file['tmp_name'], $destination)) {
            if (!empty($old_file_path) && file_exists('../' . $old_file_path)) {
                @unlink('../' . $old_file_path);
            }
            return 'uploads/' . $new_filename;
        } else {
            $_SESSION['message'] = '錯誤：移動檔案失敗，請檢查 uploads 資料夾權限。';
            $_SESSION['message_type'] = 'error';
            return false;
        }
    }
    return $old_file_path;
}

// (此函式無變動)
function update_tags($pdo, $project_id, $tags) {
    $stmt = $pdo->prepare("DELETE FROM project_tag_map WHERE project_id = ?");
    $stmt->execute([$project_id]);
    if (!empty($tags)) {
        $sql = "INSERT INTO project_tag_map (project_id, tag_id) VALUES (?, ?)";
        $stmt = $pdo->prepare($sql);
        foreach ($tags as $tag_id) {
            $stmt->execute([$project_id, $tag_id]);
        }
    }
}

// --- NEW: Gallery Handling Functions ---
function handle_gallery_uploads($pdo, $project_id) {
    if (isset($_FILES['gallery_images']) && is_array($_FILES['gallery_images']['name'])) {
        $files = $_FILES['gallery_images'];
        $upload_dir = '../uploads/';
        foreach ($files['name'] as $key => $name) {
            if ($files['error'][$key] === UPLOAD_ERR_OK) {
                $tmp_name = $files['tmp_name'][$key];
                $type = $files['type'][$key];
                $allowed_types = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
                if (!in_array($type, $allowed_types)) continue; // Skip invalid file types
                $file_extension = strtolower(pathinfo($name, PATHINFO_EXTENSION));
                $new_filename = uniqid('gallery_', true) . '.' . $file_extension;
                $destination = $upload_dir . $new_filename;
                if (move_uploaded_file($tmp_name, $destination)) {
                    $image_path = 'uploads/' . $new_filename;
                    $sql = "INSERT INTO project_galleries (project_id, image_url, sort_order) VALUES (?, ?, 0)";
                    $stmt = $pdo->prepare($sql);
                    $stmt->execute([$project_id, $image_path]);
                }
            }
        }
    }
}

function update_gallery_meta($pdo, $project_id, $captions, $sort_orders) {
    if (!empty($captions) && !empty($sort_orders)) {
        $sql = "UPDATE project_galleries SET caption = ?, sort_order = ? WHERE id = ? AND project_id = ?";
        $stmt = $pdo->prepare($sql);
        foreach ($captions as $img_id => $caption) {
            $sort_order = $sort_orders[$img_id] ?? 0;
            $stmt->execute([$caption, intval($sort_order), intval($img_id), $project_id]);
        }
    }
}

$action = $_POST['action'] ?? $_GET['action'] ?? null;

// --- NEW: Handle single gallery image deletion (not in transaction) ---
if ($action === 'delete_gallery_image') {
    $id = intval($_GET['id'] ?? 0);
    $project_id = intval($_GET['project_id'] ?? 0);
    if ($id > 0) {
        $stmt = $pdo->prepare("SELECT image_url FROM project_galleries WHERE id = ?");
        $stmt->execute([$id]);
        $image = $stmt->fetch();
        if ($image && !empty($image['image_url']) && file_exists('../' . $image['image_url'])) {
            @unlink('../' . $image['image_url']);
        }
        $stmt = $pdo->prepare("DELETE FROM project_galleries WHERE id = ?");
        $stmt->execute([$id]);
        $_SESSION['message'] = "圖庫圖片已刪除！";
        $_SESSION['message_type'] = 'success';
    }
    redirect('edit.php?id=' . $project_id);
}

// --- Main form actions (in transaction) ---
$pdo->beginTransaction();
try {
    switch ($action) {
        case 'create':
            $cover_image_path = handle_upload('cover_image');
            if ($cover_image_path === false) { throw new Exception($_SESSION['message'] ?? '封面圖片上傳失敗'); }
            $is_published = isset($_POST['is_published']) ? 1 : 0;
            $sql = "INSERT INTO projects (category_id, title, description, cover_image_url, project_link, sort_order, is_published) VALUES (?, ?, ?, ?, ?, ?, ?)";
            $stmt = $pdo->prepare($sql);
            $stmt->execute([$_POST['category_id'], $_POST['title'], $_POST['description'], $cover_image_path, $_POST['project_link'], $_POST['sort_order'], $is_published]);
            $project_id = $pdo->lastInsertId();
            update_tags($pdo, $project_id, $_POST['tags'] ?? []);
            // Note: Gallery images can only be added after creation, in the edit view.
            $_SESSION['message'] = "專案已成功新增！現在您可以為它新增圖庫圖片。";
            $_SESSION['message_type'] = 'success';
            // Redirect to edit page to add gallery images
            $pdo->commit();
            redirect('edit.php?id=' . $project_id);
            break;

        case 'update':
            $id = intval($_POST['id']);
            if ($id <= 0) { throw new Exception("無效的 ID"); }
            $old_cover_image = $_POST['old_cover_image'];
            $cover_image_path = handle_upload('cover_image', $old_cover_image);
            if ($cover_image_path === false) { throw new Exception($_SESSION['message'] ?? '封面圖片上傳失敗'); }
            $is_published = isset($_POST['is_published']) ? 1 : 0;
            $sql = "UPDATE projects SET category_id = ?, title = ?, description = ?, cover_image_url = ?, project_link = ?, sort_order = ?, is_published = ? WHERE id = ?";
            $stmt = $pdo->prepare($sql);
            $stmt->execute([$_POST['category_id'], $_POST['title'], $_POST['description'], $cover_image_path, $_POST['project_link'], $_POST['sort_order'], $is_published, $id]);
            update_tags($pdo, $id, $_POST['tags'] ?? []);
            // NEW: Handle gallery updates
            update_gallery_meta($pdo, $id, $_POST['captions'] ?? [], $_POST['sort_orders'] ?? []);
            handle_gallery_uploads($pdo, $id);
            $_SESSION['message'] = "專案已成功更新！";
            $_SESSION['message_type'] = 'success';
            break;

        case 'delete':
            $id = intval($_GET['id']);
            if ($id <= 0) { throw new Exception("無效的 ID"); }
            // Get all gallery images to delete files
            $stmt = $pdo->prepare("SELECT image_url FROM project_galleries WHERE project_id = ?");
            $stmt->execute([$id]);
            $gallery_images = $stmt->fetchAll();
            foreach ($gallery_images as $img) {
                if (!empty($img['image_url']) && file_exists('../' . $img['image_url'])) {
                    @unlink('../' . $img['image_url']);
                }
            }
            // Get cover image to delete file
            $stmt = $pdo->prepare("SELECT cover_image_url FROM projects WHERE id = ?");
            $stmt->execute([$id]);
            $project = $stmt->fetch();
            if ($project && !empty($project['cover_image_url']) && file_exists('../' . $project['cover_image_url'])) {
                @unlink('../' . $project['cover_image_url']);
            }
            // Delete project from DB (related records in map and gallery tables will be deleted by ON DELETE CASCADE)
            $stmt = $pdo->prepare("DELETE FROM projects WHERE id = ?");
            $stmt->execute([$id]);
            $_SESSION['message'] = "專案已成功刪除！";
            $_SESSION['message_type'] = 'success';
            break;
    }
    $pdo->commit();
} catch (Exception $e) {
    $pdo->rollBack();
    $_SESSION['message'] = "操作失敗：" . $e->getMessage();
    $_SESSION['message_type'] = 'error';
}

// Redirect back to edit page for update, or index for others
if ($action === 'update') {
    redirect('edit.php?id=' . $id);
} else {
    redirect('index.php');
}
