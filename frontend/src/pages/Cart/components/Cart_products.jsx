import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCartStore } from '../../../store/store';
import { formatPrice } from '../../../data/productData';
import { Trash2, ShoppingBag } from 'lucide-react';

const Cart_products = () => {
  const navigate = useNavigate();
  const { items, updateQuantity, removeFromCart, getTotal } = useCartStore();

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-md mx-auto bg-white p-8 rounded-xl shadow-sm border border-gray-150">
          <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Your Cart is Empty</h2>
          <p className="text-gray-500 mb-6">Looks like you haven't added any products to your cart yet.</p>
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
    <div className="w-full h-auto p-4 box-border overflow-x-hidden max-w-7xl mx-auto">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Left Panel - Products Table */}
        <div className="left-panel flex flex-col w-full lg:w-[70%]">
          <div className="bg-[#faf3ea] h-[60px] items-center justify-center hidden md:flex rounded-t-lg">
            <ul className="flex font-bold mb-0 p-4 w-full justify-center items-center text-gray-700 text-sm">
              <li className="text-center flex-1">PRODUCT IMAGE</li>
              <li className="text-center flex-1">NAME</li>
              <li className="text-center flex-1">PRICE</li>
              <li className="text-center flex-1">QUANTITY</li>
              <li className="text-center flex-1">SUBTOTAL</li>
              <li className="text-center flex-1">REMOVE</li>
            </ul>
          </div>

          <div className="flex flex-col border border-gray-200 rounded-b-lg divide-y divide-gray-200 bg-white shadow-sm">
            {items.map((item) => {
              const isOutOfStock = item.stock !== undefined && item.stock <= 0;
              const hasInsufficientStock = item.stock !== undefined && item.quantity > item.stock;
              return (
                <ul key={item._id} className={`flex flex-col md:flex-row mb-0 p-6 w-full justify-center items-center gap-4 md:gap-0 ${
                  isOutOfStock ? "bg-red-50/30" : ""
                }`}>
                  <li className="text-center flex-1 min-w-[100px] relative">
                    <img 
                      onClick={() => navigate(`/product/${item._id}`)}
                      src={item.image} 
                      alt={item.name}
                      className={`h-[100px] w-auto object-contain rounded-md cursor-pointer hover:opacity-80 transition duration-300 mx-auto ${
                        isOutOfStock ? "opacity-50 grayscale-[50%]" : ""
                      }`} 
                    />
                    {isOutOfStock && (
                      <span className="absolute top-0 left-1/2 transform -translate-x-1/2 bg-red-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded uppercase shadow-sm">
                        Out of Stock
                      </span>
                    )}
                  </li>
                  <li className="text-center flex-1 min-w-[100px] font-semibold text-gray-800 flex flex-col items-center">
                    <span>{item.name}</span>
                    {hasInsufficientStock && !isOutOfStock && (
                      <span className="text-[10px] text-orange-600 font-bold mt-1">
                        Only {item.stock} available!
                      </span>
                    )}
                  </li>
                  <li className="text-center flex-1 min-w-[100px] text-gray-600">
                    {formatPrice(item.price)}
                  </li>
                  <li className="text-center flex-1 min-w-[100px] flex justify-center items-center">
                    <div className="flex items-center gap-2 border border-gray-300 rounded px-2 py-1 bg-white">
                      <button 
                        onClick={() => updateQuantity(item._id, item.quantity - 1)}
                        className="font-bold text-gray-600 hover:text-black px-1"
                      >
                        -
                      </button>
                      <span className="w-6 text-center font-bold text-gray-800">{isOutOfStock ? 0 : item.quantity}</span>
                      <button 
                        onClick={() => updateQuantity(item._id, item.quantity + 1)}
                        disabled={isOutOfStock || item.quantity >= (item.stock || 999)}
                        className="font-bold text-gray-600 hover:text-black px-1 disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        +
                      </button>
                    </div>
                  </li>
                  <li className="text-center flex-1 min-w-[100px] font-bold text-gray-800">
                    {formatPrice(item.price * (isOutOfStock ? 0 : item.quantity))}
                  </li>
                  <li className="flex-1 text-center min-w-[100px]">
                    <button 
                      onClick={() => removeFromCart(item._id)}
                      className="text-red-500 hover:text-red-700 transition p-2 hover:bg-red-50 rounded-full"
                      aria-label="Remove item"
                    >
                      <Trash2 className="w-5 h-5 mx-auto" />
                    </button>
                  </li>
                </ul>
              );
            })}
          </div>
        </div>

        {/* Right Panel - Cart Total */}
        <div className="bg-[#faf3ea] flex flex-col items-center p-6 w-full lg:w-[30%] rounded-lg shadow-sm border border-gray-250/50 h-fit">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b border-gray-200 pb-2 w-full text-center">Cart Totals</h2>
          
          <div className="flex w-full justify-between mb-4 border-b border-gray-200 pb-3 text-sm sm:text-base">
            <span className="font-semibold text-gray-600">Subtotal</span>
            <span className="text-gray-500 font-medium">
              {formatPrice(
                items.reduce((total, item) => {
                  const isOutOfStock = item.stock !== undefined && item.stock <= 0;
                  return total + (isOutOfStock ? 0 : item.price * item.quantity);
                }, 0)
              )}
            </span>
          </div>
          
          <div className="flex w-full justify-between mb-8 pb-3 text-base sm:text-lg">
            <span className="font-bold text-gray-800">Total</span>
            <span className="text-[#B88E2F] font-bold">
              {formatPrice(
                items.reduce((total, item) => {
                  const isOutOfStock = item.stock !== undefined && item.stock <= 0;
                  return total + (isOutOfStock ? 0 : item.price * item.quantity);
                }, 0)
              )}
            </span>
          </div>
          
          {items.some(item => item.stock !== undefined && (item.stock <= 0 || item.quantity > item.stock)) && (
            <p className="text-xs text-red-600 font-semibold mb-4 text-center leading-normal">
              ⚠️ Please remove out-of-stock items or reduce quantities to match available stock.
            </p>
          )}

          <button 
            onClick={() => navigate('/checkout')}
            disabled={items.some(item => item.stock !== undefined && (item.stock <= 0 || item.quantity > item.stock))}
            className={`w-full py-3 text-white font-bold rounded shadow transition duration-300 ${
              items.some(item => item.stock !== undefined && (item.stock <= 0 || item.quantity > item.stock))
                ? "bg-gray-400 cursor-not-allowed opacity-65"
                : "bg-[#B88E2F] hover:bg-[#a5761f]"
            }`}
          >
            Check Out
          </button>
        </div>
      </div>
    </div>
  );
};

export default Cart_products;

