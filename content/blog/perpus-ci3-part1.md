---
title: "Aplikasi Perpus CI 3 - Part 1: Setup Awal, Perancangan Database, dan Sistem Otentikasi"
date: "Mar 25, 2026"
description: "Setup projek CI 3 dan database"
---

**Seri Tutorial: Membangun Aplikasi Perpustakaan Multi-Cabang dengan CodeIgniter 3**

---

## Pendahuluan

Halo! Aku akan menemanimu membangun aplikasi perpustakaan enterprise-grade. Di part pertama ini, kita akan memulai dari nol: setup project, merancang database yang scalable, dan membangun sistem otentikasi yang aman.

Targetku sederhana: di akhir part ini, kamu punya aplikasi CI3 yang bisa login dan register dengan struktur database siap untuk fitur-fitur kompleks nanti.

---

## 1. Setup Project CodeIgniter 3

### Download dan Konfigurasi Dasar

1. Download CI3 dari [codeigniter.com](https://codeigniter.com/download) atau clone dari GitHub.
2. Extract ke folder `perpustakaan-multi-cabang/`.
3. Ubah `application/config/config.php`:

```php
$config['base_url'] = 'http://localhost/perpustakaan-multi-cabang/';
$config['index_page'] = '';
$config['uri_protocol'] = 'REQUEST_URI';
```

4. Setup `.htaccess` di root folder untuk menghilangkan `index.php`:

```apache
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ index.php/$1 [L]
```

5. Konfigurasi database di `application/config/database.php`:

```php
$db['default'] = array(
    'dsn'   => '',
    'hostname' => 'localhost',
    'username' => 'root',
    'password' => '',
    'database' => 'perpustakaan_db',
    'dbdriver' => 'mysqli',
    'dbprefix' => '',
    'pconnect' => FALSE,
    'db_debug' => (ENVIRONMENT !== 'production'),
    'cache_on' => FALSE,
    'cachedir' => '',
    'char_set' => 'utf8',
    'dbcollat' => 'utf8_general_ci',
    'swap_pre' => '',
    'encrypt' => FALSE,
    'compress' => FALSE,
    'stricton' => FALSE,
    'failover' => array(),
    'save_queries' => TRUE
);
```

---

## 2. Autoload dan Helper

Ubah `application/config/autoload.php`:

```php
$autoload['packages'] = array();
$autoload['libraries'] = array('database', 'session', 'form_validation', 'encryption');
$autoload['helper'] = array('url', 'form', 'security', 'date');
$autoload['config'] = array();
$autoload['language'] = array();
$autoload['model'] = array();
```

---

## 3. Struktur Folder Application

Buat struktur folder berikut di dalam `application/`:

```
application/
├── config/
├── controllers/
│   └── Auth.php
├── core/
│   └── MY_Controller.php
├── helpers/
├── libraries/
├── models/
│   ├── User_model.php
│   ├── Role_model.php
│   ├── Permission_model.php
│   ├── Branch_model.php
│   └── Book_model.php
├── services/
│   └── Auth_service.php
├── validations/
│   └── Auth_validation.php
├── views/
│   ├── auth/
│   │   ├── login.php
│   │   └── register.php
│   └── templates/
│       ├── header.php
│       └── footer.php
└── ...
```

Struktur ini mengikuti prinsip separation of concerns: controller tetap thin, logika bisnis dipindahkan ke service layer, dan validasi dipisahkan ke folder tersendiri.

---

## 4. Perancangan Database

### Konsep RBAC dan Multi-Cabang

Sebelum menulis SQL, pahami dulu konsepnya:

**RBAC (Role-Based Access Control)** = User punya Role, Role punya Permission. User tidak langsung punya permission, melainkan melalui role.

**Multi-Cabang** = Setiap user terikat ke satu cabang. Data juga terikat ke cabang. Admin bisa lihat semua cabang, user biasa hanya cabangnya sendiri.

### Entity Relationship Diagram (Konseptual)

```
branches (1) ----< (N) users (N) >---- (N) roles
                      |
                      N
                      |
                user_roles (junction)
                      |
                      N
                      |
                roles (1) ----< (N) role_permissions (N) >---- (1) permissions
                      |
                      1
                      |
                branches ----< books
```

### SQL Schema Lengkap

Buat database dan jalankan query berikut:

```sql
-- Buat database
CREATE DATABASE IF NOT EXISTS perpustakaan_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE perpustakaan_db;

-- Tabel Cabang
CREATE TABLE branches (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    address TEXT,
    phone VARCHAR(20),
    email VARCHAR(100),
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL DEFAULT NULL,
    INDEX idx_is_active (is_active)
) ENGINE=InnoDB;

-- Tabel Role
CREATE TABLE roles (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description VARCHAR(255),
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_is_active (is_active)
) ENGINE=InnoDB;

-- Tabel Permission
CREATE TABLE permissions (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description VARCHAR(255),
    module VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_module (module)
) ENGINE=InnoDB;

-- Tabel Role-Permission (Many-to-Many)
CREATE TABLE role_permissions (
    role_id INT UNSIGNED NOT NULL,
    permission_id INT UNSIGNED NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (role_id, permission_id),
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Tabel User
CREATE TABLE users (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    branch_id INT UNSIGNED NOT NULL,
    role_id INT UNSIGNED NOT NULL,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    avatar VARCHAR(255),
    is_active TINYINT(1) DEFAULT 1,
    last_login TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL DEFAULT NULL,
    FOREIGN KEY (branch_id) REFERENCES branches(id),
    FOREIGN KEY (role_id) REFERENCES roles(id),
    INDEX idx_branch_id (branch_id),
    INDEX idx_role_id (role_id),
    INDEX idx_is_active (is_active)
) ENGINE=InnoDB;

-- Tabel Buku
CREATE TABLE books (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    branch_id INT UNSIGNED NOT NULL,
    title VARCHAR(255) NOT NULL,
    author VARCHAR(100),
    isbn VARCHAR(20),
    publisher VARCHAR(100),
    publication_year INT(4),
    category VARCHAR(50),
    description TEXT,
    stock INT DEFAULT 0,
    is_active TINYINT(1) DEFAULT 1,
    created_by INT UNSIGNED,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL DEFAULT NULL,
    FOREIGN KEY (branch_id) REFERENCES branches(id),
    FOREIGN KEY (created_by) REFERENCES users(id),
    INDEX idx_branch_id (branch_id),
    INDEX idx_title (title),
    INDEX idx_is_active (is_active)
) ENGINE=InnoDB;

-- Data Awal (Seeder)

-- Insert Cabang Default
INSERT INTO branches (name, address, phone, email) VALUES
('Cabang Pusat', 'Jl. Sudirman No. 1, Jakarta', '021-1234567', 'pusat@perpustakaan.com'),
('Cabang Bandung', 'Jl. Dago No. 10, Bandung', '022-7654321', 'bandung@perpustakaan.com'),
('Cabang Surabaya', 'Jl. Tunjungan No. 5, Surabaya', '031-9876543', 'surabaya@perpustakaan.com');

-- Insert Roles
INSERT INTO roles (name, description) VALUES
('Superadmin', 'Akses penuh ke seluruh sistem dan semua cabang'),
('Admin Cabang', 'Mengelola data di cabangnya sendiri'),
('Petugas', 'Input dan edit data di cabangnya sendiri'),
('Peminjam', 'Hanya melihat katalog dan pinjam buku');

-- Insert Permissions
INSERT INTO permissions (name, description, module) VALUES
-- User Management
('user_view', 'Melihat daftar user', 'user'),
('user_create', 'Membuat user baru', 'user'),
('user_edit', 'Mengedit user', 'user'),
('user_delete', 'Menghapus user', 'user'),
-- Role Management
('role_view', 'Melihat daftar role', 'role'),
('role_create', 'Membuat role baru', 'role'),
('role_edit', 'Mengedit role', 'role'),
('role_delete', 'Menghapus role', 'role'),
('role_assign_permission', 'Mengatur permission role', 'role'),
-- Branch Management
('branch_view', 'Melihat daftar cabang', 'branch'),
('branch_create', 'Membuat cabang baru', 'branch'),
('branch_edit', 'Mengedit cabang', 'branch'),
('branch_delete', 'Menghapus cabang', 'branch'),
-- Book Management
('book_view', 'Melihat daftar buku', 'book'),
('book_create', 'Membuat buku baru', 'book'),
('book_edit', 'Mengedit buku', 'book'),
('book_delete', 'Menghapus buku', 'book'),
('book_view_all_branch', 'Melihat buku semua cabang', 'book');

-- Assign Permissions ke Roles
-- Superadmin: semua permission
INSERT INTO role_permissions (role_id, permission_id)
SELECT 1, id FROM permissions;

-- Admin Cabang: semua kecuali manage role dan manage branch
INSERT INTO role_permissions (role_id, permission_id) VALUES
(2, 1), (2, 2), (2, 3), (2, 4),  -- user
(2, 13), (2, 14), (2, 15), (2, 16), -- book
(2, 17); -- book_view_all_branch (tapi akan difilter di kode)

-- Petugas: hanya book CRUD di cabang sendiri
INSERT INTO role_permissions (role_id, permission_id) VALUES
(3, 13), (3, 14), (3, 15), (3, 16);

-- Peminjam: hanya view book
INSERT INTO role_permissions (role_id, permission_id) VALUES
(4, 13);

-- Insert User Superadmin Default (password: admin123)
INSERT INTO users (branch_id, role_id, username, email, password_hash, full_name, is_active)
VALUES (1, 1, 'superadmin', 'admin@perpustakaan.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Administrator Pusat', 1);
-- Password di atas adalah hash dari "admin123" menggunakan password_hash() PHP
```

**Catatan Penting:** Password hash di atas adalah contoh. Nanti kita akan generate hash yang valid menggunakan PHP.

---

## 5. Core Model (MY_Model)

Sebelum membuat model spesifik, kita buat base model yang handle operasi CRUD umum dan soft delete.

**File: `application/core/MY_Model.php`**

```php
<?php
defined('BASEPATH') OR exit('No direct script access allowed');

class MY_Model extends CI_Model {

    protected $table = '';
    protected $primary_key = 'id';
    protected $soft_delete = TRUE;
    protected $deleted_field = 'deleted_at';

    public function __construct() {
        parent::__construct();
    }

    /**
     * Get all records with optional soft delete filter
     */
    public function get_all($include_deleted = FALSE) {
        if ($this->soft_delete && !$include_deleted) {
            $this->db->where($this->deleted_field, NULL);
        }
        return $this->db->get($this->table)->result();
    }

    /**
     * Get single record by ID
     */
    public function get_by_id($id, $include_deleted = FALSE) {
        if ($this->soft_delete && !$include_deleted) {
            $this->db->where($this->deleted_field, NULL);
        }
        return $this->db->get_where($this->table, array($this->primary_key => $id))->row();
    }

    /**
     * Insert data
     */
    public function insert($data) {
        $this->db->insert($this->table, $data);
        return $this->db->insert_id();
    }

    /**
     * Update data
     */
    public function update($id, $data) {
        $this->db->where($this->primary_key, $id);
        return $this->db->update($this->table, $data);
    }

    /**
     * Soft delete or hard delete
     */
    public function delete($id, $force = FALSE) {
        if ($this->soft_delete && !$force) {
            return $this->update($id, array($this->deleted_field => date('Y-m-d H:i:s')));
        }
        return $this->db->delete($this->table, array($this->primary_key => $id));
    }

    /**
     * Restore soft deleted record
     */
    public function restore($id) {
        if ($this->soft_delete) {
            return $this->update($id, array($this->deleted_field => NULL));
        }
        return FALSE;
    }

    /**
     * Count all records
     */
    public function count_all($include_deleted = FALSE) {
        if ($this->soft_delete && !$include_deleted) {
            $this->db->where($this->deleted_field, NULL);
        }
        return $this->db->count_all_results($this->table);
    }
}
```

---

## 6. Core Controller (MY_Controller)

Base controller untuk handle autentikasi dan data user yang login.

**File: `application/core/MY_Controller.php`**

```php
<?php
defined('BASEPATH') OR exit('No direct script access allowed');

class MY_Controller extends CI_Controller {

    protected $current_user = NULL;
    protected $user_branch_id = NULL;
    protected $user_role_id = NULL;

    public function __construct() {
        parent::__construct();

        // Load auth service
        $this->load->library('session');
        $this->load->model('user_model');

        // Set current user data jika sudah login
        if ($this->session->userdata('user_id')) {
            $this->current_user = $this->user_model->get_by_id($this->session->userdata('user_id'));
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
    protected function require_permission($permission_name) {
        $this->require_auth();

        // Cek permission (akan diimplementasikan di Part 3)
        if (!$this->has_permission($permission_name)) {
            show_error('Anda tidak memiliki akses ke halaman ini.', 403, 'Akses Ditolak');
        }
    }

    /**
     * Check permission (placeholder untuk Part 3)
     */
    protected function has_permission($permission_name) {
        // Sementara return TRUE untuk superadmin
        if ($this->user_role_id == 1) {
            return TRUE;
        }
        return FALSE;
    }

    /**
     * Get current user data
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
     * Check if user is superadmin
     */
    protected function is_superadmin() {
        return $this->user_role_id == 1;
    }
}
```

---

## 7. Service Layer: Auth Service

Logika bisnis autentikasi dipisahkan ke service layer agar controller tetap clean.

**File: `application/services/Auth_service.php`**

```php
<?php
defined('BASEPATH') OR exit('No direct script access allowed');

class Auth_service {

    protected $CI;

    public function __construct() {
        $this->CI =& get_instance();
        $this->CI->load->model('user_model');
        $this->CI->load->library('session');
        $this->CI->load->helper('security');
    }

    /**
     * Register new user
     */
    public function register($data) {
        // Validasi dasar
        if (empty($data['username']) || empty($data['email']) || empty($data['password'])) {
            return array('success' => FALSE, 'message' => 'Semua field wajib diisi.');
        }

        // Cek username sudah ada
        if ($this->CI->user_model->get_by_username($data['username'])) {
            return array('success' => FALSE, 'message' => 'Username sudah digunakan.');
        }

        // Cek email sudah ada
        if ($this->CI->user_model->get_by_email($data['email'])) {
            return array('success' => FALSE, 'message' => 'Email sudah terdaftar.');
        }

        // Prepare data
        $user_data = array(
            'branch_id' => isset($data['branch_id']) ? $data['branch_id'] : 1,
            'role_id' => isset($data['role_id']) ? $data['role_id'] : 4, // Default: Peminjam
            'username' => $data['username'],
            'email' => $data['email'],
            'password_hash' => password_hash($data['password'], PASSWORD_BCRYPT),
            'full_name' => $data['full_name'],
            'phone' => isset($data['phone']) ? $data['phone'] : NULL,
            'is_active' => 1
        );

        // Insert user
        $user_id = $this->CI->user_model->insert($user_data);

        if ($user_id) {
            return array('success' => TRUE, 'user_id' => $user_id, 'message' => 'Registrasi berhasil.');
        }

        return array('success' => FALSE, 'message' => 'Gagal menyimpan data.');
    }

    /**
     * Login user
     */
    public function login($username_or_email, $password) {
        // Cari user by username atau email
        $user = $this->CI->user_model->get_by_username_or_email($username_or_email);

        if (!$user) {
            return array('success' => FALSE, 'message' => 'Username atau email tidak ditemukan.');
        }

        // Cek password
        if (!password_verify($password, $user->password_hash)) {
            return array('success' => FALSE, 'message' => 'Password salah.');
        }

        // Cek user aktif
        if (!$user->is_active) {
            return array('success' => FALSE, 'message' => 'Akun tidak aktif.');
        }

        // Update last login
        $this->CI->user_model->update($user->id, array('last_login' => date('Y-m-d H:i:s')));

        // Set session
        $session_data = array(
            'user_id' => $user->id,
            'username' => $user->username,
            'full_name' => $user->full_name,
            'role_id' => $user->role_id,
            'branch_id' => $user->branch_id,
            'logged_in' => TRUE
        );

        $this->CI->session->set_userdata($session_data);

        return array('success' => TRUE, 'user' => $user, 'message' => 'Login berhasil.');
    }

    /**
     * Logout user
     */
    public function logout() {
        $this->CI->session->sess_destroy();
        return TRUE;
    }

    /**
     * Check if logged in
     */
    public function is_logged_in() {
        return $this->CI->session->userdata('logged_in') === TRUE;
    }

    /**
     * Get current user ID
     */
    public function get_current_user_id() {
        return $this->CI->session->userdata('user_id');
    }
}
```

---

## 8. Validation Layer

Pisahkan aturan validasi agar bisa reusable.

**File: `application/validations/Auth_validation.php`**

```php
<?php
defined('BASEPATH') OR exit('No direct script access allowed');

class Auth_validation {

    protected $CI;

    public function __construct() {
        $this->CI =& get_instance();
        $this->CI->load->library('form_validation');
    }

    /**
     * Set rules untuk login
     */
    public function set_login_rules() {
        $this->CI->form_validation->set_rules('username', 'Username atau Email', 'required|trim');
        $this->CI->form_validation->set_rules('password', 'Password', 'required');

        return $this->CI->form_validation->run();
    }

    /**
     * Set rules untuk register
     */
    public function set_register_rules() {
        $this->CI->form_validation->set_rules('username', 'Username', 'required|trim|min_length[3]|max_length[20]|is_unique[users.username]');
        $this->CI->form_validation->set_rules('email', 'Email', 'required|trim|valid_email|is_unique[users.email]');
        $this->CI->form_validation->set_rules('password', 'Password', 'required|min_length[6]');
        $this->CI->form_validation->set_rules('password_confirm', 'Konfirmasi Password', 'required|matches[password]');
        $this->CI->form_validation->set_rules('full_name', 'Nama Lengkap', 'required|trim');
        $this->CI->form_validation->set_rules('branch_id', 'Cabang', 'required|integer');

        return $this->CI->form_validation->run();
    }

    /**
     * Get validation errors
     */
    public function get_errors() {
        return validation_errors();
    }
}
```

---

## 9. Model: User Model

**File: `application/models/User_model.php`**

```php
<?php
defined('BASEPATH') OR exit('No direct script access allowed');

class User_model extends MY_Model {

    protected $table = 'users';

    public function __construct() {
        parent::__construct();
    }

    /**
     * Get user by username
     */
    public function get_by_username($username) {
        return $this->db->get_where($this->table, array('username' => $username))->row();
    }

    /**
     * Get user by email
     */
    public function get_by_email($email) {
        return $this->db->get_where($this->table, array('email' => $email))->row();
    }

    /**
     * Get user by username or email
     */
    public function get_by_username_or_email($input) {
        $this->db->where('username', $input);
        $this->db->or_where('email', $input);
        $query = $this->db->get($this->table);
        return $query->row();
    }

    /**
     * Get user dengan join branch dan role
     */
    public function get_with_relations($id) {
        $this->db->select('users.*, branches.name as branch_name, roles.name as role_name');
        $this->db->from($this->table);
        $this->db->join('branches', 'branches.id = users.branch_id', 'left');
        $this->db->join('roles', 'roles.id = users.role_id', 'left');
        $this->db->where('users.id', $id);
        return $this->db->get()->row();
    }

    /**
     * Get all users dengan filter branch (untuk multi-cabang)
     */
    public function get_by_branch($branch_id, $include_deleted = FALSE) {
        $this->db->where('branch_id', $branch_id);
        if ($this->soft_delete && !$include_deleted) {
            $this->db->where($this->deleted_field, NULL);
        }
        return $this->db->get($this->table)->result();
    }
}
```

---

## 10. Controller: Auth

Controller yang thin, hanya handle request/response.

**File: `application/controllers/Auth.php`**

```php
<?php
defined('BASEPATH') OR exit('No direct script access allowed');

class Auth extends CI_Controller {

    private $auth_service;
    private $auth_validation;

    public function __construct() {
        parent::__construct();
        $this->load->service('auth_service');
        $this->load->library('auth_validation');
        $this->auth_service = new Auth_service();
        $this->auth_validation = new Auth_validation();
    }

    /**
     * Halaman Login
     */
    public function login() {
        // Redirect jika sudah login
        if ($this->auth_service->is_logged_in()) {
            redirect('dashboard');
        }

        $data['title'] = 'Login';
        $data['error'] = $this->session->flashdata('error');

        $this->load->view('templates/header', $data);
        $this->load->view('auth/login', $data);
        $this->load->view('templates/footer');
    }

    /**
     * Proses Login
     */
    public function do_login() {
        // Validasi input
        if (!$this->auth_validation->set_login_rules()) {
            $this->session->set_flashdata('error', validation_errors());
            redirect('auth/login');
        }

        $username = $this->input->post('username');
        $password = $this->input->post('password');

        // Proses login via service
        $result = $this->auth_service->login($username, $password);

        if ($result['success']) {
            redirect('dashboard');
        } else {
            $this->session->set_flashdata('error', $result['message']);
            redirect('auth/login');
        }
    }

    /**
     * Halaman Register
     */
    public function register() {
        // Redirect jika sudah login
        if ($this->auth_service->is_logged_in()) {
            redirect('dashboard');
        }

        // Load model untuk dropdown
        $this->load->model('branch_model');

        $data['title'] = 'Register';
        $data['branches'] = $this->branch_model->get_all();
        $data['error'] = $this->session->flashdata('error');

        $this->load->view('templates/header', $data);
        $this->load->view('auth/register', $data);
        $this->load->view('templates/footer');
    }

    /**
     * Proses Register
     */
    public function do_register() {
        // Validasi input
        if (!$this->auth_validation->set_register_rules()) {
            $this->session->set_flashdata('error', validation_errors());
            redirect('auth/register');
        }

        $data = array(
            'username' => $this->input->post('username'),
            'email' => $this->input->post('email'),
            'password' => $this->input->post('password'),
            'full_name' => $this->input->post('full_name'),
            'phone' => $this->input->post('phone'),
            'branch_id' => $this->input->post('branch_id'),
            'role_id' => 4 // Default: Peminjam
        );

        // Proses register via service
        $result = $this->auth_service->register($data);

        if ($result['success']) {
            $this->session->set_flashdata('success', 'Registrasi berhasil. Silakan login.');
            redirect('auth/login');
        } else {
            $this->session->set_flashdata('error', $result['message']);
            redirect('auth/register');
        }
    }

    /**
     * Logout
     */
    public function logout() {
        $this->auth_service->logout();
        redirect('auth/login');
    }
}
```

---

## 11. Model: Branch Model

**File: `application/models/Branch_model.php`**

```php
<?php
defined('BASEPATH') OR exit('No direct script access allowed');

class Branch_model extends MY_Model {

    protected $table = 'branches';

    public function __construct() {
        parent::__construct();
    }

    /**
     * Get active branches only
     */
    public function get_active() {
        return $this->db->get_where($this->table, array('is_active' => 1))->result();
    }
}
```

---

## 12. Views

### Template Header

**File: `application/views/templates/header.php`**

```php
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?php echo isset($title) ? $title . ' - Perpustakaan' : 'Perpustakaan Multi-Cabang'; ?></title>

    <!-- Bootstrap 5 CSS -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">

    <style>
        body {
            background-color: #f8f9fa;
        }
        .auth-container {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .auth-card {
            width: 100%;
            max-width: 400px;
            padding: 2rem;
            background: white;
            border-radius: 10px;
            box-shadow: 0 0 20px rgba(0,0,0,0.1);
        }
        .form-floating {
            margin-bottom: 1rem;
        }
    </style>
</head>
<body>
```

### Template Footer

**File: `application/views/templates/footer.php`**

```php
    <!-- Bootstrap 5 JS Bundle -->
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>
```

### View Login

**File: `application/views/auth/login.php`**

```php
<div class="auth-container">
    <div class="auth-card">
        <h2 class="text-center mb-4">Login</h2>
        <p class="text-center text-muted mb-4">Perpustakaan Multi-Cabang</p>

        <?php if ($error): ?>
            <div class="alert alert-danger"><?php echo $error; ?></div>
        <?php endif; ?>

        <?php if ($this->session->flashdata('success')): ?>
            <div class="alert alert-success"><?php echo $this->session->flashdata('success'); ?></div>
        <?php endif; ?>

        <form action="<?php echo base_url('auth/do_login'); ?>" method="post">
            <div class="form-floating">
                <input type="text" class="form-control" id="username" name="username" placeholder="Username atau Email" required>
                <label for="username">Username atau Email</label>
            </div>

            <div class="form-floating">
                <input type="password" class="form-control" id="password" name="password" placeholder="Password" required>
                <label for="password">Password</label>
            </div>

            <div class="d-grid">
                <button type="submit" class="btn btn-primary btn-lg">Login</button>
            </div>
        </form>

        <div class="text-center mt-3">
            <p>Belum punya akun? <a href="<?php echo base_url('auth/register'); ?>">Daftar disini</a></p>
        </div>

        <div class="mt-4 p-3 bg-light rounded">
            <small class="text-muted">
                <strong>Akun Demo:</strong><br>
                Username: superadmin<br>
                Password: admin123
            </small>
        </div>
    </div>
</div>
```

### View Register

**File: `application/views/auth/register.php`**

```php
<div class="auth-container">
    <div class="auth-card" style="max-width: 500px;">
        <h2 class="text-center mb-4">Register</h2>
        <p class="text-center text-muted mb-4">Buat akun baru</p>

        <?php if ($error): ?>
            <div class="alert alert-danger"><?php echo $error; ?></div>
        <?php endif; ?>

        <form action="<?php echo base_url('auth/do_register'); ?>" method="post">
            <div class="row">
                <div class="col-md-6">
                    <div class="form-floating">
                        <input type="text" class="form-control" id="username" name="username" placeholder="Username" required>
                        <label for="username">Username</label>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="form-floating">
                        <input type="email" class="form-control" id="email" name="email" placeholder="Email" required>
                        <label for="email">Email</label>
                    </div>
                </div>
            </div>

            <div class="row">
                <div class="col-md-6">
                    <div class="form-floating">
                        <input type="password" class="form-control" id="password" name="password" placeholder="Password" required>
                        <label for="password">Password</label>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="form-floating">
                        <input type="password" class="form-control" id="password_confirm" name="password_confirm" placeholder="Konfirmasi Password" required>
                        <label for="password_confirm">Konfirmasi Password</label>
                    </div>
                </div>
            </div>

            <div class="form-floating">
                <input type="text" class="form-control" id="full_name" name="full_name" placeholder="Nama Lengkap" required>
                <label for="full_name">Nama Lengkap</label>
            </div>

            <div class="form-floating">
                <input type="tel" class="form-control" id="phone" name="phone" placeholder="Nomor Telepon">
                <label for="phone">Nomor Telepon</label>
            </div>

            <div class="form-floating">
                <select class="form-select" id="branch_id" name="branch_id" required>
                    <option value="">Pilih Cabang</option>
                    <?php foreach ($branches as $branch): ?>
                        <option value="<?php echo $branch->id; ?>"><?php echo $branch->name; ?></option>
                    <?php endforeach; ?>
                </select>
                <label for="branch_id">Cabang</label>
            </div>

            <div class="d-grid">
                <button type="submit" class="btn btn-primary btn-lg">Daftar</button>
            </div>
        </form>

        <div class="text-center mt-3">
            <p>Sudah punya akun? <a href="<?php echo base_url('auth/login'); ?>">Login disini</a></p>
        </div>
    </div>
</div>
```

---

## 13. Konfigurasi Routes

**File: `application/config/routes.php`**

Tambahkan di bagian akhir sebelum closing PHP tag:

```php
// Auth Routes
$route['login'] = 'auth/login';
$route['register'] = 'auth/register';
$route['logout'] = 'auth/logout';
$route['do_login'] = 'auth/do_login';
$route['do_register'] = 'auth/do_register';

// Default
$route['default_controller'] = 'auth/login';
```

---

## 14. Helper untuk Load Service

CI3 tidak punya method `load->service()` secara default. Kita buat helper.

**File: `application/core/MY_Loader.php`**

```php
<?php
defined('BASEPATH') OR exit('No direct script access allowed');

class MY_Loader extends CI_Loader {

    /**
     * Load service
     */
    public function service($service_name, $params = NULL, $object_name = NULL) {
        $service_name = ucfirst($service_name);
        $class_name = $service_name;

        // Full path
        $service_path = APPPATH . 'services/' . $class_name . '.php';

        if (!file_exists($service_path)) {
            show_error('Service tidak ditemukan: ' . $class_name);
        }

        require_once($service_path);

        if (!class_exists($class_name)) {
            show_error('Class service tidak valid: ' . $class_name);
        }

        // Instantiate
        if ($params !== NULL) {
            $service = new $class_name($params);
        } else {
            $service = new $class_name();
        }

        // Assign to CI object
        if ($object_name === NULL) {
            $object_name = strtolower($service_name);
        }

        $this->_ci_classes[$object_name] = $service_name;
        $CI =& get_instance();
        $CI->$object_name = $service;

        return $this;
    }
}
```

---

## 15. Setup Database untuk Superadmin

Karena password di SQL sebelumnya adalah placeholder, kita perlu generate hash yang valid. Buat file sementara:

**File: `generate_hash.php` (di root folder, hapus setelah pakai)**

```php
<?php
echo password_hash('admin123', PASSWORD_BCRYPT);
// Copy output dan update database manual, atau jalankan ini sekali lalu hapus
```

Jalankan di browser, copy hasilnya, lalu update database:

```sql
UPDATE users SET password_hash = '[HASH_YANG_DIHASILKAN]' WHERE id = 1;
```

---

## 16. Testing

1. Buka `http://localhost/perpustakaan-multi-cabang/`
2. Login dengan superadmin / admin123
3. Coba register user baru
4. Verifikasi data tersimpan di database

---

## Ringkasan Part 1

Di part ini kita sudah:

1. Setup struktur project CI3 dengan arsitektur enterprise-grade (service layer, validation layer, core model/controller)
2. Merancang database yang mendukung RBAC dan multi-cabang
3. Membangun sistem otentikasi lengkap dengan password hashing yang aman
4. Menerapkan prinsip DRY melalui MY_Model dan MY_Controller

**Struktur yang sudah jadi:**

- Database schema lengkap dengan relasi
- Base model dengan soft delete
- Base controller dengan autentikasi
- Service layer untuk logika bisnis
- Validation layer untuk aturan validasi
- Controller thin yang hanya handle request/response

Di Part 2, kita akan membangun sistem filter, sort, dan pagination yang reusable dan universal.

---

## Troubleshooting Umum

**Error: Unable to locate the specified class: Service.php**
Pastikan file `application/core/MY_Loader.php` sudah dibuat dan tidak ada typo.

**Error: Table doesn't exist**
Pastikan database `perpustakaan_db` sudah dibuat dan SQL schema sudah dijalankan.

**Password tidak valid**
Pastikan hash password di database sudah diupdate dengan hash yang valid dari PHP.

**Session tidak persist**
Cek konfigurasi session di `config.php` dan pastikan folder writable.
