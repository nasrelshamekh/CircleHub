import { LoaderCircle, Save } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import PasswordInput from "@/components/ui/PasswordInput";
import { useAuth } from "@/hooks/useAuth";
import { changePasswordSchema } from "@/lib/authValidation";
import { changePassword } from "@/services/authApi";

export default function ChangePasswordForm() {
    const { setUserData } = useAuth();
    const navigate = useNavigate();

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm({
        resolver: zodResolver(changePasswordSchema),
        mode: "onTouched",
        defaultValues: {
            currentPassword: "",
            newPassword: "",
            confirmPassword: "",
        },
    });

    async function onSubmit(values) {
        try {
            await changePassword(values.currentPassword, values.newPassword);

            setUserData(null);
            toast.success("Password changed. Please sign in again.");
            navigate("/signin", { replace: true });
        } catch (error) {
            toast.error(
                error.response?.data?.message ||
                    error.message ||
                    "Could not change your password"
            );
        }
    }

    return (
        <section className="content-card-padded">
            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
                <div>
                    <h2 className="type-title-lg text-primary">Change Password</h2>
                    <p className="type-body-sm mt-1 text-secondary">
                        Update the password you use to sign in to CircleHub.
                    </p>
                </div>

                <div className="flex flex-col gap-5">
                    <PasswordInput
                        id="currentPassword"
                        label="Current password"
                        autoComplete="current-password"
                        placeholder="Enter your current password"
                        error={errors.currentPassword}
                        registration={register("currentPassword")}
                    />

                    <PasswordInput
                        id="newPassword"
                        label="New password"
                        autoComplete="new-password"
                        placeholder="Create a new password"
                        error={errors.newPassword}
                        registration={register("newPassword")}
                    />

                    <PasswordInput
                        id="confirmPassword"
                        label="Confirm new password"
                        autoComplete="new-password"
                        placeholder="Re-enter your new password"
                        error={errors.confirmPassword}
                        registration={register("confirmPassword")}
                    />
                </div>

                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="button-primary mx-auto flex w-50 items-center justify-center gap-2 p-3 disabled:cursor-not-allowed disabled:opacity-60"
                >
                    {isSubmitting ? (
                        <LoaderCircle size={18} className="animate-spin" />
                    ) : (
                        <Save size={18} />
                    )}
                    {isSubmitting ? "Updating..." : "Update password"}
                </button>
            </form>
        </section>
    );
}
