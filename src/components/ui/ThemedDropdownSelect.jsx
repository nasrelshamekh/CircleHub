import { Check, ChevronDown } from "lucide-react";

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function ThemedDropdownSelect({ id, value, options, onChange, ariaLabel, disabled = false }) {
    const selectedOption = options.find((option) => option.value === value) || options[0];

    return (
        <DropdownMenu>
            <DropdownMenuTrigger
                id={id}
                type="button"
                aria-label={ariaLabel}
                disabled={disabled}
                className="input-surface type-body-sm flex w-fit items-center gap-3 rounded-lg border-0 bg-(--surface-low) px-4 py-3 text-primary outline-none transition hover:bg-(--hover) disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-(--surface-low)"
            >
                <span>{selectedOption.label}</span>
                <ChevronDown size={17} className="text-(--primary)" />
            </DropdownMenuTrigger>

            <DropdownMenuContent className="w-(--radix-dropdown-menu-trigger-width) bg-(--surface-lowest)" align="start">
                {options.map((option) => (
                    <DropdownMenuItem
                        key={option.value}
                        onClick={() => onChange(option.value)}
                        className="justify-between"
                    >
                        <span>{option.label}</span>
                        {option.value === value && <Check size={16} className="text-(--primary)" />}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
