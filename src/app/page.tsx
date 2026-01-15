import Link from "next/link";
import { profile, experiences } from "@/data/portfolio";
import ProjectSection from "@/components/ProjectSection";
import ScrollButtons from "@/components/ScrollButtons";
import { getSortedPostsData } from "@/lib/posts";
import { formatDate } from "@/lib/utils";
import { ArrowUpRight, Linkedin, Mail, MapPin } from "lucide-react";

export default function Home() {
  const allPosts = getSortedPostsData();
  const recentPosts = allPosts.slice(0, 3);

  return (
    // STANDAR: max-w-screen-lg, px-6 md:px-12
    <div className="mx-auto min-h-screen max-w-screen-lg px-6 py-8 md:px-12 md:py-12 lg:py-0">
      <ScrollButtons />

      {/* UPDATE: lg:gap-12 -> lg:gap-16 (Memberi sedikit space tambahan) */}
      <div className="lg:flex lg:justify-between lg:gap-16 lg:items-start">
        {/* --- PANEL KIRI (STICKY) --- */}
        {/* UPDATE: lg:py-16 -> lg:py-20 (Agar posisi start lebih enak dilihat/tidak mepet) */}
        <header className="lg:sticky lg:top-0 lg:flex lg:h-screen lg:w-1/3 lg:flex-col lg:justify-between lg:py-20">
          <div>
            <div className="mb-6 w-20 h-20 rounded-full overflow-hidden">
              <img
                src={profile.photo}
                alt={profile.name}
                className="w-full h-full object-cover"
              />
            </div>

            <h1 className="text-4xl font-bold tracking-tight text-slate-800 sm:text-5xl font-serif">
              {profile.name}
            </h1>
            <h2 className="mt-2 text-lg font-medium tracking-tight text-slate-700 sm:text-xl font-mono">
              {profile.role}
            </h2>
            <p className="mt-8 max-w-xs leading-relaxed text-slate-500 font-sans text-sm">
              A lifelong learner
            </p>

            <div className="mt-8 flex flex-col gap-2 font-mono text-xs text-slate-500">
              <span className="flex items-center gap-3">
                <MapPin size={16} className="shrink-0 text-slate-400" />{" "}
                {profile.location}
              </span>

              <a
                href={`mailto:${profile.email}`}
                className="flex items-center gap-3 hover:text-slate-900 transition w-fit group"
              >
                <Mail
                  size={16}
                  className="shrink-0 text-slate-400 group-hover:text-slate-900 transition-colors"
                />
                Email
              </a>

              <a
                href={profile.linkedin}
                target="_blank"
                className="flex items-center gap-3 hover:text-slate-900 transition w-fit group"
              >
                <Linkedin
                  size={16}
                  className="shrink-0 text-slate-400 group-hover:text-slate-900 transition-colors"
                />
                LinkedIn
              </a>
            </div>
          </div>

          <div className="hidden lg:block font-mono text-xs text-slate-400 font-medium">
            © {new Date().getFullYear()} Rizky Ramadhan.
          </div>
        </header>

        {/* --- PANEL KANAN (CONTENT) --- */}
        {/* pt-12 (Mobile) & lg:py-20 (Desktop): Start sejajar dengan panel kiri */}
        <main className="pt-12 lg:w-2/3 lg:py-20">
          {/* ABOUT */}
          <section id="about" className="mb-16 text-justify">
            <div className="font-sans text-slate-600 leading-loose text-base space-y-4">
              <p>{profile.about}</p>
            </div>
          </section>

          {/* EXPERIENCE */}
          <section id="experience" className="mb-16">
            <div className="sticky top-0 z-20 -mx-6 mb-6 w-screen bg-white/80 px-6 py-4 backdrop-blur md:-mx-12 md:px-12 lg:relative lg:top-auto lg:mx-auto lg:w-full lg:px-0 lg:py-0 lg:opacity-100">
              <h3 className="font-mono text-sm font-bold uppercase tracking-widest text-slate-800">
                Experience
              </h3>
            </div>

            <ol className="group/list space-y-8">
              {experiences.map((exp, i) => (
                <li
                  key={i}
                  className="group relative grid grid-cols-1 sm:grid-cols-8 gap-2 sm:gap-6 transition-all items-start"
                >
                  <header className="z-10 mt-1 text-xs font-semibold uppercase tracking-wide text-slate-400 sm:col-span-2 font-mono group-hover:text-slate-800 transition-colors">
                    {exp.period}
                  </header>
                  <div className="z-10 sm:col-span-6">
                    <h3 className="font-medium leading-snug text-slate-800 font-serif text-lg group-hover:text-blue-700 transition-colors">
                      {exp.role}
                    </h3>
                    <div className="text-slate-500 font-mono text-xs mt-1">
                      {exp.company}
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          {/* PROJECTS */}
          <section id="projects" className="mb-16">
            <div className="sticky top-0 z-20 -mx-6 mb-6 w-screen bg-white/80 px-6 py-4 backdrop-blur md:-mx-12 md:px-12 lg:relative lg:top-auto lg:mx-auto lg:w-full lg:px-0 lg:py-0 lg:opacity-100">
              <h3 className="font-mono text-sm font-bold uppercase tracking-widest text-slate-800">
                Projects
              </h3>
            </div>
            <ProjectSection />
          </section>

          {/* WRITING */}
          <section id="writing" className="mb-16">
            <div className="sticky top-0 z-20 -mx-6 mb-6 w-screen bg-white/80 px-6 py-4 backdrop-blur md:-mx-12 md:px-12 lg:relative lg:top-auto lg:mx-auto lg:w-full lg:px-0 lg:py-0 lg:opacity-100 flex justify-between items-center">
              <h3 className="font-mono text-sm font-bold uppercase tracking-widest text-slate-800">
                Writing
              </h3>
              <Link
                href="/blog"
                className="font-mono text-xs font-bold text-slate-800 hover:text-blue-700 hover:underline underline-offset-4 flex items-center gap-1"
              >
                All Posts <ArrowUpRight size={12} />
              </Link>
            </div>

            <ul className="space-y-4">
              {recentPosts.map((post) => (
                <li key={post.id}>
                  <Link
                    href={`/blog/${post.id}`}
                    className="group relative flex flex-col sm:flex-row gap-2 sm:gap-4 transition-all hover:bg-slate-50/50 -mx-3 p-3 rounded-lg items-baseline"
                  >
                    <div className="text-xs font-mono text-slate-400 sm:w-24 shrink-0 group-hover:text-slate-800 transition-colors">
                      {formatDate(post.date)}
                    </div>

                    <div>
                      <h3 className="font-serif font-bold text-slate-800 group-hover:text-blue-700 transition-colors text-base sm:text-lg">
                        {post.title}
                      </h3>
                      <p className="mt-1 text-sm leading-normal text-slate-500 font-sans line-clamp-2">
                        {post.excerpt}
                      </p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          <footer className="lg:hidden pt-6 text-xs font-mono text-slate-400 font-medium pb-12">
            © {new Date().getFullYear()} Rizky Ramadhan.
          </footer>
        </main>
      </div>
    </div>
  );
}
