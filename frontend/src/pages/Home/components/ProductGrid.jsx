import React from "react";
import { useNavigate } from "react-router-dom";
import rect36 from "../../../assets/Rectangle36.png";
import rect37 from "../../../assets/Rectangle37.png";
import rect38 from "../../../assets/Rectangle38.png";
import rect39 from "../../../assets/Rectangle39.png";
import rect40 from "../../../assets/Rectangle40.png";
import rect41 from "../../../assets/Rectangle41.png";
import rect43 from "../../../assets/Rectangle43.png";
import rect44 from "../../../assets/Rectangle44.png";
import rect45 from "../../../assets/Rectangle45.png";

function ProductGrid() {
  const navigate = useNavigate();

  // A local wrapper component to add cursor-pointer, zoom transitions, and navigate on click
  const ProductImage = ({ src, className, productId, alt = "Furniture piece" }) => {
    return (
      <img
        className={`${className} cursor-pointer transition-transform duration-500 hover:scale-[1.03] hover:shadow-lg hover:brightness-95 rounded`}
        src={src}
        alt={alt}
        onClick={() => {
          if (productId) {
            navigate(`/product/${productId}`);
          } else {
            navigate("/shop");
          }
        }}
      />
    );
  };

  return (
    <div className="productgrid-wrapper mt-5 mb-20 overflow-x-hidden">
      <div className="sub-heading flex justify-center">
        <h5 className="text-[#616161] text-lg font-medium">Share your setup with</h5>
      </div>
      <div className="heading flex justify-center mb-5">
        <h2 className="text-3xl font-bold text-[#3A3A3A]">#FuniroFurniture</h2>
      </div>

      {/* Full layout for md and up */}
      <div className="image-colage hidden md:flex items-center justify-center gap-4">
        <div className="left flex flex-col gap-4">
          <div className="left-top flex items-end gap-4">
            <ProductImage
              src={rect36}
              productId="prod_010"
              alt="Executive Desk"
              className="w-auto h-[320px] object-cover"
            />
            <ProductImage
              src={rect38}
              productId="prod_012"
              alt="Bella Dining Set"
              className="h-80 w-auto mt-20 object-cover"
            />
          </div>
          <div className="left-bottom flex items-start gap-4">
            <ProductImage
              src={rect37}
              productId="prod_011"
              alt="Ergonomic Chair"
              className="mt-3 object-cover"
            />
            <ProductImage
              src={rect39}
              productId="prod_013"
              alt="Cloud King Bed"
              className="mt-3 h-60 w-auto object-cover"
            />
          </div>
        </div>

        <div className="middle flex items-center justify-center">
          <ProductImage
            src={rect40}
            productId="prod_014"
            alt="Zen Bookshelf"
            className="h-auto w-85 object-cover"
          />
        </div>

        <div className="right flex flex-col gap-4">
          <div className="right-top flex items-end gap-4">
            <ProductImage
              src={rect43}
              productId="prod_016"
              alt="Nordic Side Table"
              className="w-auto h-90 object-cover"
            />
            <ProductImage
              src={rect45}
              productId="prod_003"
              alt="Lolito Sofa"
              className="object-cover"
            />
          </div>
          <div className="right-bottom flex items-start gap-4">
            <ProductImage
              src={rect41}
              productId="prod_015"
              alt="Patio Lounge Set"
              className="mt-3 h-auto w-51 object-cover"
            />
            <ProductImage
              src={rect44}
              productId="prod_007"
              alt="Pingky Bed"
              className="mt-3 h-60 w-auto object-cover"
            />
          </div>
        </div>
      </div>

      {/* Mobile layout with only 4 images */}
      <div className="image-colage md:hidden grid grid-cols-2 gap-4 px-4">
        <ProductImage src={rect44} productId="prod_007" alt="Pingky Bed" className="w-full h-40 object-cover" />
        <ProductImage src={rect38} productId="prod_012" alt="Bella Dining Set" className="w-full h-40 object-cover" />
        <ProductImage src={rect40} productId="prod_014" alt="Zen Bookshelf" className="w-full h-40 object-cover" />
        <ProductImage src={rect43} productId="prod_016" alt="Nordic Side Table" className="w-full h-40 object-cover" />
      </div>
    </div>
  );
}

export default ProductGrid;
