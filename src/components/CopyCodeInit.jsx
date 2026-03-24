"use client";
import { useEffect } from "react";

export default function CopyCodeInit() {
  useEffect(() => {
    // Cari semua elemen <pre> (kotak kode) di dalam markdown
    const preElements = document.querySelectorAll(".markdown-body pre");

    preElements.forEach((pre) => {
      // Mencegah duplikasi tombol jika useEffect berjalan dua kali (React Strict Mode)
      if (pre.querySelector(".copy-btn")) return;

      // Buat elemen tombol
      const btn = document.createElement("button");
      btn.className = "copy-btn";
      btn.setAttribute("aria-label", "Copy code");

      // Icon Copy (Lucide SVG)
      const copyIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>`;

      // Icon Check (Lucide SVG)
      const checkIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>`;

      btn.innerHTML = copyIcon;

      // Event listener saat tombol diklik
      btn.addEventListener("click", () => {
        const codeElement = pre.querySelector("code");
        if (codeElement) {
          // Menyalin teks asli (tanpa line number karena line number ada di CSS)
          navigator.clipboard.writeText(codeElement.innerText).then(() => {
            // Ubah icon jadi centang hijau
            btn.innerHTML = checkIcon;

            // Kembalikan ke icon copy setelah 2 detik
            setTimeout(() => {
              btn.innerHTML = copyIcon;
            }, 2000);
          });
        }
      });

      // Masukkan tombol ke dalam elemen <pre>
      pre.appendChild(btn);
    });
  }, []);

  return null; // Komponen ini tidak merender UI secara langsung
}
