import { SignIn } from "@clerk/clerk-react";
import { cloudinaryAssets } from "../../cloudinaryAssets";
const bgImg = cloudinaryAssets["Bglogin.png"];


const Login = () => {
  return (
    <div
      className="h-screen w-full bg-cover bg-center bg-no-repeat flex items-center justify-center"
      style={{ backgroundImage: `url(${bgImg})` }}
    >
      <SignIn signUpUrl="/register" fallbackRedirectUrl="/" />
    </div>
  );
};

export default Login;
