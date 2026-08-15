import { cloudinaryAssets } from "../cloudinaryAssets";

const furniroLogo = cloudinaryAssets["Furniro-logo.png"];
const cartBg = cloudinaryAssets["cartimg.jpg"];

const Location = ({ title = "Page", breadcrumb = "" }) => {
  return (
    <div className="relative w-full overflow-hidden">
      {/* Background blurred image */}
      <div
        className="w-full h-[300px] bg-cover bg-center blur-[2px] opacity-70"
        style={{ backgroundImage: `url(${cartBg})` }}
      ></div>

      {/* Centered content */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center text-black">
        <img src={furniroLogo} className="h-[50px] w-[50px]" alt="Furniro Logo" />
        <h1 className="text-2xl font-semibold">{title}</h1>
        <h6 className="text-sm">
          <span className="font-bold">Home &gt;</span> {breadcrumb || title}
        </h6>
      </div>
    </div>
  );
};

export default Location;
