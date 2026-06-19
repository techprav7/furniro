import React from "react";
import CardComponent from "../../Home/components/HeroSectionComponet/CardComponent";

const Otherprods = ({ products, currentPage, setCurrentPage, totalPages }) => {
  if (products.length === 0) {
    return (
      <div className="text-center py-20 bg-gray-50 border border-dashed border-gray-200 rounded-lg my-8 mx-4">
        <h3 className="text-xl font-bold text-gray-700 mb-2">No products found</h3>
        <p className="text-gray-500">Try adjusting your filters or category selection.</p>
      </div>
    );
  }

  // Generate pagination buttons
  const pageButtons = [];
  for (let i = 1; i <= totalPages; i++) {
    pageButtons.push(i);
  }

  return (
    <div className="HeroSection-wrapper mt-5 mb-20 px-4">
      <div className="product-list grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mt-4">
        {products.map((product) => (
          <CardComponent
            key={product._id}
            product={product}
          />
        ))}
      </div>
      
      {totalPages > 1 && (
        <div className="bottombutton flex justify-center items-center flex-wrap gap-2 sm:gap-4 my-12">
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className={`px-4 py-2 rounded transition duration-300 ${
              currentPage === 1
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-[#f3eee7] text-black hover:bg-[#B88E2F] hover:text-white"
            }`}
          >
            Prev
          </button>
          
          {pageButtons.map((page) => (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              className={`px-4 py-2 rounded transition duration-300 font-semibold ${
                currentPage === page
                  ? "bg-[#B88E2F] text-white shadow"
                  : "bg-[#f3eee7] text-black hover:bg-[#B88E2F] hover:text-white"
              }`}
            >
              {page}
            </button>
          ))}
          
          <button
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className={`px-4 py-2 rounded transition duration-300 ${
              currentPage === totalPages
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-[#f3eee7] text-black hover:bg-[#B88E2F] hover:text-white"
            }`}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default Otherprods;

