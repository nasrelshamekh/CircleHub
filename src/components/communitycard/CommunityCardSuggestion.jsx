import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowDownFromLine, ArrowUpToLine } from "lucide-react";

import SuggestedCommunityItem from "./SuggestedCommunityItem";

export default function CommunityCardSuggestion({ communities, onMembershipChange }) {
    const [isSuggestionsExpanded, setIsSuggestionsExpanded] = useState(false);

    const visibleCommunities = isSuggestionsExpanded
        ? communities
        : [];

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
                                {isSuggestionsExpanded ? (
                                    <ArrowUpToLine size={22} />
                                ) : (
                                    <ArrowDownFromLine size={22} />
                                )}
                    </button>
                </div>

                <p className="type-body-sm mt-1 text-secondary">
                    Find more communities to join.
                </p>
            </div>

            <motion.div layout className="space-y-3">
                <AnimatePresence initial={false}>
                    {visibleCommunities.map((community) => (
                        <motion.div
                            key={community.id}
                            layout
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.16, ease: "easeOut" }}
                        >
                            <SuggestedCommunityItem
                                community={community}
                                onMembershipChange={onMembershipChange}
                            />
                        </motion.div>
                    ))}
                </AnimatePresence>
            </motion.div>
            {/* <div className="flex justify-center">
            <button
                type="button"
                className="mt-4 text-center cursor-pointer text-sm font-medium underline transition-opacity hover:opacity-80"
                onClick={() => setIsSuggestionsExpanded((current) => !current)}
            >
                {isSuggestionsExpanded ? "Show fewer" : `View all ${communities.length}`}
            </button>
            </div> */}
        </aside>
    );
}
