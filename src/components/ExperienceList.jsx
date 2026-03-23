"use client";
import { useState } from "react";
import { experiences } from "@/data/experience";

export default function ExperienceList() {
  const [showAll, setShowAll] = useState(false);
  const displayedExp = showAll ? experiences : experiences.slice(0, 3);

  return (
    <section id="experience">
      <h2>Experience</h2>
      <div className="exp-list">
        {displayedExp.map((exp, index) => (
          <div key={exp.id} className="list-item">
            {/* Menggunakan Flexbox untuk memisahkan kolom Angka dan kolom Teks */}
            <div
              style={{ display: "flex", alignItems: "flex-start", gap: "1rem" }}
            >
              {/* Kolom Angka */}
              <div
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.85rem",
                  color: "var(--text-light)",
                  paddingTop: "0.1rem", // Penyesuaian tinggi agar sejajar dengan teks H3
                }}
              >
                {String(index + 1).padStart(2, "0")}.
              </div>

              {/* Kolom Konten (Akan otomatis sejajar sempurna rata kiri) */}
              <div style={{ flex: 1 }}>
                <div className="item-header">
                  <h3 style={{ margin: 0 }}>{exp.role}</h3>
                  <span className="item-meta">{exp.period}</span>
                </div>
                <div className="tech-stack" style={{ marginTop: "0.2rem" }}>
                  {exp.company}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {experiences.length > 3 && (
        <button className="btn-text" onClick={() => setShowAll(!showAll)}>
          {showAll ? "- Show less" : "+ Show all experiences"}
        </button>
      )}
    </section>
  );
}
