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
      { postId, optionId },
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
      className="my-3 rounded-2xl border border-border bg-surface-lowest p-4 shadow-xs"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center gap-2 mb-3">
        <BarChart3 size={18} className="text-(--primary)" />
        <h4 className="type-label-lg font-semibold text-text-primary">
          {poll.question}
        </h4>
      </div>

      <div className="flex flex-col gap-2">
        {poll.options.map((option) => {
          const isMyPick = poll.myVotedOptionId === option.id;

          if (showResults) {
            return (
              <div
                key={option.id}
                className={`group relative overflow-hidden rounded-xl border p-3 transition-colors ${
                  isMyPick
                    ? "border-(--primary)/50 bg-(--primary)/5"
                    : "border-border/60 bg-surface-low/50"
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

                <div className="relative z-10 flex items-center justify-between gap-3 text-sm">
                  <div className="flex items-center gap-2 min-w-0">
                    {isMyPick && (
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full gradient-primary text-(--button-gradient-text) shadow-xs">
                        <Check size={12} strokeWidth={3} />
                      </span>
                    )}
                    <span
                      className={`truncate ${
                        isMyPick ? "font-semibold text-text-primary" : "text-text-primary"
                      }`}
                    >
                      {option.text}
                    </span>
                  </div>

                  <div className="shrink-0 font-medium text-xs text-text-secondary flex items-center gap-1.5">
                    <span>{option.votesCount} {option.votesCount === 1 ? "vote" : "votes"}</span>
                    <span>•</span>
                    <span className="font-semibold text-text-primary">{option.percentage}%</span>
                  </div>
                </div>
              </div>
            );
          }

          // Interactive voting choice button with radio indicator
          return (
            <button
              key={option.id}
              type="button"
              disabled={voteMutation.isPending}
              onClick={() => handleVote(option.id)}
              className="group flex items-center justify-between rounded-xl border border-border bg-surface-low px-4 py-3 text-left text-sm font-medium text-text-primary transition-all hover:border-(--primary) hover:bg-(--primary)/5 active:scale-[0.99] disabled:opacity-50 cursor-pointer"
            >
              <span>{option.text}</span>
              <div className="flex h-5 w-5 items-center justify-center rounded-full border border-border group-hover:border-(--primary) bg-surface-lowest transition-colors">
                <div className="h-2 w-2 rounded-full bg-transparent group-hover:bg-(--primary)/40 transition-colors" />
              </div>
            </button>
          );
        })}
      </div>

      {/* Footer bar */}
      <div className="mt-3.5 flex items-center justify-between text-xs text-text-secondary pt-2.5 border-t border-border/50">
        <div className="flex items-center gap-2.5">
          <span>
            {poll.totalVotes} {poll.totalVotes === 1 ? "vote" : "votes"}
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <Clock size={12} />
            {formatRemainingTime()}
          </span>
        </div>

        {hasVoted && !isExpired && (
          <button
            type="button"
            onClick={() => setIsChangingVote((prev) => !prev)}
            className="px-2.5 py-1 rounded-lg text-xs font-semibold text-(--primary) hover:bg-surface-low transition-colors cursor-pointer"
          >
            {isChangingVote ? "Cancel" : "Change vote"}
          </button>
        )}
      </div>
    </div>
  );
}
