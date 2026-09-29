import { AlertCircle, Eye, EyeOff, LoaderCircle, LogIn } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";

import logo from "@/assets/circlehub-logo.png";
import { useAuth } from "@/hooks/useAuth";
import { signinSchema } from "@/lib/authValidation";
import { loginUser } from "@/services/authApi";

export default function Signin() {
    const { setUserData } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [showPassword, setShowPassword] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm({
        resolver: zodResolver(signinSchema),
        mode: "onTouched",
        defaultValues: { usernameOrEmail: "", password: "" },
    });

    async function onSubmit(values) {
        try {
            const response = await loginUser(values);
            const { user, token } = response.data;

            localStorage.setItem("token", token);
            setUserData(user);

            toast.success(response.message || "Signed in successfully");
            navigate(location.state?.from?.pathname || "/feed", { replace: true });
        } catch (error) {
            const status = error.response?.status;
            const message = error.response?.data?.message || error.message || "Could not sign in";

            if (status === 403) {
                toast.error(message, { duration: 5000 });
                navigate("/verify-email", {
                    state: {
                        email: values.usernameOrEmail.includes("@")
                            ? values.usernameOrEmail
                            : "",
                    },
                });
                return;
            }

            toast.error(message);
        }
    }

    return (
        <section className="flex min-h-screen w-full items-center justify-center bg-(--surface-low) p-6">
            <div className="content-card-padded w-full max-w-lg">
                <div className="mb-8 flex flex-col items-center justify-center">
                    <img src={logo} alt="CircleHub" className="mb-8 w-44" />

                    <h1 className="type-headline-md text-primary">
                        Welcome back
                    </h1>

                    <p className="type-body-sm-readable mt-2 text-secondary">
                        Sign in to continue to your CircleHub feed.
                    </p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                    <div className="space-y-3">
                        <label htmlFor="usernameOrEmail" className="type-label-md mb-3 block text-primary">
                            Email or Username
                        </label>

                        <input
                            id="usernameOrEmail"
                            type="text"
                            autoComplete="username"
                            placeholder="username or you@example.com"
                            aria-invalid={Boolean(errors.usernameOrEmail)}
                            className="input-surface type-body-sm w-full rounded-xl px-4 py-3"
                            {...register("usernameOrEmail")}
                        />

                        {errors.usernameOrEmail && (
                            <p className="flex items-center gap-1.5 text-(length:--text-label-sm) text-(--error)">
                                <AlertCircle size={14} />
                                {errors.usernameOrEmail.message}
                            </p>
                        )}
                    </div>

                    <div className="space-y-3">
                        <label htmlFor="password" className="type-label-md mb-3 block text-primary">
                            Password
                        </label>

                        <div className="input-surface flex w-full items-center rounded-xl px-4 py-3">
                            <input
                                id="password"
                                type={showPassword ? "text" : "password"}
                                autoComplete="current-password"
                                placeholder="Enter your password"
                                aria-invalid={Boolean(errors.password)}
                                className="type-body-sm min-w-0 flex-1 bg-transparent outline-none placeholder:text-(--text-secondary)"
                                {...register("password")}
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

                        {errors.password && (
                            <p className="flex items-center gap-1.5 text-(length:--text-label-sm) text-(--error)">
                                <AlertCircle size={14} />
                                {errors.password.message}
                            </p>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="button-primary type-button flex w-full items-center justify-center gap-2 px-5 py-3 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {isSubmitting ? (
                            <LoaderCircle size={18} className="animate-spin" />
                        ) : (
                            <LogIn size={18} />
                        )}
                        {isSubmitting ? "Signing In..." : "Sign In"}
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
