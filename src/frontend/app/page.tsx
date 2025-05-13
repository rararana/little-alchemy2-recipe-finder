"use client";
import { Josefin_Sans } from "next/font/google";
import { useRouter } from "next/navigation";
import Footer from "./_components/Footer";
import Navbar from "./_components/Navbar";

const josefinSans = Josefin_Sans({
  subsets: ["latin"],
  weight: ["700"],
});

const LandingPage = () => {
  const Router = useRouter();
  return (
    <div className="max-h-screen flex flex-col bg-[var(--background)] overflow-y-hidden">
      <Navbar variant="home" />
      {/* Konten Utama */}
      <div className="flex flex-1 items-center justify-center gap-[15vw] px-[8vw] my-[12.25vh]">
        {/* Kiri: Teks dan Tombol */}
        <div className="max-w-xl">
          <h1 className={`leading-[1.3] text-[3rem] text-white font-bold ${josefinSans.className}`}>
            Little<br />
            <span className="bg-gradient-to-br from-[#798772] to-[#D6BD98] bg-clip-text text-transparent">
              Alchemy
            </span>
            <br />
            Recipe Finder
          </h1>
          <div className="mt-6">
            <p className="font-semibold text-base text-white">
              Looking for a recipe in Little Alchemy?
            </p>
          </div>
          <div className="mt-4">
            <p className="text-sm text-white leading-relaxed">
              Just type the element you're curious about, and we'll show you all the<br />
              possible ways to make it — including the simplest, shortest recipe.
            </p>
          </div>
          <div className="mt-10 flex flex-wrap gap-5">
            <button 
              onClick={() => Router.push("/single-recipe")} 
              className="py-3 px-6 bg-[#D6BD98] rounded-md text-sm font-semibold text-[#1A3636] transition duration-300 hover:scale-105 hover:shadow-[0_0_1rem_rgba(214,189,152,0.25)]">
              Single Recipe
            </button>
            <button 
              onClick={() => Router.push("/multiple-recipe")}
              className="py-3 px-6 bg-[#D6BD98] rounded-md text-sm font-semibold text-[#1A3636] transition duration-300 hover:scale-105 hover:shadow-[0_0_1rem_rgba(214,189,152,0.25)]">
              Multiple Recipe
            </button>
          </div>
        </div>

        {/* Kanan: Gambar Beaver */}
        <div>
          <img
            src="Beaver_2.svg"
            className="w-[27vw] h-auto drop-shadow-[0px_0.5rem_0.3rem_rgba(0,0,0,0.5)]"
            alt="Beaver"
          />
        </div>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default LandingPage;
