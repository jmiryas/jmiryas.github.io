import Link from "next/link";
import { getSortedPostsData } from "@/lib/posts";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { formatDate } from "@/lib/utils";
import ScrollButtons from "@/components/ScrollButtons";

export default function BlogIndex() {
  const allPosts = getSortedPostsData();

  return (
    // STANDAR: max-w-screen-lg, px-6 md:px-12
    <div className="mx-auto min-h-screen max-w-screen-lg px-6 py-12 md:px-12 md:py-16 lg:py-20">
      <ScrollButtons />

      {/* Header Halaman */}
      <header className="mb-16 max-w-2xl">
        <Link
          href="/"
          className="group inline-flex items-center gap-2 font-mono text-xs text-slate-500 hover:text-slate-900 mb-8 transition-colors border-b border-transparent hover:border-slate-900 pb-0.5"
        >
          <ArrowLeft
            size={12}
            className="group-hover:-translate-x-1 transition-transform"
          />
          Back to Portfolio
        </Link>

        <h1 className="text-4xl font-bold tracking-tight text-slate-800 sm:text-5xl font-serif mb-4">
          Writing
        </h1>
        <p className="text-slate-500 font-sans leading-relaxed text-base">
          Thoughts on backend architecture, system design, and software
          engineering.
        </p>
      </header>

      {/* List Posts */}
      <main>
        <div className="group/list">
          {allPosts.length > 0 ? (
            <ul className="space-y-6">
              {allPosts.map((post) => (
                <li
                  key={post.id}
                  className="group border-b border-slate-100 pb-6 last:border-none"
                >
                  <Link
                    href={`/blog/${post.id}`}
                    // FIX: Hapus 'hover:opacity-75' agar transisi warna lebih tajam & konsisten
                    className="block"
                  >
                    {/* Header Artikel */}
                    <div className="flex flex-col md:flex-row md:items-baseline md:justify-between gap-2 mb-2">
                      <h2 className="text-xl font-bold font-serif text-slate-800 group-hover:text-blue-700 transition-colors">
                        {post.title}
                      </h2>
                      {/* Update: Tanggal ikut berubah warna sedikit saat hover */}
                      <span className="font-mono text-xs text-slate-400 shrink-0 group-hover:text-slate-600 transition-colors">
                        {formatDate(post.date)}
                      </span>
                    </div>

                    {/* Excerpt */}
                    <p className="text-slate-500 font-sans leading-relaxed mb-2 line-clamp-2 max-w-3xl">
                      {post.excerpt}
                    </p>

                    {/* Read Article Animation (Slide in) */}
                    <div className="inline-flex items-center gap-1 text-xs font-bold font-mono text-blue-700 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                      Read Article <ArrowUpRight size={10} />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <div className="py-20 text-center border border-dashed border-slate-200 rounded-lg">
              <p className="font-mono text-sm text-slate-400">
                No posts found yet.
              </p>
            </div>
          )}
        </div>
      </main>

      <footer className="mt-20 pt-8 border-t border-slate-100 text-left">
        <span className="font-mono text-xs text-slate-400 font-medium">
          © {new Date().getFullYear()} Rizky Ramadhan.
        </span>
      </footer>
    </div>
  );
}
