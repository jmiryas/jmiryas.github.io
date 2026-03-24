import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getPostBySlug, getAllPosts } from "@/lib/blog";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypePrettyCode from "rehype-pretty-code";
import rehypeStringify from "rehype-stringify";

import CopyCodeInit from "@/components/CopyCodeInit";

export async function generateStaticParams() {
  const posts = getAllPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

export default async function BlogPost({ params }) {
  const resolvedParams = await params;
  const { slug } = resolvedParams;

  const post = getPostBySlug(slug);

  if (!post) {
    return <div>Post not found</div>;
  }

  // Proses markdown dan aktifkan line numbers via rehype-pretty-code
  const file = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype)
    .use(rehypePrettyCode, {
      theme: "one-dark-pro",
      keepBackground: false,
    })
    .use(rehypeStringify)
    .process(post.content);

  const htmlContent = String(file);

  return (
    <div className="reading-container">
      {/* Tombol Back sekarang mengarah langsung ke Beranda Utama (/) */}
      <Link href="/" className="nav-back hover-link">
        <ArrowLeft size={16} /> Back
      </Link>

      <h1 style={{ fontSize: "1.8rem", marginBottom: "0.2rem" }}>
        {post.frontmatter.title}
      </h1>
      <span
        className="item-meta"
        style={{ marginBottom: "1.5rem", display: "block" }}
      >
        Published on {post.frontmatter.date}
      </span>

      <div
        className="markdown-body"
        dangerouslySetInnerHTML={{ __html: htmlContent }}
      />

      <CopyCodeInit />
    </div>
  );
}
