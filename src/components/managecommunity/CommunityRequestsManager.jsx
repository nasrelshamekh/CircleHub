import { Check, X } from "lucide-react";
import { Link } from "react-router-dom";

export default function CommunityRequestsManager({ requests, onAccept, onReject }) {
    return (
        <section className="content-card-padded">
            <div className="mb-5">
                <h2 className="type-title-lg text-primary">Pending Requests</h2>
                <p className="type-body-sm mt-1 text-secondary">
                    Accept or reject people waiting to join this community.
                </p>
            </div>

            {requests.length > 0 ? (
                <div className="space-y-3">
                    {requests.map((request) => (
                        <div
                            key={request.id}
                            className="flex flex-col gap-3 rounded-xl bg-(--surface-low) p-3 md:flex-row md:items-center md:justify-between"
                        >
                            <Link to={`/profile/${request.user.username}`} className="flex min-w-0 items-center gap-3">
                                <img
                                    src={request.user.avatar}
                                    alt={request.user.name}
                                    className="avatar-lg"
                                />
                                <div className="min-w-0">
                                    <h3 className="type-label-md truncate text-primary">
                                        {request.user.name}
                                    </h3>
                                    <p className="type-label-sm truncate text-secondary">
                                        {request.user.role} &bull; {request.requestedAt}
                                    </p>
                                    <p className="type-label-sm mt-1 text-secondary">
                                        {request.note}
                                    </p>
                                </div>
                            </Link>

                            <div className="flex shrink-0 items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => onAccept(request)}
                                    className="button-primary flex items-center gap-2 px-4 py-2 text-(length:--text-label-sm)"
                                >
                                    <Check size={16} />
                                    Accept
                                </button>
                                <button
                                    type="button"
                                    onClick={() => onReject(request.id)}
                                    className="flex cursor-pointer items-center gap-2 rounded-xl bg-(--surface-lowest) px-4 py-2 text-(length:--text-label-sm) font-medium text-(--error) transition hover:bg-(--error-container) hover:text-(--on-error-container)"
                                >
                                    <X size={16} />
                                    Reject
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="rounded-xl bg-(--surface-low) px-4 py-10 text-center">
                    <h3 className="type-title-lg text-primary">No pending requests</h3>
                    <p className="type-body-sm-readable mt-2 text-secondary">
                        New join requests will appear here.
                    </p>
                </div>
            )}
        </section>
    );
}
