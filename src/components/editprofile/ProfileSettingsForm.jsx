import { useQueryClient } from "@tanstack/react-query";
import { Save } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import ThemedDropdownSelect from "@/components/ui/ThemedDropdownSelect";
import { useAuth } from "@/hooks/useAuth";
import { queryKeys } from "@/lib/queryKeys";
import { updateSettings } from "@/services/userApi";

function settingsFromUser(user) {
    return {
        profileVisibility: user?.profileVisibility ?? "public",
        messagesFrom: user?.messagesFrom ?? "followers",
        emailNotifications: user?.emailNotifications ?? true,
        communityUpdates: user?.communityUpdates ?? true,
    };
}

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
    const { userData, setUserData } = useAuth();
    const queryClient = useQueryClient();
    const [settings, setSettings] = useState(() => settingsFromUser(userData));
    const [isSaving, setIsSaving] = useState(false);
    const [soundSettings, setSoundSettings] = useState(() => ({
        messageSound: localStorage.getItem("circlehub-mute-message-sound") !== "true",
        notificationSound: localStorage.getItem("circlehub-mute-notification-sound") !== "true",
    }));

    function updateSetting(name, value) {
        setSettings((currentSettings) => ({
            ...currentSettings,
            [name]: value,
        }));
    }

    function updateSoundSetting(key, enabled) {
        setSoundSettings((current) => ({ ...current, [key]: enabled }));
        const storageKey =
            key === "messageSound"
                ? "circlehub-mute-message-sound"
                : "circlehub-mute-notification-sound";
        if (enabled) {
            localStorage.removeItem(storageKey);
        } else {
            localStorage.setItem(storageKey, "true");
        }
    }

    async function handleSave() {
        if (isSaving) return;

        setIsSaving(true);

        try {
            const response = await updateSettings(settings);

            setUserData(response.data);

            const username = response.data?.username ?? userData?.username;
            if (username) {
                queryClient.invalidateQueries({ queryKey: queryKeys.user(username) });
            }

            toast.success(response.message || "Settings updated successfully");
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to update settings");
        } finally {
            setIsSaving(false);
        }
    }

    return (
        <section className="content-card-padded">
            <div className="flex flex-col gap-6">
                <div>
                    <h2 className="type-title-lg text-primary">Profile Settings</h2>
                    <p className="type-body-sm mt-1 text-secondary">
                        Manage privacy, messages, sounds, and notification preferences.
                    </p>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="flex flex-col gap-2">
                        <label htmlFor="profile-visibility" className="type-body-sm cursor-pointer text-(--primary)">
                            Profile Visibility
                        </label>
                        <ThemedDropdownSelect
                            id="profile-visibility"
                            value={settings.profileVisibility}
                            options={profileVisibilityOptions}
                            ariaLabel="Select profile visibility"
                            onChange={(value) => updateSetting("profileVisibility", value)}
                        />
                    </div>

                    <div className="flex flex-col gap-2">
                        <label htmlFor="messages-from" className="type-body-sm cursor-pointer text-(--primary)">
                            Messages From
                        </label>
                        <ThemedDropdownSelect
                            id="messages-from"
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

                    <label className="flex cursor-pointer items-center justify-between gap-4 rounded-xl bg-(--surface-low) p-4">
                        <div>
                            <h3 className="type-label-md text-primary">Message Alert Sounds</h3>
                            <p className="type-body-sm mt-1 text-secondary">
                                Play an alert chime when a direct message arrives while CircleHub is not the active window.
                            </p>
                        </div>

                        <input
                            type="checkbox"
                            checked={soundSettings.messageSound}
                            onChange={(event) => updateSoundSetting("messageSound", event.target.checked)}
                            className="h-5 w-5 accent-(--primary)"
                        />
                    </label>

                    <label className="flex cursor-pointer items-center justify-between gap-4 rounded-xl bg-(--surface-low) p-4">
                        <div>
                            <h3 className="type-label-md text-primary">Notification Alert Sounds</h3>
                            <p className="type-body-sm mt-1 text-secondary">
                                Play an alert sound for social notifications like follows, likes, and comments.
                            </p>
                        </div>

                        <input
                            type="checkbox"
                            checked={soundSettings.notificationSound}
                            onChange={(event) => updateSoundSetting("notificationSound", event.target.checked)}
                            className="h-5 w-5 accent-(--primary)"
                        />
                    </label>
                </div>

                <button
                    type="button"
                    onClick={handleSave}
                    disabled={isSaving}
                    className="button-primary mx-auto flex w-50 items-center justify-center gap-2 p-3 disabled:opacity-60"
                >
                    <Save size={18} />
                    {isSaving ? "Saving..." : "Save Changes"}
                </button>
            </div>
        </section>
    );
}
