"use client";
import { useState } from "react"; // Hapus useEffect dari import
import Link from "next/link";
import { ArrowLeft, Search } from "lucide-react";

const POSTS_PER_PAGE = 10;

export default function BlogClientPage({ posts }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // FIX: Fungsi pencarian baru yang langsung mereset halaman ke 1 (Tanpa useEffect)
  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const filteredPosts = posts.filter((post) =>
    post.frontmatter.title.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const totalPages = Math.ceil(filteredPosts.length / POSTS_PER_PAGE);
  const paginatedPosts = filteredPosts.slice(
    (currentPage - 1) * POSTS_PER_PAGE,
    currentPage * POSTS_PER_PAGE,
  );

  const handlePrev = () => setCurrentPage((prev) => Math.max(prev - 1, 1));
  const handleNext = () =>
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));

  return (
    <>
      <Link href="/" className="nav-back hover-link">
        <ArrowLeft size={16} /> Back to Home
      </Link>

      <h2
        style={{
          marginBottom: "1rem",
          borderBottom: "1px solid var(--border)",
          paddingBottom: "0.3rem",
        }}
      >
        All Notes & Writing
      </h2>

      <div className="search-container">
        <Search size={16} />
        <input
          type="text"
          className="search-input"
          placeholder="Search posts by title or keyword..."
          value={searchQuery}
          onChange={
            handleSearch
          } /* <- Gunakan fungsi yang baru dibuat di sini */
        />
      </div>

      <div>
        {paginatedPosts.length > 0 ? (
          paginatedPosts.map((post, index) => {
            const actualIndex = (currentPage - 1) * POSTS_PER_PAGE + index + 1;

            return (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                className="list-item hover-link"
                style={{
                  display: "block",
                  color: "inherit",
                  textDecoration: "none",
                }}
              >
                <div className="item-header">
                  <h3
                    style={{
                      display: "flex",
                      alignItems: "baseline",
                      gap: "0.75rem",
                      margin: 0,
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "0.85rem",
                        color: "var(--text-light)",
                        fontWeight: "400",
                      }}
                    >
                      {String(actualIndex).padStart(2, "0")}.
                    </span>
                    {post.frontmatter.title}
                  </h3>
                </div>
                <span
                  className="item-meta"
                  style={{
                    display: "block",
                    marginTop: "0.3rem",
                    marginLeft: "2.1rem",
                  }}
                >
                  {post.frontmatter.date}
                </span>
              </Link>
            );
          })
        ) : (
          <p>No posts found.</p>
        )}
      </div>

      {totalPages > 1 && (
        <div className="pagination">
          <button
            className="page-btn"
            onClick={handlePrev}
            disabled={currentPage === 1}
          >
            ← Prev
          </button>
          <div className="page-numbers">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(
              (pageNum) => (
                <button
                  key={pageNum}
                  className={`page-btn ${currentPage === pageNum ? "active" : ""}`}
                  onClick={() => setCurrentPage(pageNum)}
                >
                  {pageNum}
                </button>
              ),
            )}
          </div>
          <button
            className="page-btn"
            onClick={handleNext}
            disabled={currentPage === totalPages}
          >
            Next →
          </button>
        </div>
      )}
    </>
  );
}
