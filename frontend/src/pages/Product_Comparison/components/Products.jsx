import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useComparisonStore, useCartStore } from '../../../store/store';
import { formatPrice } from '../../../data/productData';
import { Trash2, Star } from 'lucide-react';
import api from '../../../utils/api';


const Products = () => {
  const navigate = useNavigate();
  const { items, addToComparison, removeFromComparison } = useComparisonStore();
  const [allProducts, setAllProducts] = useState([]);

  useEffect(() => {
    const fetchCompareProducts = async () => {
      try {
        const data = await api("/api/products?limit=100");
        setAllProducts(data.products || []);
      } catch (err) {
        console.error("Error fetching comparison candidates:", err);
      }
    };
    fetchCompareProducts();
  }, []);

  // Filter out products already in comparison
  const availableToCompare = allProducts.filter(
    (ap) => !items.some((item) => item._id === ap._id)
  );

  const handleSelectProduct = (e) => {
    const productId = e.target.value;
    if (!productId) return;
    const selected = allProducts.find((p) => p._id === productId);
    if (selected) {
      addToComparison(selected);
    }
  };

  return (
    <div className='Productwrapper flex flex-col lg:flex-row gap-6 p-4 max-w-7xl mx-auto items-start'>
      <div className="title flex flex-col gap-2 w-full lg:w-[250px]">
        <h3 className="text-xl font-bold text-gray-900 leading-snug">Go to Product Page for more details</h3>
        <button 
          onClick={() => navigate('/shop')}
          className='text-left text-[#B88E2F] hover:text-[#906c20] cursor-pointer transition-colors duration-300 font-semibold inline-flex items-center gap-1'
        >
          View More Products &rarr;
        </button>
      </div>

      <div className="Products flex flex-col md:flex-row gap-4 flex-grow w-full lg:w-auto">
        {items.map((item) => (
          <div 
            key={item._id}
            className="card flex flex-col justify-between cursor-pointer border border-gray-200 bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-300 w-full md:w-[240px] relative group"
            onClick={() => navigate(`/product/${item._id}`)}
          >
            {/* Remove from comparison */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                removeFromComparison(item._id);
              }}
              className="absolute top-2 right-2 p-1.5 rounded-full bg-red-50 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-red-100"
              aria-label="Remove from comparison"
            >
              <Trash2 className="w-4 h-4" />
            </button>

            <div>
              <div className="h-[150px] flex items-center justify-center bg-gray-50 rounded-lg mb-3 p-2">
                <img src={item.image} className='max-h-full max-w-full object-contain' alt={item.name} />
              </div>
              <h4 className="font-bold text-[#3A3A3A] text-lg mb-1 truncate">{item.name}</h4>
              <h6 className="font-semibold text-gray-700 mb-2">{formatPrice(item.price)}</h6>
            </div>

            <div className="star-rating flex items-center gap-2 mt-2 pt-2 border-t border-gray-100">
              <p className='text-center mb-0 font-bold text-gray-800'>{item.rating || 4.5}</p>
              <div className="flex text-yellow-500">
                <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
              </div>
              <div className="bg-gray-300 w-[1px] h-6 mx-1"></div>
              <p className='text-gray-500 text-xs mb-0'>{item.reviewCount || 12} Reviews</p>
            </div>
          </div>
        ))}
      </div>

      {items.length < 3 && (
        <div className="choose flex flex-col gap-2 p-4 border border-dashed border-gray-300 rounded-xl w-full lg:w-[240px] bg-gray-50">
          <h3 className="text-lg font-bold text-gray-800">Add a product</h3>
          <p className="text-xs text-gray-500 mb-2">Compare up to 3 products</p>
          <div className="relative">
            <select
              onChange={handleSelectProduct}
              value=""
              className="w-full bg-[#B88E2F] hover:bg-[#a0781d] text-white font-bold rounded-full cursor-pointer p-2.5 px-4 outline-none transition-all duration-300 appearance-none pr-8 text-sm shadow-sm"
            >
              <option value="" disabled>Choose a product</option>
              {availableToCompare.map((ap) => (
                <option key={ap._id} value={ap._id} className="bg-white text-gray-800">
                  {ap.name} ({ap.category})
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-white">
              <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
              </svg>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;