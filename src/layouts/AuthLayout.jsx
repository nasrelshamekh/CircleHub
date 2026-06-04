import { Outlet } from "react-router-dom"
import AuthBG from "@/assets/registerpage.png"

export default function AuthLayout() {
  return (
    <>
      <div className="grid grid-cols-4">
        <div className="hidden lg:block col-span-2 h-screen">
          <img src={AuthBG} className="w-full h-full object-cover" alt="Auth Background" />
        </div>
        <div className="lg:col-span-2 col-span-4 flex justify-center items-center">
          <Outlet />
        </div>
      </div>
    </>
  )
}
