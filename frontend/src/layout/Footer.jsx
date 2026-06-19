import { Link } from "react-router-dom";

function Footer() {
  return (
    <div className="footer px-4 overflow-x-hidden text-sm">
      <hr className="my-4 sm:my-6 border-t-2 border-gray-300" />

      <div className="footer-wrapper flex flex-col lg:flex-row lg:justify-center items-center lg:items-start gap-6 lg:gap-0 leading-relaxed sm:leading-loose">
        {/* Address */}
        <div className="firstpart text-center lg:text-left mb-4 lg:mb-0 lg:mr-16 xl:mr-24">
          <h3 className="mb-1 sm:mb-4 text-base sm:text-xl">Furniro.</h3>
          <p className="text-gray-400 text-xs sm:text-sm leading-snug">
            400 University Drive Suite 200 Coral <br />
            Gables, <br />
            FL 33134 USA
          </p>
        </div>

        {/* Links & Help */}
        <div className="flex flex-row justify-center gap-8 mb-4 lg:mb-0 lg:flex-col lg:mr-16 xl:mr-24">
          {/* Links */}
          <div className="secondpart text-center lg:text-left">
            <ul>
              <li className="mb-1 sm:mb-4 font-semibold text-gray-400 text-xs sm:text-sm">Links</li>
              <li className="mb-1 sm:mb-2 font-semibold"><Link to="/" className="text-black no-underline hover:text-[#B88E2F] transition-colors">Home</Link></li>
              <li className="mb-1 sm:mb-2 font-semibold"><Link to="/shop" className="text-black no-underline hover:text-[#B88E2F] transition-colors">Shop</Link></li>
              <li className="mb-1 sm:mb-2 font-semibold"><Link to="/blog" className="text-black no-underline hover:text-[#B88E2F] transition-colors">Blog</Link></li>
              <li className="font-semibold"><Link to="/contact" className="text-black no-underline hover:text-[#B88E2F] transition-colors">Contact</Link></li>
            </ul>
          </div>

          {/* Help */}
          <div className="thirdpart text-center lg:text-left">
            <ul>
              <li className="mb-1 sm:mb-4 font-semibold text-gray-400 text-xs sm:text-sm">Help</li>
              <li className="mb-1 sm:mb-2 font-semibold"><Link to="/orders" className="text-black no-underline hover:text-[#B88E2F] transition-colors">My Orders</Link></li>
              <li className="mb-1 sm:mb-2 font-semibold"><Link to="/comparison" className="text-black no-underline hover:text-[#B88E2F] transition-colors">Compare Products</Link></li>
              <li className="font-semibold"><Link to="/profile" className="text-black no-underline hover:text-[#B88E2F] transition-colors">My Account</Link></li>
            </ul>
          </div>
        </div>
      </div>

      {/* Copyright */}
      <div className="w-full sm:w-[80%] mx-auto text-center">
        <hr className="my-4 sm:my-6 border-t-2 border-gray-300" />
        <div className="copyright mb-6 sm:mb-10 mt-2 text-gray-400 text-xs sm:text-sm">
          <h6>© 2026 Furniro | Developed by Praver Jain</h6>
        </div>
      </div>
    </div>
  );
}

export default Footer;

