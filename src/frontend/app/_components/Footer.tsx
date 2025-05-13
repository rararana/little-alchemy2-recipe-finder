import { Josefin_Sans } from "next/font/google";

const josefinSans = Josefin_Sans({
  subsets: ["latin"],
  weight: ["700"],
});

const Footer = () => {
  return (
    <div className="w-full border-t border-[#b3b3b3] bg-[var(--background)] px-[10vw] py-[2.35vh] flex items-center">
      <p className={`mr-[2.5vw] font-semibold text-white text-[0.9rem] mt-[0.5px] ${josefinSans.className}`}>
        Contributors
      </p>

      <div className="flex gap-[2.5vw] text-[0.8rem] text-white">
        <p>Ranashahira Reztaputri</p>
        <p>Syahrizal Bani Khairan</p>
        <p>Nayla Zahira</p>
      </div>
    </div>
  );
};

export default Footer;