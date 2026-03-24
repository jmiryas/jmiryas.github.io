---
title: "Part 4: UI Dinamis dengan Bootstrap 5"
date: "Mar 25, 2026"
description: "UI dinamis"
---

**Seri Tutorial: Membangun Aplikasi Perpustakaan Multi-Cabang dengan CodeIgniter 3**

---

## Pendahuluan

Di Part 4 ini, kita membangun UI yang dinamis: menu navigasi dan tombol aksi muncul atau hilang berdasarkan permission user yang login. Tujuannya adalah user tidak pernah melihat tombol atau menu yang tidak bisa mereka akses.

---

## 1. Konsep UI Dinamis

### Prinsipnya

User hanya melihat apa yang boleh mereka lakukan. Kalau tidak punya permission `book_create`, tombol "Tambah Buku" tidak muncul sama sekali. Ini mengurangi kebingungan dan error akses.

### Struktur Menu Berbasis Permission

```php
$menu_items = array(
    array(
        'label' => 'Buku',
        'icon' => 'book',
        'url' => 'books',
        'permission' => 'book_view'  // Hanya muncul kalau punya permission ini
    ),
    array(
        'label' => 'Manajemen User',
        'icon' => 'users',
        'url' => 'users',
        'permission' => 'user_view',
        'submenu' => array(...)  // Bisa punya submenu
    )
);
```

---

## 2. Menu Config dengan Permission

**File: `application/config/menu.php`**

```php
<?php
defined('BASEPATH') OR exit('No direct script access allowed');

/**
 * Menu Configuration dengan Permission
 * Setiap menu bisa punya permission requirement
 */

$config['menu_items'] = array(
    array(
        'label' => 'Dashboard',
        'icon' => 'speedometer2',
        'url' => 'dashboard',
        'permission' => NULL  // NULL = semua user yang login bisa lihat
    ),
    array(
        'label' => 'Buku',
        'icon' => 'book',
        'url' => 'books',
        'permission' => 'book_view'
    ),
    array(
        'label' => 'Manajemen User',
        'icon' => 'people',
        'url' => '#',
        'permission' => 'user_view',
        'submenu' => array(
            array(
                'label' => 'Daftar User',
                'icon' => 'person-lines-fill',
                'url' => 'users',
                'permission' => 'user_view'
            ),
            array(
                'label' => 'Tambah User',
                'icon' => 'person-plus',
                'url' => 'users/create',
                'permission' => 'user_create'
            )
        )
    ),
    array(
        'label' => 'Manajemen Role',
        'icon' => 'shield-lock',
        'url' => '#',
        'permission' => 'role_view',
        'submenu' => array(
            array(
                'label' => 'Daftar Role',
                'icon' => 'list',
                'url' => 'roles',
                'permission' => 'role_view'
            ),
            array(
                'label' => 'Tambah Role',
                'icon' => 'plus-circle',
                'url' => 'roles/create',
                'permission' => 'role_create'
            ),
            array(
                'label' => 'Assign Permission',
                'icon' => 'key',
                'url' => 'roles/permissions',
                'permission' => 'role_assign_permission'
            )
        )
    ),
    array(
        'label' => 'Manajemen Cabang',
        'icon' => 'building',
        'url' => 'branches',
        'permission' => 'branch_view'
    )
);

/**
 * Quick Actions (Tombol di header)
 */
$config['quick_actions'] = array(
    array(
        'label' => 'Tambah Buku',
        'icon' => 'plus',
        'url' => 'books/create',
        'permission' => 'book_create',
        'class' => 'btn-primary'
    ),
    array(
        'label' => 'Tambah User',
        'icon' => 'person-plus',
        'url' => 'users/create',
        'permission' => 'user_create',
        'class' => 'btn-success'
    )
);
```

---

## 3. Menu Library

**File: `application/libraries/Menu.php`**

```php
<?php
defined('BASEPATH') OR exit('No direct script access allowed');

class Menu {

    protected $CI;
    protected $menu_items = array();
    protected $rbac_service;

    public function __construct() {
        $this->CI =& get_instance();
        $this->CI->load->config('menu');
        $this->CI->load->service('rbac_service');
        $this->rbac_service = new Rbac_service();

        $this->menu_items = $this->CI->config->item('menu_items');
    }

    /**
     * Get menu items yang diizinkan untuk user saat ini
     */
    public function get_allowed_menus() {
        return $this->filter_by_permission($this->menu_items);
    }

    /**
     * Filter menu berdasarkan permission
     */
    protected function filter_by_permission($items) {
        $allowed = array();

        foreach ($items as $item) {
            // Cek permission
            if (isset($item['permission']) && $item['permission'] !== NULL) {
                if (!$this->rbac_service->has_permission($item['permission'])) {
                    continue;
                }
            }

            // Filter submenu jika ada
            if (isset($item['submenu']) && !empty($item['submenu'])) {
                $item['submenu'] = $this->filter_by_permission($item['submenu']);

                // Skip jika submenu kosong setelah filter
                if (empty($item['submenu'])) {
                    continue;
                }
            }

            $allowed[] = $item;
        }

        return $allowed;
    }

    /**
     * Get quick actions yang diizinkan
     */
    public function get_allowed_quick_actions() {
        $actions = $this->CI->config->item('quick_actions');
        $allowed = array();

        foreach ($actions as $action) {
            if (isset($action['permission']) && $action['permission'] !== NULL) {
                if ($this->rbac_service->has_permission($action['permission'])) {
                    $allowed[] = $action;
                }
            } else {
                $allowed[] = $action;
            }
        }

        return $allowed;
    }

    /**
     * Check if menu item is active
     */
    public function is_active($url) {
        $current_url = uri_string();

        // Exact match
        if ($current_url === $url) {
            return TRUE;
        }

        // Check if current URL starts with menu URL (for submenu active state)
        if ($url !== '#' && strpos($current_url, $url) === 0) {
            return TRUE;
        }

        return FALSE;
    }

    /**
     * Render menu sebagai array (untuk view)
     */
    public function render() {
        $menus = $this->get_allowed_menus();

        // Mark active menu
        foreach ($menus as &$menu) {
            $menu['is_active'] = $this->is_active($menu['url']);

            if (isset($menu['submenu'])) {
                $has_active_child = FALSE;
                foreach ($menu['submenu'] as &$submenu) {
                    $submenu['is_active'] = $this->is_active($submenu['url']);
                    if ($submenu['is_active']) {
                        $has_active_child = TRUE;
                    }
                }

                // Parent aktif jika ada child yang aktif
                if ($has_active_child) {
                    $menu['is_active'] = TRUE;
                    $menu['is_expanded'] = TRUE;
                }
            }
        }

        return $menus;
    }
}
```

---

## 4. Update MY_Controller untuk Menu

**Update `application/core/MY_Controller.php`:**

Tambahkan di method `__construct()`:

```php
public function __construct() {
    parent::__construct();

    $this->load->library('session');
    $this->load->model('user_model');
    $this->load->service('rbac_service');
    $this->load->library('menu');

    $this->rbac_service = new Rbac_service();

    // Set current user data
    if ($this->session->userdata('user_id')) {
        $this->current_user = $this->user_model->get_with_relations($this->session->userdata('user_id'));
        if ($this->current_user) {
            $this->user_branch_id = $this->current_user->branch_id;
            $this->user_role_id = $this->current_user->role_id;
        }
    }
}
```

Update method `add_permission_data()`:

```php
/**
 * Add permission data ke view data
 */
protected function add_permission_data(&$data) {
    $data['is_superadmin'] = $this->is_superadmin();
    $data['current_user'] = $this->current_user;
    $data['user_branch_id'] = $this->user_branch_id;
    $data['user_role_id'] = $this->user_role_id;
    $data['user_permissions'] = $this->rbac_service->get_user_permissions();

    // Menu data
    $data['menu_items'] = $this->menu->render();
    $data['quick_actions'] = $this->menu->get_allowed_quick_actions();

    return $data;
}
```

---

## 5. Template Sidebar Dinamis

**File: `application/views/templates/sidebar.php` (Update Lengkap)**

```php
<?php
// Helper untuk icon Bootstrap Icons
function icon($name) {
    return '<i class="bi bi-' . $name . '"></i>';
}
?>

<div class="d-flex">
    <nav class="sidebar bg-dark text-white" style="width: 260px; min-height: 100vh; position: fixed;">
        <div class="p-3">
            <!-- Logo/Brand -->
            <div class="d-flex align-items-center mb-4 pb-3 border-bottom border-secondary">
                <span class="fs-4 fw-bold">Perpustakaan</span>
            </div>

            <!-- User Info -->
            <div class="mb-4 p-3 bg-secondary rounded">
                <small class="text-light d-block">Login sebagai</small>
                <strong class="d-block text-truncate"><?php echo $current_user->full_name; ?></strong>
                <small class="text-info"><?php echo $current_user->role_name; ?></small>
                <small class="d-block text-muted"><?php echo $current_user->branch_name; ?></small>
            </div>

            <!-- Menu Navigation -->
            <ul class="nav flex-column">
                <?php foreach ($menu_items as $menu): ?>
                    <?php if (isset($menu['submenu']) && !empty($menu['submenu'])): ?>
                        <!-- Menu dengan Submenu -->
                        <li class="nav-item mb-1">
                            <a class="nav-link text-white d-flex justify-content-between align-items-center <?php echo $menu['is_active'] ? 'active bg-primary' : ''; ?>"
                               href="#"
                               data-bs-toggle="collapse"
                               data-bs-target="#submenu-<?php echo str_replace(' ', '-', strtolower($menu['label'])); ?>">
                                <span>
                                    <?php if (isset($menu['icon'])): ?>
                                        <?php echo icon($menu['icon']); ?>
                                    <?php endif; ?>
                                    <span class="ms-2"><?php echo $menu['label']; ?></span>
                                </span>
                                <?php echo icon('chevron-down'); ?>
                            </a>
                            <div class="collapse <?php echo isset($menu['is_expanded']) && $menu['is_expanded'] ? 'show' : ''; ?>"
                                 id="submenu-<?php echo str_replace(' ', '-', strtolower($menu['label'])); ?>">
                                <ul class="nav flex-column ms-4 mt-1">
                                    <?php foreach ($menu['submenu'] as $submenu): ?>
                                        <li class="nav-item">
                                            <a class="nav-link text-white-50 py-1 <?php echo $submenu['is_active'] ? 'active text-white' : ''; ?>"
                                               href="<?php echo base_url($submenu['url']); ?>">
                                                <?php if (isset($submenu['icon'])): ?>
                                                    <?php echo icon($submenu['icon']); ?>
                                                <?php endif; ?>
                                                <span class="ms-2 small"><?php echo $submenu['label']; ?></span>
                                            </a>
                                        </li>
                                    <?php endforeach; ?>
                                </ul>
                            </div>
                        </li>
                    <?php else: ?>
                        <!-- Menu tanpa Submenu -->
                        <li class="nav-item mb-1">
                            <a class="nav-link text-white <?php echo $menu['is_active'] ? 'active bg-primary' : ''; ?>"
                               href="<?php echo base_url($menu['url']); ?>">
                                <?php if (isset($menu['icon'])): ?>
                                    <?php echo icon($menu['icon']); ?>
                                <?php endif; ?>
                                <span class="ms-2"><?php echo $menu['label']; ?></span>
                            </a>
                        </li>
                    <?php endif; ?>
                <?php endforeach; ?>

                <!-- Divider -->
                <li class="nav-item my-3">
                    <hr class="dropdown-divider border-secondary">
                </li>

                <!-- Logout -->
                <li class="nav-item">
                    <a class="nav-link text-danger" href="<?php echo base_url('auth/logout'); ?>">
                        <?php echo icon('box-arrow-left'); ?>
                        <span class="ms-2">Logout</span>
                    </a>
                </li>
            </ul>
        </div>
    </nav>

    <main class="flex-grow-1" style="margin-left: 260px;">
        <!-- Header -->
        <header class="bg-white shadow-sm py-3 px-4 d-flex justify-content-between align-items-center sticky-top">
            <h5 class="mb-0"><?php echo $title; ?></h5>

            <!-- Quick Actions -->
            <div class="d-flex gap-2">
                <?php foreach ($quick_actions as $action): ?>
                    <a href="<?php echo base_url($action['url']); ?>"
                       class="btn <?php echo $action['class']; ?> btn-sm">
                        <?php if (isset($action['icon'])): ?>
                            <?php echo icon($action['icon']); ?>
                        <?php endif; ?>
                        <span class="ms-1"><?php echo $action['label']; ?></span>
                    </a>
                <?php endforeach; ?>
            </div>
        </header>

        <!-- Content Area -->
        <div class="p-4">
```

---

## 6. Update Template Header

**Update `application/views/templates/header.php`:**

```php
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?php echo isset($title) ? $title . ' - Perpustakaan' : 'Perpustakaan Multi-Cabang'; ?></title>

    <!-- Bootstrap 5 CSS -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">

    <!-- Bootstrap Icons -->
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.0/font/bootstrap-icons.css">

    <style>
        :root {
            --sidebar-width: 260px;
        }

        body {
            background-color: #f5f6fa;
        }

        .sidebar {
            z-index: 1000;
        }

        .sidebar .nav-link {
            border-radius: 5px;
            transition: all 0.3s;
        }

        .sidebar .nav-link:hover {
            background-color: rgba(255,255,255,0.1);
        }

        .sidebar .nav-link.active {
            font-weight: 500;
        }

        .sidebar .collapse .nav-link {
            font-size: 0.9rem;
        }

        main {
            min-height: 100vh;
        }

        .card {
            border: none;
            box-shadow: 0 0 10px rgba(0,0,0,0.05);
        }

        .table th {
            font-weight: 600;
            text-transform: uppercase;
            font-size: 0.8rem;
            letter-spacing: 0.5px;
        }

        .btn-sm {
            padding: 0.25rem 0.5rem;
            font-size: 0.875rem;
        }

        .sticky-top {
            z-index: 999;
        }
    </style>
</head>
<body>
```

---

## 7. Update Template Footer

**Update `application/views/templates/footer.php`:**

```php
        </div> <!-- End content area -->
    </main>
</div>

<!-- Bootstrap 5 JS Bundle -->
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>

<script>
// Auto-hide alerts after 5 seconds
document.addEventListener('DOMContentLoaded', function() {
    const alerts = document.querySelectorAll('.alert:not(.alert-permanent)');
    alerts.forEach(function(alert) {
        setTimeout(function() {
            const bsAlert = new bootstrap.Alert(alert);
            bsAlert.close();
        }, 5000);
    });
});
</script>

</body>
</html>
```

---

## 8. Helper untuk UI Components

**File: `application/helpers/ui_helper.php`**

```php
<?php
defined('BASEPATH') OR exit('No direct script access allowed');

/**
 * Check if current user has permission
 */
if (!function_exists('can')) {
    function can($permission_name) {
        $CI =& get_instance();
        $CI->load->service('rbac_service');
        $rbac = new Rbac_service();
        return $rbac->has_permission($permission_name);
    }
}

/**
 * Render button dengan permission check
 */
if (!function_exists('action_button')) {
    function action_button($url, $label, $permission, $class = 'btn-primary', $icon = NULL, $confirm = NULL) {
        if (!can($permission)) {
            return '';
        }

        $icon_html = $icon ? '<i class="bi bi-' . $icon . '"></i> ' : '';
        $onclick = $confirm ? 'onclick="return confirm('' . $confirm . '')"' : '';

        return '<a href="' . base_url($url) . '" class="btn btn-sm ' . $class . '" ' . $onclick . '>'
            . $icon_html . $label . '</a>';
    }
}

/**
 * Render button group untuk CRUD actions
 */
if (!function_exists('crud_actions')) {
    function crud_actions($base_url, $id, $permissions = array()) {
        $CI =& get_instance();
        $output = '';

        // View button (default TRUE)
        if (!isset($permissions['view']) || $permissions['view']) {
            $output .= '<a href="' . base_url($base_url . '/view/' . $id) . '" class="btn btn-sm btn-info">Detail</a> ';
        }

        // Edit button
        if (isset($permissions['edit']) && $permissions['edit'] && can($base_url . '_edit')) {
            $output .= '<a href="' . base_url($base_url . '/edit/' . $id) . '" class="btn btn-sm btn-warning">Edit</a> ';
        }

        // Delete button
        if (isset($permissions['delete']) && $permissions['delete'] && can($base_url . '_delete')) {
            $output .= '<a href="' . base_url($base_url . '/delete/' . $id) . '" class="btn btn-sm btn-danger" onclick="return confirm('Yakin hapus?')">Hapus</a>';
        }

        return $output;
    }
}

/**
 * Render section yang hanya muncul kalau punya permission
 */
if (!function_exists('permission_section')) {
    function permission_section($permission_name, $content) {
        if (can($permission_name)) {
            return $content;
        }
        return '';
    }
}

/**
 * Render badge role
 */
if (!function_exists('role_badge')) {
    function role_badge($role_name) {
        $colors = array(
            'Superadmin' => 'bg-danger',
            'Admin Cabang' => 'bg-warning text-dark',
            'Petugas' => 'bg-info',
            'Peminjam' => 'bg-secondary'
        );

        $class = isset($colors[$role_name]) ? $colors[$role_name] : 'bg-secondary';
        return '<span class="badge ' . $class . '">' . $role_name . '</span>';
    }
}

/**
 * Render status badge
 */
if (!function_exists('status_badge')) {
    function status_badge($is_active) {
        if ($is_active) {
            return '<span class="badge bg-success">Aktif</span>';
        }
        return '<span class="badge bg-secondary">Nonaktif</span>';
    }
}
```

Update autoload helper:

```php
$autoload['helper'] = array('url', 'form', 'security', 'date', 'filter', 'ui');
```

---

## 9. Update Books View dengan UI Helper

**Update `application/views/books/index.php`:**

```php
<div class="container-fluid">
    <div class="d-flex justify-content-between align-items-center mb-4">
        <h4 class="mb-0">Daftar Buku</h4>

        <!-- Tombol Tambah hanya muncul kalau punya permission -->
        <?php if (can('book_create')): ?>
            <a href="<?php echo base_url('books/create'); ?>" class="btn btn-primary">
                <i class="bi bi-plus-lg"></i> Tambah Buku
            </a>
        <?php endif; ?>
    </div>

    <!-- Flash Messages -->
    <?php if ($this->session->flashdata('success')): ?>
        <div class="alert alert-success alert-dismissible fade show">
            <?php echo $this->session->flashdata('success'); ?>
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
    <?php endif; ?>

    <?php if ($this->session->flashdata('error')): ?>
        <div class="alert alert-danger alert-dismissible fade show">
            <?php echo $this->session->flashdata('error'); ?>
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
    <?php endif; ?>

    <!-- Filter Panel -->
    <div class="card mb-4">
        <div class="card-header bg-white d-flex justify-content-between align-items-center py-3">
            <h6 class="mb-0 fw-bold">Filter Pencarian</h6>
            <button class="btn btn-sm btn-outline-primary" type="button" data-bs-toggle="collapse" data-bs-target="#filterCollapse">
                <i class="bi bi-funnel"></i> Toggle
            </button>
        </div>
        <div class="collapse show" id="filterCollapse">
            <div class="card-body">
                <form method="get" action="<?php echo current_url(); ?>">
                    <div class="row g-3">
                        <div class="col-md-3">
                            <label class="form-label small text-muted">Judul</label>
                            <input type="text" name="title" class="form-control" value="<?php echo $active_filters['title'] ?? ''; ?>" placeholder="Cari judul...">
                        </div>
                        <div class="col-md-3">
                            <label class="form-label small text-muted">Penulis</label>
                            <input type="text" name="author" class="form-control" value="<?php echo $active_filters['author'] ?? ''; ?>" placeholder="Cari penulis...">
                        </div>
                        <div class="col-md-2">
                            <label class="form-label small text-muted">Kategori</label>
                            <select name="category" class="form-select">
                                <option value="">Semua</option>
                                <?php foreach ($categories as $cat): ?>
                                    <option value="<?php echo $cat; ?>" <?php echo ($active_filters['category'] ?? '') == $cat ? 'selected' : ''; ?>><?php echo $cat; ?></option>
                                <?php endforeach; ?>
                            </select>
                        </div>
                        <div class="col-md-2">
                            <label class="form-label small text-muted">Tahun</label>
                            <input type="number" name="publication_year" class="form-control" value="<?php echo $active_filters['publication_year'] ?? ''; ?>" placeholder="2020">
                        </div>

                        <?php if ($is_superadmin): ?>
                        <div class="col-md-2">
                            <label class="form-label small text-muted">Cabang</label>
                            <select name="branch_id" class="form-select">
                                <option value="">Semua</option>
                                <?php foreach ($branches as $branch): ?>
                                    <option value="<?php echo $branch->id; ?>" <?php echo ($active_filters['branch_id'] ?? '') == $branch->id ? 'selected' : ''; ?>><?php echo $branch->name; ?></option>
                                <?php endforeach; ?>
                            </select>
                        </div>
                        <?php endif; ?>
                    </div>

                    <!-- Preserve sort params -->
                    <?php if (!empty($active_sort)): ?>
                        <?php foreach ($active_sort as $field => $order): ?>
                            <input type="hidden" name="sort" value="<?php echo $field; ?>">
                            <input type="hidden" name="order" value="<?php echo $order; ?>">
                        <?php endforeach; ?>
                    <?php endif; ?>

                    <div class="row mt-3">
                        <div class="col-12">
                            <button type="submit" class="btn btn-primary">
                                <i class="bi bi-search"></i> Terapkan
                            </button>
                            <a href="<?php echo current_url(); ?>" class="btn btn-outline-secondary">
                                <i class="bi bi-x-circle"></i> Reset
                            </a>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    </div>

    <!-- Table -->
    <div class="card">
        <div class="card-body p-0">
            <div class="table-responsive">
                <table class="table table-hover mb-0">
                    <thead class="table-light">
                        <tr>
                            <th width="5%" class="text-center">No</th>
                            <th>
                                <a href="<?php echo $this->book_model->build_sort_url('title', $active_sort); ?>" class="text-decoration-none text-dark">
                                    Judul <?php echo $this->book_model->get_sort_indicator('title', $active_sort); ?>
                                </a>
                            </th>
                            <th>
                                <a href="<?php echo $this->book_model->build_sort_url('author', $active_sort); ?>" class="text-decoration-none text-dark">
                                    Penulis <?php echo $this->book_model->get_sort_indicator('author', $active_sort); ?>
                                </a>
                            </th>
                            <th>ISBN</th>
                            <th>Kategori</th>
                            <th class="text-center">
                                <a href="<?php echo $this->book_model->build_sort_url('publication_year', $active_sort); ?>" class="text-decoration-none text-dark">
                                    Tahun <?php echo $this->book_model->get_sort_indicator('publication_year', $active_sort); ?>
                                </a>
                            </th>
                            <th class="text-center">Stok</th>
                            <?php if ($is_superadmin): ?>
                            <th>Cabang</th>
                            <?php endif; ?>
                            <th width="15%" class="text-center">Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php if (empty($books)): ?>
                            <tr>
                                <td colspan="<?php echo $is_superadmin ? 9 : 8; ?>" class="text-center py-4 text-muted">
                                    <i class="bi bi-inbox fs-1 d-block mb-2"></i>
                                    Tidak ada data buku
                                </td>
                            </tr>
                        <?php else: ?>
                            <?php $no = (($current_page - 1) * 10) + 1; ?>
                            <?php foreach ($books as $book): ?>
                                <tr>
                                    <td class="text-center"><?php echo $no++; ?></td>
                                    <td><?php echo htmlspecialchars($book->title); ?></td>
                                    <td><?php echo htmlspecialchars($book->author); ?></td>
                                    <td><?php echo htmlspecialchars($book->isbn); ?></td>
                                    <td><?php echo htmlspecialchars($book->category); ?></td>
                                    <td class="text-center"><?php echo $book->publication_year; ?></td>
                                    <td class="text-center">
                                        <span class="badge bg-<?php echo $book->stock > 0 ? 'success' : 'danger'; ?>">
                                            <?php echo $book->stock; ?>
                                        </span>
                                    </td>
                                    <?php if ($is_superadmin): ?>
                                    <td><?php echo $book->branch_name; ?></td>
                                    <?php endif; ?>
                                    <td class="text-center">
                                        <a href="<?php echo base_url('books/view/' . $book->id); ?>" class="btn btn-sm btn-info">
                                            <i class="bi bi-eye"></i>
                                        </a>

                                        <?php if (can('book_edit')): ?>
                                            <a href="<?php echo base_url('books/edit/' . $book->id); ?>" class="btn btn-sm btn-warning">
                                                <i class="bi bi-pencil"></i>
                                            </a>
                                        <?php endif; ?>

                                        <?php if (can('book_delete')): ?>
                                            <a href="<?php echo base_url('books/delete/' . $book->id); ?>"
                                               class="btn btn-sm btn-danger"
                                               onclick="return confirm('Yakin ingin menghapus buku ini?')">
                                                <i class="bi bi-trash"></i>
                                            </a>
                                        <?php endif; ?>
                                    </td>
                                </tr>
                            <?php endforeach; ?>
                        <?php endif; ?>
                    </tbody>
                </table>
            </div>
        </div>

        <!-- Pagination -->
        <?php if ($pagination): ?>
            <div class="card-footer bg-white">
                <div class="d-flex justify-content-between align-items-center">
                    <small class="text-muted"><?php echo $pagination_info; ?></small>
                    <?php echo $pagination; ?>
                </div>
            </div>
        <?php endif; ?>
    </div>
</div>
```

---

## 10. View untuk Detail Buku

**File: `application/views/books/view.php`**

```php
<div class="container-fluid">
    <div class="d-flex justify-content-between align-items-center mb-4">
        <h4 class="mb-0">Detail Buku</h4>
        <div class="d-flex gap-2">
            <a href="<?php echo base_url('books'); ?>" class="btn btn-outline-secondary">
                <i class="bi bi-arrow-left"></i> Kembali
            </a>
            <?php if ($can_edit): ?>
                <a href="<?php echo base_url('books/edit/' . $book->id); ?>" class="btn btn-warning">
                    <i class="bi bi-pencil"></i> Edit
                </a>
            <?php endif; ?>
        </div>
    </div>

    <div class="row">
        <div class="col-md-8">
            <div class="card mb-4">
                <div class="card-header bg-white">
                    <h5 class="mb-0">Informasi Buku</h5>
                </div>
                <div class="card-body">
                    <table class="table table-borderless">
                        <tr>
                            <td width="25%" class="text-muted">Judul</td>
                            <td class="fw-bold"><?php echo htmlspecialchars($book->title); ?></td>
                        </tr>
                        <tr>
                            <td class="text-muted">Penulis</td>
                            <td><?php echo htmlspecialchars($book->author); ?></td>
                        </tr>
                        <tr>
                            <td class="text-muted">ISBN</td>
                            <td><?php echo htmlspecialchars($book->isbn); ?></td>
                        </tr>
                        <tr>
                            <td class="text-muted">Penerbit</td>
                            <td><?php echo htmlspecialchars($book->publisher); ?></td>
                        </tr>
                        <tr>
                            <td class="text-muted">Tahun Terbit</td>
                            <td><?php echo $book->publication_year; ?></td>
                        </tr>
                        <tr>
                            <td class="text-muted">Kategori</td>
                            <td>
                                <span class="badge bg-info"><?php echo htmlspecialchars($book->category); ?></span>
                            </td>
                        </tr>
                        <tr>
                            <td class="text-muted">Stok</td>
                            <td>
                                <span class="badge bg-<?php echo $book->stock > 0 ? 'success' : 'danger'; ?> fs-6">
                                    <?php echo $book->stock; ?> unit
                                </span>
                            </td>
                        </tr>
                        <tr>
                            <td class="text-muted">Cabang</td>
                            <td><?php echo $book->branch_name; ?></td>
                        </tr>
                    </table>
                </div>
            </div>

            <div class="card">
                <div class="card-header bg-white">
                    <h5 class="mb-0">Deskripsi</h5>
                </div>
                <div class="card-body">
                    <p class="mb-0"><?php echo nl2br(htmlspecialchars($book->description)); ?></p>
                </div>
            </div>
        </div>

        <div class="col-md-4">
            <div class="card">
                <div class="card-header bg-white">
                    <h6 class="mb-0">Informasi Sistem</h6>
                </div>
                <div class="card-body">
                    <small class="text-muted d-block mb-1">Dibuat pada</small>
                    <p><?php echo date('d M Y H:i', strtotime($book->created_at)); ?></p>

                    <small class="text-muted d-block mb-1">Terakhir update</small>
                    <p><?php echo date('d M Y H:i', strtotime($book->updated_at)); ?></p>

                    <small class="text-muted d-block mb-1">Status</small>
                    <p><?php echo status_badge($book->is_active); ?></p>
                </div>
            </div>

            <?php if ($can_delete): ?>
                <div class="card mt-4 border-danger">
                    <div class="card-header bg-danger text-white">
                        <h6 class="mb-0"><i class="bi bi-exclamation-triangle"></i> Zona Berbahaya</h6>
                    </div>
                    <div class="card-body">
                        <p class="small text-muted">Tindakan ini tidak bisa dibatalkan.</p>
                        <a href="<?php echo base_url('books/delete/' . $book->id); ?>"
                           class="btn btn-outline-danger w-100"
                           onclick="return confirm('Yakin ingin menghapus buku ini secara permanen?')">
                            <i class="bi bi-trash"></i> Hapus Buku
                        </a>
                    </div>
                </div>
            <?php endif; ?>
        </div>
    </div>
</div>
```

---

## 11. Update Dashboard View

**Update `application/views/dashboard/index.php`:**

```php
<div class="container-fluid">
    <div class="d-flex justify-content-between align-items-center mb-4">
        <h4 class="mb-0">Dashboard</h4>
        <span class="text-muted"><?php echo date('l, d F Y'); ?></span>
    </div>

    <!-- Welcome Card -->
    <div class="card bg-primary text-white mb-4">
        <div class="card-body">
            <div class="d-flex align-items-center">
                <div class="flex-grow-1">
                    <h5 class="mb-1">Selamat Datang, <?php echo $current_user->full_name; ?>!</h5>
                    <p class="mb-0 opacity-75">
                        <?php echo role_badge($current_user->role_name); ?>
                        <span class="ms-2"><?php echo $current_user->branch_name; ?></span>
                    </p>
                </div>
                <div class="fs-1 opacity-25">
                    <i class="bi bi-person-circle"></i>
                </div>
            </div>
        </div>
    </div>

    <!-- Quick Stats -->
    <div class="row mb-4">
        <?php if (can('book_view')): ?>
        <div class="col-md-3">
            <div class="card">
                <div class="card-body">
                    <div class="d-flex align-items-center">
                        <div class="flex-grow-1">
                            <h6 class="text-muted mb-1">Total Buku</h6>
                                    <h3 class="mb-0">-</h3>
                        </div>
                        <div class="fs-2 text-primary">
                            <i class="bi bi-book"></i>
                        </div>
                    </div>
                    <a href="<?php echo base_url('books'); ?>" class="small text-decoration-none">Lihat semua <i class="bi bi-arrow-right"></i></a>
                </div>
            </div>
        </div>
        <?php endif; ?>

        <?php if (can('user_view')): ?>
        <div class="col-md-3">
            <div class="card">
                <div class="card-body">
                    <div class="d-flex align-items-center">
                        <div class="flex-grow-1">
                            <h6 class="text-muted mb-1">Total User</h6>
                            <h3 class="mb-0">-</h3>
                        </div>
                        <div class="fs-2 text-success">
                            <i class="bi bi-people"></i>
                        </div>
                    </div>
                    <a href="<?php echo base_url('users'); ?>" class="small text-decoration-none">Lihat semua <i class="bi bi-arrow-right"></i></a>
                </div>
            </div>
        </div>
        <?php endif; ?>

        <?php if (can('branch_view')): ?>
        <div class="col-md-3">
            <div class="card">
                <div class="card-body">
                    <div class="d-flex align-items-center">
                        <div class="flex-grow-1">
                            <h6 class="text-muted mb-1">Total Cabang</h6>
                            <h3 class="mb-0">-</h3>
                        </div>
                        <div class="fs-2 text-info">
                            <i class="bi bi-building"></i>
                        </div>
                    </div>
                    <a href="<?php echo base_url('branches'); ?>" class="small text-decoration-none">Lihat semua <i class="bi bi-arrow-right"></i></a>
                </div>
            </div>
        </div>
        <?php endif; ?>

        <div class="col-md-3">
            <div class="card">
                <div class="card-body">
                    <div class="d-flex align-items-center">
                        <div class="flex-grow-1">
                            <h6 class="text-muted mb-1">Permission</h6>
                            <h3 class="mb-0"><?php echo count($user_permissions); ?></h3>
                        </div>
                        <div class="fs-2 text-warning">
                            <i class="bi bi-shield-check"></i>
                        </div>
                    </div>
                    <span class="small text-muted">Akses yang dimiliki</span>
                </div>
            </div>
        </div>
    </div>

    <!-- Permissions List -->
    <div class="card">
        <div class="card-header bg-white">
            <h6 class="mb-0">Permission yang Dimiliki</h6>
        </div>
        <div class="card-body">
            <?php if (empty($user_permissions)): ?>
                <p class="text-muted mb-0">Tidak ada permission yang ditetapkan.</p>
            <?php else: ?>
                <div class="row">
                    <?php foreach (array_chunk($user_permissions, 4) as $chunk): ?>
                        <div class="col-md-3">
                            <ul class="list-unstyled mb-0">
                                <?php foreach ($chunk as $perm): ?>
                                    <li class="mb-2">
                                        <span class="badge bg-light text-dark border">
                                            <i class="bi bi-check-circle-fill text-success small"></i>
                                            <?php echo $perm; ?>
                                        </span>
                                    </li>
                                <?php endforeach; ?>
                            </ul>
                        </div>
                    <?php endforeach; ?>
                </div>
            <?php endif; ?>
        </div>
    </div>
</div>
```

---

## Ringkasan Part 4

Di part ini kita sudah membangun UI dinamis lengkap:

1. **Menu Config** (`config/menu.php`) - Definisi menu dengan permission requirement
2. **Menu Library** (`libraries/Menu.php`) - Filter menu berdasarkan permission user
3. **Sidebar Dinamis** - Menu muncul/hilang sesuai permission, auto active state
4. **Quick Actions** - Tombol di header muncul sesuai permission
5. **UI Helper** (`helpers/ui_helper.php`):
   - `can()` - cek permission di view
   - `action_button()` - render button dengan permission check
   - `role_badge()` - badge role dengan warna
   - `status_badge()` - badge status aktif/nonaktif
6. **View Update** dengan Bootstrap 5 styling:
   - Tombol CRUD muncul/hilang sesuai permission
   - Card-based layout
   - Responsive table
   - Auto-hide alerts

Hasil akhir:

- User hanya melihat menu yang boleh diakses
- Tombol create/edit/delete muncul sesuai permission
- Layout profesional dengan Bootstrap 5
- Sidebar fixed dengan user info

Di Part 5, kita akan membangun fitur manajemen RBAC untuk Admin (CRUD Role dan assign permissions).

---

## Troubleshooting

**Menu tidak muncul padahal punya permission**
Cek `Menu::filter_by_permission()`, pastikan permission name di config sama dengan di database.

**Active state tidak bekerja**
Pastikan URL di config menu sesuai dengan uri_string() CI.

**Quick actions tidak muncul**
Cek `Menu::get_allowed_quick_actions()` dan pastikan permission di config sudah benar.
