"use client";

import React from "react";
import { Josefin_Sans } from "next/font/google";
import { useRouter } from "next/navigation";

const josefinSans = Josefin_Sans({
  subsets: ["latin"],
  weight: ["700"],
});

type NavbarProps = {
  variant: "home" | "single" | "multiple";
  currentRecipeMode?: number;
  setRecipeMode?: (value: number) => void;
};

const Navbar = ({ variant, currentRecipeMode, setRecipeMode }: NavbarProps) => {
  const router = useRouter();

  const wrapper =
    "grid grid-cols-2 items-center justify-center mx-[10px] h-8.5 " +
    "w-[350px] rounded-[200px] border-2 border-[var(--foreground)] " +
    "bg-[var(--foreground)]";
  
  const highlight =
    "h-[85%] w-[95%] bg-white/70 mx-[5px] text-[var(--background)] " +
    "rounded-[200px] flex justify-center items-center text-sm text-bold";
  const inactive =
    "h-[85%] w-[95%] mx-[5px] rounded-[200px] flex justify-center items-center " +
    "text-white text-sm cursor-pointer " +
    "transition duration-200 hover:scale-105";

  const maybeHighlight = (n: number) =>
    currentRecipeMode === n ? highlight : inactive;

  const handleClickSR = (setRecipeMode: (value: number) => void) => {
    if (setRecipeMode) {
      setRecipeMode(1);
    }
    router.push("/single-recipe");
  };

  const handleClickMR = (setRecipeMode: (value: number) => void) => {
    setRecipeMode(2);
    router.push("/multiple-recipe");
  };

  return (
    <div className="sticky top-0 z-50 h-auto w-full border-b border-[#b3b3b3] bg-[var(--background)] pl-5 pr-10 flex items-center justify-between">
      {/* ---- logo ---- */}
      <div className="flex items-center gap-x-1 cursor-pointer" onClick={() => router.push("/")}>
        <div
          className="w-[50px] h-[50px] bg-[#d6bd98]"
          style={{
            maskImage: 'url("/little-alchemy-2-icon.png")',
            WebkitMaskImage: 'url("/little-alchemy-2-icon.png")',
            maskSize: "50px 50px",
            WebkitMaskSize: "50px 50px",
            maskRepeat: "no-repeat",
            WebkitMaskRepeat: "no-repeat",
            maskPosition: "center",
            WebkitMaskPosition: "center",
          }}
        />
        <p className={`text-[#f3f3f3] text-lg leading-none transition duration-200 hover:scale-110 ${josefinSans.className}`}>
          Home
        </p>
      </div>

      {/* ---- conditional layout ---- */}
      {variant === "home" && (
        <div className="flex gap-6 text-sm text-white">
          <button onClick={() => router.push("/single-recipe")}>Single recipe</button>
          <button onClick={() => router.push("/multiple-recipe")}>Multiple recipe</button>
        </div>
      )}

      {(variant === "single" || variant === "multiple") && currentRecipeMode !== undefined && setRecipeMode && (
        <div className={wrapper}>
          <p className={maybeHighlight(1)} onClick={() => handleClickSR(setRecipeMode)}>Single recipe</p>
          <p className={maybeHighlight(2)} onClick={() => handleClickMR(setRecipeMode)}>Multiple recipe</p>
        </div>
      )}
    </div>
  );
};

export default Navbar;
