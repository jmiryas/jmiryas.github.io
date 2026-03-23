import fs from "fs";
import path from "path";
import matter from "gray-matter";

const postsDirectory = path.join(process.cwd(), "content/blog");

export function getPostSlugs() {
  // Hanya ambil file yang berakhiran .md (mengabaikan file sistem seperti .DS_Store)
  return fs.readdirSync(postsDirectory).filter((file) => file.endsWith(".md"));
}

export function getPostBySlug(slug) {
  // Validasi tambahan untuk mencegah undefined
  if (!slug) return null;

  const realSlug = slug.replace(/\.md$/, "");
  const fullPath = path.join(postsDirectory, `${realSlug}.md`);
  const fileContents = fs.readFileSync(fullPath, "utf8");
  const { data, content } = matter(fileContents);

  return { slug: realSlug, frontmatter: data, content };
}

export function getAllPosts() {
  const slugs = getPostSlugs();
  const posts = slugs
    .map((slug) => getPostBySlug(slug))
    .filter(Boolean) // Membuang nilai null jika ada
    .sort((post1, post2) =>
      new Date(post1.frontmatter.date) > new Date(post2.frontmatter.date)
        ? -1
        : 1,
    );
  return posts;
}
