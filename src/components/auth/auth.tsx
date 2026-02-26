import { Copyright } from "@hugeicons/core-free-icons";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../ui/tabs";
import { useParams, useNavigate } from "react-router";
import { HugeiconsIcon } from "@hugeicons/react";
import { LoginForm } from "./layout/loginForm";
import { SignupForm } from "./layout/signupForm";


const AuthTabs = () => {
  const navigate = useNavigate();
  const { tab } = useParams();

  if (tab !== "login" && tab !== "signup") {
    navigate("/auth/login");
  }

  return (
    <Tabs
      defaultValue={tab || "login"}
      onValueChange={(value) => navigate(`/auth/${value}`)}
    >
      <TabsList>
        <TabsTrigger value="login">Login</TabsTrigger>
        <TabsTrigger value="signup">Signup</TabsTrigger>
      </TabsList>
      <TabsContent value="login">
        <LoginForm />
      </TabsContent>
      <TabsContent value="signup">
        <SignupForm />
      </TabsContent>
    </Tabs>
  );
};

export const Auth = () => {
  return (
    <main className="w-5/6 mx-auto md:w-full flex flex-col gap-8 grow justify-center items-center">
      <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-md">
        <AuthTabs />
      </div>
      <p className=" w-fit text-slate-500 text-center text-sm md:text-base flex items-center gap-2">
        <HugeiconsIcon icon={Copyright} className="inline-block w-4 h-4 md:w-6 md:h-6" />
        Copyright @2026 DocDrop. All rights reserved.
      </p>
    </main>
  );
};
