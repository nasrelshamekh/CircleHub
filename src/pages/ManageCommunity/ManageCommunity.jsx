import { CheckCircle, MoveLeft, Settings, UserPlus, Users } from "lucide-react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";

import CommunityMembersManager from "@/components/managecommunity/CommunityMembersManager";
import CommunityRequestsManager from "@/components/managecommunity/CommunityRequestsManager";
import CommunitySettingsForm from "@/components/managecommunity/CommunitySettingsForm";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { useCommunities } from "@/hooks/useCommunities";

const tabs = [
    {
        value: "manage",
        label: "Manage",
        icon: Settings,
    },
    {
        value: "members",
        label: "Members",
        icon: Users,
    },
    {
        value: "requests",
        label: "Requests",
        icon: UserPlus,
    },
];

export default function ManageCommunity() {
    const { slug } = useParams();
    const navigate = useNavigate();
    const {
        communities,
        setCommunities,
    } = useCommunities();
    const { userData } = useAuth();
    const community = communities.find((item) => item.slug === slug);
    const members = community?.members || [];
    const requests = community?.requests || [];

    if (!community) {
        return (
            <section className="content-stack max-w-4xl">
                <div className="content-card-padded text-center">
                    <h1 className="type-headline-md text-primary">Community not found</h1>
                    <p className="type-body-sm-readable mt-2 text-secondary">
                        The community you are trying to manage does not exist.
                    </p>
                </div>
            </section>
        );
    }

    if (community.admin.id !== userData.id) {
        return <Navigate to={`/communities/${community.slug}`} replace />;
    }

    function handleSaveCommunity(formData) {
        setCommunities((currentCommunities) =>
            currentCommunities.map((currentCommunity) =>
                currentCommunity.id === community.id
                    ? { ...currentCommunity, ...formData }
                    : currentCommunity
            )
        );
        toast.success("Community updated successfully");
    }

    function handleRoleChange(username, role) {
        setCommunities((currentCommunities) =>
            currentCommunities.map((currentCommunity) =>
                currentCommunity.id === community.id
                    ? {
                        ...currentCommunity,
                        members: currentCommunity.members.map((member) =>
                            member.username === username
                                ? { ...member, communityRole: role }
                                : member
                        ),
                    }
                    : currentCommunity
            )
        );
        toast.success("Member role updated");
    }

    function handleAcceptRequest(request) {
        setCommunities((currentCommunities) =>
            currentCommunities.map((currentCommunity) => {
                if (currentCommunity.id !== community.id) return currentCommunity;

                const alreadyMember = currentCommunity.members.some(
                    (member) => member.username === request.user.username
                );
                const newMember = {
                    ...request.user,
                    communityRole: "member",
                };

                return {
                    ...currentCommunity,
                    members: alreadyMember
                        ? currentCommunity.members
                        : [...currentCommunity.members, newMember],
                    requests: currentCommunity.requests.filter(
                        (currentRequest) => currentRequest.id !== request.id
                    ),
                };
            })
        );

        toast.success(`${request.user.name} was accepted`);
    }

    function handleRejectRequest(requestId) {
        setCommunities((currentCommunities) =>
            currentCommunities.map((currentCommunity) =>
                currentCommunity.id === community.id
                    ? {
                        ...currentCommunity,
                        requests: currentCommunity.requests.filter(
                            (request) => request.id !== requestId
                        ),
                    }
                    : currentCommunity
            )
        );
        toast.success("Request rejected");
    }

    return (
        <section className="content-stack max-w-7xl">
            <button
                type="button"
                onClick={() => navigate(`/communities/${community.slug}`)}
                className="button-primary type-button flex w-45 items-center justify-center gap-1 rounded-full p-1"
            >
                <MoveLeft className="size-5 lg:size-6" />
                Back To Community
            </button>

            <div>
                <h1 className="type-headline-responsive text-primary">Manage {community.name}</h1>
                <p className="type-body-md mt-2 text-secondary">
                    Edit community details, assign roles, and review pending join requests.
                </p>
            </div>

            <div className="content-card-padded flex flex-wrap items-center gap-3">
                <CheckCircle size={20} className="text-(--primary)" />
                <div>
                    <h2 className="type-label-md text-primary">Admin Access</h2>
                    <p className="type-body-sm text-secondary">
                        You are managing this community as {userData.name}.
                    </p>
                </div>
            </div>

            <Tabs defaultValue="manage" className="min-w-0">
                <div className="py-2">
                    <TabsList className="sm:grid-cols-3">
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

                <TabsContent value="manage">
                    <CommunitySettingsForm community={community} onSave={handleSaveCommunity} />
                </TabsContent>

                <TabsContent value="members">
                    <CommunityMembersManager
                        members={members}
                        adminUsername={community.admin.username}
                        onRoleChange={handleRoleChange}
                    />
                </TabsContent>

                <TabsContent value="requests">
                    <CommunityRequestsManager
                        requests={requests}
                        onAccept={handleAcceptRequest}
                        onReject={handleRejectRequest}
                    />
                </TabsContent>
            </Tabs>
        </section>
    );
}
