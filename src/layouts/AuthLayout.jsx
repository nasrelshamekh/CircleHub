import { Outlet, useLocation } from "react-router-dom"
import RegisterBG from "@/assets/registerpage.png"
import SigninBG from "@/assets/signinpage.png"

export default function AuthLayout() {
  const { pathname } = useLocation();
  const authBackground = pathname === "/signin" ? SigninBG : RegisterBG;

  return (
    <>
      <div className="grid min-h-screen grid-cols-4 items-stretch">
        <div className="relative hidden min-h-screen lg:col-span-2 lg:block">
          <img src={authBackground} className="absolute inset-0 h-full w-full object-cover" alt="Auth Background" />
        </div>
        <div className="col-span-4 flex items-center justify-center lg:col-span-2">
          <Outlet />
        </div>
      </div>
    </>
  )
}
