import EditProfileForm from "@/components/editprofile/EditProfileForm";
import ProfileSettingsForm from "@/components/editprofile/ProfileSettingsForm";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs";
import { Settings, UserRound } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

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

    function handleTabChange(tab) {
        setSearchParams({ tab });
    }

    function handleProfileUpdate(formData) {
        setUserData({ ...userData, ...formData });
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
