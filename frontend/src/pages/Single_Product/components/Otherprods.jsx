import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import CardComponent from "../../Home/components/HeroSectionComponet/CardComponent";
import api from "../../../utils/api";

const Otherprods = ({ product }) => {
  const navigate = useNavigate();
  const [relatedProducts, setRelatedProducts] = useState([]);

  useEffect(() => {
    const fetchRelated = async () => {
      try {
        const data = await api(`/api/products?category=${encodeURIComponent(product.category)}&limit=5`);
        const filtered = (data.products || []).filter(p => p._id !== product._id).slice(0, 4);
        setRelatedProducts(filtered);
      } catch (err) {
        console.error("Error loading related products:", err);
      }
    };
    if (product && product.category) {
      fetchRelated();
    }
  }, [product]);

  const handleShowMore = () => {
    navigate(`/shop?category=${encodeURIComponent(product.category)}`);
  };

  return (
    <div className="HeroSection-wrapper mt-5 mb-20 px-4">
      <div className="heading flex justify-center text-center">
        <h2 className="text-3xl font-bold text-gray-900">Related Products</h2>
      </div>
      
      <div className="product-list grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mt-8">
        {relatedProducts.map((p) => (
          <CardComponent
            key={p._id}
            product={p}
          />
        ))}
      </div>

      <div className="bottombutton flex justify-center mt-10">
        <button 
          onClick={handleShowMore}
          className="py-3 px-10 border-2 border-[#B88E2F] text-[#B88E2F] font-bold hover:bg-[#B88E2F] hover:text-white transition duration-300 rounded-full shadow-sm"
        >
          Show More
        </button>
      </div>
    </div>
  );
};

export default Otherprods;