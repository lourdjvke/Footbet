import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";

const WC_IMAGES = [
  "https://s.yimg.com/ny/api/res/1.2/uNqnF0982_oinxBzZW6wMw--/YXBwaWQ9aGlnaGxhbmRlcjt3PTEyNDI7aD02OTk7Y2Y9d2VicA--/https://media.zenfs.com/en/creative_bloq_161/c993fa31beb7f42d552238bea6d58105",
  "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRtFUpH3bBoOagrychSRtdd1R4FX2CbEPZ_RRdc9T3eww&s",
  "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT6IWi7ngJ5CzHJMQqteJ2KXLsRXdRL-uLclDbXweRCzQ&s=10"
];

interface RotatingWorldCupIconProps {
  className?: string;
  containerClassName?: string;
}

export function RotatingWorldCupIcon({ className, containerClassName }: RotatingWorldCupIconProps) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % WC_IMAGES.length);
    }, 2000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className={containerClassName}>
      <AnimatePresence mode="wait">
        <motion.img
          key={WC_IMAGES[index]}
          src={WC_IMAGES[index]}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.1 }}
          transition={{ duration: 0.5 }}
          className={className}
          alt="World Cup"
        />
      </AnimatePresence>
    </div>
  );
}
