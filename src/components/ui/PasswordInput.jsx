import { AlertCircle, Eye, EyeOff } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";

export default function PasswordInput({ id, label, autoComplete, placeholder, error, registration }) {
    const [visible, setVisible] = useState(false);

    return (
        <div className="space-y-3">
            <label htmlFor={id} className="type-label-md mb-3 block text-primary">
                {label}
            </label>

            <div className="input-surface flex w-full items-center rounded-xl px-4 py-3">
                <input
                    id={id}
                    type={visible ? "text" : "password"}
                    autoComplete={autoComplete}
                    placeholder={placeholder}
                    aria-invalid={Boolean(error)}
                    className="type-body-sm min-w-0 flex-1 bg-transparent outline-none placeholder:text-(--text-secondary)"
                    {...registration}
                />

                <button
                    type="button"
                    onClick={() => setVisible((current) => !current)}
                    className="icon-button ml-3 shrink-0"
                    aria-label={visible ? "Hide password" : "Show password"}
                >
                    <motion.span
                        key={visible ? "hide" : "show"}
                        initial={{ opacity: 0, scale: 0.8, rotate: -12 }}
                        animate={{ opacity: 1, scale: 1, rotate: 0 }}
                        transition={{ duration: 0.18, ease: "easeOut" }}
                        className="flex"
                    >
                        {visible ? <EyeOff size={18} /> : <Eye size={18} />}
                    </motion.span>
                </button>
            </div>

            {error && (
                <p className="flex items-center gap-1.5 text-(length:--text-label-sm) text-(--error)">
                    <AlertCircle size={14} />
                    {error.message}
                </p>
            )}
        </div>
    );
}
