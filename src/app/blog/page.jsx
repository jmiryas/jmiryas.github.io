import { getAllPosts } from "@/lib/blog";
import BlogClientPage from "./BlogClientPage";

export default function BlogPage() {
  const posts = getAllPosts();
  return <BlogClientPage posts={posts} />;
}
