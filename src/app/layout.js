import { Inter, Lora, Fira_Code } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import ScrollControls from "@/components/ScrollControls";

// Load fonts via Next.js for perfect rendering
const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const lora = Lora({
  subsets: ["latin"],
  variable: "--font-serif",
  style: ["normal", "italic"],
});
const firaCode = Fira_Code({ subsets: ["latin"], variable: "--font-mono" });

export const metadata = {
  title: "Rizky Ramadhan - Portfolio",
  description: "Software Engineer Portfolio",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${lora.variable} ${firaCode.variable}`}
    >
      <body>
        {children}
        <ScrollControls />
      </body>
    </html>
  );
}
