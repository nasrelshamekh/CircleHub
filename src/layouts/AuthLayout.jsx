import { Outlet, useLocation } from "react-router-dom"
import RegisterBG from "@/assets/registerpage.png"
import SigninBG from "@/assets/signinpage.png"

export default function AuthLayout() {
  const { pathname } = useLocation();
  const authBackground = pathname === "/signin" ? SigninBG : RegisterBG;

  return (
    <>
      <div className="grid grid-cols-4">
        <div className="hidden lg:block col-span-2 h-screen">
          <img src={authBackground} className="w-full h-full object-cover" alt="Auth Background" />
        </div>
        <div className="lg:col-span-2 col-span-4 flex justify-center items-center">
          <Outlet />
        </div>
      </div>
    </>
  )
}
