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
            <div className="item-header">
              {/* Menambahkan flex dan baseline agar angka dan teks sejajar rapi di bawah */}
              <h3
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  gap: "0.75rem",
                  margin: 0,
                }}
              >
                {/* Styling khusus untuk angka indeks */}
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "0.85rem",
                    color: "var(--text-light)", // Menggunakan abu-abu terang agar sangat subtle
                    fontWeight: "400",
                  }}
                >
                  {String(index + 1).padStart(2, "0")}.
                </span>
                {exp.role}
              </h3>
              <span className="item-meta">{exp.period}</span>
            </div>
            <div className="tech-stack" style={{ marginLeft: "2rem" }}>
              {" "}
              {/* Memberikan indentasi agar sejajar dengan teks h3 */}
              {exp.company}
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
