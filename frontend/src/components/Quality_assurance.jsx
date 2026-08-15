import { cloudinaryAssets } from "../cloudinaryAssets";

const trophyImg = cloudinaryAssets["trophy.png"];
const guaranteeImg = cloudinaryAssets["guarantee.png"];
const shippingImg = cloudinaryAssets["shipping.png"];
const supportImg = cloudinaryAssets["customer-support.png"];

const Quality_assurance = () => {
  return (
    <div className="bg-[#faf3ea] w-full flex flex-col md:flex-row justify-between p-5 md:p-[50px] gap-6 overflow-x-hidden">
      <div className="feature-item flex gap-[10px]">
        <img src={trophyImg} className="h-[60px]" alt="High Quality" />
        <div>
          <h3>High Quality</h3>
          <p className="text-gray-500">crafted from top materials</p>
        </div>
      </div>

      <div className="feature-item flex gap-[10px]">
        <img src={guaranteeImg} className="h-[60px]" alt="Warranty" />
        <div>
          <h3>Warranty Protection</h3>
          <p className="text-gray-500">Over 2 years</p>
        </div>
      </div>

      <div className="feature-item flex gap-[10px]">
        <img src={shippingImg} className="h-[60px]" alt="Free Shipping" />
        <div>
          <h3>Free Shipping</h3>
          <p className="text-gray-500">Orders over 150$</p>
        </div>
      </div>

      <div className="feature-item flex gap-[10px]">
        <img src={supportImg} className="h-[60px]" alt="24/7 Support" />
        <div>
          <h3>24 / 7</h3>
          <p className="text-gray-500">Dedicated support</p>
        </div>
      </div>
    </div>
  );
};

export default Quality_assurance;
