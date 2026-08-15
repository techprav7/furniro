import { SignUp } from "@clerk/clerk-react";
import { cloudinaryAssets } from "../../cloudinaryAssets";
const bgImg = cloudinaryAssets["Bglogin.png"];


const Register = () => {
  return (
    <div
      className="h-screen w-full bg-cover bg-center bg-no-repeat flex items-center justify-center"
      style={{ backgroundImage: `url(${bgImg})` }}
    >
      <SignUp signInUrl="/login" fallbackRedirectUrl="/" />
    </div>
  );
};

export default Register;
