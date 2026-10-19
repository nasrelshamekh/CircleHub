import {
    Bell,
    CheckCircle2,
    Heart,
    MessageCircle,
    ShieldCheck,
    Trash2,
    UserMinus,
    UserPlus,
    Users,
    XCircle,
} from "lucide-react";

/**
 * The feed's wording lives here, not in the database: a row stores the facts (who, what, which post or
 * community) and these functions turn them into a sentence. Renaming a type means changing this file and
 * `NotificationType` together.
 */

const ICONS = {
    Follow: UserPlus,
    PostLike: Heart,
    PostComment: MessageCircle,
    CommunityJoinRequested: Users,
    CommunityJoinRequestApproved: CheckCircle2,
    CommunityJoinRequestRejected: XCircle,
    CommunityMemberRemoved: UserMinus,
    CommunityRoleChanged: ShieldCheck,
    CommunityPostRemoved: Trash2,
};

// Fallbacks only matter if a notification outlives the community or post it points at.
const FALLBACK_COMMUNITY = "a community";

const SENTENCES = {
    Follow: () => "started following you.",
    PostLike: () => "liked your post.",
    PostComment: () => "commented on your post.",
    CommunityJoinRequested: (n) =>
        `asked to join ${n.communityName ?? FALLBACK_COMMUNITY}.`,
    CommunityJoinRequestApproved: (n) =>
        `approved your request to join ${n.communityName ?? FALLBACK_COMMUNITY}.`,
    CommunityJoinRequestRejected: (n) =>
        `declined your request to join ${n.communityName ?? FALLBACK_COMMUNITY}.`,
    CommunityMemberRemoved: (n) =>
        `removed you from ${n.communityName ?? FALLBACK_COMMUNITY}.`,
    CommunityRoleChanged: (n) =>
        `changed your role in ${n.communityName ?? FALLBACK_COMMUNITY}.`,
    CommunityPostRemoved: (n) =>
        `removed your post in ${n.communityName ?? FALLBACK_COMMUNITY}.`,
};

export function notificationIcon(type) {
    return ICONS[type] ?? Bell;
}

export function notificationSentence(notification) {
    const build = SENTENCES[notification.type];

    return build ? build(notification) : "did something you might want to see.";
}

/**
 * Where clicking the row goes. Null means there is nothing left to open (a post that was deleted, a
 * community that is gone), and the row is rendered as plain text rather than a dead link.
 */
export function notificationLink(notification) {
    switch (notification.type) {
        case "Follow":
            return notification.actor?.username
                ? `/profile/${notification.actor.username}`
                : null;
        case "PostLike":
        case "PostComment":
            return notification.postId ? `/post/${notification.postId}` : null;
        default:
            return notification.communitySlug
                ? `/communities/${notification.communitySlug}`
                : null;
    }
}
