import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useWishlistStore, useCartStore } from '../../../store/store';
import { formatPrice } from '../../../data/productData';
import { Trash2, ShoppingBag, Heart } from 'lucide-react';

const Wishlist_products = () => {
  const navigate = useNavigate();
  const { items, removeFromWishlist } = useWishlistStore();
  const { addToCart } = useCartStore();
  const [toastMessage, setToastMessage] = useState("");

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage("");
    }, 2000);
  };

  const handleMoveToCart = (product) => {
    addToCart(product, 1);
    removeFromWishlist(product._id);
    showToast("Moved to Cart!");
  };

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-md mx-auto bg-white p-8 rounded-xl shadow-sm border border-gray-150">
          <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Your Wishlist is Empty</h2>
          <p className="text-gray-500 mb-6">Explore products and click the Heart icon to add items here.</p>
          <Link
            to="/shop"
            className="inline-block bg-[#B88E2F] text-white px-8 py-3 rounded font-semibold hover:bg-[#a5761f] transition"
          >
            Go to Shop
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-auto p-4 max-w-7xl mx-auto">
      {toastMessage && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-85 text-white text-sm px-6 py-2 rounded-full z-50 transition-all shadow-lg">
          {toastMessage}
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-4">
        <div className="left-panel flex flex-col w-full">
          <div className="bg-[#faf3ea] h-[60px] items-center justify-center hidden md:flex rounded-t-lg">
            <ul className="flex font-bold mb-0 p-4 w-full justify-center items-center text-gray-700 text-sm">
              <li className="text-center flex-1">PRODUCT IMAGE</li>
              <li className="text-center flex-1">NAME</li>
              <li className="text-center flex-1">PRICE</li>
              <li className="text-center flex-1">ACTION</li>
              <li className="text-center flex-1">REMOVE</li>
            </ul>
          </div>

          {/* Wishlist Items List */}
          <div className="flex flex-col border border-gray-200 rounded-b-lg divide-y divide-gray-200 bg-white shadow-sm">
            {items.map((item) => (
              <ul key={item._id} className="flex flex-col md:flex-row mb-0 p-6 w-full justify-center items-center gap-4 md:gap-0">
                <li className="text-center flex-1 min-w-[100px]">
                  <img
                    onClick={() => navigate(`/product/${item._id}`)}
                    src={item.image}
                    className="h-[100px] w-auto object-contain rounded-md cursor-pointer hover:opacity-80 transition duration-300 mx-auto"
                    alt={item.name}
                  />
                </li>
                <li className="text-center flex-1 min-w-[100px] font-semibold text-gray-800">
                  {item.name}
                </li>
                <li className="text-center flex-1 min-w-[100px] text-gray-600">
                  {formatPrice(item.price)}
                </li>
                <li className="text-center flex-1 min-w-[120px]">
                  <button 
                    onClick={() => handleMoveToCart(item)}
                    className="py-2 px-5 border border-[#B88E2F] text-[#B88E2F] font-semibold hover:bg-[#B88E2F] hover:text-white transition duration-300 rounded-full shadow-sm"
                  >
                    Move to Cart
                  </button>
                </li>
                <li className="text-center flex-1 min-w-[100px]">
                  <button
                    onClick={() => removeFromWishlist(item._id)}
                    className="text-red-500 hover:text-red-700 transition p-2 hover:bg-red-50 rounded-full"
                    aria-label="Remove wishlist item"
                  >
                    <Trash2 className="w-5 h-5 mx-auto" />
                  </button>
                </li>
              </ul>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Wishlist_products;

