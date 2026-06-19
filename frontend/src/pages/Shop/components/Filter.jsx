import React from 'react';
import { SlidersHorizontal, Grid, AlignJustify } from 'lucide-react';

const FilterBar = ({
  totalResults,
  itemsPerPage,
  setItemsPerPage,
  sortBy,
  setSortBy,
  selectedCategory,
  setSelectedCategory,
  currentPage,
  categories = []
}) => {
  const displayCategories = ["All", ...categories];

  // Calculate shown range
  const startResult = totalResults === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const endResult = Math.min(currentPage * itemsPerPage, totalResults);

  return (
    <div className="bg-[#faf3ea] w-full px-6 sm:px-10 md:px-16 py-4 text-sm">
      <div className="flex flex-col md:flex-row flex-wrap items-center justify-between gap-4 text-center">
        
        {/* Left Side */}
        <div className="flex items-center flex-wrap justify-center gap-3">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-gray-700" />
            <span className="font-semibold text-[#3A3A3A] mr-1">Category:</span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="border border-gray-300 rounded px-2 py-1 bg-white text-gray-700 cursor-pointer focus:outline-none focus:ring-1 focus:ring-gray-300"
            >
              {displayCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="w-[1px] h-6 bg-gray-400 mx-2 hidden sm:block" />
          <div className="pt-1">
            <p className="text-gray-700">
              Showing <strong>{startResult}–{endResult}</strong> of <strong>{totalResults}</strong> results
            </p>
          </div>
        </div>

        {/* Right Side */}
        <div className="flex items-center flex-wrap justify-center gap-4">
          <div className="flex items-center gap-2">
            <p className="text-[#3A3A3A] font-semibold mb-0">Show</p>
            <input
              type="number"
              value={itemsPerPage}
              min="1"
              max="50"
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                setItemsPerPage(isNaN(val) || val <= 0 ? 16 : val);
              }}
              className="w-16 text-center border border-gray-300 rounded px-2 py-1 text-gray-700 bg-white focus:outline-none focus:ring-1 focus:ring-gray-300"
            />
          </div>

          <div className="flex items-center gap-2">
            <p className="text-[#3A3A3A] font-semibold mb-0">Sort by</p>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="border border-gray-300 px-3 py-1 rounded bg-white text-gray-700 cursor-pointer focus:outline-none focus:ring-1 focus:ring-gray-300"
            >
              <option value="Default">Default</option>
              <option value="price-low-high">Price: Low to High</option>
              <option value="price-high-low">Price: High to Low</option>
              <option value="rating">Rating: High to Low</option>
              <option value="name">Name: A to Z</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FilterBar;

