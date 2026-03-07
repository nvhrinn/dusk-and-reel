import { useGoogleLogin } from "@react-oauth/google";
import { loginUser, logoutUser, getUser } from "@/lib/auth";
import { LogIn, LogOut, User, ChevronDown } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const UserMenu = () => {
  const [user, setUser] = useState(getUser());
  const navigate = useNavigate();

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
      <button
        onClick={() => googleLogin()}
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
      >
        <LogIn className="w-4 h-4" />
        
      </button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 rounded-xl px-1.5 py-1 hover:bg-secondary/80 transition-colors outline-none">
          <Avatar className="h-7 w-7">
            <AvatarImage src={user.picture} alt={user.name} />
            <AvatarFallback className="text-xs bg-primary text-primary-foreground">
              {user.name?.charAt(0)?.toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <ChevronDown className="w-3 h-3 text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <div className="px-2 py-1.5">
          <p className="text-sm font-medium text-foreground truncate">{user.name}</p>
          <p className="text-xs text-muted-foreground truncate">{user.email}</p>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => navigate("/profile")} className="cursor-pointer">
          <User className="w-4 h-4 mr-2" />
          Profil
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => navigate("/about")} className="cursor-pointer">
          <LogOut className="w-4 h-4 mr-2" />
          About
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserMenu;
