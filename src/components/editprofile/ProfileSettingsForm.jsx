import { Save } from "lucide-react";
import { useState } from "react";

import ThemedDropdownSelect from "@/components/ui/ThemedDropdownSelect";

const profileVisibilityOptions = [
    {
        value: "public",
        label: "Public",
    },
    {
        value: "followers",
        label: "Followers only",
    },
    {
        value: "private",
        label: "Private",
    },
];

const messageOptions = [
    {
        value: "everyone",
        label: "Everyone",
    },
    {
        value: "followers",
        label: "Followers only",
    },
    {
        value: "none",
        label: "No one",
    },
];

export default function ProfileSettingsForm() {
    const [settings, setSettings] = useState({
        profileVisibility: "public",
        messagesFrom: "followers",
        emailNotifications: true,
        communityUpdates: true,
    });

    function updateSetting(name, value) {
        setSettings((currentSettings) => ({
            ...currentSettings,
            [name]: value,
        }));
    }

    return (
        <section className="content-card-padded">
            <div className="flex flex-col gap-6">
                <div>
                    <h2 className="type-title-lg text-primary">Profile Settings</h2>
                    <p className="type-body-sm mt-1 text-secondary">
                        Manage privacy, messages, and notification preferences.
                    </p>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="flex flex-col gap-2">
                        <label className="type-body-sm text-(--primary)">
                            Profile Visibility
                        </label>
                        <ThemedDropdownSelect
                            value={settings.profileVisibility}
                            options={profileVisibilityOptions}
                            ariaLabel="Select profile visibility"
                            onChange={(value) => updateSetting("profileVisibility", value)}
                        />
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="type-body-sm text-(--primary)">
                            Messages From
                        </label>
                        <ThemedDropdownSelect
                            value={settings.messagesFrom}
                            options={messageOptions}
                            ariaLabel="Select who can message you"
                            onChange={(value) => updateSetting("messagesFrom", value)}
                        />
                    </div>
                </div>

                <div className="space-y-3">
                    <label className="flex cursor-pointer items-center justify-between gap-4 rounded-xl bg-(--surface-low) p-4">
                        <div>
                            <h3 className="type-label-md text-primary">Email Notifications</h3>
                            <p className="type-body-sm mt-1 text-secondary">
                                Receive important account and activity updates by email.
                            </p>
                        </div>

                        <input
                            type="checkbox"
                            checked={settings.emailNotifications}
                            onChange={(event) => updateSetting("emailNotifications", event.target.checked)}
                            className="h-5 w-5 accent-(--primary)"
                        />
                    </label>

                    <label className="flex cursor-pointer items-center justify-between gap-4 rounded-xl bg-(--surface-low) p-4">
                        <div>
                            <h3 className="type-label-md text-primary">Community Updates</h3>
                            <p className="type-body-sm mt-1 text-secondary">
                                Receive updates from communities you joined or manage.
                            </p>
                        </div>

                        <input
                            type="checkbox"
                            checked={settings.communityUpdates}
                            onChange={(event) => updateSetting("communityUpdates", event.target.checked)}
                            className="h-5 w-5 accent-(--primary)"
                        />
                    </label>
                </div>

                <button type="button" className="button-primary mx-auto flex w-50 items-center justify-center gap-2 p-3">
                    <Save size={18} />
                    Save Changes
                </button>
            </div>
        </section>
    );
}
