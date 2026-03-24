---
title: "Aplikasi Perpus CI 3 - Part 3: Sistem RBAC (Role-Based Access Control) Backend"
date: "Mar 25, 2026"
description: "RBAC"
---

**Seri Tutorial: Membangun Aplikasi Perpustakaan Multi-Cabang dengan CodeIgniter 3**

---

## Pendahuluan

Di Part 3 ini, kita membangun sistem RBAC yang solid di backend. RBAC (Role-Based Access Control) adalah cara mengatur akses user berdasarkan role mereka, bukan satu per satu.

Konsepnya: User punya Role, Role punya Permissions. User tidak langsung punya permission, tapi mewarisi dari role.

---

## 1. Konsep RBAC dalam Sistem Kita

### Struktur Hierarki

```
User (Pegawai A)
    ↓ memiliki
Role (Admin Cabang)
    ↓ punya banyak
Permissions [book_view, book_create, book_edit, user_view, etc.]
```

### Multi-Cabang + RBAC

Superadmin bisa akses semua cabang. Admin Cabang hanya cabang sendiri. Sistem harus cek permission DAN cabang.

---

## 2. Permission Model

**File: `application/models/Permission_model.php`**

```php
<?php
defined('BASEPATH') OR exit('No direct script access allowed');

class Permission_model extends MY_Model {

    protected $table = 'permissions';
    protected $soft_delete = FALSE;

    protected $filterable_fields = array('name', 'description', 'module');
    protected $sortable_fields = array('id', 'name', 'module');
    protected $default_sort = array('module' => 'ASC', 'name' => 'ASC');

    public function __construct() {
        parent::__construct();
    }

    /**
     * Get permissions by role ID
     */
    public function get_by_role($role_id) {
        $this->db->select('permissions.*');
        $this->db->from($this->table);
        $this->db->join('role_permissions', 'role_permissions.permission_id = permissions.id');
        $this->db->where('role_permissions.role_id', $role_id);
        $this->db->order_by('permissions.module', 'ASC');
        $this->db->order_by('permissions.name', 'ASC');
        return $this->db->get()->result();
    }

    /**
     * Get permission names by role ID (untuk checking)
     */
    public function get_names_by_role($role_id) {
        $this->db->select('permissions.name');
        $this->db->from($this->table);
        $this->db->join('role_permissions', 'role_permissions.permission_id = permissions.id');
        $this->db->where('role_permissions.role_id', $role_id);
        $result = $this->db->get()->result();

        $names = array();
        foreach ($result as $row) {
            $names[] = $row->name;
        }
        return $names;
    }

    /**
     * Get permissions grouped by module (untuk UI)
     */
    public function get_grouped_by_module() {
        $permissions = $this->get_all();
        $grouped = array();

        foreach ($permissions as $perm) {
            if (!isset($grouped[$perm->module])) {
                $grouped[$perm->module] = array();
            }
            $grouped[$perm->module][] = $perm;
        }

        return $grouped;
    }

    /**
     * Get by name (untuk checking)
     */
    public function get_by_name($name) {
        return $this->db->get_where($this->table, array('name' => $name))->row();
    }
}
```

---

## 3. Role Model

**File: `application/models/Role_model.php`**

```php
<?php
defined('BASEPATH') OR exit('No direct script access allowed');

class Role_model extends MY_Model {

    protected $table = 'roles';

    protected $filterable_fields = array('name', 'description', 'is_active');
    protected $sortable_fields = array('id', 'name', 'created_at');
    protected $default_sort = array('id' => 'ASC');

    public function __construct() {
        parent::__construct();
        $this->load->model('permission_model');
    }

    /**
     * Get role dengan permissions
     */
    public function get_with_permissions($role_id) {
        $role = $this->get_by_id($role_id);
        if ($role) {
            $role->permissions = $this->permission_model->get_by_role($role_id);
            $role->permission_names = $this->permission_model->get_names_by_role($role_id);
        }
        return $role;
    }

    /**
     * Get all dengan permission count
     */
    public function get_all_with_count() {
        $roles = $this->get_all();

        foreach ($roles as $role) {
            $role->permission_count = $this->db
                ->where('role_id', $role->id)
                ->count_all_results('role_permissions');

            $role->user_count = $this->db
                ->where('role_id', $role->id)
                ->where('deleted_at', NULL)
                ->count_all_results('users');
        }

        return $roles;
    }

    /**
     * Assign permissions ke role
     */
    public function assign_permissions($role_id, $permission_ids) {
        // Hapus permission lama
        $this->db->where('role_id', $role_id);
        $this->db->delete('role_permissions');

        // Insert permission baru
        if (!empty($permission_ids)) {
            $data = array();
            foreach ($permission_ids as $perm_id) {
                $data[] = array(
                    'role_id' => $role_id,
                    'permission_id' => $perm_id
                );
            }
            return $this->db->insert_batch('role_permissions', $data);
        }

        return TRUE;
    }

    /**
     * Check if role has permission
     */
    public function has_permission($role_id, $permission_name) {
        $this->db->select('role_permissions.permission_id');
        $this->db->from('role_permissions');
        $this->db->join('permissions', 'permissions.id = role_permissions.permission_id');
        $this->db->where('role_permissions.role_id', $role_id);
        $this->db->where('permissions.name', $permission_name);
        return $this->db->get()->num_rows() > 0;
    }

    /**
     * Get role ID by name
     */
    public function get_id_by_name($name) {
        $role = $this->db->get_where($this->table, array('name' => $name))->row();
        return $role ? $role->id : NULL;
    }
}
```

---

## 4. RBAC Service Layer

Service ini handle semua logika permission checking.

**File: `application/services/Rbac_service.php`**

```php
<?php
defined('BASEPATH') OR exit('No direct script access allowed');

class Rbac_service {

    protected $CI;
    protected $user_permissions = NULL;

    public function __construct() {
        $this->CI =& get_instance();
        $this->CI->load->model('role_model');
        $this->CI->load->model('permission_model');
        $this->CI->load->library('session');
    }

    /**
     * Check if current user has specific permission
     */
    public function has_permission($permission_name) {
        $role_id = $this->CI->session->userdata('role_id');

        // Superadmin (role_id = 1) bypass all
        if ($role_id == 1) {
            return TRUE;
        }

        if (!$role_id) {
            return FALSE;
        }

        // Cache permissions untuk reduce query
        if ($this->user_permissions === NULL) {
            $this->user_permissions = $this->permission_model->get_names_by_role($role_id);
        }

        return in_array($permission_name, $this->user_permissions);
    }

    /**
     * Check multiple permissions (AND logic - harus punya semua)
     */
    public function has_all_permissions($permission_names) {
        foreach ($permission_names as $perm) {
            if (!$this->has_permission($perm)) {
                return FALSE;
            }
        }
        return TRUE;
    }

    /**
     * Check multiple permissions (OR logic - punya salah satu)
     */
    public function has_any_permission($permission_names) {
        foreach ($permission_names as $perm) {
            if ($this->has_permission($perm)) {
                return TRUE;
            }
        }
        return FALSE;
    }

    /**
     * Get all permissions of current user
     */
    public function get_user_permissions() {
        $role_id = $this->CI->session->userdata('role_id');

        if (!$role_id) {
            return array();
        }

        if ($this->user_permissions === NULL) {
            $this->user_permissions = $this->permission_model->get_names_by_role($role_id);
        }

        return $this->user_permissions;
    }

    /**
     * Check if user can access specific branch data
     */
    public function can_access_branch($target_branch_id) {
        $user_branch_id = $this->CI->session->userdata('branch_id');
        $role_id = $this->CI->session->userdata('role_id');

        // Superadmin bisa akses semua cabang
        if ($role_id == 1) {
            return TRUE;
        }

        // User biasa hanya bisa akses cabang sendiri
        return $user_branch_id == $target_branch_id;
    }

    /**
     * Get branch filter untuk query
     * Return: branch_id untuk user biasa, NULL untuk superadmin (lihat semua)
     */
    public function get_branch_filter() {
        $role_id = $this->CI->session->userdata('role_id');
        $user_branch_id = $this->CI->session->userdata('branch_id');

        if ($role_id == 1) {
            return NULL; // Superadmin lihat semua
        }

        return $user_branch_id;
    }

    /**
     * Check permission untuk controller/method
     * Format permission: controller_action (contoh: book_create, user_delete)
     */
    public function check_controller_permission($controller, $action) {
        $permission_name = strtolower($controller) . '_' . strtolower($action);
        return $this->has_permission($permission_name);
    }

    /**
     * Enforce permission - redirect atau show error jika tidak punya permission
     */
    public function enforce_permission($permission_name, $redirect_url = NULL) {
        if (!$this->has_permission($permission_name)) {
            if ($redirect_url) {
                $this->CI->session->set_flashdata('error', 'Anda tidak memiliki akses untuk melakukan aksi ini.');
                redirect($redirect_url);
            } else {
                show_error('Akses ditolak. Anda tidak memiliki permission: ' . $permission_name, 403);
            }
        }
    }

    /**
     * Get menu items berdasarkan permission
     */
    public function get_allowed_menus($menu_items) {
        $allowed = array();

        foreach ($menu_items as $item) {
            // Jika tidak punya permission requirement, tampilkan
            if (!isset($item['permission'])) {
                $allowed[] = $item;
                continue;
            }

            // Cek permission
            if ($this->has_permission($item['permission'])) {
                // Cek submenu jika ada
                if (isset($item['submenu'])) {
                    $item['submenu'] = $this->get_allowed_menus($item['submenu']);
                    // Hanya tampilkan jika ada submenu yang diizinkan
                    if (!empty($item['submenu'])) {
                        $allowed[] = $item;
                    }
                } else {
                    $allowed[] = $item;
                }
            }
        }

        return $allowed;
    }
}
```

---

## 5. Update MY_Controller dengan RBAC

**File: `application/core/MY_Controller.php` (Update Lengkap)**

```php
<?php
defined('BASEPATH') OR exit('No direct script access allowed');

class MY_Controller extends CI_Controller {

    protected $current_user = NULL;
    protected $user_branch_id = NULL;
    protected $user_role_id = NULL;
    protected $rbac_service = NULL;

    public function __construct() {
        parent::__construct();

        $this->load->library('session');
        $this->load->model('user_model');
        $this->load->service('rbac_service');

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

    /**
     * Check if user is logged in
     */
    protected function require_auth() {
        if (!$this->session->userdata('logged_in')) {
            redirect('auth/login');
        }
    }

    /**
     * Check if user has specific permission
     */
    protected function has_permission($permission_name) {
        return $this->rbac_service->has_permission($permission_name);
    }

    /**
     * Require permission atau redirect
     */
    protected function require_permission($permission_name, $redirect_url = NULL) {
        $this->require_auth();

        if (!$this->has_permission($permission_name)) {
            if ($redirect_url) {
                $this->session->set_flashdata('error', 'Anda tidak memiliki akses ke halaman ini.');
                redirect($redirect_url);
            } else {
                show_error('Akses ditolak. Permission diperlukan: ' . $permission_name, 403);
            }
        }
    }

    /**
     * Check multiple permissions
     */
    protected function has_any_permission($permission_names) {
        return $this->rbac_service->has_any_permission($permission_names);
    }

    /**
     * Check branch access
     */
    protected function can_access_branch($branch_id) {
        return $this->rbac_service->can_access_branch($branch_id);
    }

    /**
     * Require branch access
     */
    protected function require_branch_access($branch_id) {
        if (!$this->can_access_branch($branch_id)) {
            show_error('Anda tidak memiliki akses ke data cabang ini.', 403);
        }
    }

    /**
     * Get current user
     */
    protected function get_current_user() {
        return $this->current_user;
    }

    /**
     * Get current branch ID
     */
    protected function get_current_branch_id() {
        return $this->user_branch_id;
    }

    /**
     * Get current role ID
     */
    protected function get_current_role_id() {
        return $this->user_role_id;
    }

    /**
     * Check if superadmin
     */
    protected function is_superadmin() {
        return $this->user_role_id == 1;
    }

    /**
     * Get branch filter untuk query
     */
    protected function get_branch_filter() {
        return $this->rbac_service->get_branch_filter();
    }

    /**
     * Get allowed menus
     */
    protected function get_allowed_menus($menus) {
        return $this->rbac_service->get_allowed_menus($menus);
    }

    /**
     * Add permission data ke view data
     */
    protected function add_permission_data(&$data) {
        $data['is_superadmin'] = $this->is_superadmin();
        $data['current_user'] = $this->current_user;
        $data['user_branch_id'] = $this->user_branch_id;
        $data['user_role_id'] = $this->user_role_id;
        $data['user_permissions'] = $this->rbac_service->get_user_permissions();
        return $data;
    }
}
```

---

## 6. Update Books Controller dengan RBAC

**File: `application/controllers/Books.php` (Update Lengkap)**

```php
<?php
defined('BASEPATH') OR exit('No direct script access allowed');

class Books extends MY_Controller {

    public function __construct() {
        parent::__construct();
        $this->require_auth();
        $this->require_permission('book_view');

        $this->load->model('book_model');
        $this->load->model('branch_model');
        $this->load->helper('filter');
    }

    /**
     * List buku dengan filter, sort, pagination
     */
    public function index() {
        $page = (int) $this->input->get('page') ?: 1;
        if ($page < 1) $page = 1;

        // Branch filter berdasarkan role
        $branch_filter = $this->get_branch_filter();

        // Get results
        $result = $this->book_model->get_filtered_with_branch($page, 10, $branch_filter);

        $data = array(
            'title' => 'Daftar Buku',
            'books' => $result['data'],
            'pagination' => $result['pagination']['links'],
            'pagination_info' => pagination_info($result['total_rows'], $result['per_page'], $result['current_page']),
            'total_rows' => $result['total_rows'],
            'current_page' => $result['current_page'],
            'active_filters' => $this->book_model->get_active_filters(),
            'active_sort' => $this->book_model->get_active_sort(),
            'branches' => $this->is_superadmin() ? $this->branch_model->get_active() : array(),
            'categories' => $this->book_model->get_categories(),
            'can_create' => $this->has_permission('book_create'),
            'can_edit' => $this->has_permission('book_edit'),
            'can_delete' => $this->has_permission('book_delete')
        );

        $this->add_permission_data($data);

        $this->load->view('templates/header', $data);
        $this->load->view('templates/sidebar', $data);
        $this->load->view('books/index', $data);
        $this->load->view('templates/footer');
    }

    /**
     * Detail buku
     */
    public function view($id) {
        $book = $this->book_model->get_with_branch($id);

        if (!$book) {
            show_404();
        }

        // Cek akses cabang
        $this->require_branch_access($book->branch_id);

        $data = array(
            'title' => 'Detail Buku',
            'book' => $book,
            'can_edit' => $this->has_permission('book_edit'),
            'can_delete' => $this->has_permission('book_delete')
        );

        $this->add_permission_data($data);

        $this->load->view('templates/header', $data);
        $this->load->view('templates/sidebar', $data);
        $this->load->view('books/view', $data);
        $this->load->view('templates/footer');
    }

    /**
     * Form tambah buku
     */
    public function create() {
        $this->require_permission('book_create');

        $data = array(
            'title' => 'Tambah Buku',
            'branches' => $this->is_superadmin() ? $this->branch_model->get_active() : array(),
            'user_branch_id' => $this->user_branch_id
        );

        $this->add_permission_data($data);

        $this->load->view('templates/header', $data);
        $this->load->view('templates/sidebar', $data);
        $this->load->view('books/form', $data);
        $this->load->view('templates/footer');
    }

    /**
     * Proses tambah buku
     */
    public function store() {
        $this->require_permission('book_create');

        // Validasi input
        $this->load->library('form_validation');
        $this->form_validation->set_rules('title', 'Judul', 'required');
        $this->form_validation->set_rules('author', 'Penulis', 'required');

        if ($this->form_validation->run() == FALSE) {
            $this->create();
            return;
        }

        // Data buku
        $data = array(
            'title' => $this->input->post('title'),
            'author' => $this->input->post('author'),
            'isbn' => $this->input->post('isbn'),
            'publisher' => $this->input->post('publisher'),
            'publication_year' => $this->input->post('publication_year'),
            'category' => $this->input->post('category'),
            'description' => $this->input->post('description'),
            'stock' => $this->input->post('stock') ?: 0,
            'is_active' => 1,
            'created_by' => $this->session->userdata('user_id')
        );

        // Set cabang
        if ($this->is_superadmin()) {
            $data['branch_id'] = $this->input->post('branch_id');
        } else {
            $data['branch_id'] = $this->user_branch_id;
        }

        // Cek akses cabang (kalau superadmin pilih cabang lain)
        $this->require_branch_access($data['branch_id']);

        $book_id = $this->book_model->insert($data);

        if ($book_id) {
            $this->session->set_flashdata('success', 'Buku berhasil ditambahkan.');
            redirect('books');
        } else {
            $this->session->set_flashdata('error', 'Gagal menambahkan buku.');
            redirect('books/create');
        }
    }

    /**
     * Form edit buku
     */
    public function edit($id) {
        $this->require_permission('book_edit');

        $book = $this->book_model->get_by_id($id);

        if (!$book) {
            show_404();
        }

        // Cek akses cabang
        $this->require_branch_access($book->branch_id);

        $data = array(
            'title' => 'Edit Buku',
            'book' => $book,
            'branches' => $this->is_superadmin() ? $this->branch_model->get_active() : array()
        );

        $this->add_permission_data($data);

        $this->load->view('templates/header', $data);
        $this->load->view('templates/sidebar', $data);
        $this->load->view('books/form', $data);
        $this->load->view('templates/footer');
    }

    /**
     * Proses update buku
     */
    public function update($id) {
        $this->require_permission('book_edit');

        $book = $this->book_model->get_by_id($id);

        if (!$book) {
            show_404();
        }

        // Cek akses cabang
        $this->require_branch_access($book->branch_id);

        // Validasi
        $this->load->library('form_validation');
        $this->form_validation->set_rules('title', 'Judul', 'required');
        $this->form_validation->set_rules('author', 'Penulis', 'required');

        if ($this->form_validation->run() == FALSE) {
            $this->edit($id);
            return;
        }

        $data = array(
            'title' => $this->input->post('title'),
            'author' => $this->input->post('author'),
            'isbn' => $this->input->post('isbn'),
            'publisher' => $this->input->post('publisher'),
            'publication_year' => $this->input->post('publication_year'),
            'category' => $this->input->post('category'),
            'description' => $this->input->post('description'),
            'stock' => $this->input->post('stock') ?: 0
        );

        // Update cabang hanya jika superadmin
        if ($this->is_superadmin()) {
            $new_branch_id = $this->input->post('branch_id');
            $this->require_branch_access($new_branch_id);
            $data['branch_id'] = $new_branch_id;
        }

        if ($this->book_model->update($id, $data)) {
            $this->session->set_flashdata('success', 'Buku berhasil diupdate.');
            redirect('books');
        } else {
            $this->session->set_flashdata('error', 'Gagal mengupdate buku.');
            redirect('books/edit/' . $id);
        }
    }

    /**
     * Hapus buku (soft delete)
     */
    public function delete($id) {
        $this->require_permission('book_delete');

        $book = $this->book_model->get_by_id($id);

        if (!$book) {
            show_404();
        }

        // Cek akses cabang
        $this->require_branch_access($book->branch_id);

        if ($this->book_model->delete($id)) {
            $this->session->set_flashdata('success', 'Buku berhasil dihapus.');
        } else {
            $this->session->set_flashdata('error', 'Gagal menghapus buku.');
        }

        redirect('books');
    }
}
```

---

## 7. Update View Books dengan RBAC

**Update `application/views/books/index.php`:**

```php
<div class="container-fluid py-4">
    <div class="d-flex justify-content-between align-items-center mb-4">
        <h1 class="h3">Daftar Buku</h1>
        <?php if ($can_create): ?>
            <a href="<?php echo base_url('books/create'); ?>" class="btn btn-primary">Tambah Buku</a>
        <?php endif; ?>
    </div>

    <!-- Flash Messages -->
    <?php if ($this->session->flashdata('success')): ?>
        <div class="alert alert-success"><?php echo $this->session->flashdata('success'); ?></div>
    <?php endif; ?>
    <?php if ($this->session->flashdata('error')): ?>
        <div class="alert alert-danger"><?php echo $this->session->flashdata('error'); ?></div>
    <?php endif; ?>

    <!-- Filter Panel -->
    <div class="card mb-4">
        <div class="card-header d-flex justify-content-between align-items-center">
            <h5 class="mb-0">Filter Pencarian</h5>
            <button class="btn btn-sm btn-outline-primary" type="button" data-bs-toggle="collapse" data-bs-target="#filterCollapse">
                Toggle Filter
            </button>
        </div>
        <div class="collapse show" id="filterCollapse">
            <div class="card-body">
                <form method="get" action="<?php echo current_url(); ?>">
                    <div class="row">
                        <div class="col-md-3">
                            <label class="form-label">Judul</label>
                            <input type="text" name="title" class="form-control" value="<?php echo $active_filters['title'] ?? ''; ?>" placeholder="Cari judul...">
                        </div>
                        <div class="col-md-3">
                            <label class="form-label">Penulis</label>
                            <input type="text" name="author" class="form-control" value="<?php echo $active_filters['author'] ?? ''; ?>" placeholder="Cari penulis...">
                        </div>
                        <div class="col-md-2">
                            <label class="form-label">Kategori</label>
                            <select name="category" class="form-select">
                                <option value="">Semua</option>
                                <?php foreach ($categories as $cat): ?>
                                    <option value="<?php echo $cat; ?>" <?php echo ($active_filters['category'] ?? '') == $cat ? 'selected' : ''; ?>><?php echo $cat; ?></option>
                                <?php endforeach; ?>
                            </select>
                        </div>
                        <div class="col-md-2">
                            <label class="form-label">Tahun</label>
                            <input type="number" name="publication_year" class="form-control" value="<?php echo $active_filters['publication_year'] ?? ''; ?>" placeholder="2020">
                        </div>

                        <?php if ($is_superadmin): ?>
                        <div class="col-md-2">
                            <label class="form-label">Cabang</label>
                            <select name="branch_id" class="form-select">
                                <option value="">Semua Cabang</option>
                                <?php foreach ($branches as $branch): ?>
                                    <option value="<?php echo $branch->id; ?>" <?php echo ($active_filters['branch_id'] ?? '') == $branch->id ? 'selected' : ''; ?>><?php echo $branch->name; ?></option>
                                <?php endforeach; ?>
                            </select>
                        </div>
                        <?php endif; ?>
                    </div>

                    <!-- Preserve sort params -->
                    <?php if (isset($active_sort) && is_array($active_sort)): ?>
                        <?php foreach ($active_sort as $field => $order): ?>
                            <input type="hidden" name="sort" value="<?php echo $field; ?>">
                            <input type="hidden" name="order" value="<?php echo $order; ?>">
                        <?php endforeach; ?>
                    <?php endif; ?>

                    <div class="row mt-3">
                        <div class="col-12">
                            <button type="submit" class="btn btn-primary">Terapkan Filter</button>
                            <a href="<?php echo current_url(); ?>" class="btn btn-outline-secondary">Reset</a>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    </div>

    <!-- Info -->
    <div class="d-flex justify-content-between align-items-center mb-3">
        <p class="text-muted mb-0"><?php echo $pagination_info; ?></p>
    </div>

    <!-- Table -->
    <div class="card">
        <div class="table-responsive">
            <table class="table table-striped table-hover mb-0">
                <thead class="table-dark">
                    <tr>
                        <th width="5%">No</th>
                        <th>
                            <a href="<?php echo $this->book_model->build_sort_url('title', $active_sort); ?>" class="text-white text-decoration-none">
                                Judul <?php echo $this->book_model->get_sort_indicator('title', $active_sort); ?>
                            </a>
                        </th>
                        <th>
                            <a href="<?php echo $this->book_model->build_sort_url('author', $active_sort); ?>" class="text-white text-decoration-none">
                                Penulis <?php echo $this->book_model->get_sort_indicator('author', $active_sort); ?>
                            </a>
                        </th>
                        <th>ISBN</th>
                        <th>Kategori</th>
                        <th>
                            <a href="<?php echo $this->book_model->build_sort_url('publication_year', $active_sort); ?>" class="text-white text-decoration-none">
                                Tahun <?php echo $this->book_model->get_sort_indicator('publication_year', $active_sort); ?>
                            </a>
                        </th>
                        <th>Stok</th>
                        <?php if ($is_superadmin): ?>
                        <th>Cabang</th>
                        <?php endif; ?>
                        <th width="15%">Aksi</th>
                    </tr>
                </thead>
                <tbody>
                    <?php if (empty($books)): ?>
                        <tr>
                            <td colspan="<?php echo $is_superadmin ? 9 : 8; ?>" class="text-center py-4">Tidak ada data buku</td>
                        </tr>
                    <?php else: ?>
                        <?php $no = (($current_page - 1) * 10) + 1; ?>
                        <?php foreach ($books as $book): ?>
                            <tr>
                                <td><?php echo $no++; ?></td>
                                <td><?php echo htmlspecialchars($book->title); ?></td>
                                <td><?php echo htmlspecialchars($book->author); ?></td>
                                <td><?php echo htmlspecialchars($book->isbn); ?></td>
                                <td><?php echo htmlspecialchars($book->category); ?></td>
                                <td><?php echo $book->publication_year; ?></td>
                                <td><?php echo $book->stock; ?></td>
                                <?php if ($is_superadmin): ?>
                                <td><?php echo $book->branch_name; ?></td>
                                <?php endif; ?>
                                <td>
                                    <a href="<?php echo base_url('books/view/' . $book->id); ?>" class="btn btn-sm btn-info">Detail</a>
                                    <?php if ($can_edit): ?>
                                        <a href="<?php echo base_url('books/edit/' . $book->id); ?>" class="btn btn-sm btn-warning">Edit</a>
                                    <?php endif; ?>
                                    <?php if ($can_delete): ?>
                                        <a href="<?php echo base_url('books/delete/' . $book->id); ?>" class="btn btn-sm btn-danger" onclick="return confirm('Yakin hapus?')">Hapus</a>
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
        <div class="mt-4">
            <?php echo $pagination; ?>
        </div>
    <?php endif; ?>
</div>
```

---

## 8. Form View untuk Create/Edit

**File: `application/views/books/form.php`**

```php
<div class="container-fluid py-4">
    <div class="d-flex justify-content-between align-items-center mb-4">
        <h1 class="h3"><?php echo isset($book) ? 'Edit Buku' : 'Tambah Buku'; ?></h1>
        <a href="<?php echo base_url('books'); ?>" class="btn btn-outline-secondary">Kembali</a>
    </div>

    <div class="card">
        <div class="card-body">
            <form method="post" action="<?php echo isset($book) ? base_url('books/update/' . $book->id) : base_url('books/store'); ?>">

                <div class="row">
                    <div class="col-md-8">
                        <div class="mb-3">
                            <label class="form-label">Judul Buku *</label>
                            <input type="text" name="title" class="form-control" value="<?php echo isset($book) ? htmlspecialchars($book->title) : ''; ?>" required>
                        </div>

                        <div class="mb-3">
                            <label class="form-label">Penulis *</label>
                            <input type="text" name="author" class="form-control" value="<?php echo isset($book) ? htmlspecialchars($book->author) : ''; ?>" required>
                        </div>

                        <div class="row">
                            <div class="col-md-6">
                                <div class="mb-3">
                                    <label class="form-label">ISBN</label>
                                    <input type="text" name="isbn" class="form-control" value="<?php echo isset($book) ? htmlspecialchars($book->isbn) : ''; ?>">
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="mb-3">
                                    <label class="form-label">Penerbit</label>
                                    <input type="text" name="publisher" class="form-control" value="<?php echo isset($book) ? htmlspecialchars($book->publisher) : ''; ?>">
                                </div>
                            </div>
                        </div>

                        <div class="row">
                            <div class="col-md-6">
                                <div class="mb-3">
                                    <label class="form-label">Tahun Terbit</label>
                                    <input type="number" name="publication_year" class="form-control" value="<?php echo isset($book) ? $book->publication_year : ''; ?>">
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="mb-3">
                                    <label class="form-label">Kategori</label>
                                    <input type="text" name="category" class="form-control" value="<?php echo isset($book) ? htmlspecialchars($book->category) : ''; ?>" placeholder="Contoh: Programming, Novel, Sejarah">
                                </div>
                            </div>
                        </div>

                        <div class="mb-3">
                            <label class="form-label">Deskripsi</label>
                            <textarea name="description" class="form-control" rows="4"><?php echo isset($book) ? htmlspecialchars($book->description) : ''; ?></textarea>
                        </div>
                    </div>

                    <div class="col-md-4">
                        <div class="mb-3">
                            <label class="form-label">Stok</label>
                            <input type="number" name="stock" class="form-control" value="<?php echo isset($book) ? $book->stock : '0'; ?>" min="0">
                        </div>

                        <?php if ($is_superadmin): ?>
                            <div class="mb-3">
                                <label class="form-label">Cabang *</label>
                                <select name="branch_id" class="form-select" required>
                                    <option value="">Pilih Cabang</option>
                                    <?php foreach ($branches as $branch): ?>
                                        <option value="<?php echo $branch->id; ?>"
                                            <?php echo (isset($book) && $book->branch_id == $branch->id) || (!isset($book) && $user_branch_id == $branch->id) ? 'selected' : ''; ?>>
                                            <?php echo $branch->name; ?>
                                        </option>
                                    <?php endforeach; ?>
                                </select>
                            </div>
                        <?php else: ?>
                            <div class="mb-3">
                                <label class="form-label">Cabang</label>
                                <input type="text" class="form-control" value="<?php echo $current_user->branch_name; ?>" disabled>
                                <input type="hidden" name="branch_id" value="<?php echo $user_branch_id; ?>">
                            </div>
                        <?php endif; ?>
                    </div>
                </div>

                <div class="d-flex gap-2">
                    <button type="submit" class="btn btn-primary">Simpan</button>
                    <a href="<?php echo base_url('books'); ?>" class="btn btn-outline-secondary">Batal</a>
                </div>

            </form>
        </div>
    </div>
</div>
```

---

## 9. Routes Update

**Update `application/config/routes.php`:**

```php
// Book Routes
$route['books'] = 'books/index';
$route['books/create'] = 'books/create';
$route['books/store'] = 'books/store';
$route['books/view/(:num)'] = 'books/view/$1';
$route['books/edit/(:num)'] = 'books/edit/$1';
$route['books/update/(:num)'] = 'books/update/$1';
$route['books/delete/(:num)'] = 'books/delete/$1';
```

---

## 10. Dashboard Controller Sementara

**File: `application/controllers/Dashboard.php`**

```php
<?php
defined('BASEPATH') OR exit('No direct script access allowed');

class Dashboard extends MY_Controller {

    public function __construct() {
        parent::__construct();
        $this->require_auth();
    }

    public function index() {
        $data = array(
            'title' => 'Dashboard'
        );

        $this->add_permission_data($data);

        $this->load->view('templates/header', $data);
        $this->load->view('templates/sidebar', $data);
        $this->load->view('dashboard/index', $data);
        $this->load->view('templates/footer');
    }
}
```

**File: `application/views/dashboard/index.php`**

```php
<div class="container-fluid py-4">
    <h1 class="h3 mb-4">Dashboard</h1>

    <div class="row">
        <div class="col-md-4">
            <div class="card bg-primary text-white">
                <div class="card-body">
                    <h5>Selamat Datang</h5>
                    <p class="mb-0"><?php echo $current_user->full_name; ?></p>
                    <small><?php echo $current_user->role_name; ?> - <?php echo $current_user->branch_name; ?></small>
                </div>
            </div>
        </div>
    </div>

    <div class="mt-4">
        <h5>Permission yang Dimiliki:</h5>
        <div class="row">
            <?php foreach ($user_permissions as $perm): ?>
                <div class="col-md-3 mb-2">
                    <span class="badge bg-secondary"><?php echo $perm; ?></span>
                </div>
            <?php endforeach; ?>
        </div>
    </div>
</div>
```

---

## Ringkasan Part 3

Di part ini kita sudah membangun:

1. **Permission Model** untuk manage permissions
2. **Role Model** dengan method assign permissions
3. **RBAC Service** sebagai service layer untuk checking permission
4. **MY_Controller Update** dengan:
   - `has_permission()` - cek permission
   - `require_permission()` - enforce permission
   - `can_access_branch()` - cek akses cabang
   - `get_branch_filter()` - filter data berdasarkan cabang
   - `add_permission_data()` - inject permission data ke view

5. **Books Controller** dengan RBAC penuh:
   - Cek permission di setiap method
   - Isolasi data berdasarkan cabang
   - Superadmin bypass semua restriction

6. **View Update** dengan:
   - Tombol create/edit/delete muncul sesuai permission
   - Filter cabang hanya untuk superadmin
   - Info permission di dashboard

Sistem RBAC sekarang:

- User login -> dapat role -> dapat permissions dari role
- Setiap request dicek permission-nya
- Data difilter berdasarkan cabang user
- Superadmin bypass semua

Di Part 4, kita akan membangun UI dinamis dengan menu yang muncul/hilang berdasarkan permission.

---

## Troubleshooting

**Permission tidak terdeteksi**
Cek database tabel `role_permissions`, pastikan role user punya permission yang dicek.

**User bisa akses cabang lain**
Pastikan `require_branch_access()` dipanggil di method yang mengakses data cabang.

**Superadmin tidak bypass**
Cek `is_superadmin()` method, pastika role_id 1 adalah Superadmin.
