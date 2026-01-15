"use client";

import { useState, useEffect } from "react";
import { projects } from "@/data/portfolio";
import {
  X,
  ArrowRight,
  ArrowUpRight,
  Building2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

export default function ProjectSection() {
  const [selectedProject, setSelectedProject] = useState<
    (typeof projects)[0] | null
  >(null);

  // STATE BARU: Untuk Show All / Show Less
  const [isExpanded, setIsExpanded] = useState(false);

  // Logic: Jika expanded, ambil semua. Jika tidak, ambil 3 saja.
  const displayedProjects = isExpanded ? projects : projects.slice(0, 3);

  useEffect(() => {
    if (selectedProject) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
  }, [selectedProject]);

  return (
    <>
      <div className="flex flex-col gap-6">
        {displayedProjects.map((project, index) => (
          <div
            key={index}
            onClick={() => setSelectedProject(project)}
            // COMPACT UPDATE: gap-4 -> gap-3, p-4 -> p-3
            className="group relative flex flex-col sm:flex-row gap-4 p-3 -mx-3 border border-transparent rounded-lg hover:border-slate-100 hover:bg-slate-50/50 transition-all cursor-pointer items-start"
          >
            {/* Thumbnail: Ukuran sedikit diperkecil w-32 -> w-28 */}
            <div className="w-full sm:w-28 aspect-video bg-slate-100 overflow-hidden rounded border border-slate-200 shrink-0 mt-1">
              <img
                src={project.image}
                alt={project.title}
                className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition duration-500"
              />
            </div>

            <div className="flex flex-col flex-1">
              {/* COMPACT UPDATE: mb-2 -> mb-1 */}
              <h3 className="font-bold leading-snug text-slate-800 group-hover:text-blue-700 transition-colors font-serif text-base sm:text-lg mb-1 flex items-center gap-2">
                {project.title}
                <ArrowUpRight
                  size={14}
                  className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300"
                />
              </h3>

              {/* COMPACT UPDATE: mb-3 -> mb-2 */}
              <p className="text-sm leading-normal text-slate-500 font-sans line-clamp-2 mb-2">
                {project.description}
              </p>

              <ul className="flex flex-wrap gap-2 mt-auto">
                {project.tech.slice(0, 3).map((t) => (
                  <li
                    key={t}
                    className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600 font-mono group-hover:bg-blue-50 group-hover:text-blue-700 transition-colors"
                  >
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>

      {/* TOMBOL SHOW ALL */}
      {projects.length > 3 && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="hover:cursor-pointer mt-6 flex items-center gap-2 text-xs font-mono font-bold text-slate-800 hover:text-blue-700 transition-colors w-fit border-b border-transparent hover:border-blue-700 pb-0.5"
        >
          {isExpanded ? (
            <>
              Show Less <ChevronUp size={14} />
            </>
          ) : (
            <>
              Show All Projects
              <ChevronDown size={14} />
            </>
          )}
        </button>
      )}

      {/* SIDE PANEL (TETAP SAMA) */}
      <div
        className={`fixed inset-0 z-40 bg-slate-900/20 backdrop-blur-sm transition-opacity duration-300 ${
          selectedProject
            ? "opacity-100 visible"
            : "opacity-0 invisible pointer-events-none"
        }`}
        onClick={() => setSelectedProject(null)}
      />

      <div
        className={`fixed top-0 right-0 z-50 h-full w-full md:w-[500px] bg-white shadow-2xl transition-transform duration-300 ease-in-out transform ${
          selectedProject ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {selectedProject && (
          <div className="h-full flex flex-col">
            {/* COMPACT MODAL HEADER: p-6 -> p-5 */}
            <div className="flex items-start justify-between p-5 border-b border-slate-100 bg-white shrink-0">
              <div>
                <div className="flex items-center gap-2 text-slate-400 font-mono text-xs mb-1">
                  <span>{selectedProject.year}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Building2 size={10} /> {selectedProject.company}
                  </span>
                </div>
                <h2 className="font-serif text-xl sm:text-2xl font-bold text-slate-800 leading-tight">
                  {selectedProject.title}
                </h2>
              </div>
              <button
                onClick={() => setSelectedProject(null)}
                className="p-2 hover:bg-slate-100 rounded-full transition text-slate-500 cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              <div className="w-full bg-slate-50 border-b border-slate-100">
                <img
                  src={selectedProject.image}
                  className="w-full h-auto max-h-[250px] object-cover mx-auto"
                  alt={selectedProject.title}
                />
              </div>

              {/* COMPACT MODAL CONTENT: p-6 -> p-5, space-y-8 -> space-y-6 */}
              <div className="p-5 space-y-6 font-sans text-sm text-slate-600 leading-relaxed">
                <div>
                  <h4 className="font-mono text-xs font-bold uppercase tracking-wider text-slate-800 mb-1">
                    Description
                  </h4>
                  <p>{selectedProject.description}</p>
                </div>

                <div className="grid grid-cols-1 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-100">
                  <div>
                    <h4 className="font-mono text-xs font-bold uppercase tracking-wider text-slate-800 mb-1">
                      Problem
                    </h4>
                    <p className="text-slate-500 text-xs leading-relaxed">
                      {selectedProject.problem}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-mono text-xs font-bold uppercase tracking-wider text-slate-800 mb-1">
                      Solution
                    </h4>
                    <p className="text-slate-500 text-xs leading-relaxed">
                      {selectedProject.solution}
                    </p>
                  </div>
                </div>

                <div>
                  <h4 className="font-mono text-xs font-bold uppercase tracking-wider text-blue-700 mb-2 border-b border-slate-100 pb-1 inline-block">
                    Key Metrics
                  </h4>
                  <ul className="space-y-1">
                    {selectedProject.impact.map((imp, i) => (
                      <li key={i} className="flex gap-2 text-slate-700">
                        <ArrowRight
                          size={14}
                          className="text-blue-700 shrink-0 mt-1"
                        />
                        <span>{imp}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <h4 className="font-mono text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                    Technologies
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedProject.tech.map((t) => (
                      <span
                        key={t}
                        className="font-mono text-xs border border-slate-200 bg-white px-2 py-1 rounded text-slate-600"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
