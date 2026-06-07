import { ChevronDown, Eye, EyeOff, UserPlus } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";

import logo from "@/assets/circlehub-logo.png";
import { getAvatarImage, getCoverImage } from "@/lib/profileImages";
import { useAuth } from "@/hooks/useAuth";
import { useCommunities } from "@/hooks/useCommunities";
import { resetCommunitiesForNewUser } from "@/lib/communityMembership";

export default function Register() {
    const { setUserData, setIsAuthenticated } = useAuth();
    const { setCommunities } = useCommunities();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: "",
        username: "",
        email: "",
        password: "",
        role: "",
        gender: "",
        location: "",
        dateOfBirth: "",
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
        if (
            !formData.name.trim() ||
            !formData.username.trim() ||
            !formData.email.trim() ||
            !formData.password.trim()
        ) {
            toast.error("Please fill in the required fields.");
            return;
        }
        const newUser = {
            id: Date.now(),
            name: formData.name.trim(),
            username: formData.username.trim(),
            email: formData.email.trim(),
            role: formData.role.trim() || "CircleHub Member",
            avatar: getAvatarImage(),
            coverImage: getCoverImage(),
            bio: "New to CircleHub and ready to connect.",
            location: formData.location.trim() || "Not set",
            website: "",
            dateOfBirth: formData.dateOfBirth,
            gender: formData.gender,
            followersCount: 0,
            followingCount: 0,
            postsCount: 0,
            joinedAt: "Just now",
            mutualConnections: [],
            skills: [],
        };
        setUserData(newUser);
        setCommunities(resetCommunitiesForNewUser);
        setIsAuthenticated(true);
        toast.success("Account created successfully");
        navigate("/feed", { replace: true });
    }

    return (
        <section className="flex min-h-screen w-full items-center justify-center bg-(--surface-low) p-6">
            <div className="content-card-padded w-full max-w-md">
                <div className="mb-8 flex flex-col items-center justify-center">
                    <img src={logo} alt="CircleHub" className="mb-8 w-44" />

                    <h1 className="type-headline-md text-primary">
                        Create your account
                    </h1>

                    <p className="type-body-sm-readable mt-2 text-secondary">
                        Join CircleHub and start building your network.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div className="space-y-3 sm:col-span-2">
                            <label htmlFor="name" className="type-label-md mb-3 block text-primary">
                                Full Name
                            </label>

                            <input
                                id="name"
                                name="name"
                                type="text"
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="Your name"
                                className="input-surface type-body-sm w-full rounded-xl py-3 pl-4 pr-10"
                            />
                        </div>

                        <div className="space-y-3">
                            <label htmlFor="username" className="type-label-md mb-3 block text-primary">
                                Username
                            </label>

                            <input
                                id="username"
                                name="username"
                                type="text"
                                value={formData.username}
                                onChange={handleChange}
                                placeholder="Choose a username"
                                className="input-surface type-body-sm w-full rounded-xl px-4 py-3"
                            />
                        </div>

                        <div className="space-y-3">
                            <label htmlFor="role" className="type-label-md mb-3 block text-primary">
                                Role
                            </label>

                            <input
                                id="role"
                                name="role"
                                type="text"
                                value={formData.role}
                                onChange={handleChange}
                                placeholder="Your role or title"
                                className="input-surface type-body-sm w-full rounded-xl px-4 py-3"
                            />
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
                                    name="gender"
                                    value={formData.gender}
                                    onChange={handleChange}
                                    className="input-surface type-body-sm w-full appearance-none rounded-xl py-3 pl-4 pr-12"
                                >
                                    <option value="">Select gender</option>
                                    <option value="male">Male</option>
                                    <option value="female">Female</option>
                                </select>

                                <ChevronDown
                                    size={18}
                                    className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-secondary"
                                />
                            </div>
                        </div>

                        <div className="space-y-3">
                            <label htmlFor="dateOfBirth" className="type-label-md mb-3 block text-primary">
                                Birthdate
                            </label>

                            <input
                                id="dateOfBirth"
                                name="dateOfBirth"
                                type="date"
                                value={formData.dateOfBirth}
                                onChange={handleChange}
                                className="input-surface type-body-sm w-full rounded-xl px-4 py-3"
                            />
                        </div>
                    </div>

                    <div className="space-y-3">
                        <label htmlFor="location" className="type-label-md mb-3 block text-primary">
                            Location
                        </label>

                        <input
                            id="location"
                            name="location"
                            type="text"
                            value={formData.location}
                            onChange={handleChange}
                            placeholder="City, Country"
                            className="input-surface type-body-sm w-full rounded-xl px-4 py-3"
                        />
                    </div>

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
                                placeholder="Create a password"
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
                        <UserPlus size={18} />
                        Create Account
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
