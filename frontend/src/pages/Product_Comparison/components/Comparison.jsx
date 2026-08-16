import React, { useState } from 'react';
import { useComparisonStore, useCartStore } from '../../../store/store';
import { formatPrice } from '../../../data/productData';


const Comparison = () => {
  const { items } = useComparisonStore();
  const { addToCart } = useCartStore();
  const [toastMessage, setToastMessage] = useState("");

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 2000);
  };

  const handleAddToCart = (product) => {
    addToCart(product, 1);
    showToast(`Added ${product.name} to Cart!`);
  };

  if (items.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500 max-w-7xl mx-auto px-4">
        <p className="text-lg">No products selected for comparison. Go to the shop and add products to compare!</p>
      </div>
    );
  }

  // Define spec categories and rows mapping to keys or helpers
  const specSections = [
    {
      title: "General",
      rows: [
        { label: "Sales Package", value: (p) => "1 Sectional Piece" },
        { label: "SKU Model", value: (p) => p.sku || "N/A" },
        { label: "Secondary Material", value: (p) => "Solid Wood Frame" },
        { label: "Configuration", value: (p) => p.category === "Living Room" ? "L-Shaped Sofa" : "Standard Model" },
        { label: "Upholstery Material", value: (p) => "Velvet Fabric & Cotton Linen" },
        { label: "Category", value: (p) => p.category },
      ]
    },
    {
      title: "Product Specs",
      rows: [
        { label: "Cushion Fill", value: (p) => "High Density Foam" },
        { label: "Finish Style", value: (p) => "Matte Polish finish" },
        { label: "Adjustable Headrest", value: (p) => p.category === "Office" ? "Yes" : "No" },
        { label: "Maximum Load Capacity", value: (p) => "280 KG" },
        { label: "Origin Country", value: (p) => "Indonesia" },
      ]
    },
    {
      title: "Dimensions",
      rows: [
        { label: "Overall Width", value: (p) => "265.32 cm" },
        { label: "Overall Height", value: (p) => "76.00 cm" },
        { label: "Overall Depth", value: (p) => "187.76 cm" },
        { label: "Weight", value: (p) => "45 KG" },
        { label: "Seat Height", value: (p) => "41.53 cm" },
        { label: "Leg Height", value: (p) => "5.46 cm" },
      ]
    },
    {
      title: "Warranty",
      rows: [
        { label: "Warranty Period", value: (p) => p.name.includes("Asgaard") ? "1 Year Domestic" : "2 Years Domestic" },
        { label: "Warranty Service", value: (p) => "Email support@furniro.com for claim requests" },
        { label: "Covered in Warranty", value: (p) => "Manufacturing Defect" },
        { label: "Not Covered", value: (p) => "Wear and Tear, Water Damage, Misuse" },
        { label: "Domestic Warranty", value: (p) => "1 Year Parts & Labor" },
      ]
    }
  ];

  // Dynamic grid columns layout
  // Column 1 is for labels, and then N columns for compared items.
  const gridStyle = {
    display: 'grid',
    gridTemplateColumns: `200px repeat(${items.length}, minmax(180px, 1fr))`,
    gap: '16px',
    alignItems: 'start'
  };

  return (
    <div className="overflow-x-auto p-4 max-w-7xl mx-auto">
      {toastMessage && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-85 text-white text-sm px-6 py-2 rounded-full z-50 transition-all shadow-lg">
          {toastMessage}
        </div>
      )}

      <div className="min-w-[700px] border border-gray-200 rounded-lg p-6 bg-white shadow-sm flex flex-col gap-6">
        <div style={gridStyle} className="text-sm font-medium border-b border-gray-250 pb-4">
          <div className="font-bold text-gray-400">Spec Comparison</div>
          {items.map((item) => (
            <div key={item._id} className="font-bold text-lg text-gray-800 truncate">
              {item.name}
            </div>
          ))}
        </div>

        {specSections.map((section, sectionIdx) => (
          <React.Fragment key={sectionIdx}>
            {/* Section Header */}
            <div style={gridStyle} className="mt-4">
              <div className="font-bold text-base text-[#B88E2F] uppercase tracking-wider">{section.title}</div>
              {items.map((item) => <div key={item._id} className="h-4 border-b border-gray-150"></div>)}
            </div>

            {/* Section Rows */}
            {section.rows.map((row, rowIdx) => (
              <div key={rowIdx} style={gridStyle} className="py-2.5 border-b border-gray-100 hover:bg-gray-50 transition text-gray-650">
                <div className="font-semibold text-gray-700">{row.label}</div>
                {items.map((item) => (
                  <div key={item._id} className="text-gray-600">
                    {row.value(item)}
                  </div>
                ))}
              </div>
            ))}
          </React.Fragment>
        ))}

        {/* Buttons Row */}
        <div style={gridStyle} className="pt-6 border-t border-gray-200 mt-4">
          <div></div>
          {items.map((item) => (
            <div key={item._id}>
              <button 
                onClick={() => handleAddToCart(item)}
                className="w-full bg-[#B88E2F] text-white py-2.5 px-4 rounded-full hover:bg-[#a17924] transition duration-300 font-semibold shadow-sm text-sm"
              >
                Add To Cart
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>    
  );
};

export default Comparison;