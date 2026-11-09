import { Trash2 } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { useDeleteCommunity } from "@/hooks/mutations/useDeleteCommunity";

export default function DeleteCommunityCard({ community }) {
    const navigate = useNavigate();
    const deleteCommunity = useDeleteCommunity();
    const [confirmation, setConfirmation] = useState("");
    const isConfirmed = confirmation === community.name;

    function handleDelete() {
        deleteCommunity.mutate(community.id, {
            onSuccess: () => navigate("/feed"),
        });
    }

    return (
        <section className="content-card-padded">
            <div className="flex flex-col gap-4">
                <div>
                    <h2 className="type-title-lg text-(--error)">Delete Community</h2>
                    <p className="type-body-sm mt-1 text-secondary">
                        Deleting <span className="font-semibold text-(--primary)">{community.name}</span>{" "}
                        will permanently remove the community, its posts, members, and requests. This
                        action cannot be undone.
                    </p>
                </div>

                <div className="flex flex-col gap-2">
                    <label htmlFor="delete-community-confirmation" className="type-body-sm text-(--primary)">
                        Type <span className="font-semibold text-(--error)">{community.name}</span> to confirm
                    </label>
                    <input
                        id="delete-community-confirmation"
                        type="text"
                        value={confirmation}
                        onChange={(event) => setConfirmation(event.target.value)}
                        placeholder={community.name}
                        className="input-surface type-body-sm w-full rounded-lg px-4 py-3 text-primary outline-none placeholder:text-(--text-secondary)"
                    />
                </div>

                <button
                    type="button"
                    onClick={handleDelete}
                    disabled={!isConfirmed || deleteCommunity.isPending}
                    className="flex w-fit cursor-pointer items-center justify-center gap-2 rounded-xl bg-(--error) px-4 py-2 text-(--on-error) transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                    <Trash2 size={16} />
                    {deleteCommunity.isPending ? "Deleting..." : "Delete Community"}
                </button>
            </div>
        </section>
    );
}