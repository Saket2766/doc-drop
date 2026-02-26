import { Link } from "react-router";
import { Button } from "../ui/button";
import { Separator } from "../ui/separator";
import { AppLogoLarge, AppLogoSmall } from "./appLogo";

export const Navbar = () => {
  return (
    <nav className="flex py-4 md:py-6 px-6 md:px-12 w-5/6 md:w-2/3 flex-row gap-2 md:gap-0 mx-auto mb-6 justify-between items-center bg-white border border-gray-200 rounded-full">
      <Link to="/" className="hidden md:block">
        <AppLogoLarge />
      </Link>
      <Link to="/" className="block md:hidden">
        <AppLogoSmall />
      </Link>
      <div className="flex items-center space-x-2 md:space-x-4 ">
        <Button size={"lg"} variant="outline" className="text-xs md:text-sm">
          <Link to="/auth/login">Login</Link>
        </Button>
        <Separator orientation="vertical" />
        <Button
          size={"lg"}
          className="bg-slate-800 hover:bg-slate-900 text-white text-xs md:text-sm"
        >
          <Link to="/auth/signup">Sign Up</Link>
        </Button>
      </div>
    </nav>
  );
};
