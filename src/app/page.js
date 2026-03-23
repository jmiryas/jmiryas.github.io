import Link from "next/link";
import ExperienceList from "@/components/ExperienceList";
import ProjectList from "@/components/ProjectList";
import { getAllPosts } from "@/lib/blog";
import { ChevronRight } from "lucide-react";

export default function Home() {
  const recentPosts = getAllPosts().slice(0, 3);

  return (
    <>
      <section id="about">
        <h2>Objective</h2>
        <p>
          Fullstack Developer with 2+ years of experience dedicated to building
          efficient backend architectures. I have had the opportunity to
          optimize complex systems, resulting in a 99% reduction in processing
          time and the successful management of high-volume payment
          integrations. My work prioritizes scalability and stability, utilizing
          tools like Redis and RabbitMQ to solve technical challenges
          effectively.
        </p>
      </section>

      <ExperienceList />
      <ProjectList />

      <section id="recent-posts">
        <div className="section-header-row">
          <h2>Recent Writing</h2>
          <Link href="/blog" className="btn-text" style={{ marginTop: 0 }}>
            View All Posts <ChevronRight size={14} />
          </Link>
        </div>

        {recentPosts.map((post) => (
          <Link
            key={post.slug}
            href={`/blog/${post.slug}`}
            className="list-item hover-link"
          >
            {/* Flex digunakan agar gap antara date dan title rapi sesuai prototipe */}
            <div
              style={{ display: "flex", gap: "1rem", alignItems: "baseline" }}
            >
              <span className="item-meta" style={{ minWidth: "100px" }}>
                {post.frontmatter.date}
              </span>
              <h3 style={{ margin: 0 }}>{post.frontmatter.title}</h3>
            </div>
          </Link>
        ))}
      </section>
    </>
  );
}
