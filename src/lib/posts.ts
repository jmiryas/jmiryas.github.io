import fs from "fs";
import path from "path";
import matter from "gray-matter";

// Pastikan folder src/content/posts ada dan berisi file .md
const postsDirectory = path.join(process.cwd(), "src/content/posts");

export function getSortedPostsData() {
  // Cek apakah folder ada agar tidak error saat build jika kosong
  if (!fs.existsSync(postsDirectory)) return [];

  const fileNames = fs.readdirSync(postsDirectory);
  const allPostsData = fileNames.map((fileName) => {
    const id = fileName.replace(/\.md$/, "");
    const fullPath = path.join(postsDirectory, fileName);
    const fileContents = fs.readFileSync(fullPath, "utf8");
    const { data, content } = matter(fileContents);

    return {
      id,
      content,
      title: data.title,
      date: data.date,
      excerpt: data.excerpt,
      readTime: data.readTime, // Tambahkan ini
      image: data.image, // Tambahkan ini
      caption: data.caption, // Tambahkan ini
    };
  });

  return allPostsData.sort((a, b) => (a.date < b.date ? 1 : -1));
}

export function getPostData(id: string) {
  const fullPath = path.join(postsDirectory, `${id}.md`);
  const fileContents = fs.readFileSync(fullPath, "utf8");
  const { data, content } = matter(fileContents);

  return {
    id,
    content,
    title: data.title,
    date: data.date,
    excerpt: data.excerpt,
    readTime: data.readTime, // Tambahkan ini
    image: data.image, // Tambahkan ini
    caption: data.caption, // Tambahkan ini
  };
}
