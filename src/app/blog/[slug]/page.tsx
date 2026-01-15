import { getPostData, getSortedPostsData } from "@/lib/posts";
import { formatDate } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import Link from "next/link";
import { ArrowLeft, Clock, Calendar } from "lucide-react";
import ScrollButtons from "@/components/ScrollButtons";
import hljs from "highlight.js";

// Penting: Pastikan di layout.tsx sudah ada: import "highlight.js/styles/atom-one-dark.css";

export async function generateStaticParams() {
  const posts = getSortedPostsData();
  return posts.map((post) => ({
    slug: post.id,
  }));
}

export default async function PostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getPostData(slug);

  return (
    <article className="min-h-screen bg-white selection:bg-blue-100 selection:text-blue-900">
      <ScrollButtons />

      {/* STANDAR: max-w-screen-lg, px-6 md:px-12, py seragam */}
      <div className="mx-auto max-w-screen-lg px-6 py-12 md:px-12 md:py-16 lg:py-20">
        {/* Navigation */}
        <Link
          href="/"
          className="group inline-flex items-center gap-2 font-mono text-xs text-slate-500 hover:text-slate-900 mb-10 transition-colors border-b border-transparent hover:border-slate-900 pb-0.5"
        >
          <ArrowLeft
            size={12}
            className="group-hover:-translate-x-1 transition-transform"
          />
          Back to Portfolio
        </Link>

        {/* Header - Dibatasi max-w-3xl agar fokus */}
        <header className="mb-10 max-w-3xl">
          <div className="flex flex-wrap items-center gap-4 font-mono text-xs text-slate-500 mb-6 uppercase tracking-wider">
            <div className="flex items-center gap-2">
              <Calendar size={12} />
              <span>{formatDate(post.date)}</span>
            </div>
            <div className="w-px h-3 bg-slate-300"></div>
            <div className="flex items-center gap-2">
              <Clock size={12} />
              <span>{post.readTime || "5 min read"}</span>
            </div>
          </div>

          <h1 className="font-serif text-3xl md:text-5xl font-bold text-slate-800 leading-[1.15]">
            {post.title}
          </h1>
        </header>

        {/* Hero Image */}
        {post.image && (
          <figure className="mb-12">
            <div className="w-full aspect-video bg-slate-50 rounded border border-slate-100 overflow-hidden relative shadow-sm">
              <img
                src={post.image}
                alt={post.caption || post.title}
                className="w-full h-full object-cover"
              />
            </div>
            {post.caption && (
              <figcaption className="mt-3 text-center font-mono text-xs text-slate-400">
                {post.caption}
              </figcaption>
            )}
          </figure>
        )}

        {/* CONTENT */}
        <div className="prose-custom">
          <ReactMarkdown
            components={{
              code({ node, inline, className, children, ...props }: any) {
                const match = /language-(\w+)(?::([^"]+))?/.exec(
                  className || "",
                );
                const lang = match ? match[1] : "";
                const filename = match ? match[2] : "";

                // Bersihkan newline di akhir string agar tidak ada baris kosong ekstra
                const codeString = String(children).replace(/\n$/, "");

                if (!inline && match) {
                  // 1. Hitung jumlah baris untuk Line Numbers
                  const lines = codeString.split("\n");

                  // 2. Syntax Highlight Logic
                  let highlightedCode = codeString;
                  try {
                    if (hljs.getLanguage(lang)) {
                      highlightedCode = hljs.highlight(codeString, {
                        language: lang,
                      }).value;
                    }
                  } catch (e) {}

                  return (
                    <div className="not-prose my-8 rounded-lg overflow-hidden shadow-xl bg-[#282c34] border border-slate-800 ring-1 ring-white/10">
                      {/* WINDOW HEADER */}
                      <div className="flex items-center justify-between px-4 py-3 bg-[#21252b] border-b border-black/40">
                        <div className="flex items-center gap-3">
                          <div className="flex gap-1.5">
                            <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f56]"></div>
                            <div className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]"></div>
                            <div className="w-2.5 h-2.5 rounded-full bg-[#27c93f]"></div>
                          </div>
                          {filename && (
                            <span className="font-mono text-xs text-slate-400 select-none ml-2">
                              {filename}
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider">
                          {lang}
                        </div>
                      </div>

                      {/* WINDOW BODY: Flex Container (Lines + Code) */}
                      <div className="flex overflow-hidden">
                        {/* COL 1: LINE NUMBERS */}
                        <div
                          aria-hidden="true"
                          className="select-none text-right border-r border-slate-700/50 bg-[#282c34] text-slate-600 p-4 pr-3 font-mono text-sm leading-relaxed min-w-[3.5rem]"
                        >
                          {lines.map((_, i) => (
                            <div key={i}>{i + 1}</div>
                          ))}
                        </div>

                        {/* COL 2: CODE CONTENT */}
                        <div className="flex-1 overflow-x-auto">
                          <pre className="!bg-[#282c34] !m-0 !p-4 !font-mono text-sm leading-relaxed !border-none text-slate-300">
                            <code
                              className={`hljs language-${lang}`}
                              dangerouslySetInnerHTML={{
                                __html: highlightedCode,
                              }}
                              {...props}
                            />
                          </pre>
                        </div>
                      </div>
                    </div>
                  );
                }

                // INLINE CODE
                return (
                  <code
                    className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-mono text-[0.85em] border border-slate-200 font-medium"
                    {...props}
                  >
                    {children}
                  </code>
                );
              },
            }}
          >
            {post.content}
          </ReactMarkdown>
        </div>

        {/* Footer */}
        <div className="mt-20 pt-8 border-t border-slate-100 flex justify-between items-center font-mono text-xs text-slate-500 max-w-3xl">
          <span>End of Article</span>
          <Link
            href="/blog"
            className="flex items-center gap-2 hover:text-slate-900 transition font-bold"
          >
            Read More Posts <ArrowLeft size={14} className="rotate-180" />
          </Link>
        </div>

        <footer className="mt-12 pt-6 text-xs font-mono text-slate-400 font-medium">
          © {new Date().getFullYear()} Rizky Ramadhan.
        </footer>
      </div>
    </article>
  );
}
