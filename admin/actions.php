<?php
// FILE: admin/actions.php
// --- UPDATED: 處理後台所有資料庫操作 (PDO 版本) ---
session_start();
include '../api/db_connect.php';

// UPDATED: handle_upload function to accept more file types
function handle_upload($file_input_name, $old_file_path = '', $allowed_types = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']) {
    if (isset($_FILES[$file_input_name]) && $_FILES[$file_input_name]['error'] === UPLOAD_ERR_OK) {
        $upload_dir = '../uploads/';
        if (!is_dir($upload_dir)) { mkdir($upload_dir, 0755, true); }
        $file = $_FILES[$file_input_name];
        
        if (!in_array($file['type'], $allowed_types)) {
            $_SESSION['message'] = '錯誤：不支援的檔案格式。';
            $_SESSION['message_type'] = 'error';
            return false;
        }
        $file_extension = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
        $new_filename = uniqid('media_', true) . '.' . $file_extension;
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

// (此函式無變動)
function handle_gallery_uploads($pdo, $project_id) {
    if (isset($_FILES['gallery_images']) && is_array($_FILES['gallery_images']['name'])) {
        $files = $_FILES['gallery_images'];
        $upload_dir = '../uploads/';
        foreach ($files['name'] as $key => $name) {
            if ($files['error'][$key] === UPLOAD_ERR_OK) {
                $tmp_name = $files['tmp_name'][$key];
                $type = $files['type'][$key];
                $allowed_types = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
                if (!in_array($type, $allowed_types)) continue;
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

// (此函式無變動)
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

// (此邏輯無變動)
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
            
            // NEW: Handle preview media upload
            $preview_media_path = handle_upload('preview_media', '', ['image/gif', 'video/mp4', 'video/webm']);
            if ($preview_media_path === false) { throw new Exception($_SESSION['message'] ?? '預覽媒體上傳失敗'); }

            $is_published = isset($_POST['is_published']) ? 1 : 0;
            $sql = "INSERT INTO projects (category_id, title, description, cover_image_url, preview_media_url, project_link, sort_order, is_published) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
            $stmt = $pdo->prepare($sql);
            $stmt->execute([$_POST['category_id'], $_POST['title'], $_POST['description'], $cover_image_path, $preview_media_path, $_POST['project_link'], $_POST['sort_order'], $is_published]);
            
            $project_id = $pdo->lastInsertId();
            update_tags($pdo, $project_id, $_POST['tags'] ?? []);
            
            $_SESSION['message'] = "專案已成功新增！現在您可以為它新增圖庫圖片。";
            $_SESSION['message_type'] = 'success';
            $redirect_id = $project_id;
            break;

        case 'update':
            $id = intval($_POST['id']);
            if ($id <= 0) { throw new Exception("無效的 ID"); }
            
            $old_cover_image = $_POST['old_cover_image'];
            $cover_image_path = handle_upload('cover_image', $old_cover_image);
            if ($cover_image_path === false) { throw new Exception($_SESSION['message'] ?? '封面圖片上傳失敗'); }

            // NEW: Handle preview media update
            $old_preview_media = $_POST['old_preview_media'];
            $preview_media_path = handle_upload('preview_media', $old_preview_media, ['image/gif', 'video/mp4', 'video/webm']);
            if ($preview_media_path === false) { throw new Exception($_SESSION['message'] ?? '預覽媒體上傳失敗'); }

            $is_published = isset($_POST['is_published']) ? 1 : 0;
            $sql = "UPDATE projects SET category_id = ?, title = ?, description = ?, cover_image_url = ?, preview_media_url = ?, project_link = ?, sort_order = ?, is_published = ? WHERE id = ?";
            $stmt = $pdo->prepare($sql);
            $stmt->execute([$_POST['category_id'], $_POST['title'], $_POST['description'], $cover_image_path, $preview_media_path, $_POST['project_link'], $_POST['sort_order'], $is_published, $id]);
            
            update_tags($pdo, $id, $_POST['tags'] ?? []);
            update_gallery_meta($pdo, $id, $_POST['captions'] ?? [], $_POST['sort_orders'] ?? []);
            handle_gallery_uploads($pdo, $id);
            
            $_SESSION['message'] = "專案已成功更新！";
            $_SESSION['message_type'] = 'success';
            $redirect_id = $id;
            break;

        case 'delete':
            $id = intval($_GET['id']);
            if ($id <= 0) { throw new Exception("無效的 ID"); }
            
            // Get all file paths to delete
            $stmt = $pdo->prepare("SELECT cover_image_url, preview_media_url FROM projects WHERE id = ?");
            $stmt->execute([$id]);
            $project = $stmt->fetch();
            if ($project) {
                if (!empty($project['cover_image_url']) && file_exists('../' . $project['cover_image_url'])) { @unlink('../' . $project['cover_image_url']); }
                if (!empty($project['preview_media_url']) && file_exists('../' . $project['preview_media_url'])) { @unlink('../' . $project['preview_media_url']); }
            }
            
            $stmt = $pdo->prepare("SELECT image_url FROM project_galleries WHERE project_id = ?");
            $stmt->execute([$id]);
            $gallery_images = $stmt->fetchAll();
            foreach ($gallery_images as $img) {
                if (!empty($img['image_url']) && file_exists('../' . $img['image_url'])) { @unlink('../' . $img['image_url']); }
            }
            
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

if (isset($redirect_id)) {
    redirect('edit.php?id=' . $redirect_id);
} else {
    redirect('index.php');
}
