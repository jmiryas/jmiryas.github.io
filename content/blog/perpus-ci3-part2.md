---
title: "Part 2: Universal Filter, Multiple Sort, dan Pagination"
date: "Mar 25, 2026"
description: "Filter, sort dan pagination"
---

**Seri Tutorial: Membangun Aplikasi Perpustakaan Multi-Cabang dengan CodeIgniter 3**

---

## Pendahuluan

Di Part 2 ini, kita akan membangun sistem filter, sort, dan pagination yang reusable. Konsepnya mirip Laravel trait "Filterable" tapi dalam bentuk Core Model untuk CI3.

Tujuannya sederhana: satu kode, bisa dipakai di semua model. Tidak ada repetisi di controller atau model turunan.

---

## 1. Konsep Reusable Filter System

### Masalah yang Ingin Kita Selesaikan

Tanpa sistem ini, setiap controller akan punya kode seperti ini:

```php
// Di Controller Buku
if ($this->input->get('title')) {
    $this->db->like('title', $this->input->get('title'));
}
if ($this->input->get('author')) {
    $this->db->like('author', $this->input->get('author'));
}
// ... dan seterusnya untuk setiap field

// Di Controller User - KODE YANG SAMA!
if ($this->input->get('username')) {
    $this->db->like('username', $this->input->get('username'));
}
```

Ini melanggar DRY. Solusi: pusatkan logika filter ke satu tempat.

### Arsitektur Solusi

```
Request (GET params)
    ↓
MY_Model (apply_filters, apply_sort)
    ↓
Model Spesifik (define filterable_fields, sortable_fields)
    ↓
Controller (panggil get_filtered_results())
    ↓
View (tampilkan + pagination links)
```

---

## 2. Update MY_Model dengan Filterable Trait

Kita tambahkan method universal ke MY_Model yang sudah dibuat di Part 1.

**File: `application/core/MY_Model.php` (Update Lengkap)**

```php
<?php
defined('BASEPATH') OR exit('No direct script access allowed');

class MY_Model extends CI_Model {

    protected $table = '';
    protected $primary_key = 'id';
    protected $soft_delete = TRUE;
    protected $deleted_field = 'deleted_at';

    // Konfigurasi filter dan sort
    protected $filterable_fields = array();
    protected $sortable_fields = array();
    protected $default_sort = array('id' => 'DESC');
    protected $per_page = 10;

    public function __construct() {
        parent::__construct();
    }

    // ==================== BASIC CRUD (dari Part 1) ====================

    public function get_all($include_deleted = FALSE) {
        if ($this->soft_delete && !$include_deleted) {
            $this->db->where($this->deleted_field, NULL);
        }
        return $this->db->get($this->table)->result();
    }

    public function get_by_id($id, $include_deleted = FALSE) {
        if ($this->soft_delete && !$include_deleted) {
            $this->db->where($this->deleted_field, NULL);
        }
        return $this->db->get_where($this->table, array($this->primary_key => $id))->row();
    }

    public function insert($data) {
        $this->db->insert($this->table, $data);
        return $this->db->insert_id();
    }

    public function update($id, $data) {
        $this->db->where($this->primary_key, $id);
        return $this->db->update($this->table, $data);
    }

    public function delete($id, $force = FALSE) {
        if ($this->soft_delete && !$force) {
            return $this->update($id, array($this->deleted_field => date('Y-m-d H:i:s')));
        }
        return $this->db->delete($this->table, array($this->primary_key => $id));
    }

    public function restore($id) {
        if ($this->soft_delete) {
            return $this->update($id, array($this->deleted_field => NULL));
        }
        return FALSE;
    }

    public function count_all($include_deleted = FALSE) {
        if ($this->soft_delete && !$include_deleted) {
            $this->db->where($this->deleted_field, NULL);
        }
        return $this->db->count_all_results($this->table);
    }

    // ==================== UNIVERSAL FILTER SYSTEM ====================

    /**
     * Apply filters from GET parameters
     * Format: ?filter[field]=value&filter[another_field]=value
     * atau: ?title=abc&author=def (untuk backward compatibility)
     */
    public function apply_filters($filters = NULL) {
        if ($filters === NULL) {
            $filters = $this->input->get('filter') ?: array();

            // Support format langsung: ?field=value
            foreach ($this->filterable_fields as $field) {
                $value = $this->input->get($field);
                if ($value !== NULL && $value !== '') {
                    $filters[$field] = $value;
                }
            }
        }

        foreach ($filters as $field => $value) {
            if (!in_array($field, $this->filterable_fields)) {
                continue;
            }

            if ($value === '' || $value === NULL) {
                continue;
            }

            // Cek apakah field ada di table
            if (strpos($field, '.') === FALSE) {
                $field = $this->table . '.' . $field;
            }

            // Deteksi tipe filter
            if (is_array($value)) {
                // Range filter: filter[created_at][from]=2024-01-01&filter[created_at][to]=2024-12-31
                if (isset($value['from']) && isset($value['to'])) {
                    $this->db->where($field . ' >=', $value['from']);
                    $this->db->where($field . ' <=', $value['to']);
                }
                // IN filter: filter[status][]=active&filter[status][]=pending
                elseif (isset($value[0])) {
                    $this->db->where_in($field, $value);
                }
            } else {
                // Deteksi operator
                if (strpos($value, '%') !== FALSE) {
                    // LIKE operator
                    $this->db->like($field, str_replace('%', '', $value), 'both');
                } elseif (strpos($value, '>=') === 0) {
                    $this->db->where($field . ' >=', substr($value, 2));
                } elseif (strpos($value, '<=') === 0) {
                    $this->db->where($field . ' <=', substr($value, 2));
                } elseif (strpos($value, '>') === 0) {
                    $this->db->where($field . ' >', substr($value, 1));
                } elseif (strpos($value, '<') === 0) {
                    $this->db->where($field . ' <', substr($value, 1));
                } elseif (strpos($value, '!=') === 0) {
                    $this->db->where($field . ' !=', substr($value, 2));
                } else {
                    // Exact match atau LIKE untuk string
                    if (is_numeric($value)) {
                        $this->db->where($field, $value);
                    } else {
                        $this->db->like($field, $value);
                    }
                }
            }
        }

        return $this;
    }

    /**
     * Apply sorting
     * Format: ?sort[field]=asc&sort[another]=desc
     * atau: ?sort=field&order=asc
     */
    public function apply_sort($sort_params = NULL) {
        if ($sort_params === NULL) {
            $sort_params = $this->input->get('sort') ?: array();

            // Support format: ?sort=field&order=asc
            $sort_field = $this->input->get('sort');
            $sort_order = $this->input->get('order');

            if (is_string($sort_field) && $sort_field !== '') {
                $sort_params = array($sort_field => ($sort_order ?: 'asc'));
            }
        }

        // Jika tidak ada sort parameter, gunakan default
        if (empty($sort_params)) {
            $sort_params = $this->default_sort;
        }

        foreach ($sort_params as $field => $direction) {
            if (!in_array($field, $this->sortable_fields)) {
                continue;
            }

            $direction = strtoupper($direction) === 'DESC' ? 'DESC' : 'ASC';

            // Cek apakah field sudah qualified dengan table
            if (strpos($field, '.') === FALSE) {
                $field = $this->table . '.' . $field;
            }

            $this->db->order_by($field, $direction);
        }

        return $this;
    }

    /**
     * Get filtered results with pagination
     * Return: array dengan data, pagination config, dan total rows
     */
    public function get_filtered_results($page = 1, $per_page = NULL, $additional_where = array()) {
        $per_page = $per_page ?: $this->per_page;
        $offset = ($page - 1) * $per_page;

        // Clone query builder untuk count total
        $this->db->start_cache();

        // Apply soft delete
        if ($this->soft_delete) {
            $this->db->where($this->table . '.' . $this->deleted_field, NULL);
        }

        // Apply additional where (misal: branch_id filter)
        foreach ($additional_where as $key => $value) {
            if (is_array($value)) {
                $this->db->where_in($key, $value);
            } else {
                $this->db->where($key, $value);
            }
        }

        // Apply filters dari GET
        $this->apply_filters();

        $this->db->stop_cache();

        // Count total
        $total_rows = $this->db->count_all_results($this->table);

        // Get data
        $this->apply_sort();
        $this->db->limit($per_page, $offset);
        $query = $this->db->get($this->table);
        $data = $query->result();

        $this->db->flush_cache();

        // Build pagination config
        $pagination_config = $this->build_pagination_config($total_rows, $per_page, $page);

        return array(
            'data' => $data,
            'total_rows' => $total_rows,
            'pagination' => $pagination_config,
            'current_page' => $page,
            'per_page' => $per_page,
            'total_pages' => ceil($total_rows / $per_page)
        );
    }

    /**
     * Build pagination configuration
     */
    protected function build_pagination_config($total_rows, $per_page, $current_page) {
        $this->load->library('pagination');

        // Preserve query string
        $query_string = $_GET;
        unset($query_string['page']); // Hapus param page jika ada

        $suffix = '';
        if (!empty($query_string)) {
            $suffix = '?' . http_build_query($query_string);
        }

        $config = array(
            'base_url' => current_url(),
            'total_rows' => $total_rows,
            'per_page' => $per_page,
            'use_page_numbers' => TRUE,
            'page_query_string' => TRUE,
            'query_string_segment' => 'page',
            'suffix' => $suffix,
            'first_url' => current_url() . ($suffix ? str_replace('?', '&', $suffix) : ''),

            // Bootstrap 5 styling
            'full_tag_open' => '<nav aria-label="Page navigation"><ul class="pagination justify-content-center">',
            'full_tag_close' => '</ul></nav>',
            'first_tag_open' => '<li class="page-item">',
            'first_tag_close' => '</li>',
            'last_tag_open' => '<li class="page-item">',
            'last_tag_close' => '</li>',
            'next_tag_open' => '<li class="page-item">',
            'next_tag_close' => '</li>',
            'prev_tag_open' => '<li class="page-item">',
            'prev_tag_close' => '</li>',
            'num_tag_open' => '<li class="page-item">',
            'num_tag_close' => '</li>',
            'cur_tag_open' => '<li class="page-item active" aria-current="page"><span class="page-link">',
            'cur_tag_close' => '</span></li>',
            'attributes' => array('class' => 'page-link'),

            'first_link' => 'First',
            'last_link' => 'Last',
            'next_link' => 'Next',
            'prev_link' => 'Prev',
        );

        $this->pagination->initialize($config);

        return array(
            'links' => $this->pagination->create_links(),
            'config' => $config
        );
    }

    /**
     * Set filterable fields
     */
    public function set_filterable_fields($fields) {
        $this->filterable_fields = $fields;
        return $this;
    }

    /**
     * Set sortable fields
     */
    public function set_sortable_fields($fields) {
        $this->sortable_fields = $fields;
        return $this;
    }

    /**
     * Get current filter state untuk ditampilkan di view
     */
    public function get_active_filters() {
        $filters = $this->input->get('filter') ?: array();

        foreach ($this->filterable_fields as $field) {
            $value = $this->input->get($field);
            if ($value !== NULL && $value !== '') {
                $filters[$field] = $value;
            }
        }

        return $filters;
    }

    /**
     * Get current sort state
     */
    public function get_active_sort() {
        $sort = $this->input->get('sort');
        $order = $this->input->get('order');

        if (is_array($sort)) {
            return $sort;
        }

        if ($sort) {
            return array($sort => ($order ?: 'asc'));
        }

        return $this->default_sort;
    }

    /**
     * Build sort URL untuk header tabel
     */
    public function build_sort_url($field, $current_sort = NULL) {
        if ($current_sort === NULL) {
            $current_sort = $this->get_active_sort();
        }

        $current_order = isset($current_sort[$field]) ? $current_sort[$field] : NULL;
        $new_order = ($current_order === 'asc') ? 'desc' : 'asc';

        // Build query string
        $params = $_GET;
        $params['sort'] = $field;
        $params['order'] = $new_order;
        unset($params['page']); // Reset ke page 1 saat sort

        return current_url() . '?' . http_build_query($params);
    }

    /**
     * Get sort indicator untuk header tabel
     */
    public function get_sort_indicator($field, $current_sort = NULL) {
        if ($current_sort === NULL) {
            $current_sort = $this->get_active_sort();
        }

        if (!isset($current_sort[$field])) {
            return '';
        }

        return ($current_sort[$field] === 'asc') ? ' ↑' : ' ↓';
    }
}
```

---

## 3. Model Buku dengan Filterable

**File: `application/models/Book_model.php`**

```php
<?php
defined('BASEPATH') OR exit('No direct script access allowed');

class Book_model extends MY_Model {

    protected $table = 'books';

    // Definisi field yang bisa difilter
    protected $filterable_fields = array(
        'title',      // Pencarian judul
        'author',     // Pencarian penulis
        'isbn',       // Pencarian ISBN
        'category',   // Filter kategori
        'branch_id',  // Filter cabang
        'is_active',  // Filter status
        'publication_year' // Filter tahun
    );

    // Definisi field yang bisa disort
    protected $sortable_fields = array(
        'id',
        'title',
        'author',
        'publication_year',
        'stock',
        'created_at'
    );

    protected $default_sort = array('created_at' => 'DESC');

    public function __construct() {
        parent::__construct();
    }

    /**
     * Get books dengan join branch (untuk tampilkan nama cabang)
     */
    public function get_with_branch($book_id = NULL) {
        $this->db->select('books.*, branches.name as branch_name');
        $this->db->from($this->table);
        $this->db->join('branches', 'branches.id = books.branch_id', 'left');

        if ($book_id) {
            $this->db->where('books.id', $book_id);
            return $this->db->get()->row();
        }

        if ($this->soft_delete) {
            $this->db->where('books.' . $this->deleted_field, NULL);
        }

        return $this->db->get()->result();
    }

    /**
     * Get filtered results dengan branch join
     */
    public function get_filtered_with_branch($page = 1, $per_page = NULL, $branch_filter = NULL) {
        $per_page = $per_page ?: $this->per_page;
        $offset = ($page - 1) * $per_page;

        $this->db->start_cache();

        // Select dengan join
        $this->db->select('books.*, branches.name as branch_name');
        $this->db->from($this->table);
        $this->db->join('branches', 'branches.id = books.branch_id', 'left');

        // Soft delete
        if ($this->soft_delete) {
            $this->db->where('books.' . $this->deleted_field, NULL);
        }

        // Branch filter (untuk isolasi data multi-cabang)
        if ($branch_filter !== NULL) {
            if (is_array($branch_filter)) {
                $this->db->where_in('books.branch_id', $branch_filter);
            } else {
                $this->db->where('books.branch_id', $branch_filter);
            }
        }

        // Apply filters
        $this->apply_filters();

        $this->db->stop_cache();

        // Count total
        $total_rows = $this->db->count_all_results();

        // Get data dengan sort dan limit
        $this->apply_sort();
        $this->db->limit($per_page, $offset);
        $query = $this->db->get();
        $data = $query->result();

        $this->db->flush_cache();

        // Build pagination
        $pagination_config = $this->build_pagination_config($total_rows, $per_page, $page);

        return array(
            'data' => $data,
            'total_rows' => $total_rows,
            'pagination' => $pagination_config,
            'current_page' => $page,
            'per_page' => $per_page,
            'total_pages' => ceil($total_rows / $per_page)
        );
    }

    /**
     * Get categories untuk dropdown filter
     */
    public function get_categories() {
        $this->db->distinct();
        $this->db->select('category');
        $this->db->where('category !=', '');
        $this->db->where('category IS NOT NULL', NULL, FALSE);
        if ($this->soft_delete) {
            $this->db->where($this->deleted_field, NULL);
        }
        $result = $this->db->get($this->table)->result();

        $categories = array();
        foreach ($result as $row) {
            $categories[] = $row->category;
        }
        return $categories;
    }
}
```

---

## 4. Helper untuk Filter View

**File: `application/helpers/filter_helper.php`**

```php
<?php
defined('BASEPATH') OR exit('No direct script access allowed');

/**
 * Build filter input text
 */
if (!function_exists('filter_input_text')) {
    function filter_input_text($name, $label, $value = '', $placeholder = '') {
        $html = '<div class="mb-3">';
        $html .= '<label for="filter_' . $name . '" class="form-label">' . $label . '</label>';
        $html .= '<input type="text" class="form-control" id="filter_' . $name . '" name="' . $name . '" value="' . htmlspecialchars($value) . '" placeholder="' . $placeholder . '">';
        $html .= '</div>';
        return $html;
    }
}

/**
 * Build filter dropdown
 */
if (!function_exists('filter_dropdown')) {
    function filter_dropdown($name, $label, $options, $selected = '', $placeholder = 'Semua') {
        $html = '<div class="mb-3">';
        $html .= '<label for="filter_' . $name . '" class="form-label">' . $label . '</label>';
        $html .= '<select class="form-select" id="filter_' . $name . '" name="' . $name . '">';
        $html .= '<option value="">' . $placeholder . '</option>';

        foreach ($options as $value => $text) {
            $is_selected = ($selected == $value) ? ' selected' : '';
            $html .= '<option value="' . $value . '"' . $is_selected . '>' . $text . '</option>';
        }

        $html .= '</select>';
        $html .= '</div>';
        return $html;
    }
}

/**
 * Build filter form open
 */
if (!function_exists('filter_form_open')) {
    function filter_form_open($action = '', $method = 'get') {
        $html = '<form action="' . $action . '" method="' . $method . '" class="filter-form">';
        // Preserve sort params
        $ci =& get_instance();
        $sort = $ci->input->get('sort');
        $order = $ci->input->get('order');

        if ($sort) {
            $html .= '<input type="hidden" name="sort" value="' . htmlspecialchars($sort) . '">';
        }
        if ($order) {
            $html .= '<input type="hidden" name="order" value="' . htmlspecialchars($order) . '">';
        }
        return $html;
    }
}

/**
 * Build filter form close dengan tombol
 */
if (!function_exists('filter_form_close')) {
    function filter_form_close($show_reset = TRUE) {
        $html = '<div class="d-flex gap-2">';
        $html .= '<button type="submit" class="btn btn-primary">Filter</button>';

        if ($show_reset) {
            $html .= '<a href="' . current_url() . '" class="btn btn-outline-secondary">Reset</a>';
        }

        $html .= '</div>';
        $html .= '</form>';
        return $html;
    }
}

/**
 * Build sortable table header
 */
if (!function_exists('sortable_header')) {
    function sortable_header($field, $label, $sort_url, $current_sort = array()) {
        $current_order = isset($current_sort[$field]) ? $current_sort[$field] : NULL;
        $indicator = '';

        if ($current_order === 'asc') {
            $indicator = ' <i class="bi bi-arrow-up"></i>';
        } elseif ($current_order === 'desc') {
            $indicator = ' <i class="bi bi-arrow-down"></i>';
        }

        return '<a href="' . $sort_url . '" class="text-decoration-none text-dark">' . $label . $indicator . '</a>';
    }
}

/**
 * Build pagination info text
 */
if (!function_exists('pagination_info')) {
    function pagination_info($total_rows, $per_page, $current_page) {
        $start = (($current_page - 1) * $per_page) + 1;
        $end = min($start + $per_page - 1, $total_rows);

        if ($total_rows == 0) {
            return 'Tidak ada data';
        }

        return 'Menampilkan ' . $start . ' - ' . $end . ' dari ' . $total_rows . ' data';
    }
}
```

Tambahkan ke autoload:

**Update `application/config/autoload.php`:**

```php
$autoload['helper'] = array('url', 'form', 'security', 'date', 'filter');
```

---

## 5. Controller Buku (Demo Sistem Filter)

**File: `application/controllers/Books.php`**

```php
<?php
defined('BASEPATH') OR exit('No direct script access allowed');

class Books extends MY_Controller {

    public function __construct() {
        parent::__construct();
        $this->require_auth();
        $this->load->model('book_model');
        $this->load->model('branch_model');
        $this->load->helper('filter');
    }

    /**
     * List buku dengan filter, sort, dan pagination
     */
    public function index() {
        // Ambil parameter page
        $page = (int) $this->input->get('page') ?: 1;
        if ($page < 1) $page = 1;

        // Filter cabang berdasarkan role
        $branch_filter = NULL;
        if (!$this->is_superadmin()) {
            // User biasa hanya lihat cabangnya sendiri
            $branch_filter = $this->user_branch_id;
        }

        // Get filtered results
        $result = $this->book_model->get_filtered_with_branch($page, 10, $branch_filter);

        // Data untuk view
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
            'categories' => $this->book_model->get_categories()
        );

        $this->load->view('templates/header', $data);
        $this->load->view('templates/sidebar');
        $this->load->view('books/index', $data);
        $this->load->view('templates/footer');
    }
}
```

---

## 6. View Buku dengan Filter Panel

**File: `application/views/books/index.php`**

```php
<div class="container-fluid py-4">
    <div class="d-flex justify-content-between align-items-center mb-4">
        <h1 class="h3">Daftar Buku</h1>
        <a href="<?php echo base_url('books/create'); ?>" class="btn btn-primary">Tambah Buku</a>
    </div>

    <!-- Filter Panel -->
    <div class="card mb-4">
        <div class="card-header">
            <h5 class="mb-0">Filter Pencarian</h5>
        </div>
        <div class="card-body">
            <div class="row">
                <div class="col-md-3">
                    <?php echo filter_input_text('title', 'Judul Buku', $active_filters['title'] ?? '', 'Cari judul...'); ?>
                </div>
                <div class="col-md-3">
                    <?php echo filter_input_text('author', 'Penulis', $active_filters['author'] ?? '', 'Cari penulis...'); ?>
                </div>
                <div class="col-md-2">
                    <?php
                    $cat_options = array();
                    foreach ($categories as $cat) {
                        $cat_options[$cat] = $cat;
                    }
                    echo filter_dropdown('category', 'Kategori', $cat_options, $active_filters['category'] ?? '');
                    ?>
                </div>
                <div class="col-md-2">
                    <?php echo filter_input_text('publication_year', 'Tahun Terbit', $active_filters['publication_year'] ?? '', 'Contoh: 2020'); ?>
                </div>

                <?php if ($this->session->userdata('role_id') == 1): ?>
                <div class="col-md-2">
                    <?php
                    $branch_options = array();
                    foreach ($branches as $branch) {
                        $branch_options[$branch->id] = $branch->name;
                    }
                    echo filter_dropdown('branch_id', 'Cabang', $branch_options, $active_filters['branch_id'] ?? '');
                    ?>
                </div>
                <?php endif; ?>
            </div>

            <div class="row mt-3">
                <div class="col-12">
                    <button type="submit" class="btn btn-primary">Terapkan Filter</button>
                    <a href="<?php echo current_url(); ?>" class="btn btn-outline-secondary">Reset Filter</a>
                </div>
            </div>
        </div>
    </div>

    <!-- Info dan Pagination -->
    <div class="d-flex justify-content-between align-items-center mb-3">
        <p class="text-muted mb-0"><?php echo $pagination_info; ?></p>
        <?php if (!empty($active_filters)): ?>
            <span class="badge bg-info">Filter Aktif</span>
        <?php endif; ?>
    </div>

    <!-- Table -->
    <div class="card">
        <div class="table-responsive">
            <table class="table table-striped table-hover mb-0">
                <thead class="table-dark">
                    <tr>
                        <th width="5%">No</th>
                        <th>
                            <?php
                            $sort_url = $this->book_model->build_sort_url('title', $active_sort);
                            echo sortable_header('title', 'Judul', $sort_url, $active_sort);
                            ?>
                        </th>
                        <th>
                            <?php
                            $sort_url = $this->book_model->build_sort_url('author', $active_sort);
                            echo sortable_header('author', 'Penulis', $sort_url, $active_sort);
                            ?>
                        </th>
                        <th>ISBN</th>
                        <th>
                            <?php
                            $sort_url = $this->book_model->build_sort_url('category', $active_sort);
                            echo sortable_header('category', 'Kategori', $sort_url, $active_sort);
                            ?>
                        </th>
                        <th>
                            <?php
                            $sort_url = $this->book_model->build_sort_url('publication_year', $active_sort);
                            echo sortable_header('publication_year', 'Tahun', $sort_url, $active_sort);
                            ?>
                        </th>
                        <th>
                            <?php
                            $sort_url = $this->book_model->build_sort_url('stock', $active_sort);
                            echo sortable_header('stock', 'Stok', $sort_url, $active_sort);
                            ?>
                        </th>
                        <th>Cabang</th>
                        <th width="15%">Aksi</th>
                    </tr>
                </thead>
                <tbody>
                    <?php if (empty($books)): ?>
                        <tr>
                            <td colspan="9" class="text-center py-4">Tidak ada data buku</td>
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
                                <td><?php echo $book->branch_name; ?></td>
                                <td>
                                    <a href="<?php echo base_url('books/view/' . $book->id); ?>" class="btn btn-sm btn-info">Detail</a>
                                    <a href="<?php echo base_url('books/edit/' . $book->id); ?>" class="btn btn-sm btn-warning">Edit</a>
                                    <a href="<?php echo base_url('books/delete/' . $book->id); ?>" class="btn btn-sm btn-danger" onclick="return confirm('Yakin hapus?')">Hapus</a>
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

## 7. Template Sidebar (Sementara)

**File: `application/views/templates/sidebar.php`**

```php
<div class="d-flex">
    <nav class="bg-dark text-white" style="width: 250px; min-height: 100vh;">
        <div class="p-3">
            <h4 class="mb-4">Perpustakaan</h4>
            <ul class="nav flex-column">
                <li class="nav-item mb-2">
                    <a class="nav-link text-white" href="<?php echo base_url('dashboard'); ?>">Dashboard</a>
                </li>
                <li class="nav-item mb-2">
                    <a class="nav-link text-white active" href="<?php echo base_url('books'); ?>">Buku</a>
                </li>
                <li class="nav-item mb-2">
                    <a class="nav-link text-white" href="<?php echo base_url('auth/logout'); ?>">Logout</a>
                </li>
            </ul>
        </div>
    </nav>
    <main class="flex-grow-1">
```

Update footer untuk nutup tag:

**Update `application/views/templates/footer.php`:**

```php
    </main>
</div>
    <!-- Bootstrap 5 JS Bundle -->
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>
```

---

## 8. Routes untuk Books

**Update `application/config/routes.php`:**

```php
// Book Routes
$route['books'] = 'books/index';
$route['books/page/(:num)'] = 'books/index/$1';
```

---

## 9. Testing Sistem Filter

Setelah setup selesai, test dengan URL berikut:

```
// Filter sederhana
http://localhost/perpustakaan-multi-cabang/books?title=php

// Multiple filter
http://localhost/perpustakaan-multi-cabang/books?title=php&author=john&category=Programming

// Filter + Sort
http://localhost/perpustakaan-multi-cabang/books?title=php&sort=publication_year&order=desc

// Filter + Sort + Page 2
http://localhost/perpustakaan-multi-cabang/books?title=php&sort=publication_year&order=desc&page=2
```

---

## 10. Contoh Penggunaan di Model Lain

Keunggulan sistem ini: reusable. Contoh implementasi di User Model:

**File: `application/models/User_model.php` (Update)**

```php
<?php
defined('BASEPATH') OR exit('No direct script access allowed');

class User_model extends MY_Model {

    protected $table = 'users';

    protected $filterable_fields = array(
        'username',
        'email',
        'full_name',
        'branch_id',
        'role_id',
        'is_active'
    );

    protected $sortable_fields = array(
        'id',
        'username',
        'full_name',
        'created_at'
    );

    protected $default_sort = array('created_at' => 'DESC');

    public function __construct() {
        parent::__construct();
    }

    // Method lain tetap sama seperti Part 1...

    /**
     * Get filtered users dengan relasi
     */
    public function get_filtered_with_relations($page = 1, $per_page = NULL, $branch_filter = NULL) {
        $per_page = $per_page ?: $this->per_page;
        $offset = ($page - 1) * $per_page;

        $this->db->start_cache();

        $this->db->select('users.*, branches.name as branch_name, roles.name as role_name');
        $this->db->from($this->table);
        $this->db->join('branches', 'branches.id = users.branch_id', 'left');
        $this->db->join('roles', 'roles.id = users.role_id', 'left');

        if ($this->soft_delete) {
            $this->db->where('users.' . $this->deleted_field, NULL);
        }

        if ($branch_filter !== NULL) {
            if (is_array($branch_filter)) {
                $this->db->where_in('users.branch_id', $branch_filter);
            } else {
                $this->db->where('users.branch_id', $branch_filter);
            }
        }

        $this->apply_filters();

        $this->db->stop_cache();

        $total_rows = $this->db->count_all_results();

        $this->apply_sort();
        $this->db->limit($per_page, $offset);
        $query = $this->db->get();
        $data = $query->result();

        $this->db->flush_cache();

        $pagination_config = $this->build_pagination_config($total_rows, $per_page, $page);

        return array(
            'data' => $data,
            'total_rows' => $total_rows,
            'pagination' => $pagination_config,
            'current_page' => $page,
            'per_page' => $per_page,
            'total_pages' => ceil($total_rows / $per_page)
        );
    }
}
```

---

## Ringkasan Part 2

Di part ini kita sudah membangun:

1. **Universal Filter System** di MY_Model dengan:
   - Multiple field filter (text, dropdown, range)
   - Auto-deteksi operator (LIKE, =, >, <, etc.)
   - Support format `?filter[field]=value` dan `?field=value`

2. **Universal Sort System** dengan:
   - Multiple sort field support
   - URL builder untuk header tabel
   - Sort indicator (arrow up/down)

3. **Pagination yang Stateful**:
   - Mempertahankan filter dan sort saat pindah page
   - Bootstrap 5 styling
   - Query string preservation

4. **Helper Functions** untuk view:
   - `filter_input_text()` - Input text filter
   - `filter_dropdown()` - Dropdown filter
   - `sortable_header()` - Header tabel yang bisa diklik
   - `pagination_info()` - Info jumlah data

5. **Implementasi di Book Model** dengan join ke branches

Keuntungan arsitektur ini:

- **DRY**: Satu kode filter di MY_Model, dipakai semua model turunan
- **Flexible**: Setiap model definisikan field filterable dan sortable sendiri
- **Clean Controller**: Controller hanya panggil `get_filtered_results()`
- **Clean View**: Helper function handle rendering filter UI

Di Part 3, kita akan membangun sistem RBAC yang lengkap dengan permission checking.

---

## Troubleshooting

**Pagination tidak mempertahankan filter**
Pastikan `$config['suffix']` sudah di-set dengan query string di method `build_pagination_config()`.

**Sort tidak berfungsi**
Cek apakah field yang disort ada di `$sortable_fields` model.

**Filter tidak berdampak**
Cek apakah field ada di `$filterable_fields` dan pastikan nama parameter URL sesuai.

**Error "Undefined method apply_filters"**
Pastikan model extends MY_Model, bukan CI_Model langsung.
