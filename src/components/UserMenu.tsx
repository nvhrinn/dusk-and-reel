import { useGoogleLogin } from "@react-oauth/google";
import { loginUser, logoutUser, getUser } from "@/lib/auth";
import { LogIn, LogOut, User } from "lucide-react";
import { useState, useEffect } from "react";

const UserMenu = () => {
  const [user, setUser] = useState(getUser());

  const googleLogin = useGoogleLogin({
    onSuccess: async (token) => {
      const res = await fetch(
        `https://www.googleapis.com/oauth2/v3/userinfo?access_token=${token.access_token}`
      );
      const profile = await res.json();

      loginUser({
        name: profile.name,
        email: profile.email,
        picture: profile.picture,
      });

      setUser(getUser());
    },
  });

  const logout = () => {
    logoutUser();
    setUser(null);
  };

  if (!user) {
    return (
      <button onClick={() => googleLogin()}>
        <LogIn className="w-4 h-4" /> Login
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <img src={user.picture} className="w-7 h-7 rounded-full" />
      <button onClick={logout}>
        <LogOut className="w-4 h-4" />
      </button>
    </div>
  );
};

export default UserMenu;
