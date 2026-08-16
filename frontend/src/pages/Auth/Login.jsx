import React, { useState, useEffect } from "react";
import { SignIn } from "@clerk/clerk-react";
import { PropagateLoader } from "react-spinners";
import { cloudinaryAssets } from "../../cloudinaryAssets";

const bgImg = cloudinaryAssets["scandinavian-interior-mockup-wall-decal-background 1.png"];
const logoImg = cloudinaryAssets["Furniro-logo.png"];

const Login = () => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div
        style={{
          height: '100vh',
          width: '100vw',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#fff',
        }}
      >
        <PropagateLoader color="#B88E2F" size={15} />
        <p style={{ fontSize: '14px', color: '#777', marginTop: '1rem' }}>
          Loading your furniture dreams...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row bg-[#faf8f6]">
      {/* Left Visual Panel - Hidden on mobile */}
      <div 
        className="hidden md:flex md:w-1/2 lg:w-3/5 bg-cover bg-center relative items-center justify-center p-12 overflow-hidden"
        style={{ backgroundImage: `url(${bgImg})` }}
      >
        {/* Dark warm overlay */}
        <div className="absolute inset-0 bg-[#3a3a3a]/40 backdrop-blur-[2px]" />
        
        {/* Branding Info */}
        <div className="relative z-10 w-full max-w-xl flex flex-col justify-between h-full text-white">
          <div className="flex items-center gap-3">
            <img src={logoImg} alt="Furniro Logo" className="h-12 w-auto bg-white/95 p-2 rounded-lg shadow-md" />
            <span className="text-3xl font-extrabold tracking-wider drop-shadow-md text-white">Furniro</span>
          </div>
          
          <div className="my-auto">
            <h1 className="text-4xl lg:text-5xl font-extrabold mb-6 leading-tight drop-shadow-md">
              Elevate Your Living Space with Elegance
            </h1>
            <p className="text-lg lg:text-xl text-gray-100 max-w-lg leading-relaxed drop-shadow-sm font-light">
              Discover premium, handcrafted furniture designed to bring warmth, sophistication, and comfort to your home.
            </p>
          </div>
          
          <div className="text-sm text-gray-200 font-light mt-8">
            &copy; 2026 Furniro. All rights reserved.
          </div>
        </div>
      </div>

      {/* Right Auth Panel */}
      <div className="w-full md:w-1/2 lg:w-2/5 flex flex-col justify-center items-center p-6 bg-[#faf8f6]">
        {/* Logo for mobile view */}
        <div className="flex md:hidden items-center gap-2 mb-8">
          <img src={logoImg} alt="Furniro Logo" className="h-10 w-auto" />
          <span className="text-2xl font-bold tracking-wider text-[#3A3A3A]">Furniro</span>
        </div>

        {/* Clerk Sign-In Component */}
        <div className="w-full max-w-md flex justify-center">
          <SignIn 
            signUpUrl="/register" 
            fallbackRedirectUrl="/" 
            appearance={{
              variables: {
                colorPrimary: "#B88E2F",
                colorText: "#3A3A3A",
                colorTextSecondary: "#616161",
                colorBackground: "#ffffff",
                borderRadius: "8px",
              },
              elements: {
                cardBox: "shadow-xl border border-gray-150 rounded-xl overflow-hidden",
                card: "bg-white p-8",
                headerTitle: "text-[#3A3A3A] font-bold text-2xl",
                headerSubtitle: "text-[#616161] font-medium",
                formButtonPrimary: "bg-[#B88E2F] hover:bg-[#a5761f] text-white font-bold transition duration-300 rounded",
                footerActionLink: "text-[#B88E2F] hover:text-[#a5761f] font-semibold"
              }
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default Login;
