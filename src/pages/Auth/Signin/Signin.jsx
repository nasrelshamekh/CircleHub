import { Eye, EyeOff, LogIn } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";

import logo from "@/assets/circlehub-logo.png";
import { useAuth } from "@/hooks/useAuth";

export default function Signin() {
    const { setIsAuthenticated } = useAuth();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        email: "",
        password: "",
    });
    const [showPassword, setShowPassword] = useState(false);
    function handleChange(event) {
        const { name, value } = event.target;

        setFormData((currentData) => ({
            ...currentData,
            [name]: value,
        }));
    }

    function handleSubmit(event) {
        event.preventDefault();
        if (!formData.email.trim() || !formData.password.trim()) {
            toast.error("Please enter your email and password.");
            return;
        }
        setIsAuthenticated(true);
        toast.success("Signed in successfully");
        navigate("/feed", { replace: true });
    }

    return (
        <section className="flex min-h-screen w-full items-center justify-center bg-(--surface-low) p-6">
            <div className="content-card-padded w-full max-w-md">
                <div className="mb-8 flex flex-col items-center justify-center">
                    <img src={logo} alt="CircleHub" className="mb-8 w-44" />

                    <h1 className="type-headline-md text-primary">
                        Welcome back
                    </h1>

                    <p className="type-body-sm-readable mt-2 text-secondary">
                        Sign in to continue to your CircleHub feed.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="space-y-3">
                        <label htmlFor="email" className="type-label-md mb-3 block text-primary">
                            Email
                        </label>

                        <input
                            id="email"
                            name="email"
                            type="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="you@example.com"
                            className="input-surface type-body-sm w-full rounded-xl px-4 py-3"
                        />
                    </div>

                    <div className="space-y-3">
                        <label htmlFor="password" className="type-label-md mb-3 block text-primary">
                            Password
                        </label>

                        <div className="input-surface flex w-full items-center rounded-xl px-4 py-3">
                            <input
                                id="password"
                                name="password"
                                type={showPassword ? "text" : "password"}
                                value={formData.password}
                                onChange={handleChange}
                                placeholder="Enter your password"
                                className="type-body-sm min-w-0 flex-1 bg-transparent outline-none placeholder:text-(--text-secondary)"
                            />

                            <button
                                type="button"
                                onClick={() => setShowPassword((current) => !current)}
                                className="icon-button ml-3 shrink-0"
                                aria-label={showPassword ? "Hide password" : "Show password"}
                            >
                                <motion.span
                                    key={showPassword ? "hide" : "show"}
                                    initial={{ opacity: 0, scale: 0.8, rotate: -12 }}
                                    animate={{ opacity: 1, scale: 1, rotate: 0 }}
                                    transition={{ duration: 0.18, ease: "easeOut" }}
                                    className="flex"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </motion.span>
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="button-primary type-button flex w-full items-center justify-center gap-2 px-5 py-3"
                    >
                        <LogIn size={18} />
                        Sign In
                    </button>
                </form>

                <p className="type-body-sm mt-6 text-center text-secondary">
                    New to CircleHub?{" "}
                    <Link to="/register" className="relative inline-block font-semibold text-(--primary) after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-full after:origin-left after:scale-x-0 after:rounded-full after:bg-(--primary) after:transition-transform after:duration-200 after:ease-out hover:after:scale-x-100">
                        Create an account
                    </Link>
                </p>
            </div>
        </section>
    )
}
