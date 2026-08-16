import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { cloudinaryAssets } from "../../../cloudinaryAssets";

const asgaardBg = cloudinaryAssets["scandinavian-interior-mockup-wall-decal-background 1.png"];
const lolitoBg = cloudinaryAssets["Image-living room.png"];
const cloudBedBg = cloudinaryAssets["image 101.png"];
const syltherineBg = cloudinaryAssets["Mask Group.png"];

const slides = [
  {
    productId: "prod_009",
    tagline: "New Arrival",
    headline: "Discover The Elegance of Asgaard Sofa",
    description: "Experience unmatched comfort with our handcrafted Scandinavian oak sofa, designed to be the highlight of your living room.",
    bg: asgaardBg,
  },
  {
    productId: "prod_003",
    tagline: "Living Room Luxury",
    headline: "Redefine Relaxation with Lolito Sofa",
    description: "Featuring deep cushioning and premium upholstery, this luxury big sofa brings timeless comfort to your living space.",
    bg: lolitoBg,
  },
  {
    productId: "prod_013",
    tagline: "Bedroom Sanctuary",
    headline: "Cozy Up in the Cloud King Bed",
    description: "A premium velvet upholstered platform bed with a padded headboard, crafting the perfect dream environment.",
    bg: cloudBedBg,
  },
  {
    productId: "prod_001",
    tagline: "Modern Dining",
    headline: "Elegance Meets Syltherine Chair",
    description: "Sleek cafe chair featuring a premium wood finish and ergonomic back support. Perfect for modern dining spaces.",
    bg: syltherineBg,
  },
];

function CategorySection() {
  const navigate = useNavigate();
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(0); // -1 for left, 1 for right
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (isHovered) return;
    const timer = setInterval(() => {
      handleNext();
    }, 1500);
    return () => clearInterval(timer);
  }, [current, isHovered]);

  const handleNext = () => {
    setDirection(1);
    setCurrent((prev) => (prev + 1) % slides.length);
  };

  const handlePrev = () => {
    setDirection(-1);
    setCurrent((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const handleDotClick = (index) => {
    setDirection(index > current ? 1 : -1);
    setCurrent(index);
  };

  // Variants for background fade/slide transitions
  const bgVariants = {
    initial: (dir) => ({
      opacity: 0,
      scale: 1.05,
    }),
    animate: {
      opacity: 1,
      scale: 1,
      transition: { duration: 0.8, ease: "easeInOut" },
    },
    exit: (dir) => ({
      opacity: 0,
      transition: { duration: 0.8, ease: "easeInOut" },
    }),
  };

  // Variants for description box slide up
  const contentVariants = {
    initial: { opacity: 0, y: 30 },
    animate: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, delay: 0.2, ease: "easeOut" },
    },
    exit: {
      opacity: 0,
      y: -20,
      transition: { duration: 0.3, ease: "easeIn" },
    },
  };

  const activeSlide = slides[current];

  return (
    <div
      className="categorysection-wrapper relative w-full h-[550px] md:h-[650px] lg:h-[700px] overflow-hidden bg-gray-150"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Background Slideshow */}
      <div className="absolute inset-0 w-full h-full">
        <AnimatePresence initial={false} custom={direction}>
          <motion.img
            key={current}
            custom={direction}
            variants={bgVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            src={activeSlide.bg}
            alt="Interior Setup"
            className="absolute inset-0 w-full h-full object-cover"
          />
        </AnimatePresence>
        {/* Subtle Dark Overlay to boost premium card readability */}
        <div className="absolute inset-0 bg-black/10 pointer-events-none" />
      </div>

      {/* Info Card (Dynamic Content) */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[90%] p-6 sm:w-[70%] sm:p-8 md:w-[50%] md:left-[55%] lg:left-[60%] lg:w-[40%] xl:w-[35%] lg:p-10 lg:-translate-x-0 bg-[#FFF3E3]/95 backdrop-blur-sm rounded-lg shadow-xl z-20 border border-white/20">
        <AnimatePresence mode="wait">
          <motion.div
            key={current}
            variants={contentVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            <div className="top-heading mb-2">
              <h6 className="text-xs uppercase tracking-widest font-bold text-[#B88E2F]">
                {activeSlide.tagline}
              </h6>
            </div>

            <div className="headline mb-4">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#B88E2F] leading-tight">
                {activeSlide.headline}
              </h2>
            </div>

            <div className="p-tag mb-6">
              <p className="text-gray-700 text-sm sm:text-base leading-relaxed">
                {activeSlide.description}
              </p>
            </div>

            <button
              onClick={() => navigate(`/product/${activeSlide.productId}`)}
              className="bg-[#B88E2F] text-white px-8 py-3.5 font-bold hover:bg-[#a5761f] transition-all duration-300 shadow-md hover:shadow-lg rounded-full tracking-wider text-xs sm:text-sm uppercase"
            >
              Buy Now
            </button>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Side Arrow Navigation Buttons */}
      <button
        onClick={handlePrev}
        className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/70 hover:bg-[#B88E2F] text-[#B88E2F] hover:text-white backdrop-blur-sm border border-[#B88E2F]/20 p-2.5 sm:p-3 rounded-full transition-all duration-300 z-30 shadow-md hover:scale-105"
        aria-label="Previous Slide"
      >
        <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
      </button>
      <button
        onClick={handleNext}
        className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/70 hover:bg-[#B88E2F] text-[#B88E2F] hover:text-white backdrop-blur-sm border border-[#B88E2F]/20 p-2.5 sm:p-3 rounded-full transition-all duration-300 z-30 shadow-md hover:scale-105"
        aria-label="Next Slide"
      >
        <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
      </button>

      {/* Dot Indicators */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-3 z-30">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => handleDotClick(index)}
            className={`w-3 h-3 rounded-full transition-all duration-300 cursor-pointer ${
              index === current
                ? "bg-[#B88E2F] scale-125 shadow-sm px-2.5"
                : "bg-gray-400 hover:bg-gray-600"
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

export default CategorySection;
