"use client";

import { ArrowUp, ArrowDown } from "lucide-react";
import { useEffect, useState } from "react";

export default function ScrollButtons() {
  const [showTopBtn, setShowTopBtn] = useState(false);
  const [showBottomBtn, setShowBottomBtn] = useState(true);

  useEffect(() => {
    const handleScroll = () => {
      // Posisi scroll saat ini
      const scrollY = window.scrollY;
      // Tinggi jendela browser (viewport)
      const windowHeight = window.innerHeight;
      // Tinggi total dokumen website
      const docHeight = document.documentElement.scrollHeight;

      // RULES 1: Tombol UP
      // Muncul hanya jika user sudah scroll ke bawah lebih dari 300px
      if (scrollY > 300) {
        setShowTopBtn(true);
      } else {
        setShowTopBtn(false);
      }

      // RULES 2: Tombol DOWN
      // Muncul selama user belum mentok di bawah.
      // Kita beri toleransi (buffer) sekitar 50px sebelum benar-benar mentok.
      if (scrollY + windowHeight < docHeight - 50) {
        setShowBottomBtn(true);
      } else {
        setShowBottomBtn(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    // Panggil sekali saat mount untuk cek posisi awal (penting jika di-refresh di tengah hal)
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const scrollToBottom = () => {
    window.scrollTo({
      top: document.documentElement.scrollHeight,
      behavior: "smooth",
    });
  };

  return (
    <div className="fixed bottom-8 right-8 flex flex-col gap-3 z-50">
      {/* Tombol Scroll UP */}
      <button
        onClick={scrollToTop}
        className={`p-3 bg-white border border-slate-200 rounded-full shadow-lg text-slate-600 hover:text-blue-700 hover:border-blue-700 transition-all duration-300 hover:-translate-y-1 cursor-pointer ${
          showTopBtn
            ? "opacity-100 translate-y-0 visible"
            : "opacity-0 translate-y-4 invisible pointer-events-none absolute bottom-0"
          // class absolute bottom-0 ditambahkan agar saat hilang dia tidak memakan tempat (layout shift)
        }`}
        aria-label="Scroll to top"
      >
        <ArrowUp size={20} />
      </button>

      {/* Tombol Scroll DOWN */}
      <button
        onClick={scrollToBottom}
        className={`p-3 bg-white border border-slate-200 rounded-full shadow-lg text-slate-600 hover:text-blue-700 hover:border-blue-700 transition-all duration-300 hover:translate-y-1 cursor-pointer ${
          showBottomBtn
            ? "opacity-100 translate-y-0 visible"
            : "opacity-0 -translate-y-4 invisible pointer-events-none"
        }`}
        aria-label="Scroll to bottom"
      >
        <ArrowDown size={20} />
      </button>
    </div>
  );
}
