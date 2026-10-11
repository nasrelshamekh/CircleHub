import { CheckCircle2, LoaderCircle, ShieldAlert, Smartphone } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useSearchParams } from "react-router-dom";
import { toast } from "sonner";

import logo from "@/assets/circlehub-logo.png";
import PasswordInput from "@/components/ui/PasswordInput";
import { resetPasswordSchema } from "@/lib/authValidation";
import { resetPassword } from "@/services/authApi";

export default function ResetPassword() {
    const [searchParams] = useSearchParams();
    const userId = searchParams.get("userId") || "";
    const token = searchParams.get("token") || "";
    const hasParams = Boolean(userId && token);

    const [done, setDone] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm({
        resolver: zodResolver(resetPasswordSchema),
        mode: "onTouched",
        defaultValues: { password: "", confirmPassword: "" },
    });

    async function onSubmit(values) {
        try {
            const response = await resetPassword(userId, token, values.password);

            toast.success(response.message || "Your password has been reset");
            setDone(true);
        } catch (error) {
            toast.error(
                error.response?.data?.message ||
                    error.message ||
                    "Could not reset your password"
            );
        }
    }

    const appLink = `circlehubmobile://reset-password?userId=${encodeURIComponent(
        userId
    )}&token=${encodeURIComponent(token)}`;

    return (
        <main className="flex min-h-screen items-center justify-center bg-(--surface-low) px-5 py-10 text-primary">
            <section className="content-card-padded w-full max-w-lg text-center">
                <Link to="/" className="mx-auto mb-8 inline-flex">
                    <img src={logo} alt="CircleHub" className="w-44" />
                </Link>

                {!hasParams && (
                    <>
                        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-(--radius-full) bg-(--surface-low) text-(--error)">
                            <ShieldAlert size={36} />
                        </div>
                        <h1 className="type-headline-responsive text-primary">
                            Reset link is invalid
                        </h1>
                        <p className="type-body-md mx-auto mt-3 max-w-md text-secondary">
                            This password reset link is missing required
                            information or has expired. Request a new link to
                            continue.
                        </p>
                        <Link
                            to="/forgot-password"
                            className="button-primary type-button mx-auto mt-8 flex w-full items-center justify-center gap-2 px-5 py-3 sm:w-auto"
                        >
                            Request a new link
                        </Link>
                    </>
                )}

                {hasParams && done && (
                    <>
                        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-(--radius-full) bg-(--active) text-(--primary)">
                            <CheckCircle2 size={36} />
                        </div>
                        <h1 className="type-headline-responsive text-primary">
                            Password updated
                        </h1>
                        <p className="type-body-md mx-auto mt-3 max-w-md text-secondary">
                            Your password has been reset successfully. You can
                            now sign in with your new password.
                        </p>
                        <Link
                            to="/signin"
                            className="button-primary type-button mx-auto mt-8 flex w-full items-center justify-center gap-2 px-5 py-3 sm:w-auto"
                        >
                            Go to Sign in
                        </Link>
                    </>
                )}

                {hasParams && !done && (
                    <>
                        <h1 className="type-headline-responsive text-primary">
                            Choose a new password
                        </h1>
                        <p className="type-body-md mx-auto mb-8 mt-3 max-w-md text-secondary">
                            Pick a strong password you haven&apos;t used before.
                        </p>

                        <form
                            onSubmit={handleSubmit(onSubmit)}
                            className="space-y-5 text-left"
                        >
                            <PasswordInput
                                id="password"
                                label="New password"
                                autoComplete="new-password"
                                placeholder="Create a password"
                                error={errors.password}
                                registration={register("password")}
                            />

                            <PasswordInput
                                id="confirmPassword"
                                label="Confirm password"
                                autoComplete="new-password"
                                placeholder="Re-enter your password"
                                error={errors.confirmPassword}
                                registration={register("confirmPassword")}
                            />

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="button-primary type-button flex w-full items-center justify-center gap-2 px-5 py-3 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {isSubmitting ? (
                                    <LoaderCircle size={18} className="animate-spin" />
                                ) : (
                                    <CheckCircle2 size={18} />
                                )}
                                {isSubmitting ? "Resetting..." : "Reset password"}
                            </button>
                        </form>

                        <a
                            href={appLink}
                            className="type-body-sm mt-6 inline-flex items-center justify-center gap-1.5 font-semibold text-(--primary)"
                        >
                            <Smartphone size={16} />
                            Open in the CircleHub app
                        </a>
                    </>
                )}
            </section>
        </main>
    );
}
