"use client";

import { useState, useEffect } from "react";
import { ChevronRight, X } from "lucide-react";
import { projects } from "@/data/projects";

export default function ProjectList() {
  const [showAll, setShowAll] = useState(false);
  const [activeProj, setActiveProj] = useState(null);

  // Mencegah body agar tidak bisa di-scroll saat drawer sedang terbuka
  useEffect(() => {
    document.body.style.overflow = activeProj ? "hidden" : "auto";

    // Cleanup function untuk mengembalikan scroll saat komponen unmount
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [activeProj]);

  // Menentukan berapa project yang tampil berdasarkan state showAll
  const displayedProj = showAll ? projects : projects.slice(0, 3);

  return (
    <section id="projects">
      <h2>Selected Projects</h2>

      <div className="proj-list">
        {displayedProj.map((proj, index) => (
          <div
            key={proj.id}
            className="list-item project-item"
            onClick={() => setActiveProj(proj)}
          >
            <div style={{ width: "100%", paddingRight: "1rem" }}>
              <div className="item-header">
                {/* Menambahkan flex dan baseline agar angka dan teks sejajar rapi */}
                <h3
                  style={{
                    display: "flex",
                    alignItems: "baseline",
                    gap: "0.75rem",
                    margin: 0,
                  }}
                >
                  {/* Styling khusus untuk angka indeks: Muted, Monospace, Normal weight */}
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "0.85rem",
                      color: "var(--text-light)",
                      fontWeight: "400",
                    }}
                  >
                    {String(index + 1).padStart(2, "0")}.
                  </span>
                  {proj.title}
                </h3>
              </div>

              {/* Indentasi agar teks deskripsi sejajar rata kiri dengan huruf pertama judul, bukan angka */}
              <div style={{ marginLeft: "2.1rem" }}>
                <p
                  style={{
                    marginBottom: 0,
                    marginTop: "0.2rem",
                    fontSize: "0.9rem",
                  }}
                >
                  {proj.desc}
                </p>
                <div className="tech-stack">{proj.tech}</div>
              </div>
            </div>

            <ChevronRight className="detail-icon" size={16} />
          </div>
        ))}
      </div>

      {/* Tombol Show All (Hanya muncul jika total project > 3) */}
      {projects.length > 3 && (
        <button className="btn-text" onClick={() => setShowAll(!showAll)}>
          {showAll ? "- Show less" : "+ Show all projects"}
        </button>
      )}

      {/* ========================================
        DRAWER & OVERLAY SECTION 
        ========================================
      */}
      <div
        className={`overlay ${activeProj ? "active" : ""}`}
        onClick={() => setActiveProj(null)}
      />

      <div className={`drawer ${activeProj ? "active" : ""}`}>
        <div className="drawer-close" onClick={() => setActiveProj(null)}>
          <X size={20} />
        </div>

        {activeProj && (
          <div className="drawer-content">
            {/* Meta Info (Tahun & Company) */}
            <div className="item-meta" style={{ marginBottom: "0.5rem" }}>
              {activeProj.year} • {activeProj.company}
            </div>

            {/* Judul Project */}
            <h1 style={{ fontSize: "1.8rem", marginBottom: 0 }}>
              {activeProj.title}
            </h1>

            {/* Tech Stack */}
            <div className="tech-stack" style={{ marginTop: "0.3rem" }}>
              [ {activeProj.tech} ]
            </div>

            {/* Gambar Project */}
            <img
              src={activeProj.img}
              alt={activeProj.title}
              className="drawer-img"
            />

            <p>{activeProj.desc}</p>

            <h3>Problem</h3>
            <p>{activeProj.problem}</p>

            <h3>Solution</h3>
            <p>{activeProj.solution}</p>

            <h3>Impact & Metrics</h3>
            <ul>
              {activeProj.impacts.map((impact, idx) => (
                <li key={idx}>{impact}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}
