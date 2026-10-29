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
      className="my-3 rounded-2xl border border-border/80 bg-surface-lowest/50 dark:bg-white/[0.02] p-4 shadow-sm"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center gap-2 mb-3">
        <BarChart3 size={18} className="text-(--primary)" />
        <h4 className="type-label-lg font-semibold text-primary">
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
                className="group relative overflow-hidden rounded-xl border border-border/60 bg-surface-lowest p-3 transition-colors"
              >
                {/* Background percentage fill bar */}
                <div
                  style={{ width: `${Math.min(Math.max(option.percentage, 0), 100)}%` }}
                  className={`absolute inset-y-0 left-0 transition-all duration-500 ease-out ${
                    isMyPick
                      ? "bg-(--primary)/20 dark:bg-(--primary)/30"
                      : "bg-black/5 dark:bg-white/10"
                  }`}
                />

                <div className="relative z-10 flex items-center justify-between gap-3 text-sm">
                  <div className="flex items-center gap-2 min-w-0">
                    {isMyPick && (
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-(--primary) text-white shadow-sm">
                        <Check size={12} strokeWidth={3} />
                      </span>
                    )}
                    <span
                      className={`truncate ${
                        isMyPick ? "font-semibold text-primary" : "text-secondary"
                      }`}
                    >
                      {option.text}
                    </span>
                  </div>

                  <div className="shrink-0 font-medium text-xs text-secondary flex items-center gap-1.5">
                    <span>{option.votesCount} {option.votesCount === 1 ? "vote" : "votes"}</span>
                    <span>•</span>
                    <span className="font-semibold text-primary">{option.percentage}%</span>
                  </div>
                </div>
              </div>
            );
          }

          // Interactive voting button
          return (
            <button
              key={option.id}
              type="button"
              disabled={voteMutation.isPending}
              onClick={() => handleVote(option.id)}
              className="flex items-center justify-between rounded-xl border border-border/80 bg-surface-lowest px-4 py-3 text-left text-sm font-medium text-secondary transition-all hover:border-(--primary) hover:bg-(--primary)/5 hover:text-primary active:scale-[0.99] disabled:opacity-50"
            >
              <span>{option.text}</span>
              <span className="text-xs text-secondary/60">Vote</span>
            </button>
          );
        })}
      </div>

      {/* Footer bar */}
      <div className="mt-3 flex items-center justify-between text-xs text-secondary/80 pt-2 border-t border-border/40">
        <div className="flex items-center gap-3">
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
            className="font-medium text-(--primary) hover:underline"
          >
            {isChangingVote ? "View results" : "Change vote"}
          </button>
        )}
      </div>
    </div>
  );
}
