import { Network } from "lucide-react";

import CommunityCardItem from "./CommunityCardItem";

export default function CommunityCard({
    communities,
    onMembershipChange,
    title = "Your Communities",
    description = "Communities you joined or are waiting to join.",
    emptyTitle = "No communities yet",
    emptyDescription = "Join a public community or request access to a private one from the suggestions.",
    showAdminBadge = false,
}) {
    return (
        <section className="content-card-padded">
            <div className="mb-5 flex items-center justify-between gap-3">
                <div>
                    <h2 className="type-title-lg text-primary">{title}</h2>
                    <p className="type-body-sm mt-1 text-secondary">
                        {description}
                    </p>
                </div>

                <span className="type-label-sm rounded-full bg-(--active) px-3 py-1 text-(--primary)">
                    {communities.length}
                </span>
            </div>

            {communities.length > 0 ? (
                <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                    {communities.map((community) => (
                        <CommunityCardItem
                            key={community.id}
                            community={community}
                            onMembershipChange={onMembershipChange}
                            showAdminBadge={showAdminBadge}
                        />
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center rounded-xl bg-(--surface-low) px-4 py-12 text-center">
                    <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-(--radius-full) bg-(--active) text-(--primary)">
                        <Network size={24} />
                    </div>

                    <h3 className="type-title-lg text-primary">{emptyTitle}</h3>

                    <p className="type-body-sm-readable mt-2 max-w-sm text-secondary">
                        {emptyDescription}
                    </p>
                </div>
            )}
        </section>
    );
}
