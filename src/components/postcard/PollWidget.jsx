import { useState } from "react";
import { Check, Clock, BarChart3 } from "lucide-react";
import { useVotePoll } from "@/hooks/mutations/useVotePoll";

export default function PollWidget({ postId, poll }) {
  const voteMutation = useVotePoll();
  const [isChangingVote, setIsChangingVote] = useState(false);
  const [currentTime] = useState(() => Date.now());

  if (!poll || !poll.options?.length) return null;

  const hasVoted = Boolean(poll.myVotedOptionId);
  const isExpired = Boolean(poll.isExpired);
  const showResults = (hasVoted && !isChangingVote) || isExpired;

  const handleVote = (optionId) => {
    if (voteMutation.isPending) return;
    voteMutation.mutate(
      { postId, optionId, currentPoll: poll },
      {
        onSuccess: () => {
          setIsChangingVote(false);
        },
      }
    );
  };

  const formatRemainingTime = () => {
    if (!poll.expiresAt) return "Ongoing poll";
    if (isExpired) return "Final results";
    const diffMs = new Date(poll.expiresAt).getTime() - currentTime;
    if (diffMs <= 0) return "Final results";
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours < 24) {
      return `${Math.max(1, diffHours)}h left`;
    }
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d left`;
  };

  return (
    <div
      className="my-3 rounded-2xl bg-surface-low/85 dark:bg-surface-low/70 p-4 sm:p-5 shadow-xs transition-colors"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header with Poll Badge & Timer */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-(--primary)/15 text-(--primary)">
          <BarChart3 size={14} strokeWidth={2.5} />
          <span>Community Poll</span>
        </div>

        <div className="flex items-center gap-1 text-xs text-text-secondary font-medium">
          <Clock size={12} />
          <span>{formatRemainingTime()}</span>
        </div>
      </div>

      {/* Question */}
      <h4 className="type-title-lg font-bold text-text-primary leading-snug mb-1">
        {poll.question}
      </h4>

      {!showResults && (
        <p className="type-label-sm text-text-secondary mb-3.5">
          Select an option to cast your vote:
        </p>
      )}

      {/* Poll Options */}
      <div className="flex flex-col gap-2.5 mt-2">
        {poll.options.map((option) => {
          const isMyPick = poll.myVotedOptionId === option.id;

          if (showResults) {
            return (
              <div
                key={option.id}
                className={`relative overflow-hidden rounded-xl p-3.5 shadow-xs transition-all ${
                  isMyPick
                    ? "bg-surface-lowest ring-2 ring-(--primary)"
                    : "bg-surface-lowest ring-1 ring-border/40"
                }`}
              >
                {/* Background percentage fill bar */}
                <div
                  style={{ width: `${Math.min(Math.max(option.percentage, 0), 100)}%` }}
                  className={`absolute inset-y-0 left-0 transition-all duration-500 ease-out ${
                    isMyPick
                      ? "gradient-primary opacity-25"
                      : "bg-surface-variant opacity-60"
                  }`}
                />

                <div className="relative z-10 flex items-center justify-between gap-3 text-sm sm:text-base">
                  <div className="flex items-center gap-2.5 min-w-0">
                    {isMyPick && (
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full gradient-primary text-(--button-gradient-text) shadow-xs">
                        <Check size={12} strokeWidth={3} />
                      </span>
                    )}
                    <span
                      className={`truncate ${
                        isMyPick
                          ? "font-bold text-text-primary"
                          : "font-medium text-text-primary"
                      }`}
                    >
                      {option.text}
                    </span>
                  </div>

                  <div className="shrink-0 font-medium text-xs sm:text-sm text-text-secondary flex items-center gap-2">
                    <span>
                      {option.votesCount} {option.votesCount === 1 ? "vote" : "votes"}
                    </span>
                    <span>•</span>
                    <span
                      className={`font-bold ${
                        isMyPick ? "text-(--primary)" : "text-text-primary"
                      }`}
                    >
                      {option.percentage}%
                    </span>
                  </div>
                </div>
              </div>
            );
          }

          // Interactive voting choice button with distinct card styling & radio indicator
          return (
            <button
              key={option.id}
              type="button"
              disabled={voteMutation.isPending}
              onClick={() => handleVote(option.id)}
              className="group relative flex items-center justify-between w-full rounded-xl bg-surface-lowest hover:bg-surface-lowest px-4 py-3.5 text-left text-sm sm:text-base font-medium text-text-primary shadow-xs hover:shadow-md transition-all duration-200 active:scale-[0.99] disabled:opacity-60 cursor-pointer ring-1 ring-border/40 hover:ring-2 hover:ring-(--primary)"
            >
              <span className="pr-3 group-hover:text-(--primary) transition-colors">
                {option.text}
              </span>
              <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full ring-1.5 ring-border group-hover:ring-(--primary) bg-surface-low transition-all">
                <div className="h-2.5 w-2.5 rounded-full bg-transparent group-hover:bg-(--primary) transition-all scale-0 group-hover:scale-100" />
              </div>
            </button>
          );
        })}
      </div>

      {/* Footer bar */}
      <div className="mt-3.5 flex items-center justify-between text-xs text-text-secondary pt-1">
        <div className="flex items-center gap-2 font-medium">
          <span>
            {poll.totalVotes} {poll.totalVotes === 1 ? "vote cast" : "votes cast"}
          </span>
        </div>

        {hasVoted && !isExpired && (
          <button
            type="button"
            onClick={() => setIsChangingVote((prev) => !prev)}
            className="px-3 py-1 rounded-full text-xs font-semibold bg-surface-lowest hover:bg-surface-high text-(--primary) transition-all shadow-xs cursor-pointer ring-1 ring-border/30 hover:ring-(--primary)/50"
          >
            {isChangingVote ? "View results" : "Change vote"}
          </button>
        )}
      </div>
    </div>
  );
}
