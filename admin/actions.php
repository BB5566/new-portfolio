<?php
// FILE: admin/actions.php
// --- OPTIMIZED: 處理後台所有資料庫操作 (已優化安全性與錯誤處理) ---
session_start();
include '../api/db_connect.php';

// 記錄操作日誌
function log_action($action, $details = '') {
    $log_message = date('Y-m-d H:i:s') . " - Action: $action, Details: $details, IP: " . ($_SERVER['REMOTE_ADDR'] ?? 'unknown') . "\n";
    error_log($log_message, 3, '../logs/admin_actions.log');
}

// 驗證檔案類型和大小
function validate_file($file, $allowed_types, $max_size = 10485760) { // 10MB default
    if ($file['error'] !== UPLOAD_ERR_OK) {
        return "檔案上傳錯誤：" . $file['error'];
    }
    
    if ($file['size'] > $max_size) {
        return "檔案大小超過限制 (" . round($max_size/1024/1024, 1) . "MB)";
    }
    
    if (!in_array($file['type'], $allowed_types)) {
        return "不支援的檔案格式：" . $file['type'];
    }
    
    // 檢查檔案內容是否符合副檔名
    $finfo = finfo_open(FILEINFO_MIME_TYPE);
    $mime_type = finfo_file($finfo, $file['tmp_name']);
    finfo_close($finfo);
    
    if (!in_array($mime_type, $allowed_types)) {
        return "檔案內容與副檔名不符";
    }
    
    return null; // 通過驗證
}

// OPTIMIZED: handle_upload function with better error handling and security
function handle_upload($file_input_name, $old_file_path = '', $allowed_types = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'], $max_size = 10485760)
{
    if (!isset($_FILES[$file_input_name]) || $_FILES[$file_input_name]['error'] === UPLOAD_ERR_NO_FILE) {
        return $old_file_path; // 沒有新檔案，返回舊路徑
    }
    
    $file = $_FILES[$file_input_name];
    
    // 驗證檔案
    $validation_error = validate_file($file, $allowed_types, $max_size);
    if ($validation_error) {
        $_SESSION['message'] = "錯誤：$validation_error";
        $_SESSION['message_type'] = 'error';
        return false;
    }
    
    $upload_dir = '../uploads/';
    if (!is_dir($upload_dir)) {
        if (!mkdir($upload_dir, 0755, true)) {
            $_SESSION['message'] = '錯誤：無法創建上傳目錄';
            $_SESSION['message_type'] = 'error';
            return false;
        }
    }
    
    // 生成安全的檔案名
    $file_extension = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
    $new_filename = uniqid('media_' . date('Ymd_'), true) . '.' . $file_extension;
    $destination = $upload_dir . $new_filename;
    
    if (move_uploaded_file($file['tmp_name'], $destination)) {
        // 成功上傳後，刪除舊檔案
        if (!empty($old_file_path) && file_exists('../' . $old_file_path)) {
            if (@unlink('../' . $old_file_path)) {
                log_action('file_deleted', "Deleted old file: $old_file_path");
            }
        }
        
        log_action('file_uploaded', "Uploaded: uploads/$new_filename");
        return 'uploads/' . $new_filename;
    } else {
        $_SESSION['message'] = '錯誤：檔案上傳失敗，請檢查伺服器權限';
        $_SESSION['message_type'] = 'error';
        return false;
    }
}

// OPTIMIZED: update_tags function with better error handling
function update_tags($pdo, $project_id, $tags)
{
    try {
        // 刪除舊的標籤關聯
        $stmt = $pdo->prepare("DELETE FROM project_tag_map WHERE project_id = ?");
        $stmt->execute([$project_id]);
        
        // 新增新的標籤關聯
        if (!empty($tags) && is_array($tags)) {
            $sql = "INSERT INTO project_tag_map (project_id, tag_id) VALUES (?, ?)";
            $stmt = $pdo->prepare($sql);
            foreach ($tags as $tag_id) {
                if (is_numeric($tag_id) && $tag_id > 0) {
                    $stmt->execute([$project_id, intval($tag_id)]);
                }
            }
            log_action('tags_updated', "Project ID: $project_id, Tags: " . implode(',', $tags));
        }
        return true;
    } catch (Exception $e) {
        log_action('tags_update_failed', "Project ID: $project_id, Error: " . $e->getMessage());
        return false;
    }
}

// OPTIMIZED: handle_gallery_uploads function with better validation
function handle_gallery_uploads($pdo, $project_id)
{
    if (!isset($_FILES['gallery_images']) || !is_array($_FILES['gallery_images']['name'])) {
        return 0; // 沒有檔案
    }
    
    $files = $_FILES['gallery_images'];
    $upload_dir = '../uploads/';
    $uploaded_count = 0;
    $allowed_types = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    $max_size = 5242880; // 5MB for gallery images
    
    foreach ($files['name'] as $key => $name) {
        if ($files['error'][$key] === UPLOAD_ERR_OK) {
            $file_data = [
                'name' => $name,
                'type' => $files['type'][$key],
                'tmp_name' => $files['tmp_name'][$key],
                'error' => $files['error'][$key],
                'size' => $files['size'][$key]
            ];
            
            $validation_error = validate_file($file_data, $allowed_types, $max_size);
            if ($validation_error) {
                log_action('gallery_upload_failed', "File: $name, Error: $validation_error");
                continue; // 跳過這個檔案
            }
            
            $file_extension = strtolower(pathinfo($name, PATHINFO_EXTENSION));
            $new_filename = uniqid('gallery_' . date('Ymd_'), true) . '.' . $file_extension;
            $destination = $upload_dir . $new_filename;
            
            if (move_uploaded_file($file_data['tmp_name'], $destination)) {
                $image_path = 'uploads/' . $new_filename;
                $sql = "INSERT INTO project_galleries (project_id, image_url, sort_order) VALUES (?, ?, 0)";
                $stmt = $pdo->prepare($sql);
                $stmt->execute([$project_id, $image_path]);
                $uploaded_count++;
                log_action('gallery_uploaded', "Project ID: $project_id, File: $new_filename");
            }
        }
    }
    
    return $uploaded_count;
}

// OPTIMIZED: update_gallery_meta function with validation
function update_gallery_meta($pdo, $project_id, $captions, $sort_orders)
{
    if (empty($captions) || empty($sort_orders)) {
        return 0;
    }
    
    $updated_count = 0;
    $sql = "UPDATE project_galleries SET caption = ?, sort_order = ? WHERE id = ? AND project_id = ?";
    $stmt = $pdo->prepare($sql);
    
    foreach ($captions as $img_id => $caption) {
        if (!is_numeric($img_id) || $img_id <= 0) continue;
        
        $sort_order = isset($sort_orders[$img_id]) ? intval($sort_orders[$img_id]) : 0;
        $clean_caption = trim(substr($caption, 0, 255)); // 限制長度
        
        if ($stmt->execute([$clean_caption, $sort_order, intval($img_id), $project_id])) {
            $updated_count++;
        }
    }
    
    log_action('gallery_meta_updated', "Project ID: $project_id, Updated: $updated_count items");
    return $updated_count;
}

// 新增：安全刪除檔案函數
function safe_delete_file($file_path) {
    if (empty($file_path)) return false;
    
    $full_path = '../' . $file_path;
    if (file_exists($full_path)) {
        if (@unlink($full_path)) {
            log_action('file_deleted', "Deleted: $file_path");
            return true;
        } else {
            log_action('file_delete_failed', "Failed to delete: $file_path");
            return false;
        }
    }
    return true; // 檔案不存在視為成功
}

$action = $_POST['action'] ?? $_GET['action'] ?? null;

// 驗證動作參數
if (empty($action)) {
    $_SESSION['message'] = "錯誤：未指定操作類型";
    $_SESSION['message_type'] = 'error';
    redirect('index.php');
}

// OPTIMIZED: delete_gallery_image action with better error handling
if ($action === 'delete_gallery_image') {
    $id = intval($_GET['id'] ?? 0);
    $project_id = intval($_GET['project_id'] ?? 0);
    
    if ($id <= 0 || $project_id <= 0) {
        $_SESSION['message'] = "錯誤：無效的 ID 參數";
        $_SESSION['message_type'] = 'error';
        redirect('index.php');
    }
    
    try {
        // 獲取圖片資訊
        $stmt = $pdo->prepare("SELECT image_url FROM project_galleries WHERE id = ? AND project_id = ?");
        $stmt->execute([$id, $project_id]);
        $image = $stmt->fetch();
        
        if ($image) {
            // 刪除檔案
            safe_delete_file($image['image_url']);
            
            // 刪除資料庫記錄
            $stmt = $pdo->prepare("DELETE FROM project_galleries WHERE id = ? AND project_id = ?");
            $stmt->execute([$id, $project_id]);
            
            $_SESSION['message'] = "圖庫圖片已刪除！";
            $_SESSION['message_type'] = 'success';
            log_action('gallery_image_deleted', "Gallery ID: $id, Project ID: $project_id");
        } else {
            $_SESSION['message'] = "錯誤：找不到指定的圖片";
            $_SESSION['message_type'] = 'error';
        }
    } catch (Exception $e) {
        $_SESSION['message'] = "刪除失敗：" . $e->getMessage();
        $_SESSION['message_type'] = 'error';
        log_action('gallery_delete_failed', "Gallery ID: $id, Error: " . $e->getMessage());
    }
    
    redirect('edit.php?id=' . $project_id);
}

// 驗證必要的 POST 資料
function validate_project_data($action) {
    $required_fields = ['title', 'category_id', 'description'];
    
    foreach ($required_fields as $field) {
        if (empty($_POST[$field])) {
            throw new Exception("必填欄位「{$field}」不能為空");
        }
    }
    
    // 驗證分類 ID
    if (!is_numeric($_POST['category_id']) || $_POST['category_id'] <= 0) {
        throw new Exception("請選擇有效的專案分類");
    }
    
    // 驗證標題長度
    if (strlen($_POST['title']) > 255) {
        throw new Exception("專案標題不能超過 255 字元");
    }
    
    // 驗證描述長度
    if (strlen($_POST['description']) > 5000) {
        throw new Exception("專案描述不能超過 5000 字元");
    }
    
    // 新增專案時必須有封面圖片
    if ($action === 'create' && (!isset($_FILES['cover_image']) || $_FILES['cover_image']['error'] === UPLOAD_ERR_NO_FILE)) {
        throw new Exception("新增專案時必須上傳封面圖片");
    }
    
    return true;
}

// --- OPTIMIZED: Main form actions with enhanced validation and error handling ---
$pdo->beginTransaction();
try {
    // 驗證基本資料
    validate_project_data($action);
    
    switch ($action) {
        case 'create':
            log_action('create_project_start', "Title: " . $_POST['title']);
            
            // 處理檔案上傳
            $cover_image_path = handle_upload('cover_image', '', ['image/jpeg', 'image/png', 'image/gif', 'image/webp'], 10485760);
            if ($cover_image_path === false) {
                throw new Exception($_SESSION['message'] ?? '封面圖片上傳失敗');
            }

            $preview_media_path = handle_upload('preview_media', '', ['image/gif', 'video/mp4', 'video/webm'], 20971520); // 20MB for videos
            if ($preview_media_path === false) {
                throw new Exception($_SESSION['message'] ?? '預覽媒體上傳失敗');
            }

            $is_published = isset($_POST['is_published']) ? 1 : 0;
            $sort_order = isset($_POST['sort_order']) ? intval($_POST['sort_order']) : 0;
            
            // 清理輸入資料
            $title = trim($_POST['title']);
            $description = trim($_POST['description']);
            $project_link = !empty($_POST['project_link']) ? trim($_POST['project_link']) : null;
            $github_link = !empty($_POST['github_link']) ? trim($_POST['github_link']) : null;
            
            // 插入專案資料
            $sql = "INSERT INTO projects (category_id, title, description, cover_image_url, preview_media_url, project_link, github_link, sort_order, is_published, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())";
            $stmt = $pdo->prepare($sql);
            
            $stmt->execute([
                intval($_POST['category_id']),
                $title,
                $description,
                $cover_image_path,
                $preview_media_path,
                $project_link,
                $github_link,
                $sort_order,
                $is_published
            ]);

            $project_id = $pdo->lastInsertId();
            
            // 處理標籤
            if (!update_tags($pdo, $project_id, $_POST['tags'] ?? [])) {
                throw new Exception("標籤更新失敗");
            }

            // 處理圖庫上傳
            $gallery_count = handle_gallery_uploads($pdo, $project_id);

            $_SESSION['message'] = "專案已成功新增！" . ($gallery_count > 0 ? "已上傳 $gallery_count 張圖庫圖片。" : "");
            $_SESSION['message_type'] = 'success';
            $redirect_id = $project_id;
            
            log_action('create_project_success', "Project ID: $project_id, Title: $title");
            break;

        case 'update':
            $id = intval($_POST['id']);
            if ($id <= 0) {
                throw new Exception("無效的專案 ID");
            }
            
            log_action('update_project_start', "Project ID: $id, Title: " . $_POST['title']);

            // 獲取舊的檔案路徑
            $old_cover_image = $_POST['old_cover_image'] ?? '';
            $old_preview_media = $_POST['old_preview_media'] ?? '';

            // 處理檔案上傳
            $cover_image_path = handle_upload('cover_image', $old_cover_image, ['image/jpeg', 'image/png', 'image/gif', 'image/webp'], 10485760);
            if ($cover_image_path === false) {
                throw new Exception($_SESSION['message'] ?? '封面圖片上傳失敗');
            }

            $preview_media_path = handle_upload('preview_media', $old_preview_media, ['image/gif', 'video/mp4', 'video/webm'], 20971520);
            if ($preview_media_path === false) {
                throw new Exception($_SESSION['message'] ?? '預覽媒體上傳失敗');
            }

            $is_published = isset($_POST['is_published']) ? 1 : 0;
            $sort_order = isset($_POST['sort_order']) ? intval($_POST['sort_order']) : 0;
            
            // 清理輸入資料
            $title = trim($_POST['title']);
            $description = trim($_POST['description']);
            $project_link = !empty($_POST['project_link']) ? trim($_POST['project_link']) : null;
            $github_link = !empty($_POST['github_link']) ? trim($_POST['github_link']) : null;

            // 更新專案資料
            $sql = "UPDATE projects SET category_id = ?, title = ?, description = ?, cover_image_url = ?, preview_media_url = ?, project_link = ?, github_link = ?, sort_order = ?, is_published = ? WHERE id = ?";
            $stmt = $pdo->prepare($sql);

            $stmt->execute([
                intval($_POST['category_id']),
                $title,
                $description,
                $cover_image_path,
                $preview_media_path,
                $project_link,
                $github_link,
                $sort_order,
                $is_published,
                $id
            ]);

            // 處理標籤
            if (!update_tags($pdo, $id, $_POST['tags'] ?? [])) {
                throw new Exception("標籤更新失敗");
            }
            
            // 更新圖庫資訊
            $meta_updated = update_gallery_meta($pdo, $id, $_POST['captions'] ?? [], $_POST['sort_orders'] ?? []);
            
            // 處理新的圖庫上傳
            $gallery_count = handle_gallery_uploads($pdo, $id);

            $_SESSION['message'] = "專案已成功更新！" . ($gallery_count > 0 ? "已新增 $gallery_count 張圖庫圖片。" : "") . ($meta_updated > 0 ? "已更新 $meta_updated 筆圖庫資訊。" : "");
            $_SESSION['message_type'] = 'success';
            $redirect_id = $id;
            
            log_action('update_project_success', "Project ID: $id, Title: $title");
            break;

        case 'delete':
            $id = intval($_GET['id'] ?? 0);
            if ($id <= 0) {
                throw new Exception("無效的專案 ID");
            }

            log_action('delete_project_start', "Project ID: $id");

            // 獲取專案資訊
            $stmt = $pdo->prepare("SELECT title, cover_image_url, preview_media_url FROM projects WHERE id = ?");
            $stmt->execute([$id]);
            $project = $stmt->fetch();
            
            if (!$project) {
                throw new Exception("找不到指定的專案");
            }

            $project_title = $project['title'];

            // 刪除主要檔案
            safe_delete_file($project['cover_image_url']);
            safe_delete_file($project['preview_media_url']);

            // 刪除圖庫檔案
            $stmt = $pdo->prepare("SELECT image_url FROM project_galleries WHERE project_id = ?");
            $stmt->execute([$id]);
            $gallery_images = $stmt->fetchAll();
            
            foreach ($gallery_images as $img) {
                safe_delete_file($img['image_url']);
            }

            // 刪除資料庫記錄（會自動刪除關聯的標籤和圖庫記錄）
            $stmt = $pdo->prepare("DELETE FROM projects WHERE id = ?");
            $stmt->execute([$id]);

            $_SESSION['message'] = "專案「{$project_title}」已成功刪除！";
            $_SESSION['message_type'] = 'success';
            
            log_action('delete_project_success', "Project ID: $id, Title: $project_title");
            break;
            
        default:
            throw new Exception("不支援的操作類型：$action");
    }
    
    $pdo->commit();
} catch (Exception $e) {
    $pdo->rollBack();
    $_SESSION['message'] = "操作失敗：" . $e->getMessage();
    $_SESSION['message_type'] = 'error';
    log_action('operation_failed', "Action: $action, Error: " . $e->getMessage());
}

// 重導向
if (isset($redirect_id)) {
    redirect('edit.php?id=' . $redirect_id);
} else {
    redirect('index.php');
}
?>