import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCartStore, useComparisonStore, useWishlistStore } from '../../../store/store';
import { formatPrice } from '../../../data/productData';
import { Heart, Share2, Star, StarHalf, ShoppingCart } from 'lucide-react';

const ProductDetail = ({ product }) => {
  const navigate = useNavigate();
  const { addToCart } = useCartStore();
  const { addToComparison, isInComparison } = useComparisonStore();
  const { addToWishlist, isInWishlist, removeFromWishlist } = useWishlistStore();

  const isOutOfStock = product.stock !== undefined && product.stock <= 0;
  const [quantity, setQuantity] = useState(isOutOfStock ? 0 : 1);
  const [selectedImage, setSelectedImage] = useState(product.image);
  const [selectedSize, setSelectedSize] = useState(
    () => (product.sizes || []).find(s => s.available)?.label || null
  );
  const [selectedColor, setSelectedColor] = useState(
    () => (product.colors || []).find(c => c.available)?.hex || null
  );
  const [toastMessage, setToastMessage] = useState("");
  const [showSharePopup, setShowSharePopup] = useState(false);

  const isLiked = isInWishlist(product._id);
  const isCompared = isInComparison(product._id);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage("");
    }, 2000);
  };

  const handleQuantityChange = (val) => {
    const maxStock = product.stock !== undefined ? product.stock : 999;
    if (maxStock <= 0) {
      setQuantity(0);
      return;
    }
    setQuantity(Math.min(maxStock, Math.max(1, quantity + val)));
  };

  const handleAddToCart = () => {
    addToCart(product, quantity);
    showToast("Added to Cart!");
  };

  const handleBuyNow = () => {
    addToCart(product, quantity);
    navigate('/checkout');
  };

  const handleCompare = () => {
    addToComparison(product);
    showToast("Added to Comparison!");
    setTimeout(() => {
      navigate('/comparison');
    }, 800);
  };

  const handleWishlistToggle = () => {
    if (isLiked) {
      removeFromWishlist(product._id);
      showToast("Removed from Wishlist");
    } else {
      addToWishlist(product);
      showToast("Added to Wishlist!");
    }
  };

  const handleShare = () => {
    const shareUrl = window.location.href;
    navigator.clipboard.writeText(shareUrl)
      .then(() => {
        setShowSharePopup(true);
        setTimeout(() => setShowSharePopup(false), 2500);
      })
      .catch(() => showToast("Could not copy link"));
  };

  // Render star rating with half-star support
  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating - fullStars >= 0.25 && rating - fullStars < 0.75;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    for (let i = 0; i < fullStars; i++) {
      stars.push(<Star key={`full-${i}`} className="w-5 h-5 fill-yellow-500 text-yellow-500" />);
    }
    if (hasHalfStar) {
      stars.push(<StarHalf key="half" className="w-5 h-5 fill-yellow-500 text-yellow-500" />);
    }
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<Star key={`empty-${i}`} className="w-5 h-5 text-gray-300" />);
    }
    return stars;
  };

  // Ensure product has list of images
  const productImages = product.images && product.images.length > 0 
    ? product.images 
    : [product.image];

  const productSizes = product.sizes || [];
  const productColors = product.colors || [];

  return (
    <div className="prod_page w-full overflow-x-hidden box-border p-4 max-w-7xl mx-auto">
      {toastMessage && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-85 text-white text-sm px-6 py-2 rounded-full z-50 transition-all shadow-lg">
          {toastMessage}
        </div>
      )}

      {/* Share Popup */}
      {showSharePopup && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-green-600 text-white text-sm px-6 py-3 rounded-lg z-50 shadow-xl flex items-center gap-2 animate-bounce">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Product link copied to clipboard!
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-8 lg:gap-12 mt-4">
        {/* Left Gallery Panel */}
        <div className="flex-1 flex flex-col-reverse lg:flex-row justify-center gap-4">
          {/* Thumbnails list */}
          {productImages.length > 1 && (
            <div className="other-pictures flex flex-row lg:flex-col gap-2 overflow-x-auto lg:overflow-x-visible">
              {productImages.map((img, index) => (
                <div 
                  key={index}
                  onClick={() => setSelectedImage(img)}
                  className={`w-[80px] h-[80px] sm:w-[90px] sm:h-[90px] p-1 border rounded cursor-pointer transition-all duration-300 hover:bg-[#F9F1E7] flex-shrink-0 ${
                    selectedImage === img ? "border-[#B88E2F] bg-[#FFF3E3]" : "border-gray-250 bg-gray-50"
                  }`}
                >
                  <img src={img} alt={`Thumbnail ${index + 1}`} className="w-full h-full object-contain" />
                </div>
              ))}
            </div>
          )}

          {/* Main Display picture */}
          <div className="main-picture bg-[#F9F1E7] p-6 rounded-lg overflow-hidden flex items-center justify-center flex-1 min-h-[300px] sm:min-h-[400px]">
            <img
              src={selectedImage}
              alt={product.name}
              className="cursor-pointer max-w-full max-h-[450px] object-contain transition-transform duration-300 hover:scale-105"
            />
          </div>
        </div>

        {/* Right Details Panel */}
        <div className="flex-1 flex flex-col gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-1">{product.name}</h1>
            <div className="flex flex-wrap items-center gap-3 mb-1">
              <p className="text-2xl font-semibold text-[#B88E2F] mb-0">{formatPrice(product.price)}</p>
              {product.originalPrice && (
                <p className="text-lg text-gray-400 line-through mb-0">{formatPrice(product.originalPrice)}</p>
              )}
            </div>
            {/* Dynamic Stock Indicator */}
            <div className="stock-indicator mt-2">
              {product.stock !== undefined && (
                product.stock <= 0 ? (
                  <span className="inline-block px-3 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-full uppercase tracking-wider">
                    Out of Stock
                  </span>
                ) : product.stock <= 5 ? (
                  <span className="inline-block px-3 py-1 bg-orange-100 text-orange-700 text-xs font-bold rounded-full uppercase tracking-wider">
                    Only {product.stock} left in stock!
                  </span>
                ) : (
                  <span className="inline-block px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full uppercase tracking-wider">
                    In Stock
                  </span>
                )
              )}
            </div>
          </div>

          <div className="star-rating flex items-center gap-2">
            <div className="flex items-center">
              {renderStars(product.rating || 0)}
            </div>
            <div className="bg-gray-300 w-[1px] h-6 mx-2"></div>
            <p className="text-gray-500 text-sm mb-0">
              {product.reviewCount || 0} Customer Review{(product.reviewCount || 0) !== 1 ? 's' : ''}
            </p>
          </div>

          <p className="text-gray-600 text-sm leading-relaxed my-2">
            {product.description}
          </p>

          {/* Dynamic Sizes */}
          {productSizes.length > 0 && (
            <div className="size flex-col gap-1 mt-2">
              <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-2">Size</p>
              <div className="size flex gap-2 flex-wrap">
                {productSizes.map((sz) => (
                  <button 
                    key={sz.label}
                    onClick={() => sz.available && setSelectedSize(sz.label)}
                    disabled={!sz.available}
                    className={`rounded-lg px-3 py-2 min-w-[40px] flex justify-center items-center font-medium text-sm transition duration-200 border ${
                      !sz.available
                        ? "bg-gray-200 text-gray-400 cursor-not-allowed border-gray-200 opacity-50 line-through"
                        : selectedSize === sz.label 
                          ? "bg-[#B88E2F] text-white border-[#B88E2F]" 
                          : "bg-[#F9F1E7] text-gray-700 hover:bg-[#B88E2F] hover:text-white border-transparent"
                    }`}
                    title={!sz.available ? "Out of stock" : `Select size ${sz.label}`}
                  >
                    {sz.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Dynamic Colors */}
          {productColors.length > 0 && (
            <div className="color flex-col gap-1 mt-2">
              <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-2">Color</p>
              <div className="flex gap-3 flex-wrap">
                {productColors.map((col) => (
                  <button 
                    key={col.hex}
                    onClick={() => col.available && setSelectedColor(col.hex)}
                    disabled={!col.available}
                    style={{ backgroundColor: col.hex }}
                    className={`rounded-full w-9 h-9 border-2 transition duration-300 relative ${
                      !col.available
                        ? "cursor-not-allowed opacity-40"
                        : selectedColor === col.hex 
                          ? "border-white ring-2 ring-[#B88E2F]" 
                          : "border-transparent hover:ring-2 hover:ring-gray-300"
                    }`}
                    aria-label={col.available ? `Select ${col.name}` : `${col.name} - unavailable`}
                    title={col.available ? col.name : `${col.name} - Out of stock`}
                  >
                    {/* Strikethrough for unavailable */}
                    {!col.available && (
                      <span className="absolute inset-0 flex items-center justify-center">
                        <span className="block w-full h-[2px] bg-red-500 rotate-45 rounded"></span>
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity and Actions */}
          <div className="buttonsdiv flex flex-wrap gap-3 mt-6 items-center">
            <div className="quantitydiv flex justify-center items-center gap-4 border border-gray-300 rounded-full px-4 py-2 bg-white">
              <button 
                onClick={() => handleQuantityChange(-1)}
                className="font-bold text-lg text-gray-600 hover:text-black transition"
                disabled={isOutOfStock}
              >
                -
              </button>
              <span className="w-8 text-center font-bold text-gray-800">{quantity}</span>
              <button 
                onClick={() => handleQuantityChange(1)}
                className="font-bold text-lg text-gray-600 hover:text-black transition"
                disabled={isOutOfStock || quantity >= (product.stock || 999)}
              >
                +
              </button>
            </div>
            
            <button 
              onClick={handleAddToCart}
              disabled={isOutOfStock}
              className={`px-6 py-2.5 border-2 border-black rounded-full font-semibold transition duration-300 flex items-center gap-2 ${
                isOutOfStock 
                  ? "border-gray-300 text-gray-400 bg-gray-55 cursor-not-allowed opacity-60" 
                  : "hover:bg-black hover:text-white"
              }`}
            >
              <ShoppingCart className="w-4 h-4" />
              {isOutOfStock ? "Out of Stock" : "Add To Cart"}
            </button>

            <button 
              onClick={handleBuyNow}
              disabled={isOutOfStock}
              className={`px-6 py-2.5 text-white rounded-full font-semibold transition duration-300 shadow-md ${
                isOutOfStock 
                  ? "bg-gray-400 cursor-not-allowed opacity-60" 
                  : "bg-[#B88E2F] hover:bg-[#a5761f]"
              }`}
            >
              Buy Now
            </button>

            <button 
              onClick={handleCompare}
              className={`px-5 py-2.5 border rounded-full font-semibold transition duration-300 flex items-center gap-1 text-sm ${
                isCompared 
                  ? "bg-[#B88E2F] border-[#B88E2F] text-white" 
                  : "border-gray-400 hover:bg-gray-50 text-gray-800"
              }`}
            >
              Compare
            </button>

            <button 
              onClick={handleWishlistToggle}
              className="p-2.5 border border-gray-300 rounded-full hover:bg-gray-50 text-gray-600 transition"
              aria-label="Add to wishlist"
            >
              <Heart className={`w-5 h-5 ${isLiked ? "fill-red-500 text-red-500" : ""}`} />
            </button>
          </div>

          <div className="h-[1px] bg-gray-200 my-6"></div>  

          {/* Metadata lists */}
          <div className="lists grid grid-cols-[100px_20px_1fr] gap-y-2 text-sm text-gray-500">
            <span>SKU</span>
            <span>:</span>
            <span className="text-gray-700 font-mono font-medium">{product.sku || "N/A"}</span>

            <span>Category</span>
            <span>:</span>
            <span className="text-gray-700 font-medium">{product.category}</span>

            <span>Tags</span>
            <span>:</span>
            <span className="text-gray-700">{product.tags?.join(", ") || "Furniture, Home"}</span>

            <span>Share</span>
            <span>:</span>
            <div className="flex items-center gap-3">
              <button
                onClick={handleShare}
                className="flex items-center gap-2 px-3 py-1.5 bg-[#F9F1E7] rounded-full hover:bg-[#B88E2F] hover:text-white text-gray-700 text-xs font-semibold transition duration-300"
              >
                <Share2 className="w-4 h-4" />
                Copy Link
              </button>
            </div>
          </div>      
        </div>
      </div>
      <div className="h-[1px] bg-gray-200 mt-10 mb-6 w-full"></div>  
    </div>
  );
};

export default ProductDetail;
