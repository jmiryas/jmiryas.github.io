import Sidebar from "@/components/Sidebar";

export default function MainLayout({ children }) {
  return (
    <div className="container">
      <Sidebar />
      <main>{children}</main>
    </div>
  );
}
