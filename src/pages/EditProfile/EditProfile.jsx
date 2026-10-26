import EditProfileForm from "@/components/editprofile/EditProfileForm";
import ChangePasswordForm from "@/components/editprofile/ChangePasswordForm";
import ProfileSettingsForm from "@/components/editprofile/ProfileSettingsForm";
import MessageRecoveryCard from "@/components/editprofile/MessageRecoveryCard";
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

            queryClient.invalidateQueries({ queryKey: queryKeys.me() });
            const username = response.data?.username ?? userData?.username;
            if (username) {
                queryClient.invalidateQueries({ queryKey: queryKeys.user(username) });
                queryClient.invalidateQueries({ queryKey: queryKeys.userPosts(username) });
            }
            queryClient.invalidateQueries({ queryKey: ["posts"] });

            toast.success(response.message || "Profile updated successfully");
            return true;
        } catch (error) {
            const message = error.response?.data?.message || "Failed to update profile";

            toast.error(message);
            return false;
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
                        <div className="flex flex-col gap-6">
                            <EditProfileForm
                                key={userData ? `${userData.id}-${userData.updatedAt || ""}` : "edit-profile"}
                                onProfileUpdate={handleProfileUpdate}
                                currentUser={userData}
                            />
                            <ChangePasswordForm />
                        </div>
                    </TabsContent>

                    <TabsContent value="settings">
                        <div className="flex flex-col gap-6">
                            <ProfileSettingsForm />
                            <MessageRecoveryCard />
                        </div>
                    </TabsContent>
                </Tabs>
            </section>
        </>
    );
}
