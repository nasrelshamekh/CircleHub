import EditProfileForm from "@/components/editprofile/EditProfileForm";
import ProfileSettingsForm from "@/components/editprofile/ProfileSettingsForm";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs";
import { Settings, UserRound } from "lucide-react";
import { toast } from "sonner";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { updateProfile } from "@/services/userApi";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";

const tabs = [
    {
        value: "profile",
        label: "Profile",
        icon: UserRound,
    },
    {
        value: "settings",
        label: "Settings",
        icon: Settings,
    },
];

export default function EditProfile() {
    const [searchParams, setSearchParams] = useSearchParams();
    const activeTab = searchParams.get("tab") === "settings" ? "settings" : "profile";
    const { userData, setUserData } = useAuth();
    const queryClient = useQueryClient();

    function handleTabChange(tab) {
        setSearchParams({ tab });
    }

    async function handleProfileUpdate(formData) {
        try {
            const response = await updateProfile(formData);

            setUserData(response.data);

            const username = response.data?.username ?? userData?.username;
            if (username) {
                queryClient.invalidateQueries({ queryKey: queryKeys.user(username) });
            }

            toast.success(response.message || "Profile updated successfully");
        } catch (error) {
            const message = error.response?.data?.message || "Failed to update profile";

            toast.error(message);
        }
    }
    return (
        <>
            <section className="content-stack max-w-7xl">
                <div>
                    <h1 className="type-headline-responsive text-primary">
                        Edit Profile
                    </h1>
                    <p className="type-body-md mt-2 text-secondary">
                        Manage your profile information. You can also update your account settings and preferences here.
                    </p>
                </div>

                <Tabs value={activeTab} onValueChange={handleTabChange} className="min-w-0">
                    <div className="py-2">
                        <TabsList className="sm:grid-cols-2">
                            {tabs.map((tab) => {
                                const Icon = tab.icon;

                                return (
                                    <TabsTrigger key={tab.value} value={tab.value}>
                                        <Icon size={16} />
                                        {tab.label}
                                    </TabsTrigger>
                                );
                            })}
                        </TabsList>
                    </div>

                    <TabsContent value="profile">
                        <EditProfileForm onProfileUpdate={handleProfileUpdate} currentUser={userData} />
                    </TabsContent>

                    <TabsContent value="settings">
                        <ProfileSettingsForm />
                    </TabsContent>
                </Tabs>
            </section>
        </>
    )
}
