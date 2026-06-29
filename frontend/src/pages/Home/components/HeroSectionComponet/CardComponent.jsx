import React, { useState } from "react";
import Card from "react-bootstrap/Card";
import { useNavigate } from "react-router-dom";
import { useCartStore, useWishlistStore, useComparisonStore } from "../../../../store/store";
import { formatPrice } from "../../../../data/productData";
import { Heart, Share2, ArrowLeftRight } from "lucide-react";

function CardComponent({ product, img, title, description, price, oldPrice }) {
  const navigate = useNavigate();
  const { addToCart } = useCartStore();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlistStore();
  const { addToComparison, isInComparison, removeFromComparison } = useComparisonStore();

  const [toastMessage, setToastMessage] = useState("");

  // Create a product object if only individual props were provided (backward compatibility)
  const p = product || {
    _id: "prod_dummy_" + title,
    name: title,
    description: description,
    price: typeof price === "number" ? price : 25000,
    originalPrice: typeof oldPrice === "number" ? oldPrice : null,
    discount: oldPrice ? 30 : 0,
    category: "Living Room",
    image: img,
    images: [img],
    stock: 10,
    rating: 4.5,
    reviewCount: 15,
  };

  const isLiked = isInWishlist(p._id);
  const isCompared = isInComparison(p._id);

  const displayPrice = product ? formatPrice(p.price) : price;
  const displayOldPrice = product && p.originalPrice ? formatPrice(p.originalPrice) : oldPrice;

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage("");
    }, 2000);
  };

  const handleAddToCart = (e) => {
    e.stopPropagation();
    addToCart(p, 1);
    showToast("Added to Cart!");
  };

  const handleWishlistToggle = (e) => {
    e.stopPropagation();
    if (isLiked) {
      removeFromWishlist(p._id);
      showToast("Removed from Wishlist");
    } else {
      addToWishlist(p);
      showToast("Added to Wishlist!");
    }
  };

  const handleComparisonToggle = (e) => {
    e.stopPropagation();
    if (isCompared) {
      removeFromComparison(p._id);
      showToast("Removed from Comparison");
    } else {
      addToComparison(p);
      showToast("Added to Comparison!");
    }
  };

  const handleShare = (e) => {
    e.stopPropagation();
    const productUrl = `${window.location.origin}/product/${p._id}`;
    navigator.clipboard.writeText(productUrl)
      .then(() => showToast("Product link copied!"))
      .catch(() => showToast("Could not copy link"));
  };

  const handleCardClick = () => {
    navigate(`/product/${p._id}`);
  };

  return (
    <div 
      onClick={handleCardClick}
      className="relative group w-full max-w-xs mx-auto sm:max-w-sm md:max-w-[17rem] lg:max-w-[18rem] xl:max-w-[19rem] cursor-pointer overflow-hidden rounded-md shadow-sm hover:shadow-lg transition-all duration-300"
    >
      {/* Toast Alert Inside Card */}
      {toastMessage && (
        <div className="absolute top-2 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-80 text-white text-xs px-3 py-1 rounded-full z-30 transition-opacity duration-300">
          {toastMessage}
        </div>
      )}

      {/* Out of Stock Badge */}
      {p.stock !== undefined && p.stock <= 0 && (
        <div className="absolute top-4 left-4 bg-[#E97171] text-white text-[10px] font-bold rounded-full w-10 h-10 flex items-center justify-center z-10 uppercase tracking-wider text-center leading-tight shadow-md">
          Out of Stock
        </div>
      )}

      {/* Discount Badge */}
      {p.discount > 0 && !p.isNew && (
        <div className="absolute top-4 right-4 bg-[#E97171] text-white text-xs font-semibold rounded-full w-10 h-10 flex items-center justify-center z-10">
          -{p.discount}%
        </div>
      )}

      {/* New Product Badge */}
      {p.isNew && (
        <div className="absolute top-4 right-4 bg-[#2EC1AC] text-white text-xs font-semibold rounded-full w-10 h-10 flex items-center justify-center z-10">
          New
        </div>
      )}

      {/* Card Content */}
      <Card className="transition duration-300 h-full border-0">
        <div className="h-[250px] overflow-hidden bg-gray-100">
          <Card.Img 
            variant="top" 
            src={p.image} 
            className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 ${
              p.stock !== undefined && p.stock <= 0 ? "opacity-60 grayscale-[50%]" : ""
            }`} 
          />
        </div>
        <div className="cardbody bg-[#F4F5F7] p-4 flex flex-col justify-between min-h-[140px]">
          <div>
            <Card.Title className="text-lg font-bold text-[#3A3A3A] mb-1 truncate">{p.name}</Card.Title>
            <Card.Text className="text-sm text-[#898989] mb-3 line-clamp-2 leading-relaxed">{p.description}</Card.Text>
          </div>
          <div className="flex items-center justify-between mt-auto">
            <span className="text-base font-semibold text-[#3A3A3A]">{displayPrice}</span>
            {p.originalPrice && (
              <span className="line-through text-sm text-[#B0B0B0]">{displayOldPrice}</span>
            )}
          </div>
        </div>
      </Card>

      {/* Premium Overlay Actions */}
      <div className="absolute inset-0 flex flex-col justify-center items-center bg-black bg-opacity-60 opacity-0 group-hover:opacity-100 transition-all duration-300 z-20 px-4">
        <button 
          onClick={(e) => { e.stopPropagation(); navigate(`/product/${p._id}`); }}
          className="bg-white text-[#B88E2F] font-semibold py-3 px-8 rounded shadow-md hover:bg-[#B88E2F] hover:text-white transition duration-300 mb-6 w-[80%] text-center"
        >
          View Product
        </button>
        
        <div className="flex items-center justify-around w-full text-white text-sm">
          {/* Share */}
          <button 
            onClick={handleShare}
            className="flex items-center gap-1 hover:text-[#B88E2F] transition font-medium"
          >
            <Share2 className="w-4 h-4" />
            <span>Share</span>
          </button>

          {/* Compare */}
          <button 
            onClick={handleComparisonToggle}
            className={`flex items-center gap-1 transition font-medium ${isCompared ? "text-[#B88E2F]" : "hover:text-[#B88E2F]"}`}
          >
            <ArrowLeftRight className="w-4 h-4" />
            <span>Compare</span>
          </button>

          {/* Like */}
          <button 
            onClick={handleWishlistToggle}
            className={`flex items-center gap-1 transition font-medium ${isLiked ? "text-red-500" : "hover:text-red-500"}`}
          >
            <Heart className={`w-4 h-4 ${isLiked ? "fill-red-500 text-red-500" : ""}`} />
            <span>Like</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default CardComponent;
