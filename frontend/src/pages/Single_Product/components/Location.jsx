import React from 'react';
import { Link } from 'react-router-dom';

const Location = ({ product }) => {
  return (
    <div className='bg-[#faf3ea] w-full box-border overflow-x-hidden flex flex-wrap items-center p-4 gap-4 text-sm sm:text-base'>
      <Link to="/" className="text-gray-500 hover:text-black transition-colors duration-200 no-underline font-medium">Home</Link>
      <div className="font-bold text-gray-400 text-lg">&gt;</div>
      <Link to="/shop" className="text-gray-500 hover:text-black transition-colors duration-200 no-underline font-medium">Shop</Link>
      <div className="font-bold text-gray-400 text-lg">&gt;</div>
      <div className="bg-gray-400 w-[1px] h-6 mx-1"></div>
      <div className="font-semibold text-gray-800">{product.name}</div>
    </div>
  );
};

export default Location;

