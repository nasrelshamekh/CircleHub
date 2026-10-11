import { AlertCircle, ArrowLeft, LoaderCircle, MailCheck, Send } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "react-router-dom";
import { toast } from "sonner";

import logo from "@/assets/circlehub-logo.png";
import { forgotPasswordSchema } from "@/lib/authValidation";
import { forgotPassword } from "@/services/authApi";

const linkClass =
    "relative inline-block font-semibold text-(--primary) after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-full after:origin-left after:scale-x-0 after:rounded-full after:bg-(--primary) after:transition-transform after:duration-200 after:ease-out hover:after:scale-x-100";

export default function ForgotPassword() {
    const [sentEmail, setSentEmail] = useState("");

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm({
        resolver: zodResolver(forgotPasswordSchema),
        mode: "onTouched",
        defaultValues: { email: "" },
    });

    async function onSubmit(values) {
        try {
            const response = await forgotPassword(values.email);

            setSentEmail(values.email);
            toast.success(response.message || "Check your inbox for the reset link");
        } catch (error) {
            toast.error(
                error.response?.data?.message ||
                    error.message ||
                    "Could not send the reset link"
            );
        }
    }

    return (
        <section className="flex min-h-screen w-full items-center justify-center bg-(--surface-low) p-6">
            <div className="content-card-padded w-full max-w-lg">
                <div className="mb-8 flex flex-col items-center justify-center">
                    <img src={logo} alt="CircleHub" className="mb-8 w-44" />

                    <h1 className="type-headline-md text-primary">
                        Forgot your password?
                    </h1>

                    <p className="type-body-sm-readable mt-2 text-center text-secondary">
                        Enter the email you use for CircleHub and we&apos;ll send
                        you a reset link.
                    </p>
                </div>

                {sentEmail ? (
                    <div className="text-center">
                        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-(--radius-full) bg-(--active) text-(--primary)">
                            <MailCheck size={36} />
                        </div>

                        <p className="type-body-md text-secondary">
                            If an account exists for <strong>{sentEmail}</strong>,
                            we&apos;ve sent a password reset link. Check your inbox.
                        </p>

                        <Link
                            to="/signin"
                            className="button-primary type-button mt-8 flex w-full items-center justify-center gap-2 px-5 py-3"
                        >
                            <ArrowLeft size={18} />
                            Back to sign in
                        </Link>
                    </div>
                ) : (
                    <>
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
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

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="button-primary type-button flex w-full items-center justify-center gap-2 px-5 py-3 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {isSubmitting ? (
                                    <LoaderCircle size={18} className="animate-spin" />
                                ) : (
                                    <Send size={18} />
                                )}
                                {isSubmitting ? "Sending..." : "Send reset link"}
                            </button>
                        </form>

                        <p className="type-body-sm mt-6 text-center text-secondary">
                            Remembered it?{" "}
                            <Link to="/signin" className={linkClass}>
                                Back to sign in
                            </Link>
                        </p>
                    </>
                )}
            </div>
        </section>
    );
}
