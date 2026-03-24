---
title: "Part 5: Manajemen RBAC untuk Admin"
date: "Mar 25, 2026"
description: "Manajemen RBAC"
---

**Seri Tutorial: Membangun Aplikasi Perpustakaan Multi-Cabang dengan CodeIgniter 3**

---

## Pendahuluan

Di Part 5 ini, kita membangun fitur manajemen RBAC lengkap untuk Admin. Admin bisa membuat role baru, mengatur permission untuk setiap role, dan melihat siapa saja yang punya role tertentu.

---

## 1. Roles Controller

**File: `application/controllers/Roles.php`**

```php
<?php
defined('BASEPATH') OR exit('No direct script access allowed');

class Roles extends MY_Controller {

    public function __construct() {
        parent::__construct();
        $this->require_auth();
        $this->require_permission('role_view');

        $this->load->model('role_model');
        $this->load->model('permission_model');
        $this->load->helper('filter');
    }

    /**
     * List roles
     */
    public function index() {
        $page = (int) $this->input->get('page') ?: 1;
        if ($page < 1) $page = 1;

        // Get all roles dengan count
        $roles = $this->role_model->get_all_with_count();

        $data = array(
            'title' => 'Manajemen Role',
            'roles' => $roles,
            'can_create' => $this->has_permission('role_create'),
            'can_edit' => $this->has_permission('role_edit'),
            'can_delete' => $this->has_permission('role_delete'),
            'can_assign' => $this->has_permission('role_assign_permission')
        );

        $this->add_permission_data($data);

        $this->load->view('templates/header', $data);
        $this->load->view('templates/sidebar', $data);
        $this->load->view('roles/index', $data);
        $this->load->view('templates/footer');
    }

    /**
     * Form create role
     */
    public function create() {
        $this->require_permission('role_create');

        $data = array(
            'title' => 'Tambah Role',
            'permissions' => $this->permission_model->get_grouped_by_module()
        );

        $this->add_permission_data($data);

        $this->load->view('templates/header', $data);
        $this->load->view('templates/sidebar', $data);
        $this->load->view('roles/form', $data);
        $this->load->view('templates/footer');
    }

    /**
     * Store new role
     */
    public function store() {
        $this->require_permission('role_create');

        $this->load->library('form_validation');
        $this->form_validation->set_rules('name', 'Nama Role', 'required|is_unique[roles.name]');
        $this->form_validation->set_rules('description', 'Deskripsi', 'trim');

        if ($this->form_validation->run() == FALSE) {
            $this->create();
            return;
        }

        $role_data = array(
            'name' => $this->input->post('name'),
            'description' => $this->input->post('description'),
            'is_active' => 1
        );

        $role_id = $this->role_model->insert($role_data);

        if ($role_id) {
            // Assign permissions jika ada
            $permissions = $this->input->post('permissions');
            if (!empty($permissions)) {
                $this->role_model->assign_permissions($role_id, $permissions);
            }

            $this->session->set_flashdata('success', 'Role berhasil dibuat.');
            redirect('roles');
        } else {
            $this->session->set_flashdata('error', 'Gagal membuat role.');
            redirect('roles/create');
        }
    }

    /**
     * Form edit role
     */
    public function edit($id) {
        $this->require_permission('role_edit');

        // Prevent edit superadmin (role_id = 1)
        if ($id == 1) {
            $this->session->set_flashdata('error', 'Role Superadmin tidak bisa diedit.');
            redirect('roles');
        }

        $role = $this->role_model->get_with_permissions($id);

        if (!$role) {
            show_404();
        }

        $data = array(
            'title' => 'Edit Role',
            'role' => $role,
            'permissions' => $this->permission_model->get_grouped_by_module(),
            'role_permissions' => $role->permission_names
        );

        $this->add_permission_data($data);

        $this->load->view('templates/header', $data);
        $this->load->view('templates/sidebar', $data);
        $this->load->view('roles/form', $data);
        $this->load->view('templates/footer');
    }

    /**
     * Update role
     */
    public function update($id) {
        $this->require_permission('role_edit');

        // Prevent edit superadmin
        if ($id == 1) {
            $this->session->set_flashdata('error', 'Role Superadmin tidak bisa diedit.');
            redirect('roles');
        }

        $role = $this->role_model->get_by_id($id);
        if (!$role) {
            show_404();
        }

        $this->load->library('form_validation');
        $this->form_validation->set_rules('name', 'Nama Role', 'required');

        if ($this->form_validation->run() == FALSE) {
            $this->edit($id);
            return;
        }

        $role_data = array(
            'name' => $this->input->post('name'),
            'description' => $this->input->post('description'),
            'is_active' => $this->input->post('is_active') ? 1 : 0
        );

        if ($this->role_model->update($id, $role_data)) {
            // Update permissions
            $permissions = $this->input->post('permissions');
            $this->role_model->assign_permissions($id, $permissions ?: array());

            $this->session->set_flashdata('success', 'Role berhasil diupdate.');
            redirect('roles');
        } else {
            $this->session->set_flashdata('error', 'Gagal mengupdate role.');
            redirect('roles/edit/' . $id);
        }
    }

    /**
     * Delete role
     */
    public function delete($id) {
        $this->require_permission('role_delete');

        // Prevent delete superadmin
        if ($id == 1) {
            $this->session->set_flashdata('error', 'Role Superadmin tidak bisa dihapus.');
            redirect('roles');
        }

        $role = $this->role_model->get_by_id($id);
        if (!$role) {
            show_404();
        }

        // Cek apakah role masih dipakai user
        if ($role->user_count > 0) {
            $this->session->set_flashdata('error', 'Role masih digunakan oleh ' . $role->user_count . ' user. Tidak bisa dihapus.');
            redirect('roles');
        }

        if ($this->role_model->delete($id, TRUE)) { // Force delete
            $this->session->set_flashdata('success', 'Role berhasil dihapus.');
        } else {
            $this->session->set_flashdata('error', 'Gagal menghapus role.');
        }

        redirect('roles');
    }

    /**
     * Assign permissions page
     */
    public function permissions($role_id = NULL) {
        $this->require_permission('role_assign_permission');

        if ($role_id) {
            // Single role permission assignment
            $role = $this->role_model->get_with_permissions($role_id);

            if (!$role) {
                show_404();
            }

            $data = array(
                'title' => 'Atur Permission: ' . $role->name,
                'role' => $role,
                'permissions' => $this->permission_model->get_grouped_by_module(),
                'role_permissions' => $role->permission_names,
                'single_mode' => TRUE
            );
        } else {
            // List all roles for selection
            $data = array(
                'title' => 'Assign Permissions',
                'roles' => $this->role_model->get_all(),
                'single_mode' => FALSE
            );
        }

        $this->add_permission_data($data);

        $this->load->view('templates/header', $data);
        $this->load->view('templates/sidebar', $data);
        $this->load->view('roles/permissions', $data);
        $this->load->view('templates/footer');
    }

    /**
     * Save permissions assignment
     */
    public function save_permissions($role_id) {
        $this->require_permission('role_assign_permission');

        // Prevent modify superadmin permissions
        if ($role_id == 1) {
            $this->session->set_flashdata('error', 'Permission Superadmin tidak bisa diubah.');
            redirect('roles');
        }

        $permissions = $this->input->post('permissions');

        if ($this->role_model->assign_permissions($role_id, $permissions ?: array())) {
            $this->session->set_flashdata('success', 'Permission berhasil diupdate.');
        } else {
            $this->session->set_flashdata('error', 'Gagal mengupdate permission.');
        }

        redirect('roles/permissions/' . $role_id);
    }
}
```

---

## 2. View List Roles

**File: `application/views/roles/index.php`**

```php
<div class="container-fluid">
    <div class="d-flex justify-content-between align-items-center mb-4">
        <h4 class="mb-0">Manajemen Role</h4>
        <?php if ($can_create): ?>
            <a href="<?php echo base_url('roles/create'); ?>" class="btn btn-primary">
                <i class="bi bi-plus-lg"></i> Tambah Role
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

    <div class="card">
        <div class="table-responsive">
            <table class="table table-hover mb-0">
                <thead class="table-light">
                    <tr>
                        <th width="5%">No</th>
                        <th>Nama Role</th>
                        <th>Deskripsi</th>
                        <th class="text-center">Permission</th>
                        <th class="text-center">User</th>
                        <th class="text-center">Status</th>
                        <th width="20%" class="text-center">Aksi</th>
                    </tr>
                </thead>
                <tbody>
                    <?php if (empty($roles)): ?>
                        <tr>
                            <td colspan="7" class="text-center py-4 text-muted">
                                <i class="bi bi-inbox fs-1 d-block mb-2"></i>
                                Tidak ada data role
                            </td>
                        </tr>
                    <?php else: ?>
                        <?php $no = 1; ?>
                        <?php foreach ($roles as $role): ?>
                            <tr>
                                <td><?php echo $no++; ?></td>
                                <td>
                                    <strong><?php echo $role->name; ?></strong>
                                    <?php if ($role->id == 1): ?>
                                        <span class="badge bg-danger ms-1">Protected</span>
                                    <?php endif; ?>
                                </td>
                                <td><?php echo $role->description; ?></td>
                                <td class="text-center">
                                    <span class="badge bg-info"><?php echo $role->permission_count; ?></span>
                                </td>
                                <td class="text-center">
                                    <span class="badge bg-secondary"><?php echo $role->user_count; ?></span>
                                </td>
                                <td class="text-center">
                                    <?php echo status_badge($role->is_active); ?>
                                </td>
                                <td class="text-center">
                                    <?php if ($can_assign): ?>
                                        <a href="<?php echo base_url('roles/permissions/' . $role->id); ?>"
                                           class="btn btn-sm btn-info"
                                           title="Atur Permission">
                                            <i class="bi bi-key"></i>
                                        </a>
                                    <?php endif; ?>

                                    <?php if ($can_edit && $role->id != 1): ?>
                                        <a href="<?php echo base_url('roles/edit/' . $role->id); ?>"
                                           class="btn btn-sm btn-warning"
                                           title="Edit">
                                            <i class="bi bi-pencil"></i>
                                        </a>
                                    <?php endif; ?>

                                    <?php if ($can_delete && $role->id != 1 && $role->user_count == 0): ?>
                                        <a href="<?php echo base_url('roles/delete/' . $role->id); ?>"
                                           class="btn btn-sm btn-danger"
                                           title="Hapus"
                                           onclick="return confirm('Yakin hapus role ini?')">
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

    <div class="alert alert-info mt-4">
        <h6><i class="bi bi-info-circle"></i> Informasi</h6>
        <ul class="mb-0">
            <li>Role <strong>Superadmin</strong> tidak bisa diedit atau dihapus karena adalah role sistem.</li>
            <li>Role yang masih memiliki user tidak bisa dihapus.</li>
            <li>Permission diatur melalui tombol <i class="bi bi-key"></i>.</li>
        </ul>
    </div>
</div>
```

---

## 3. View Form Role (Create/Edit)

**File: `application/views/roles/form.php`**

```php
<div class="container-fluid">
    <div class="d-flex justify-content-between align-items-center mb-4">
        <h4 class="mb-0"><?php echo isset($role) ? 'Edit Role' : 'Tambah Role'; ?></h4>
        <a href="<?php echo base_url('roles'); ?>" class="btn btn-outline-secondary">
            <i class="bi bi-arrow-left"></i> Kembali
        </a>
    </div>

    <div class="row">
        <div class="col-md-4">
            <div class="card">
                <div class="card-header bg-white">
                    <h6 class="mb-0">Informasi Role</h6>
                </div>
                <div class="card-body">
                    <form method="post"
                          action="<?php echo isset($role) ? base_url('roles/update/' . $role->id) : base_url('roles/store'); ?>">

                        <div class="mb-3">
                            <label class="form-label">Nama Role <span class="text-danger">*</span></label>
                            <input type="text"
                                   name="name"
                                   class="form-control"
                                   value="<?php echo isset($role) ? htmlspecialchars($role->name) : ''; ?>"
                                   required
                                   <?php echo (isset($role) && $role->id == 1) ? 'disabled' : ''; ?>>
                            <?php if (isset($role) && $role->id == 1): ?>
                                <small class="text-muted">Nama Superadmin tidak bisa diubah.</small>
                            <?php endif; ?>
                        </div>

                        <div class="mb-3">
                            <label class="form-label">Deskripsi</label>
                            <textarea name="description" class="form-control" rows="3"><?php echo isset($role) ? htmlspecialchars($role->description) : ''; ?></textarea>
                        </div>

                        <?php if (isset($role)): ?>
                            <div class="mb-3">
                                <div class="form-check form-switch">
                                    <input type="checkbox"
                                           class="form-check-input"
                                           id="is_active"
                                           name="is_active"
                                           value="1"
                                           <?php echo $role->is_active ? 'checked' : ''; ?>
                                           <?php echo $role->id == 1 ? 'disabled' : ''; ?>>
                                    <label class="form-check-label" for="is_active">Role Aktif</label>
                                </div>
                            </div>
                        <?php endif; ?>

                        <div class="d-flex gap-2">
                            <button type="submit" class="btn btn-primary">
                                <i class="bi bi-check-lg"></i> Simpan
                            </button>
                            <a href="<?php echo base_url('roles'); ?>" class="btn btn-outline-secondary">Batal</a>
                        </div>

                    </form>
                </div>
            </div>
        </div>

        <div class="col-md-8">
            <div class="card">
                <div class="card-header bg-white d-flex justify-content-between align-items-center">
                    <h6 class="mb-0">Atur Permission</h6>
                    <div class="form-check">
                        <input type="checkbox" class="form-check-input" id="selectAll">
                        <label class="form-check-label" for="selectAll">Pilih Semua</label>
                    </div>
                </div>
                <div class="card-body">
                    <form method="post"
                          action="<?php echo isset($role) ? base_url('roles/save_permissions/' . $role->id) : '#'; ?>"
                          id="permissionForm">

                        <div class="row">
                            <?php foreach ($permissions as $module => $perms): ?>
                                <div class="col-md-6 mb-4">
                                    <div class="card border">
                                        <div class="card-header bg-light">
                                            <h6 class="mb-0 text-capitalize"><?php echo $module; ?></h6>
                                        </div>
                                        <div class="card-body">
                                            <?php foreach ($perms as $perm): ?>
                                                <div class="form-check mb-2">
                                                    <input type="checkbox"
                                                           class="form-check-input permission-checkbox"
                                                           name="permissions[]"
                                                           value="<?php echo $perm->id; ?>"
                                                           id="perm_<?php echo $perm->id; ?>"
                                                           <?php echo (isset($role_permissions) && in_array($perm->name, $role_permissions)) ? 'checked' : ''; ?>
                                                           <?php echo (isset($role) && $role->id == 1) ? 'disabled' : ''; ?>>
                                                    <label class="form-check-label" for="perm_<?php echo $perm->id; ?>">
                                                        <?php echo $perm->description ?: $perm->name; ?>
                                                        <br>
                                                        <small class="text-muted"><?php echo $perm->name; ?></small>
                                                    </label>
                                                </div>
                                            <?php endforeach; ?>
                                        </div>
                                    </div>
                                </div>
                            <?php endforeach; ?>
                        </div>

                        <div class="d-flex gap-2">
                            <button type="submit" class="btn btn-primary"
                                    <?php echo (isset($role) && $role->id == 1) ? 'disabled' : ''; ?>>
                                <i class="bi bi-check-lg"></i> Simpan Permission
                            </button>
                        </div>

                    </form>
                </div>
            </div>
        </div>
    </div>
</div>

<script>
document.getElementById('selectAll').addEventListener('change', function() {
    const checkboxes = document.querySelectorAll('.permission-checkbox:not(:disabled)');
    checkboxes.forEach(function(checkbox) {
        checkbox.checked = this.checked;
    }, this);
});
</script>
```

---

## 4. View Assign Permissions

**File: `application/views/roles/permissions.php`**

```php
<div class="container-fluid">
    <div class="d-flex justify-content-between align-items-center mb-4">
        <h4 class="mb-0"><?php echo $single_mode ? 'Atur Permission: ' . $role->name : 'Assign Permissions'; ?></h4>
        <a href="<?php echo base_url('roles'); ?>" class="btn btn-outline-secondary">
            <i class="bi bi-arrow-left"></i> Kembali
        </a>
    </div>

    <?php if (!$single_mode): ?>
        <!-- Mode: Pilih Role -->
        <div class="card">
            <div class="card-header bg-white">
                <h6 class="mb-0">Pilih Role untuk Diatur Permission-nya</h6>
            </div>
            <div class="card-body">
                <div class="row">
                    <?php foreach ($roles as $r): ?>
                        <div class="col-md-4 mb-3">
                            <div class="card h-100">
                                <div class="card-body">
                                    <h5 class="card-title"><?php echo $r->name; ?></h5>
                                    <p class="card-text small text-muted"><?php echo $r->description; ?></p>
                                    <a href="<?php echo base_url('roles/permissions/' . $r->id); ?>"
                                       class="btn btn-primary btn-sm">
                                        <i class="bi bi-key"></i> Atur Permission
                                    </a>
                                </div>
                            </div>
                        </div>
                    <?php endforeach; ?>
                </div>
            </div>
        </div>
    <?php else: ?>
        <!-- Mode: Atur Permission -->
        <div class="card">
            <div class="card-header bg-white d-flex justify-content-between align-items-center">
                <h6 class="mb-0">Permission untuk Role <?php echo $role->name; ?></h6>
                <div class="form-check">
                    <input type="checkbox" class="form-check-input" id="selectAll">
                    <label class="form-check-label" for="selectAll">Pilih Semua</label>
                </div>
            </div>
            <div class="card-body">
                <form method="post" action="<?php echo base_url('roles/save_permissions/' . $role->id); ?>">

                    <div class="row">
                        <?php foreach ($permissions as $module => $perms): ?>
                            <div class="col-md-6 col-lg-4 mb-4">
                                <div class="card border h-100">
                                    <div class="card-header bg-light d-flex justify-content-between align-items-center">
                                        <h6 class="mb-0 text-capitalize"><?php echo $module; ?></h6>
                                        <input type="checkbox"
                                               class="form-check-input select-module"
                                               data-module="<?php echo $module; ?>">
                                    </div>
                                    <div class="card-body">
                                        <?php foreach ($perms as $perm): ?>
                                            <div class="form-check mb-2">
                                                <input type="checkbox"
                                                       class="form-check-input permission-check"
                                                       name="permissions[]"
                                                       value="<?php echo $perm->id; ?>"
                                                       id="perm_<?php echo $perm->id; ?>"
                                                       data-module="<?php echo $module; ?>"
                                                       <?php echo in_array($perm->name, $role_permissions) ? 'checked' : ''; ?>
                                                       <?php echo $role->id == 1 ? 'disabled' : ''; ?>>
                                                <label class="form-check-label" for="perm_<?php echo $perm->id; ?>">
                                                    <?php echo $perm->description ?: $perm->name; ?>
                                                    <br>
                                                    <small class="text-muted font-monospace"><?php echo $perm->name; ?></small>
                                                </label>
                                            </div>
                                        <?php endforeach; ?>
                                    </div>
                                </div>
                            </div>
                        <?php endforeach; ?>
                    </div>

                    <div class="d-flex gap-2">
                        <button type="submit" class="btn btn-primary"
                                <?php echo $role->id == 1 ? 'disabled' : ''; ?>>
                            <i class="bi bi-check-lg"></i> Simpan Permission
                        </button>
                        <a href="<?php echo base_url('roles'); ?>" class="btn btn-outline-secondary">Batal</a>
                    </div>

                </form>
            </div>
        </div>

        <?php if ($role->id == 1): ?>
            <div class="alert alert-warning mt-4">
                <i class="bi bi-exclamation-triangle"></i>
                <strong>Superadmin</strong> memiliki semua permission secara otomatis. Tidak perlu diatur.
            </div>
        <?php endif; ?>
    <?php endif; ?>
</div>

<script>
// Select all
document.getElementById('selectAll').addEventListener('change', function() {
    const checkboxes = document.querySelectorAll('.permission-check:not(:disabled)');
    checkboxes.forEach(function(checkbox) {
        checkbox.checked = this.checked;
    }, this);
});

// Select module
document.querySelectorAll('.select-module').forEach(function(checkbox) {
    checkbox.addEventListener('change', function() {
        const module = this.dataset.module;
        const moduleChecks = document.querySelectorAll('.permission-check[data-module="' + module + '"]:not(:disabled)');
        moduleChecks.forEach(function(check) {
            check.checked = this.checked;
        }, this);
    });
});
</script>
```

---

## 5. Routes Update

**Update `application/config/routes.php`:**

```php
// Role Routes
$route['roles'] = 'roles/index';
$route['roles/create'] = 'roles/create';
$route['roles/store'] = 'roles/store';
$route['roles/edit/(:num)'] = 'roles/edit/$1';
$route['roles/update/(:num)'] = 'roles/update/$1';
$route['roles/delete/(:num)'] = 'roles/delete/$1';
$route['roles/permissions'] = 'roles/permissions';
$route['roles/permissions/(:num)'] = 'roles/permissions/$1';
$route['roles/save_permissions/(:num)'] = 'roles/save_permissions/$1';
```

---

## 6. Permission Seeder (Tambahan)

Jika perlu menambah permission baru, gunakan SQL ini:

```sql
-- Tambah permission baru jika diperlukan
INSERT INTO permissions (name, description, module) VALUES
-- Role Management tambahan
('role_view', 'Melihat daftar role', 'role'),
('role_create', 'Membuat role baru', 'role'),
('role_edit', 'Mengedit role', 'role'),
('role_delete', 'Menghapus role', 'role'),
('role_assign_permission', 'Mengatur permission role', 'role')

-- ON DUPLICATE KEY UPDATE untuk MySQL (jika sudah ada)
ON DUPLICATE KEY UPDATE description=VALUES(description), module=VALUES(module);
```

---

## Ringkasan Part 5

Di part ini kita sudah membangun:

1. **Roles Controller** dengan fitur:
   - List roles dengan count permission dan user
   - Create role dengan assign permission
   - Edit role dengan update permission
   - Delete role (dengan protection untuk superadmin dan role yang punya user)
   - Dedicated permission assignment page

2. **View List Roles** - Tabel dengan info permission count, user count, status

3. **View Form Role** - Form role + checkbox permission grouped by module

4. **View Assign Permissions** - Dedicated page untuk atur permission dengan:
   - Select all checkbox
   - Select by module
   - Visual grouping by module

5. **Protection**:
   - Superadmin (role_id = 1) tidak bisa diedit/dihapus
   - Role yang masih punya user tidak bisa dihapus
   - Permission superadmin tidak bisa diubah

Di Part 6, kita akan menggabungkan semua fitur untuk implementasi akhir CRUD Buku dengan isolasi data multi-cabang, filter, sort, pagination, dan RBAC lengkap.

---

## Troubleshooting

**Permission tidak tersimpan**
Cek form method dan action URL. Pastikan checkbox name adalah `permissions[]`.

**Role superadmin terhapus**
Cek validasi di controller, seharusnya ada pengecekan `if ($id == 1)` sebelum delete.

**Module permission tidak muncul**
Pastikan `get_grouped_by_module()` di Permission_model mengembalikan array yang benar.
