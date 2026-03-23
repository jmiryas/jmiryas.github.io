import { MapPin, Mail, Linkedin, Github } from "lucide-react";
import Image from "next/image";

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <Image
        src="/images/profile.png"
        alt="Rizky Ramadhan"
        width={85}
        height={85}
        className="profile-img"
      />

      <h1 className="profile-name">Rizky Ramadhan</h1>
      <div className="profile-role">Fullstack Developer</div>

      <p className="profile-quote">A lifelong learner</p>

      <div className="profile-links">
        <div className="link-item">
          <MapPin size={16} /> <span>Jakarta, Indonesia</span>
        </div>
        <a href="mailto:jmiryas@gmail.com" className="link-item">
          <Mail size={16} /> <span>jmiryas@gmail.com</span>
        </a>
        <a
          href="https://www.linkedin.com/in/rizky-ramadhan28/"
          className="link-item"
          target="_blank"
        >
          <Linkedin size={16} /> <span>/in/rizkyramadhan</span>
        </a>
        <a
          href="https://github.com/jmiryas"
          className="link-item"
          target="_blank"
        >
          <Github size={16} /> <span>github.com/jmiryas</span>
        </a>
      </div>
    </aside>
  );
}
