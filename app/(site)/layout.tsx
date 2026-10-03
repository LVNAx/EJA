import { AuroraBackground } from "@/components/screening/AuroraBackground";
import { Footer } from "@/components/site/Footer";
import { Navbar } from "@/components/site/Navbar";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AuroraBackground />
      <Navbar />
      <main id="main">{children}</main>
      <Footer />
    </>
  );
}
