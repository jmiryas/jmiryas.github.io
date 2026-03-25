---
title: "Aplikasi Perpus CI 3 - Part 6: Implementasi Akhir CRUD Buku"
date: "Mar 25, 2026"
description: "Part 6: Implementasi Akhir CRUD Buku"
---

**Seri Tutorial: Membangun Aplikasi Perpustakaan Multi-Cabang dengan CodeIgniter 3**

---

## Pendahuluan

Di Part 6 final ini, kita menggabungkan semua fitur yang sudah dibangun: isolasi data multi-cabang, filter universal, sort, pagination, dan RBAC ke dalam fitur CRUD Buku yang lengkap dan siap pakai.

---

## 1. Final Book Model

**File: `application/models/Book_model.php` (Final Version)**

```php
<?php
defined('BASEPATH') OR exit('No direct script access allowed');

class Book_model extends MY_Model {

    protected $table = 'books';

    protected $filterable_fields = array(
        'title',
        'author',
        'isbn',
        'publisher',
        'category',
        'publication_year',
        'branch_id',
        'is_active',
        'stock'
    );

    protected $sortable_fields = array(
        'id',
        'title',
        'author',
        'isbn',
        'publication_year',
        'stock',
        'created_at'
    );

    protected $default_sort = array('created_at' => 'DESC');

    public function __construct() {
        parent::__construct();
    }

    /**
     * Get book dengan branch info
     */
    public function get_with_branch($book_id) {
        $this->db->select('books.*, branches.name as branch_name');
        $this->db->from($this->table);
        $this->db->join('branches', 'branches.id = books.branch_id', 'left');
        $this->db->where('books.id', $book_id);

        if ($this->soft_delete) {
            $this->db->where('books.' . $this->deleted_field, NULL);
        }

        return $this->db->get()->row();
    }

    /**
     * Get filtered results dengan branch join dan multi-cabang support
     */
    public function get_filtered_with_branch($page = 1, $per_page = NULL, $branch_filter = NULL) {
        $per_page = $per_page ?: $this->per_page;
        $offset = ($page - 1) * $per_page;

        $this->db->start_cache();

        // Select dengan join
        $this->db->select('books.*, branches.name as branch_name, users.full_name as created_by_name');
        $this->db->from($this->table);
        $this->db->join('branches', 'branches.id = books.branch_id', 'left');
        $this->db->join('users', 'users.id = books.created_by', 'left');

        // Soft delete
        if ($this->soft_delete) {
            $this->db->where('books.' . $this->deleted_field, NULL);
        }

        // Branch filter (multi-cabang isolation)
        if ($branch_filter !== NULL) {
            if (is_array($branch_filter)) {
                $this->db->where_in('books.branch_id', $branch_filter);
            } else {
                $this->db->where('books.branch_id', $branch_filter);
            }
        }

        // Apply filters dari GET
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
            if ($row->category) {
                $categories[] = $row->category;
            }
        }

        return $categories;
    }

    /**
     * Get years untuk dropdown filter
     */
    public function get_years() {
        $this->db->distinct();
        $this->db->select('publication_year');
        $this->db->where('publication_year IS NOT NULL', NULL, FALSE);
        $this->db->where('publication_year >', 0);
        $this->db->order_by('publication_year', 'DESC');

        if ($this->soft_delete) {
            $this->db->where($this->deleted_field, NULL);
        }

        $result = $this->db->get($this->table)->result();

        $years = array();
        foreach ($result as $row) {
            if ($row->publication_year) {
                $years[] = $row->publication_year;
            }
        }

        return $years;
    }

    /**
     * Check if ISBN exists (untuk validasi unique)
     */
    public function isbn_exists($isbn, $exclude_id = NULL) {
        if (empty($isbn)) {
            return FALSE;
        }

        $this->db->where('isbn', $isbn);

        if ($exclude_id) {
            $this->db->where('id !=', $exclude_id);
        }

        if ($this->soft_delete) {
            $this->db->where($this->deleted_field, NULL);
        }

        return $this->db->count_all_results($this->table) > 0;
    }

    /**
     * Count books by branch
     */
    public function count_by_branch($branch_id) {
        $this->db->where('branch_id', $branch_id);

        if ($this->soft_delete) {
            $this->db->where($this->deleted_field, NULL);
        }

        return $this->db->count_all_results($this->table);
    }

    /**
     * Get statistics untuk dashboard
     */
    public function get_statistics($branch_filter = NULL) {
        $this->db->select('COUNT(*) as total_books, SUM(stock) as total_stock');
        $this->db->from($this->table);

        if ($this->soft_delete) {
            $this->db->where($this->deleted_field, NULL);
        }

        if ($branch_filter !== NULL) {
            if (is_array($branch_filter)) {
                $this->db->where_in('branch_id', $branch_filter);
            } else {
                $this->db->where('branch_id', $branch_filter);
            }
        }

        return $this->db->get()->row();
    }
}
```

---

## 2. Final Books Controller

**File: `application/controllers/Books.php` (Final Version)**

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
        $this->load->helper(array('filter', 'ui'));
    }

    /**
     * List buku dengan filter, sort, pagination, dan multi-cabang isolation
     */
    public function index() {
        $page = (int) $this->input->get('page') ?: 1;
        if ($page < 1) $page = 1;

        // Branch filter berdasarkan role (multi-cabang isolation)
        $branch_filter = $this->get_branch_filter();

        // Get filtered results
        $result = $this->book_model->get_filtered_with_branch($page, 10, $branch_filter);

        // Build data untuk view
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
            'years' => $this->book_model->get_years(),

            // Permission flags untuk UI
            'can_create' => $this->has_permission('book_create'),
            'can_edit' => $this->has_permission('book_edit'),
            'can_delete' => $this->has_permission('book_delete'),
            'can_view_all' => $this->has_permission('book_view_all_branch')
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

        // Cek akses cabang (multi-cabang isolation)
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
            'user_branch_id' => $this->user_branch_id,
            'categories' => $this->book_model->get_categories(),
            'years' => $this->book_model->get_years()
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
        $this->form_validation->set_rules('title', 'Judul Buku', 'required|trim');
        $this->form_validation->set_rules('author', 'Penulis', 'required|trim');
        $this->form_validation->set_rules('isbn', 'ISBN', 'trim');
        $this->form_validation->set_rules('stock', 'Stok', 'integer|greater_than_equal_to[0]');

        if ($this->form_validation->run() == FALSE) {
            $this->create();
            return;
        }

        // Cek ISBN unique
        $isbn = $this->input->post('isbn');
        if (!empty($isbn) && $this->book_model->isbn_exists($isbn)) {
            $this->session->set_flashdata('error', 'ISBN sudah terdaftar.');
            $this->create();
            return;
        }

        // Prepare data
        $data = array(
            'title' => $this->input->post('title'),
            'author' => $this->input->post('author'),
            'isbn' => $isbn,
            'publisher' => $this->input->post('publisher'),
            'publication_year' => $this->input->post('publication_year'),
            'category' => $this->input->post('category'),
            'description' => $this->input->post('description'),
            'stock' => $this->input->post('stock') ?: 0,
            'is_active' => 1,
            'created_by' => $this->session->userdata('user_id')
        );

        // Set cabang berdasarkan role
        if ($this->is_superadmin()) {
            $data['branch_id'] = $this->input->post('branch_id');
            if (empty($data['branch_id'])) {
                $this->session->set_flashdata('error', 'Cabang harus dipilih.');
                $this->create();
                return;
            }
        } else {
            $data['branch_id'] = $this->user_branch_id;
        }

        // Insert
        $book_id = $this->book_model->insert($data);

        if ($book_id) {
            $this->session->set_flashdata('success', 'Buku "' . $data['title'] . '" berhasil ditambahkan.');
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
            'branches' => $this->is_superadmin() ? $this->branch_model->get_active() : array(),
            'categories' => $this->book_model->get_categories(),
            'years' => $this->book_model->get_years()
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
        $this->form_validation->set_rules('title', 'Judul Buku', 'required|trim');
        $this->form_validation->set_rules('author', 'Penulis', 'required|trim');

        if ($this->form_validation->run() == FALSE) {
            $this->edit($id);
            return;
        }

        // Cek ISBN unique
        $isbn = $this->input->post('isbn');
        if (!empty($isbn) && $this->book_model->isbn_exists($isbn, $id)) {
            $this->session->set_flashdata('error', 'ISBN sudah terdaftar oleh buku lain.');
            $this->edit($id);
            return;
        }

        $data = array(
            'title' => $this->input->post('title'),
            'author' => $this->input->post('author'),
            'isbn' => $isbn,
            'publisher' => $this->input->post('publisher'),
            'publication_year' => $this->input->post('publication_year'),
            'category' => $this->input->post('category'),
            'description' => $this->input->post('description'),
            'stock' => $this->input->post('stock') ?: 0
        );

        // Update cabang hanya jika superadmin
        if ($this->is_superadmin()) {
            $new_branch_id = $this->input->post('branch_id');
            if ($new_branch_id && $new_branch_id != $book->branch_id) {
                $this->require_branch_access($new_branch_id);
                $data['branch_id'] = $new_branch_id;
            }
        }

        if ($this->book_model->update($id, $data)) {
            $this->session->set_flashdata('success', 'Buku "' . $data['title'] . '" berhasil diupdate.');
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
            $this->session->set_flashdata('success', 'Buku "' . $book->title . '" berhasil dihapus.');
        } else {
            $this->session->set_flashdata('error', 'Gagal menghapus buku.');
        }

        redirect('books');
    }
}
```

---

## 3. Final View Books Index

**File: `application/views/books/index.php` (Final Version)**

```php
<div class="container-fluid">
    <!-- Header -->
    <div class="d-flex justify-content-between align-items-center mb-4">
        <div>
            <h4 class="mb-1">Daftar Buku</h4>
            <small class="text-muted">Kelola koleksi buku perpustakaan</small>
        </div>
        <?php if ($can_create): ?>
            <a href="<?php echo base_url('books/create'); ?>" class="btn btn-primary">
                <i class="bi bi-plus-lg"></i> Tambah Buku
            </a>
        <?php endif; ?>
    </div>

    <!-- Flash Messages -->
    <?php if ($this->session->flashdata('success')): ?>
        <div class="alert alert-success alert-dismissible fade show">
            <i class="bi bi-check-circle-fill me-2"></i>
            <?php echo $this->session->flashdata('success'); ?>
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
    <?php endif; ?>

    <?php if ($this->session->flashdata('error')): ?>
        <div class="alert alert-danger alert-dismissible fade show">
            <i class="bi bi-exclamation-triangle-fill me-2"></i>
            <?php echo $this->session->flashdata('error'); ?>
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
    <?php endif; ?>

    <!-- Filter Panel -->
    <div class="card mb-4">
        <div class="card-header bg-white d-flex justify-content-between align-items-center py-3">
            <h6 class="mb-0 fw-bold"><i class="bi bi-funnel me-2"></i>Filter Pencarian</h6>
            <button class="btn btn-sm btn-outline-primary" type="button" data-bs-toggle="collapse" data-bs-target="#filterCollapse">
                <i class="bi bi-chevron-down"></i>
            </button>
        </div>
        <div class="collapse show" id="filterCollapse">
            <div class="card-body">
                <form method="get" action="<?php echo current_url(); ?>">
                    <div class="row g-3">
                        <div class="col-md-3">
                            <label class="form-label small text-muted">Judul Buku</label>
                            <input type="text" name="title" class="form-control"
                                   value="<?php echo $active_filters['title'] ?? ''; ?>"
                                   placeholder="Cari judul...">
                        </div>
                        <div class="col-md-3">
                            <label class="form-label small text-muted">Penulis</label>
                            <input type="text" name="author" class="form-control"
                                   value="<?php echo $active_filters['author'] ?? ''; ?>"
                                   placeholder="Cari penulis...">
                        </div>
                        <div class="col-md-2">
                            <label class="form-label small text-muted">Kategori</label>
                            <select name="category" class="form-select">
                                <option value="">Semua</option>
                                <?php foreach ($categories as $cat): ?>
                                    <option value="<?php echo $cat; ?>"
                                            <?php echo ($active_filters['category'] ?? '') == $cat ? 'selected' : ''; ?>>
                                        <?php echo $cat; ?>
                                    </option>
                                <?php endforeach; ?>
                            </select>
                        </div>
                        <div class="col-md-2">
                            <label class="form-label small text-muted">Tahun Terbit</label>
                            <select name="publication_year" class="form-select">
                                <option value="">Semua</option>
                                <?php foreach ($years as $year): ?>
                                    <option value="<?php echo $year; ?>"
                                            <?php echo ($active_filters['publication_year'] ?? '') == $year ? 'selected' : ''; ?>>
                                        <?php echo $year; ?>
                                    </option>
                                <?php endforeach; ?>
                            </select>
                        </div>

                        <?php if ($is_superadmin): ?>
                        <div class="col-md-2">
                            <label class="form-label small text-muted">Cabang</label>
                            <select name="branch_id" class="form-select">
                                <option value="">Semua Cabang</option>
                                <?php foreach ($branches as $branch): ?>
                                    <option value="<?php echo $branch->id; ?>"
                                            <?php echo ($active_filters['branch_id'] ?? '') == $branch->id ? 'selected' : ''; ?>>
                                        <?php echo $branch->name; ?>
                                    </option>
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
                                <i class="bi bi-search me-1"></i> Terapkan Filter
                            </button>
                            <a href="<?php echo current_url(); ?>" class="btn btn-outline-secondary">
                                <i class="bi bi-x-circle me-1"></i> Reset
                            </a>

                            <?php if (!empty($active_filters)): ?>
                                <span class="badge bg-info ms-2">
                                    <?php echo count($active_filters); ?> filter aktif
                                </span>
                            <?php endif; ?>
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
                            <th width="5%" class="text-center">#</th>
                            <th>
                                <a href="<?php echo $this->book_model->build_sort_url('title', $active_sort); ?>"
                                   class="text-decoration-none text-dark">
                                    Judul <?php echo $this->book_model->get_sort_indicator('title', $active_sort); ?>
                                </a>
                            </th>
                            <th>
                                <a href="<?php echo $this->book_model->build_sort_url('author', $active_sort); ?>"
                                   class="text-decoration-none text-dark">
                                    Penulis <?php echo $this->book_model->get_sort_indicator('author', $active_sort); ?>
                                </a>
                            </th>
                            <th>ISBN</th>
                            <th>Kategori</th>
                            <th class="text-center">
                                <a href="<?php echo $this->book_model->build_sort_url('publication_year', $active_sort); ?>"
                                   class="text-decoration-none text-dark">
                                    Tahun <?php echo $this->book_model->get_sort_indicator('publication_year', $active_sort); ?>
                                </a>
                            </th>
                            <th class="text-center">
                                <a href="<?php echo $this->book_model->build_sort_url('stock', $active_sort); ?>"
                                   class="text-decoration-none text-dark">
                                    Stok <?php echo $this->book_model->get_sort_indicator('stock', $active_sort); ?>
                                </a>
                            </th>
                            <?php if ($is_superadmin): ?>
                            <th>Cabang</th>
                            <?php endif; ?>
                            <th width="12%" class="text-center">Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php if (empty($books)): ?>
                            <tr>
                                <td colspan="<?php echo $is_superadmin ? 9 : 8; ?>" class="text-center py-5 text-muted">
                                    <i class="bi bi-inbox fs-1 d-block mb-3 opacity-50"></i>
                                    <p class="mb-0">Tidak ada data buku</p>
                                    <small>Coba ubah filter atau tambah buku baru</small>
                                </td>
                            </tr>
                        <?php else: ?>
                            <?php $no = (($current_page - 1) * 10) + 1; ?>
                            <?php foreach ($books as $book): ?>
                                <tr>
                                    <td class="text-center text-muted"><?php echo $no++; ?></td>
                                    <td>
                                        <strong><?php echo htmlspecialchars($book->title); ?></strong>
                                        <?php if (!empty($book->publisher)): ?>
                                            <br><small class="text-muted"><?php echo $book->publisher; ?></small>
                                        <?php endif; ?>
                                    </td>
                                    <td><?php echo htmlspecialchars($book->author); ?></td>
                                    <td class="font-monospace small"><?php echo htmlspecialchars($book->isbn); ?></td>
                                    <td>
                                        <?php if ($book->category): ?>
                                            <span class="badge bg-light text-dark border"><?php echo $book->category; ?></span>
                                        <?php else: ?>
                                            <span class="text-muted">-</span>
                                        <?php endif; ?>
                                    </td>
                                    <td class="text-center"><?php echo $book->publication_year ?: '-'; ?></td>
                                    <td class="text-center">
                                        <span class="badge bg-<?php echo $book->stock > 0 ? 'success' : 'danger'; ?>">
                                            <?php echo $book->stock; ?>
                                        </span>
                                    </td>
                                    <?php if ($is_superadmin): ?>
                                    <td>
                                        <span class="badge bg-info"><?php echo $book->branch_name; ?></span>
                                    </td>
                                    <?php endif; ?>
                                    <td class="text-center">
                                        <div class="btn-group">
                                            <a href="<?php echo base_url('books/view/' . $book->id); ?>"
                                               class="btn btn-sm btn-outline-info" title="Detail">
                                                <i class="bi bi-eye"></i>
                                            </a>

                                            <?php if ($can_edit): ?>
                                                <a href="<?php echo base_url('books/edit/' . $book->id); ?>"
                                                   class="btn btn-sm btn-outline-warning" title="Edit">
                                                    <i class="bi bi-pencil"></i>
                                                </a>
                                            <?php endif; ?>

                                            <?php if ($can_delete): ?>
                                                <a href="<?php echo base_url('books/delete/' . $book->id); ?>"
                                                   class="btn btn-sm btn-outline-danger"
                                                   title="Hapus"
                                                   onclick="return confirm('Yakin ingin menghapus buku &quot;<?php echo htmlspecialchars(addslashes($book->title)); ?>&quot;?')">
                                                    <i class="bi bi-trash"></i>
                                                </a>
                                            <?php endif; ?>
                                        </div>
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
                    <small class="text-muted">
                        <?php echo $pagination_info; ?>
                    </small>
                    <div>
                        <?php echo $pagination; ?>
                    </div>
                </div>
            </div>
        <?php endif; ?>
    </div>
</div>
```

---

## 4. Final View Book Form

**File: `application/views/books/form.php` (Final Version)**

```php
<div class="container-fluid">
    <!-- Header -->
    <div class="d-flex justify-content-between align-items-center mb-4">
        <div>
            <h4 class="mb-1"><?php echo isset($book) ? 'Edit Buku' : 'Tambah Buku'; ?></h4>
            <small class="text-muted"><?php echo isset($book) ? 'Update informasi buku' : 'Tambah buku baru ke koleksi'; ?></small>
        </div>
        <a href="<?php echo base_url('books'); ?>" class="btn btn-outline-secondary">
            <i class="bi bi-arrow-left me-1"></i> Kembali
        </a>
    </div>

    <!-- Validation Errors -->
    <?php if (validation_errors()): ?>
        <div class="alert alert-danger alert-dismissible fade show">
            <i class="bi bi-exclamation-triangle-fill me-2"></i>
            <?php echo validation_errors(); ?>
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
    <?php endif; ?>

    <div class="card">
        <div class="card-body">
            <form method="post"
                  action="<?php echo isset($book) ? base_url('books/update/' . $book->id) : base_url('books/store'); ?>">

                <div class="row">
                    <!-- Kolom Kiri: Informasi Utama -->
                    <div class="col-md-8">
                        <h6 class="text-primary mb-3">Informasi Buku</h6>

                        <div class="mb-3">
                            <label class="form-label">Judul Buku <span class="text-danger">*</span></label>
                            <input type="text" name="title" class="form-control form-control-lg"
                                   value="<?php echo isset($book) ? htmlspecialchars($book->title) : ''; ?>"
                                   required placeholder="Masukkan judul buku">
                        </div>

                        <div class="mb-3">
                            <label class="form-label">Penulis <span class="text-danger">*</span></label>
                            <input type="text" name="author" class="form-control"
                                   value="<?php echo isset($book) ? htmlspecialchars($book->author) : ''; ?>"
                                   required placeholder="Nama penulis">
                        </div>

                        <div class="row">
                            <div class="col-md-6">
                                <div class="mb-3">
                                    <label class="form-label">ISBN</label>
                                    <input type="text" name="isbn" class="form-control font-monospace"
                                           value="<?php echo isset($book) ? htmlspecialchars($book->isbn) : ''; ?>"
                                           placeholder="978-xxx-xxxxxx-x">
                                    <small class="text-muted">Biarkan kosong jika tidak ada</small>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="mb-3">
                                    <label class="form-label">Penerbit</label>
                                    <input type="text" name="publisher" class="form-control"
                                           value="<?php echo isset($book) ? htmlspecialchars($book->publisher) : ''; ?>"
                                           placeholder="Nama penerbit">
                                </div>
                            </div>
                        </div>

                        <div class="row">
                            <div class="col-md-6">
                                <div class="mb-3">
                                    <label class="form-label">Tahun Terbit</label>
                                    <select name="publication_year" class="form-select">
                                        <option value="">Pilih Tahun</option>
                                        <?php $current_year = date('Y'); ?>
                                        <?php for ($year = $current_year; $year >= 1900; $year--): ?>
                                            <option value="<?php echo $year; ?>"
                                                    <?php echo (isset($book) && $book->publication_year == $year) ? 'selected' : ''; ?>>
                                                <?php echo $year; ?>
                                            </option>
                                        <?php endfor; ?>
                                    </select>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="mb-3">
                                    <label class="form-label">Kategori</label>
                                    <div class="input-group">
                                        <select name="category" class="form-select" id="categorySelect">
                                            <option value="">Pilih atau ketik kategori</option>
                                            <?php foreach ($categories as $cat): ?>
                                                <option value="<?php echo $cat; ?>"
                                                        <?php echo (isset($book) && $book->category == $cat) ? 'selected' : ''; ?>>
                                                    <?php echo $cat; ?>
                                                </option>
                                            <?php endforeach; ?>
                                            <option value="__other__">+ Kategori Baru</option>
                                        </select>
                                        <input type="text" name="category_custom" id="categoryCustom"
                                               class="form-control d-none" placeholder="Kategori baru">
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="mb-3">
                            <label class="form-label">Deskripsi / Sinopsis</label>
                            <textarea name="description" class="form-control" rows="4"
                                      placeholder="Deskripsi singkat tentang buku"><?php echo isset($book) ? htmlspecialchars($book->description) : ''; ?></textarea>
                        </div>
                    </div>

                    <!-- Kolom Kanan: Informasi Sistem -->
                    <div class="col-md-4">
                        <h6 class="text-primary mb-3">Informasi Sistem</h6>

                        <div class="mb-3">
                            <label class="form-label">Stok <span class="text-danger">*</span></label>
                            <input type="number" name="stock" class="form-control"
                                   value="<?php echo isset($book) ? $book->stock : '0'; ?>"
                                   min="0" required>
                            <small class="text-muted">Jumlah unit yang tersedia</small>
                        </div>

                        <?php if ($is_superadmin): ?>
                            <div class="mb-3">
                                <label class="form-label">Cabang <span class="text-danger">*</span></label>
                                <select name="branch_id" class="form-select" required>
                                    <option value="">Pilih Cabang</option>
                                    <?php foreach ($branches as $branch): ?>
                                        <option value="<?php echo $branch->id; ?>"
                                                <?php echo (isset($book) && $book->branch_id == $branch->id) ||
                                                           (!isset($book) && $user_branch_id == $branch->id) ? 'selected' : ''; ?>>
                                            <?php echo $branch->name; ?>
                                        </option>
                                    <?php endforeach; ?>
                                </select>
                                <small class="text-muted">Pilih cabang tempat buku disimpan</small>
                            </div>
                        <?php else: ?>
                            <div class="mb-3">
                                <label class="form-label">Cabang</label>
                                <input type="text" class="form-control"
                                       value="<?php echo $current_user->branch_name; ?>" disabled>
                                <input type="hidden" name="branch_id" value="<?php echo $user_branch_id; ?>">
                                <small class="text-muted">Buku akan ditambahkan ke cabang Anda</small>
                            </div>
                        <?php endif; ?>

                        <?php if (isset($book)): ?>
                            <div class="card bg-light mt-4">
                                <div class="card-body">
                                    <h6 class="card-title">Informasi Data</h6>
                                    <p class="card-text small mb-1">
                                        <strong>Dibuat:</strong><br>
                                        <?php echo date('d M Y H:i', strtotime($book->created_at)); ?>
                                    </p>
                                    <p class="card-text small mb-0">
                                        <strong>Terakhir Update:</strong><br>
                                        <?php echo date('d M Y H:i', strtotime($book->updated_at)); ?>
                                    </p>
                                </div>
                            </div>
                        <?php endif; ?>
                    </div>
                </div>

                <hr class="my-4">

                <div class="d-flex gap-2">
                    <button type="submit" class="btn btn-primary btn-lg">
                        <i class="bi bi-check-lg me-1"></i> Simpan
                    </button>
                    <a href="<?php echo base_url('books'); ?>" class="btn btn-outline-secondary btn-lg">
                        Batal
                    </a>
                </div>

            </form>
        </div>
    </div>
</div>

<script>
// Toggle custom category input
document.getElementById('categorySelect').addEventListener('change', function() {
    const customInput = document.getElementById('categoryCustom');
    if (this.value === '__other__') {
        this.name = '';
        customInput.name = 'category';
        customInput.classList.remove('d-none');
        customInput.focus();
    } else {
        this.name = 'category';
        customInput.name = '';
        customInput.classList.add('d-none');
    }
});
</script>
```

---

## 5. Final View Book Detail

**File: `application/views/books/view.php` (Final Version)**

```php
<div class="container-fluid">
    <!-- Header -->
    <div class="d-flex justify-content-between align-items-center mb-4">
        <div>
            <h4 class="mb-1">Detail Buku</h4>
            <small class="text-muted">Informasi lengkap tentang buku</small>
        </div>
        <div class="d-flex gap-2">
            <a href="<?php echo base_url('books'); ?>" class="btn btn-outline-secondary">
                <i class="bi bi-arrow-left me-1"></i> Kembali
            </a>
            <?php if ($can_edit): ?>
                <a href="<?php echo base_url('books/edit/' . $book->id); ?>" class="btn btn-warning">
                    <i class="bi bi-pencil me-1"></i> Edit
                </a>
            <?php endif; ?>
        </div>
    </div>

    <div class="row">
        <!-- Informasi Utama -->
        <div class="col-md-8">
            <div class="card mb-4">
                <div class="card-header bg-white">
                    <h5 class="mb-0"><?php echo htmlspecialchars($book->title); ?></h5>
                </div>
                <div class="card-body">
                    <div class="row">
                        <div class="col-md-6">
                            <table class="table table-borderless">
                                <tr>
                                    <td width="35%" class="text-muted">Penulis</td>
                                    <td class="fw-medium"><?php echo htmlspecialchars($book->author); ?></td>
                                </tr>
                                <tr>
                                    <td class="text-muted">ISBN</td>
                                    <td class="font-monospace"><?php echo htmlspecialchars($book->isbn) ?: '-'; ?></td>
                                </tr>
                                <tr>
                                    <td class="text-muted">Penerbit</td>
                                    <td><?php echo htmlspecialchars($book->publisher) ?: '-'; ?></td>
                                </tr>
                                <tr>
                                    <td class="text-muted">Tahun Terbit</td>
                                    <td><?php echo $book->publication_year ?: '-'; ?></td>
                                </tr>
                            </table>
                        </div>
                        <div class="col-md-6">
                            <table class="table table-borderless">
                                <tr>
                                    <td width="35%" class="text-muted">Kategori</td>
                                    <td>
                                        <?php if ($book->category): ?>
                                            <span class="badge bg-info"><?php echo $book->category; ?></span>
                                        <?php else: ?>
                                            -
                                        <?php endif; ?>
                                    </td>
                                </tr>
                                <tr>
                                    <td class="text-muted">Stok Tersedia</td>
                                    <td>
                                        <span class="badge bg-<?php echo $book->stock > 0 ? 'success' : 'danger'; ?> fs-6">
                                            <?php echo $book->stock; ?> unit
                                        </span>
                                    </td>
                                </tr>
                                <tr>
                                    <td class="text-muted">Cabang</td>
                                    <td>
                                        <span class="badge bg-secondary"><?php echo $book->branch_name; ?></span>
                                    </td>
                                </tr>
                                <tr>
                                    <td class="text-muted">Status</td>
                                    <td><?php echo status_badge($book->is_active); ?></td>
                                </tr>
                            </table>
                        </div>
                    </div>

                    <?php if ($book->description): ?>
                        <hr>
                        <h6>Deskripsi</h6>
                        <p class="mb-0"><?php echo nl2br(htmlspecialchars($book->description)); ?></p>
                    <?php endif; ?>
                </div>
            </div>
        </div>

        <!-- Sidebar Info -->
        <div class="col-md-4">
            <div class="card mb-4">
                <div class="card-header bg-white">
                    <h6 class="mb-0">Riwayat Data</h6>
                </div>
                <div class="card-body">
                    <p class="mb-2">
                        <small class="text-muted d-block">Dibuat Pada</small>
                        <?php echo date('d M Y H:i', strtotime($book->created_at)); ?>
                    </p>
                    <p class="mb-2">
                        <small class="text-muted d-block">Terakhir Diupdate</small>
                        <?php echo date('d M Y H:i', strtotime($book->updated_at)); ?>
                    </p>
                    <?php if (!empty($book->created_by_name)): ?>
                        <p class="mb-0">
                            <small class="text-muted d-block">Dibuat Oleh</small>
                            <?php echo $book->created_by_name; ?>
                        </p>
                    <?php endif; ?>
                </div>
            </div>

            <?php if ($can_delete): ?>
                <div class="card border-danger">
                    <div class="card-header bg-danger text-white">
                        <h6 class="mb-0"><i class="bi bi-exclamation-triangle me-2"></i>Zona Berbahaya</h6>
                    </div>
                    <div class="card-body">
                        <p class="small text-muted">Tindakan ini akan menghapus buku secara permanen dari sistem.</p>
                        <a href="<?php echo base_url('books/delete/' . $book->id); ?>"
                           class="btn btn-outline-danger w-100"
                           onclick="return confirm('PERINGATAN: Yakin ingin menghapus buku &quot;<?php echo htmlspecialchars(addslashes($book->title)); ?>&quot;? Tindakan ini tidak bisa dibatalkan.')">
                            <i class="bi bi-trash me-1"></i> Hapus Buku
                        </a>
                    </div>
                </div>
            <?php endif; ?>
        </div>
    </div>
</div>
```

---

## 6. Update Dashboard dengan Statistik

**Update `application/controllers/Dashboard.php`:**

```php
<?php
defined('BASEPATH') OR exit('No direct script access allowed');

class Dashboard extends MY_Controller {

    public function __construct() {
        parent::__construct();
        $this->require_auth();

        $this->load->model('book_model');
        $this->load->model('user_model');
        $this->load->model('branch_model');
    }

    public function index() {
        $branch_filter = $this->get_branch_filter();

        // Get statistics
        $book_stats = $this->book_model->get_statistics($branch_filter);

        $data = array(
            'title' => 'Dashboard',
            'total_books' => $book_stats->total_books ?: 0,
            'total_stock' => $book_stats->total_stock ?: 0,
            'can_book_view' => $this->has_permission('book_view'),
            'can_user_view' => $this->has_permission('user_view'),
            'can_branch_view' => $this->has_permission('branch_view')
        );

        // Get counts jika punya permission
        if ($data['can_user_view']) {
            $this->load->model('user_model');
            $data['total_users'] = count($this->user_model->get_by_branch($this->is_superadmin() ? NULL : $this->user_branch_id));
        }

        if ($data['can_branch_view']) {
            $data['total_branches'] = $this->branch_model->count_all();
        }

        $this->add_permission_data($data);

        $this->load->view('templates/header', $data);
        $this->load->view('templates/sidebar', $data);
        $this->load->view('dashboard/index', $data);
        $this->load->view('templates/footer');
    }
}
```

**Update `application/views/dashboard/index.php`:**

```php
<div class="container-fluid">
    <!-- Header -->
    <div class="d-flex justify-content-between align-items-center mb-4">
        <div>
            <h4 class="mb-1">Dashboard</h4>
            <small class="text-muted"><?php echo date('l, d F Y'); ?></small>
        </div>
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

    <!-- Statistics Cards -->
    <div class="row g-4 mb-4">
        <?php if ($can_book_view): ?>
        <div class="col-md-3">
            <div class="card h-100 border-primary border-start border-4">
                <div class="card-body">
                    <div class="d-flex align-items-center">
                        <div class="flex-grow-1">
                            <h6 class="text-muted mb-1 text-uppercase small">Total Buku</h6>
                            <h3 class="mb-0"><?php echo number_format($total_books); ?></h3>
                            <small class="text-muted"><?php echo number_format($total_stock); ?> total stok</small>
                        </div>
                        <div class="fs-1 text-primary opacity-50">
                            <i class="bi bi-book"></i>
                        </div>
                    </div>
                </div>
                <div class="card-footer bg-white">
                    <a href="<?php echo base_url('books'); ?>" class="small text-decoration-none">
                        Lihat semua <i class="bi bi-arrow-right"></i>
                    </a>
                </div>
            </div>
        </div>
        <?php endif; ?>

        <?php if ($can_user_view): ?>
        <div class="col-md-3">
            <div class="card h-100 border-success border-start border-4">
                <div class="card-body">
                    <div class="d-flex align-items-center">
                        <div class="flex-grow-1">
                            <h6 class="text-muted mb-1 text-uppercase small">Total User</h6>
                            <h3 class="mb-0"><?php echo number_format($total_users); ?></h3>
                        </div>
                        <div class="fs-1 text-success opacity-50">
                            <i class="bi bi-people"></i>
                        </div>
                    </div>
                </div>
                <div class="card-footer bg-white">
                    <a href="<?php echo base_url('users'); ?>" class="small text-decoration-none">
                        Kelola user <i class="bi bi-arrow-right"></i>
                    </a>
                </div>
            </div>
        </div>
        <?php endif; ?>

        <?php if ($can_branch_view): ?>
        <div class="col-md-3">
            <div class="card h-100 border-info border-start border-4">
                <div class="card-body">
                    <div class="d-flex align-items-center">
                        <div class="flex-grow-1">
                            <h6 class="text-muted mb-1 text-uppercase small">Total Cabang</h6>
                            <h3 class="mb-0"><?php echo number_format($total_branches); ?></h3>
                        </div>
                        <div class="fs-1 text-info opacity-50">
                            <i class="bi bi-building"></i>
                        </div>
                    </div>
                </div>
                <div class="card-footer bg-white">
                    <a href="<?php echo base_url('branches'); ?>" class="small text-decoration-none">
                        Lihat cabang <i class="bi bi-arrow-right"></i>
                    </a>
                </div>
            </div>
        </div>
        <?php endif; ?>

        <div class="col-md-3">
            <div class="card h-100 border-warning border-start border-4">
                <div class="card-body">
                    <div class="d-flex align-items-center">
                        <div class="flex-grow-1">
                            <h6 class="text-muted mb-1 text-uppercase small">Permission</h6>
                            <h3 class="mb-0"><?php echo count($user_permissions); ?></h3>
                            <small class="text-muted">Akses yang dimiliki</small>
                        </div>
                        <div class="fs-1 text-warning opacity-50">
                            <i class="bi bi-shield-check"></i>
                        </div>
                    </div>
                </div>
                <div class="card-footer bg-white">
                    <span class="small text-muted">Role: <?php echo $current_user->role_name; ?></span>
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
                                            <i class="bi bi-check-circle-fill text-success small me-1"></i>
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

## 7. Routes Final

**File: `application/config/routes.php` (Final)**

```php
<?php
defined('BASEPATH') OR exit('No direct script access allowed');

$route['default_controller'] = 'auth/login';
$route['404_override'] = '';
$route['translate_uri_dashes'] = FALSE;

// Auth Routes
$route['login'] = 'auth/login';
$route['register'] = 'auth/register';
$route['logout'] = 'auth/logout';
$route['do_login'] = 'auth/do_login';
$route['do_register'] = 'auth/do_register';

// Dashboard
$route['dashboard'] = 'dashboard/index';

// Book Routes
$route['books'] = 'books/index';
$route['books/create'] = 'books/create';
$route['books/store'] = 'books/store';
$route['books/view/(:num)'] = 'books/view/$1';
$route['books/edit/(:num)'] = 'books/edit/$1';
$route['books/update/(:num)'] = 'books/update/$1';
$route['books/delete/(:num)'] = 'books/delete/$1';

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

## Ringkasan Seri Tutorial

Selamat! Kamu sudah menyelesaikan seri tutorial membangun aplikasi Perpustakaan Multi-Cabang enterprise-grade dengan CodeIgniter 3.

### Yang Sudah Dibangun:

**Part 1: Setup & Otentikasi**

- Struktur folder enterprise-grade (service layer, validation layer)
- Database schema lengkap dengan RBAC dan multi-cabang
- Sistem login/register dengan password hashing

**Part 2: Universal Filter & Pagination**

- MY_Model dengan filterable dan sortable fields
- Pagination stateful yang mempertahankan filter
- Helper functions untuk UI filter

**Part 3: RBAC Backend**

- Permission dan Role models
- RBAC service untuk checking permission
- MY_Controller dengan method permission dan branch access

**Part 4: UI Dinamis**

- Menu config dengan permission requirement
- Sidebar dinamis dengan active state
- UI helper (can(), action_button(), etc.)
- Bootstrap 5 styling profesional

**Part 5: Manajemen RBAC**

- CRUD Role dengan assign permissions
- Protection untuk superadmin
- Permission grouped by module

**Part 6: Implementasi Akhir**

- CRUD Buku lengkap dengan semua fitur
- Isolasi data multi-cabang
- Filter, sort, pagination
- RBAC integration
- Dashboard dengan statistik

### Fitur Utama Aplikasi:

1. **Multi-Cabang**: User hanya lihat data cabangnya, superadmin lihat semua
2. **RBAC**: Role-based access control dengan permission granularity
3. **UI Dinamis**: Menu dan tombol muncul/hilang sesuai permission
4. **Filter & Sort**: Universal filter system di semua halaman list
5. **Pagination**: Stateful pagination dengan Bootstrap 5 styling
6. **Soft Delete**: Data tidak benar-benar dihapus, hanya dimark deleted
7. **Clean Code**: Service layer, validation layer, DRY principle

### Struktur Folder Akhir:

```
application/
├── config/
│   ├── menu.php          # Menu configuration
│   └── routes.php        # All routes
├── controllers/
│   ├── Auth.php          # Login/register
│   ├── Dashboard.php     # Dashboard
│   ├── Books.php         # CRUD Buku
│   └── Roles.php         # Manajemen RBAC
├── core/
│   ├── MY_Controller.php # Base controller dengan RBAC
│   ├── MY_Model.php      # Base model dengan filter & pagination
│   └── MY_Loader.php     # Service loader
├── helpers/
│   ├── filter_helper.php # Filter UI helpers
│   └── ui_helper.php     # UI component helpers
├── libraries/
│   └── Menu.php          # Menu rendering
├── models/
│   ├── Book_model.php    # Buku model
│   ├── User_model.php    # User model
│   ├── Role_model.php    # Role model
│   ├── Permission_model.php # Permission model
│   └── Branch_model.php  # Branch model
├── services/
│   ├── Auth_service.php  # Logika autentikasi
│   └── Rbac_service.php  # Logika RBAC
├── validations/
│   └── Auth_validation.php # Aturan validasi
└── views/
    ├── auth/             # Login & register views
    ├── books/            # Buku CRUD views
    ├── roles/            # Role management views
    ├── dashboard/        # Dashboard view
    └── templates/        # Header, sidebar, footer
```

### Testing Aplikasi:

1. Login sebagai superadmin (admin123)
2. Buat role baru dengan permission tertentu
3. Register user baru dengan role tersebut
4. Login sebagai user baru
5. Verifikasi menu dan tombol yang muncul sesuai permission
6. Cek isolasi data (user hanya lihat cabangnya)

### Pengembangan Selanjutnya:

- Tambah fitur peminjaman buku
- Tambah laporan dan grafik
- Tambah notifikasi
- Tambah API untuk mobile app
- Implementasi caching untuk performance

Selamat mengembangkan aplikasi perpustakaanmu!

---

## Troubleshooting Umum

**Aplikasi redirect terus ke login**
Cek session configuration di `config.php`, pastikan folder writable.

**Permission denied padahal sudah login**
Cek database `role_permissions`, pastikan role user punya permission yang diperlukan.

**Data cabang lain muncul**
Cek `get_branch_filter()` di controller, pastika superadmin check benar.

**Filter tidak berfungsi**
Cek `filterable_fields` di model, pastikan field yang difilter ada di daftar.

**Pagination hilang saat filter**
Cek `build_pagination_config()` di MY_Model, pastikan suffix query string benar.
