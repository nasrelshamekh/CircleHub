import { AlertCircle, ChevronDown, Eye, EyeOff, LoaderCircle, UserPlus } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";

import logo from "@/assets/circlehub-logo.png";
import { registerSchema } from "@/lib/authValidation";
import { registerUser } from "@/services/authApi";

export default function Register() {
    const navigate = useNavigate();
    const [showPassword, setShowPassword] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm({
        resolver: zodResolver(registerSchema),
        mode: "onTouched",
        defaultValues: {
            name: "",
            username: "",
            jobTitle: "",
            gender: "",
            dateOfBirth: "",
            location: "",
            email: "",
            password: "",
        },
    });

    async function onSubmit(values) {
        try {
            const response = await registerUser(values);
            toast.success(response.message || "Account created successfully");
            navigate("/verify-email", { state: { email: values.email } });
        } catch (error) {
            toast.error(
                error.response?.data?.message ||
                error.message ||
                "Could not create account"
            );
        }
    }

    return (
        <section className="flex min-h-screen w-full items-center justify-center bg-(--surface-low) p-6">
            <div className="content-card-padded w-full max-w-lg">
                <div className="mb-8 flex flex-col items-center justify-center">
                    <img src={logo} alt="CircleHub" className="mb-8 w-44" />

                    <h1 className="type-headline-md text-primary">
                        Create your account
                    </h1>

                    <p className="type-body-sm-readable mt-2 text-secondary">
                        Join CircleHub and start building your network.
                    </p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div className="space-y-3 sm:col-span-2">
                            <label htmlFor="name" className="type-label-md mb-3 block text-primary">
                                Full Name
                            </label>

                            <input
                                id="name"
                                type="text"
                                placeholder="Your name"
                                aria-invalid={Boolean(errors.name)}
                                className="input-surface type-body-sm w-full rounded-xl py-3 pl-4 pr-10"
                                {...register("name")}
                            />
                            {errors.name && (
                                <p className="flex items-center gap-1.5 text-(length:--text-label-sm) text-(--error)">
                                    <AlertCircle size={14} />
                                    {errors.name.message}
                                </p>
                            )}
                        </div>

                        <div className="space-y-3">
                            <label htmlFor="username" className="type-label-md mb-3 block text-primary">
                                Username
                            </label>

                            <input
                                id="username"
                                type="text"
                                placeholder="Choose a username"
                                aria-invalid={Boolean(errors.username)}
                                className="input-surface type-body-sm w-full rounded-xl px-4 py-3"
                                {...register("username")}
                            />
                            {errors.username && (
                                <p className="flex items-center gap-1.5 text-(length:--text-label-sm) text-(--error)">
                                    <AlertCircle size={14} />
                                    {errors.username.message}
                                </p>
                            )}
                            <p className="type-label-sm text-secondary">
                                Your username can't be changed after you create your account.
                            </p>
                        </div>

                        <div className="space-y-3">
                            <label htmlFor="jobTitle" className="type-label-md mb-3 block text-primary">
                                Job Title
                            </label>

                            <input
                                id="jobTitle"
                                type="text"
                                placeholder="Your job title"
                                aria-invalid={Boolean(errors.jobTitle)}
                                className="input-surface type-body-sm w-full rounded-xl px-4 py-3"
                                {...register("jobTitle")}
                            />
                            {errors.jobTitle && (
                                <p className="flex items-center gap-1.5 text-(length:--text-label-sm) text-(--error)">
                                    <AlertCircle size={14} />
                                    {errors.jobTitle.message}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div className="space-y-3">
                            <label htmlFor="gender" className="type-label-md mb-3 block text-primary">
                                Gender
                            </label>

                            <div className="relative">
                                <select
                                    id="gender"
                                    aria-invalid={Boolean(errors.gender)}
                                    className="input-surface type-body-sm w-full appearance-none rounded-xl py-3 pl-4 pr-12"
                                    {...register("gender")}
                                >
                                    <option value="">Select gender</option>
                                    <option value="male">Male</option>
                                    <option value="female">Female</option>
                                    <option value="other">Other</option>
                                </select>

                                <ChevronDown
                                    size={18}
                                    className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-secondary"
                                />
                            </div>
                            {errors.gender && (
                                <p className="flex items-center gap-1.5 text-(length:--text-label-sm) text-(--error)">
                                    <AlertCircle size={14} />
                                    {errors.gender.message}
                                </p>
                            )}
                        </div>

                        <div className="space-y-3">
                            <label htmlFor="dateOfBirth" className="type-label-md mb-3 block text-primary">
                                Birthdate
                            </label>

                            <input
                                id="dateOfBirth"
                                type="date"
                                aria-invalid={Boolean(errors.dateOfBirth)}
                                className="input-surface type-body-sm w-full rounded-xl px-4 py-3"
                                {...register("dateOfBirth")}
                            />
                            {errors.dateOfBirth && (
                                <p className="flex items-center gap-1.5 text-(length:--text-label-sm) text-(--error)">
                                    <AlertCircle size={14} />
                                    {errors.dateOfBirth.message}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="space-y-3">
                        <label htmlFor="location" className="type-label-md mb-3 block text-primary">
                            Location
                        </label>

                        <input
                            id="location"
                            type="text"
                            placeholder="City, Country"
                            aria-invalid={Boolean(errors.location)}
                            className="input-surface type-body-sm w-full rounded-xl px-4 py-3"
                            {...register("location")}
                        />
                        {errors.location && (
                            <p className="flex items-center gap-1.5 text-(length:--text-label-sm) text-(--error)">
                                <AlertCircle size={14} />
                                {errors.location.message}
                            </p>
                        )}
                    </div>

                    <div className="space-y-3">
                        <label htmlFor="email" className="type-label-md mb-3 block text-primary">
                            Email
                        </label>

                        <input
                            id="email"
                            type="email"
                            autoComplete="email"
                            placeholder="you@example.com"
                            aria-invalid={Boolean(errors.email)}
                            className="input-surface type-body-sm w-full rounded-xl px-4 py-3"
                            {...register("email")}
                        />
                        {errors.email && (
                            <p className="flex items-center gap-1.5 text-(length:--text-label-sm) text-(--error)">
                                <AlertCircle size={14} />
                                {errors.email.message}
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
                                autoComplete="new-password"
                                placeholder="Create a password"
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
                            <UserPlus size={18} />
                        )}
                        {isSubmitting ? "Creating Account..." : "Create Account"}
                    </button>
                </form>

                <p className="type-body-sm mt-6 text-center text-secondary">
                    Already have an account?{" "}
                    <Link to="/signin" className="relative inline-block font-semibold text-(--primary) after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-full after:origin-left after:scale-x-0 after:rounded-full after:bg-(--primary) after:transition-transform after:duration-200 after:ease-out hover:after:scale-x-100">
                        Sign in
                    </Link>
                </p>
            </div>
        </section>
    )
}
