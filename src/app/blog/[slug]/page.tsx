import { getPostData, getSortedPostsData } from "@/lib/posts";
import { formatDate } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import Link from "next/link";
import { ArrowLeft, Clock, Calendar } from "lucide-react";
import ScrollButtons from "@/components/ScrollButtons";
import hljs from "highlight.js";
import remarkGfm from "remark-gfm"; // OPTIONAL: Install 'npm install remark-gfm' untuk Table support lebih baik

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

      {/* COMPACT LAYOUT: Padding vertikal dikurangi (py-12 ke py-8/10) */}
      <div className="mx-auto max-w-screen-lg px-6 py-8 md:px-12 md:py-12 lg:py-16">
        {/* Navigation - Compact margin (mb-8) */}
        <Link
          href="/"
          className="group inline-flex items-center gap-2 font-mono text-xs font-medium text-slate-500 hover:text-slate-900 mb-8 transition-colors border-b border-transparent hover:border-slate-900 pb-0.5"
        >
          <ArrowLeft
            size={12}
            className="group-hover:-translate-x-1 transition-transform"
          />
          Back to Portfolio
        </Link>

        {/* Header Artikel - Compact margin (mb-8) */}
        <header className="mb-8 pb-8 border-b border-slate-100">
          <h1 className="font-serif text-3xl md:text-5xl font-bold text-slate-900 leading-[1.15] mb-5 tracking-tight">
            {post.title}
          </h1>

          <div className="flex flex-wrap items-center gap-5 font-mono text-xs font-medium text-slate-500 uppercase tracking-wider">
            <div className="flex items-center gap-2">
              <Calendar size={14} className="text-slate-400" />
              <span>{formatDate(post.date)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock size={14} className="text-slate-400" />
              <span>{post.readTime || "5 min read"}</span>
            </div>
          </div>
        </header>

        {/* Hero Image - Compact margin (mb-10) */}
        {post.image && (
          <figure className="mb-10">
            <div className="w-full aspect-video bg-slate-50 rounded-lg border border-slate-100 overflow-hidden relative shadow-sm">
              <img
                src={post.image}
                alt={post.caption || post.title}
                className="w-full h-full object-cover"
              />
            </div>
            {post.caption && (
              <figcaption className="mt-2 text-center font-mono text-xs text-slate-400 italic">
                {post.caption}
              </figcaption>
            )}
          </figure>
        )}

        {/* KONTEN ARTIKEL */}
        <div className="prose-custom">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]} // Gunakan ini agar Tabel markdown support sempurna
            components={{
              // CUSTOM CODE BLOCK (Tetap dipertahankan)
              code({ node, inline, className, children, ...props }: any) {
                const match = /language-(\w+)(?::([^"]+))?/.exec(
                  className || ""
                );
                const lang = match ? match[1] : "";
                const filename = match ? match[2] : "";
                const codeString = String(children).replace(/\n$/, "");

                if (!inline && match) {
                  const lines = codeString.split("\n");
                  let highlightedCode = codeString;
                  try {
                    if (hljs.getLanguage(lang)) {
                      highlightedCode = hljs.highlight(codeString, {
                        language: lang,
                      }).value;
                    }
                  } catch (e) {}

                  return (
                    // Compact margin untuk code block (my-6)
                    <div className="not-prose my-6 rounded-lg overflow-hidden shadow-lg bg-[#282c34] border border-slate-800 ring-1 ring-white/10">
                      <div className="flex items-center justify-between px-4 py-2 bg-[#21252b] border-b border-black/40">
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

                      <div className="flex overflow-hidden">
                        <div
                          aria-hidden="true"
                          className="select-none text-right border-r border-slate-700/50 bg-[#282c34] text-slate-600 p-4 pr-3 font-mono text-sm leading-relaxed min-w-[3.5rem]"
                        >
                          {lines.map((_, i) => (
                            <div key={i}>{i + 1}</div>
                          ))}
                        </div>
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

                return (
                  <code
                    className="bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded font-mono text-[0.85em] border border-slate-200 font-medium"
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

        {/* FOOTER */}
        <div className="mt-16 pt-8 border-t border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4 font-mono text-xs text-slate-500">
          <Link
            href="/blog"
            className="flex items-center gap-2 hover:text-slate-900 transition font-bold uppercase tracking-wide"
          >
            <ArrowLeft size={14} /> Back to All Posts
          </Link>
          <span className="text-slate-400">
            © {new Date().getFullYear()} Rizky Ramadhan.
          </span>
        </div>
      </div>
    </article>
  );
}
