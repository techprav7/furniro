import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import CardComponent from "./HeroSectionComponet/CardComponent";
import api from "../../../utils/api";
import { motion, AnimatePresence } from "framer-motion";

function HeroSection() {
  const navigate = useNavigate();
  const [allProducts, setAllProducts] = useState([]);
  const [limit, setLimit] = useState(8); // Default showing 8 products
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const data = await api("/api/products?limit=32&featured=true");
        setAllProducts(data.products || []);
      } catch (err) {
        console.error("Error fetching home products:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const visibleProducts = allProducts.slice(0, limit);

  const handleShowMore = () => {
    if (limit < allProducts.length) {
      setLimit((prev) => Math.min(prev + 8, allProducts.length));
    } else {
      navigate("/shop");
    }
  };

  if (loading) {
    return (
      <div className="HeroSection-wrapper mt-5 mb-20 px-4">
        <div className="heading flex justify-center text-center">
          <h2 className="text-3xl font-bold text-[#3A3A3A]">Our Products</h2>
        </div>
        <div className="flex justify-center items-center py-20">
          <p className="text-gray-500 font-medium">Loading products...</p>
        </div>
      </div>
    );
  }


  return (
    <div className="HeroSection-wrapper mt-5 mb-20 px-4">
      <div className="heading flex justify-center text-center">
        <h2 className="text-3xl font-bold text-[#3A3A3A]">Our Products</h2>
      </div>

      {/* Responsive grid layout */}
      <div className="product-list grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mt-8 overflow-hidden">
        <AnimatePresence>
          {visibleProducts.map((product) => (
            <motion.div
              key={product._id}
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 30, scale: 0.95 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              layout
            >
              <CardComponent
                product={product}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Show More Button */}
      <div className="bottombutton flex justify-center mt-12">
        <button 
          onClick={handleShowMore}
          className="py-3 px-10 border-2 border-[#B88E2F] text-[#B88E2F] font-bold hover:bg-[#B88E2F] hover:text-white transition duration-300 rounded"
        >
          {limit < allProducts.length ? "Show More" : "Explore More Products"}
        </button>
      </div>
    </div>
  );
}

export default HeroSection;

