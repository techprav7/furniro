import React from 'react';
import { useNavigate } from 'react-router-dom';
import diningImg from '../../../assets/Rectangle38.png';
import livingImg from '../../../assets/Asgaardsofa3.png';
import bedroomImg from '../../../assets/Rectangle39.png';

function GallerySection() {
  const navigate = useNavigate();

  const handleCategoryClick = (category) => {
    navigate(`/shop?category=${encodeURIComponent(category)}`);
  };

  return (
    <div className="GallerySection-wrapper mt-5 px-4">
      <div className="heading flex justify-center text-center">
        <h2 className="text-3xl font-bold text-[#3A3A3A]">Browse The Range</h2>
      </div>
      <div className="p-tag flex justify-center mb-5 text-center">
        <p className="text-gray-500">Discover curated furniture designs crafted for modern homes.</p>
      </div>

      <div className="card-section-wrapper grid grid-cols-1 sm:grid-cols-2 md:flex md:flex-row md:justify-center md:gap-x-6 lg:gap-x-10 gap-y-8">
        {/* Card 1 */}
        <div 
          onClick={() => handleCategoryClick('Dining')}
          className="card-one cursor-pointer transform transition duration-300 hover:scale-105 hover:shadow-lg rounded-lg p-2 w-full sm:w-auto"
        >
          <img className="h-[380px] w-[280px] object-cover mx-auto rounded-lg shadow-sm" src={diningImg} alt="Dining Range" />
          <div className="title flex justify-center mt-3">
            <h4 className="font-semibold text-gray-800 hover:text-[#B88E2F] transition-colors">Dining</h4>
          </div>
        </div>

        {/* Card 2 */}
        <div 
          onClick={() => handleCategoryClick('Living Room')}
          className="card-one cursor-pointer transform transition duration-300 hover:scale-105 hover:shadow-lg rounded-lg p-2 w-full sm:w-auto"
        >
          <img className="h-[380px] w-[280px] object-cover mx-auto rounded-lg shadow-sm" src={livingImg} alt="Living Range" />
          <div className="title flex justify-center mt-3">
            <h4 className="font-semibold text-gray-800 hover:text-[#B88E2F] transition-colors">Living</h4>
          </div>
        </div>

        {/* Card 3 */}
        <div 
          onClick={() => handleCategoryClick('Bedroom')}
          className="card-one cursor-pointer transform transition duration-300 hover:scale-105 hover:shadow-lg rounded-lg p-2 w-full sm:w-auto"
        >
          <img className="h-[380px] w-[280px] object-cover mx-auto rounded-lg shadow-sm" src={bedroomImg} alt="Bedroom Range" />
          <div className="title flex justify-center mt-3">
            <h4 className="font-semibold text-gray-800 hover:text-[#B88E2F] transition-colors">Bedroom</h4>
          </div>
        </div>
      </div>
    </div>
  );
}

export default GallerySection;

