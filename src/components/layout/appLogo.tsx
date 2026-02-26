import DocDropLogo from "@/assets/vite.svg";

export const AppLogoSmall = () => {
  return (
    <div className="flex w-fit gap-2">
      <img src={DocDropLogo} alt="DocDrop Logo" width={20} />
      <h3 className="w-fit text-center scroll-m-20 text-xl text-blue-500 font-extrabold tracking-tight">
        DocDrop
      </h3>
    </div>
  );
};

export const AppLogoLarge = () => {
  return (
    <div className="flex w-fit gap-2">
      <img src={DocDropLogo} alt="DocDrop Logo" width={36} />
      <h1 className="bg-linear-to-r bg-clip-text from-blue-500 to-indigo-500 scroll-m-20 text-center text-transparent  text-4xl font-extrabold tracking-tight text-balance">
        DocDrop
      </h1>
    </div>
  );
};
