import { CheckCircle2, LoaderCircle, MailCheck, MailX, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { toast } from "sonner";

import logo from "@/assets/circlehub-logo.png";
import { resendVerificationEmail, verifyEmail } from "@/services/authApi";

export default function VerifyEmail() {
    const [searchParams] = useSearchParams();
    const location = useLocation();
    const userId = searchParams.get("userId") || "";
    const token = searchParams.get("token") || "";
    const hasParams = Boolean(userId && token);

    const [errorMessage, setErrorMessage] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    const [email, setEmail] = useState(location.state?.email || "");
    const [resending, setResending] = useState(false);
    const [resent, setResent] = useState(false);

    useEffect(() => {
        if (!hasParams) return;

        let active = true;

        verifyEmail(userId, token)
            .then((response) => {
                if (!active) return;
                if (response.success) {
                    setSuccessMessage(
                        response.message ||
                            "Your email has been verified successfully. You can now sign in."
                    );
                    toast.success(response.message || "Email verified successfully");
                } else {
                    setErrorMessage(response.message || "Could not verify your email.");
                    toast.error(response.message || "Could not verify your email.");
                }
            })
            .catch((error) => {
                if (!active) return;
                setErrorMessage(
                    error.response?.data?.message ||
                        "Could not verify your email. The link may be invalid or expired."
                );
            });

        return () => {
            active = false;
        };
    }, [hasParams, userId, token]);

    async function handleResend(event) {
        event.preventDefault();
        setResending(true);
        try {
            const response = await resendVerificationEmail(email);
            setResent(true);
            toast.success(response.message || "Verification email sent");
        } catch (error) {
            toast.error(
                error.response?.data?.message || "Could not send the verification email"
            );
        } finally {
            setResending(false);
        }
    }

    async function handleResendEmail() {
        setResending(true);
        try {
            const response = await resendVerificationEmail(email);
            setResent(true);
            toast.success(response.message || "Verification email resent");
        } catch (error) {
            toast.error(
                error.response?.data?.message || "Could not send the verification email"
            );
        } finally {
            setResending(false);
        }
    }

    const missingParams = !hasParams;
    const showSuccess = Boolean(successMessage);
    const showError = Boolean(errorMessage);
    const showPending = missingParams && !showSuccess && !showError && email;
    const showVerifying = hasParams && !showSuccess && !showError;

    return (
        <main className="flex min-h-screen items-center justify-center bg-(--surface-low) px-5 py-10 text-primary">
            <section className="content-card-padded w-full max-w-lg text-center">
                <Link to="/" className="mx-auto mb-8 inline-flex">
                    <img src={logo} alt="CircleHub" className="w-44" />
                </Link>

                {showPending && (
                    <>
                        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-(--radius-full) bg-(--active) text-(--primary)">
                            <MailCheck size={36} />
                        </div>
                        <h1 className="type-headline-responsive text-primary">
                            Check your email
                        </h1>
                        <p className="type-body-md mx-auto mt-3 max-w-md text-secondary">
                            We sent a verification link to <strong>{email}</strong>. Open the link in your email to activate your account.
                        </p>
                        <div className="mt-8 flex flex-col items-center justify-center gap-3">
                            <Link
                                to="/signin"
                                className="button-primary type-button flex w-full items-center justify-center gap-2 px-5 py-3 sm:w-auto"
                            >
                                Go to Sign in
                            </Link>
                            {!resent ? (
                                <button
                                    type="button"
                                    onClick={handleResendEmail}
                                    disabled={resending}
                                    className="button-primary type-button flex w-full items-center justify-center gap-2 px-5 py-3 sm:w-auto disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {resending ? (
                                        <LoaderCircle size={18} className="animate-spin" />
                                    ) : (
                                        <RefreshCw size={18} />
                                    )}
                                    {resending ? "Sending..." : "Resend verification email"}
                                </button>
                            ) : (
                                <p className="type-body-sm text-secondary">
                                    A new verification link has been sent. Check your inbox.
                                </p>
                            )}
                        </div>
                    </>
                )}

                {showVerifying && (
                    <>
                        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-(--radius-full) bg-(--active) text-(--primary)">
                            <LoaderCircle size={36} className="animate-spin" />
                        </div>
                        <h1 className="type-headline-responsive text-primary">
                            Verifying your email
                        </h1>
                        <p className="type-body-md mt-3 text-secondary">
                            Please wait a moment while we confirm your email address.
                        </p>
                    </>
                )}

                {showSuccess && (
                    <>
                        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-(--radius-full) bg-(--active) text-(--primary)">
                            <CheckCircle2 size={36} />
                        </div>
                        <h1 className="type-headline-responsive text-primary">
                            You&apos;re all set!
                        </h1>
                        <p className="type-body-md mx-auto mt-3 max-w-md text-secondary">
                            {successMessage}
                        </p>
                        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                            <Link
                                to="/signin"
                                className="button-primary type-button flex w-full items-center justify-center gap-2 px-5 py-3 sm:w-auto"
                            >
                                Go to Sign in
                            </Link>
                        </div>
                    </>
                )}

                {(showError || (missingParams && !email)) && (
                    <>
                        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-(--radius-full) bg-(--surface-low) text-(--error)">
                            <MailX size={36} />
                        </div>
                        <h1 className="type-headline-responsive text-primary">
                            Email verification failed
                        </h1>
                        <p className="type-body-md mx-auto mt-3 max-w-md text-secondary">
                            {errorMessage ||
                                "This verification link is missing required information."}
                        </p>

                        {!resent ? (
                            <form onSubmit={handleResend} className="mx-auto mt-8 max-w-sm space-y-3 text-left">
                                <label htmlFor="resendEmail" className="type-label-md mb-3 block text-primary">
                                    Request a new link
                                </label>
                                <input
                                    id="resendEmail"
                                    type="email"
                                    required
                                    autoComplete="email"
                                    placeholder="you@example.com"
                                    value={email}
                                    onChange={(event) => setEmail(event.target.value)}
                                    className="input-surface type-body-sm w-full rounded-xl px-4 py-3"
                                />
                                <button
                                    type="submit"
                                    disabled={resending}
                                    className="button-primary type-button flex w-full items-center justify-center gap-2 px-5 py-3 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {resending ? (
                                        <LoaderCircle size={18} className="animate-spin" />
                                    ) : (
                                        <RefreshCw size={18} />
                                    )}
                                    {resending ? "Sending..." : "Resend verification email"}
                                </button>
                            </form>
                        ) : (
                            <p className="type-body-sm mt-8 text-secondary">
                                Check your inbox for a new verification link. You can also{" "}
                                <span
                                    role="button"
                                    tabIndex={0}
                                    onClick={() => setResent(false)}
                                    onKeyDown={(event) => {
                                        if (event.key === "Enter" || event.key === " ") setResent(false);
                                    }}
                                    className="cursor-pointer font-semibold text-(--primary) underline"
                                >
                                    try another email
                                </span>
                                .
                            </p>
                        )}
                    </>
                )}
            </section>
        </main>
    );
}
