import { useState } from "react";
import { motion } from "motion/react";
import { ArrowDownFromLine } from "lucide-react";

import SuggestedCommunityItem from "./SuggestedCommunityItem";

export default function CommunityCardSuggestion({ communities, onMembershipChange }) {
    const [isSuggestionsExpanded, setIsSuggestionsExpanded] = useState(false);

    return (
        <aside className="content-card-padded lg:top-24">
            <div className="mb-4">
                <div className="flex items-center justify-between">
                    <h2 className="type-title-lg text-primary">Suggested Communities</h2>

                    <button
                        type="button"
                        className="icon-button-soft cursor-pointer p-2"
                        aria-label={isSuggestionsExpanded ? "Show fewer suggestions" : "View more suggestions"}
                        onClick={() => setIsSuggestionsExpanded((current) => !current)}
                    >
                        <motion.span
                            className="block"
                            animate={{ rotate: isSuggestionsExpanded ? 180 : 0 }}
                            transition={{ duration: 0.2, ease: "easeOut" }}
                        >
                            <ArrowDownFromLine size={22} />
                        </motion.span>
                    </button>
                </div>

                <p className="type-body-sm mt-1 text-secondary">
                    Find more communities to join.
                </p>
            </div>

            <motion.div
                initial={false}
                animate={{
                    gridTemplateRows: isSuggestionsExpanded ? "1fr" : "0fr",
                    opacity: isSuggestionsExpanded ? 1 : 0,
                }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className={`grid ${isSuggestionsExpanded ? "" : "pointer-events-none"}`}
                aria-hidden={!isSuggestionsExpanded}
            >
                <div className="overflow-hidden">
                    <div className="space-y-3">
                        {communities.map((community) => (
                            <SuggestedCommunityItem
                                key={community.id}
                                community={community}
                                onMembershipChange={onMembershipChange}
                            />
                        ))}
                    </div>
                </div>
            </motion.div>
        </aside>
    );
}
