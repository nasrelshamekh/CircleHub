import { CheckCircle, MoveLeft, Settings, UserPlus, Users } from "lucide-react";
import { Navigate, useNavigate, useParams } from "react-router-dom";

import CommunityMembersManager from "@/components/managecommunity/CommunityMembersManager";
import CommunityRequestsManager from "@/components/managecommunity/CommunityRequestsManager";
import CommunitySettingsForm from "@/components/managecommunity/CommunitySettingsForm";
import DeleteCommunityCard from "@/components/managecommunity/DeleteCommunityCard";
import ManageCommunitySkeleton from "@/components/Skeletons/ManageCommunitySkeleton";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { useCommunities } from "@/hooks/useCommunities";
import { useCommunityMembers } from "@/hooks/useCommunityMembers";
import { useCommunityRequests } from "@/hooks/useCommunityRequests";
import { useRemoveCommunityMember } from "@/hooks/mutations/useRemoveCommunityMember";
import { useUpdateCommunityMemberRole } from "@/hooks/mutations/useUpdateCommunityMemberRole";
import { useUpdateCommunity } from "@/hooks/mutations/useUpdateCommunity";
import { useDecideCommunityJoinRequest } from "@/hooks/mutations/useDecideCommunityJoinRequest";

const allTabs = [
    {
        value: "manage",
        label: "Manage",
        icon: Settings,
        adminOnly: true,
    },
    {
        value: "members",
        label: "Members",
        icon: Users,
        adminOnly: false,
    },
    {
        value: "requests",
        label: "Requests",
        icon: UserPlus,
        adminOnly: false,
    },
];

export default function ManageCommunity() {
    const { slug } = useParams();
    const navigate = useNavigate();
    const {
        communities,
        isLoading: isLoadingCommunities,
    } = useCommunities();
    const { userData } = useAuth();
    const community = communities.find((item) => item.slug === slug);
    const { members, isLoading: isLoadingMembers } = useCommunityMembers(community?.id);
    const { requests } = useCommunityRequests(community?.id);
    const removeMember = useRemoveCommunityMember();
    const updateRole = useUpdateCommunityMemberRole();
    const updateCommunity = useUpdateCommunity();
    const decideRequest = useDecideCommunityJoinRequest();

    const isAdmin = community?.admin.id === userData.id;
    const currentUserMember = members.find((member) => member.id === userData.id);
    const isModerator = currentUserMember?.communityRole === "moderator";
    const canManage = isAdmin || isModerator;
    const visibleTabs = allTabs.filter((tab) => isAdmin || !tab.adminOnly);
    const defaultTab = isAdmin ? "manage" : "members";

    if (!community) {
        if (isLoadingCommunities) {
            return <ManageCommunitySkeleton />;
        }

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

    if (!isAdmin && isLoadingMembers) {
        return <ManageCommunitySkeleton />;
    }

    if (!canManage) {
        return <Navigate to={`/communities/${community.slug}`} replace />;
    }

    function handleSaveCommunity(formData) {
        updateCommunity.mutate({
            communityId: community.id,
            slug: community.slug,
            data: formData,
        });
    }

    function handleRoleChange(membershipId, role) {
        const target = members.find((m) => m.membershipId === membershipId);
        if (!target || target.communityRole === role) return Promise.resolve();

        return new Promise((resolve, reject) => {
            updateRole.mutate(
                { communityId: community.id, membershipId, role },
                {
                    onSuccess: () => resolve(),
                    onError: (err) => reject(err),
                }
            );
        });
    }

    function handleRemoveMember(communityId, membershipId) {
        return new Promise((resolve, reject) => {
            removeMember.mutate(
                { communityId, membershipId, communitySlug: community.slug },
                {
                    onSuccess: () => resolve(),
                    onError: (err) => reject(err),
                }
            );
        });
    }

    function handleAcceptRequest(request) {
        return new Promise((resolve, reject) => {
            decideRequest.mutate(
                { community, request, decision: "approve" },
                { onSuccess: () => resolve(), onError: (err) => reject(err) },
            );
        });
    }

    function handleRejectRequest(requestId) {
        const request = requests.find((r) => r.id === requestId);
        if (!request) return Promise.resolve();
        return new Promise((resolve, reject) => {
            decideRequest.mutate(
                { community, request, decision: "reject" },
                { onSuccess: () => resolve(), onError: (err) => reject(err) },
            );
        });
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

            <Tabs defaultValue={defaultTab} className="min-w-0">
                <div className="py-2">
                    <TabsList className={visibleTabs.length === 1 ? "sm:grid-cols-1" : visibleTabs.length === 2 ? "sm:grid-cols-2" : "sm:grid-cols-3"}>
                        {visibleTabs.map((tab) => {
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

                {isAdmin && (
                    <TabsContent value="manage">
                        <div className="flex flex-col gap-6">
                            <CommunitySettingsForm community={community} onSave={handleSaveCommunity} />
                            <DeleteCommunityCard community={community} />
                        </div>
                    </TabsContent>
                )}

                <TabsContent value="members">
                    <CommunityMembersManager
                        members={members}
                        community={community}
                        adminUsername={community.admin.username}
                        viewerIsAdmin={isAdmin}
                        onRoleChange={handleRoleChange}
                        onRemoveMember={handleRemoveMember}
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
