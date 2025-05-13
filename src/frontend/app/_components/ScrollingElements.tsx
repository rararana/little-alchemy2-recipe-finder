import { Josefin_Sans } from "next/font/google";

const josefinSans = Josefin_Sans({
  subsets: ["latin"],
  weight: ["700"],
});

const ScrollingElements = () => {
  const items1 = [
    { img: "Time.svg", label: "Time" },
    { img: "Rain.svg", label: "Rain" },
    { img: "Avalanche.svg", label: "Avalanche" },
    { img: "Fire.svg", label: "Fire" },
    { img: "Pond.svg", label: "Pond" },
    { img: "Idea.svg", label: "Idea" },
    { img: "Earthquake.svg", label: "Earthquake" },
    { img: "Ore.svg", label: "Ore" },
    { img: "Tornado.svg", label: "Tornado" },
  ];

  const items2 = [
    { img: "Sky.svg", label: "Sky" },
    { img: "Cyclops.svg", label: "Cyclops" },
    { img: "Rust.svg", label: "Rust" },
    { img: "Liquid.svg", label: "Liquid" },
    { img: "Pirate_ship.svg", label: "Pirate ship" },
    { img: "Fog.svg", label: "Fog" },
    { img: "Family.svg", label: "Family" },
    { img: "Jupiter.svg", label: "Jupiter" },
    { img: "Supernova.svg", label: "Supernova" },
  ];

  return (
    <div className="flex flex-col items-center space-y-6 anim">
      {/* Baris Pertama */}
      <div className="flex space-x-3">
        {items1.map((item, index) => (
          <div
            key={index}
            className="bg-[#677D6A] h-36 w-32 rounded-md mx-1.5 flex flex-col items-center justify-center transform transition duration-300 hover:scale-110 hover:shadow-[0_0_1rem_rgba(214,189,152,0.25)]"
          >
            <img src={item.img} className="h-14 mb-4 drop-shadow-[0_0_1rem_rgba(214,189,152,0.5)]" />
            <p className={`${josefinSans.className} text-white`}>{item.label}</p>
          </div>
        ))}
      </div>

      {/* Baris Kedua (duplikat) */}
      <div className="flex space-x-3">
        {items2.map((item, index) => (
          <div
            key={`second-${index}`}
            className="bg-[#677D6A] h-36 w-32 rounded-md mx-1.5 flex flex-col items-center justify-center transform transition duration-300 hover:scale-110 hover:shadow-[0_0_1rem_rgba(214,189,152,0.25)]"
          >
            <img src={item.img} className="h-14 mb-4 drop-shadow-[0_0_1rem_rgba(214,189,152,0.5)]" />
            <p className={`${josefinSans.className} text-white`}>{item.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ScrollingElements;
