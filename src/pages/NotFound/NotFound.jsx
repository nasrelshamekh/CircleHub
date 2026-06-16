import { Compass, Home, SearchX } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import logo from "@/assets/circlehub-logo.png";
import { useAuth } from "@/hooks/useAuth";

export default function NotFound() {
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();
    const homePath = isAuthenticated ? "/feed" : "/";

    return (
        <main className="flex min-h-screen items-center justify-center bg-(--surface-low) px-5 py-10 text-primary">
            <section className="content-card-padded w-full max-w-2xl text-center">
                <Link to={homePath} className="mx-auto mb-8 inline-flex">
                    <img src={logo} alt="CircleHub" className="w-48" />
                </Link>

                <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-(--radius-full) bg-(--active) text-(--primary)">
                    <SearchX size={36} />
                </div>

                <p className="type-label-md mb-3 text-(--primary)">404</p>

                <h1 className="type-headline-responsive text-primary">
                    Page not found
                </h1>

                <p className="type-body-md mx-auto mt-3 max-w-md text-secondary">
                    The page you are looking for does not exist, was moved, or is no longer available.
                </p>

                <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                    <Link
                        to={homePath}
                        className="button-primary type-button flex w-full items-center justify-center gap-2 px-5 py-3 sm:w-auto"
                    >
                        <Home size={18} />
                        {isAuthenticated ? "Back to Feed" : "Back to Home"}
                    </Link>

                    <button
                        type="button"
                        onClick={() => navigate(-1)}
                        className="type-button flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-(--surface-low) px-5 py-3 text-(--primary) transition hover:bg-(--hover) sm:w-auto"
                    >
                        <Compass size={18} />
                        Go Back
                    </button>
                </div>
            </section>
        </main>
    );
}
