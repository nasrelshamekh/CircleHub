using Microsoft.AspNetCore.RateLimiting;
using CircleHub.Api.Data;
using CircleHub.Api.Dtos;
using CircleHub.Api.Entities;
using CircleHub.Api.Enums;
using CircleHub.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace CircleHub.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class MessagesController : ControllerBase
    {
        // Ciphertext is base64 (≈ +33%) plus one wrap per device of *both* participants, so the cap sizes
        // the *envelope*, not what a person can type: the client holds its plaintext budget at 5000, which
        // lands around 9.7 KB with 36-character device ids and two devices on each side. 12000 covers a
        // realistic multi-device pair with room to spare, and stays under the hub's 16 KB payload cap. The
        // column is longtext, so only this constant decides. It is also the *only* cap that applies: the
        // DTO's own [MaxLength] is deliberately higher, because a model-binding truncation would store half
        // an envelope and still return 200.
        private const int MaxContentLength = 12000;

        private readonly AppDbContext _db;
        private readonly MessagePolicyService _policy;
        private readonly MessageDeliveryService _delivery;
        private readonly PresenceService _presence;

        public MessagesController(
            AppDbContext db,
            MessagePolicyService policy,
            MessageDeliveryService delivery,
            PresenceService presence)
        {
            _db = db;
            _policy = policy;
            _delivery = delivery;
            _presence = presence;
        }

        private Guid? CurrentUserId
        {
            get
            {
                var sub = User.FindFirstValue("sub");
                return Guid.TryParse(sub, out var id) ? id : null;
            }
        }

        private IActionResult Fail(int status, string message) =>
            new ObjectResult(new ApiErrorResponse { Success = false, Message = message })
            {
                StatusCode = status
            };

        [HttpGet("conversations")]
        public async Task<IActionResult> GetConversations()
        {
            var currentUserId = CurrentUserId!.Value;

            var conversations = await _db.ConversationParticipants
                .Where(p => p.UserId == currentUserId)
                .Select(p => new ConversationDto
                {
                    Id = p.ConversationId,
                    OtherUser = p.Conversation.Participants
                        .Where(other => other.UserId != currentUserId)
                        .Select(other => new ConversationUserDto
                        {
                            Id = other.User.Id,
                            Name = other.User.Name,
                            Username = other.User.Username,
                            AvatarUrl = other.User.AvatarUrl,
                            LastSeenAt = other.User.LastSeenAt
                        })
                        .FirstOrDefault()!,
                    LastMessageAt = p.Conversation.LastMessageAt,
                    UnreadCount = p.Conversation.Messages.Count(m =>
                        m.SenderId != currentUserId &&
                        (p.LastReadAt == null || m.CreatedAt > p.LastReadAt)),
                    LastMessage = p.Conversation.Messages
                        .OrderByDescending(m => m.CreatedAt)
                        .Select(m => new MessagePreviewDto
                        {
                            Id = m.Id,
                            Content = m.Content,
                            HasPost = m.PostId != null,
                            IsMine = m.SenderId == currentUserId,
                            CreatedAt = m.CreatedAt
                        })
                        .FirstOrDefault()
                })
                .OrderByDescending(c => c.LastMessageAt)
                .ToListAsync();

            // IsOnline is process-local state, not a column, so it cannot be projected by the query and
            // is filled in afterwards.
            foreach (var conversation in conversations)
                ApplyPresence(conversation.OtherUser);

            return Ok(new ApiResponse<List<ConversationDto>>
            {
                Count = conversations.Count,
                Data = conversations
            });
        }

        [HttpPost("conversations")]
        public async Task<IActionResult> GetOrCreateConversation([FromBody] StartConversationDto dto)
        {
            var currentUserId = CurrentUserId!.Value;

            User? recipient = null;
            if (dto.RecipientId.HasValue && dto.RecipientId.Value != Guid.Empty)
            {
                recipient = await _db.Users.FirstOrDefaultAsync(u => u.Id == dto.RecipientId.Value);
            }
            else if (!string.IsNullOrWhiteSpace(dto.RecipientUsername))
            {
                var username = dto.RecipientUsername.Trim();
                recipient = await _db.Users.FirstOrDefaultAsync(u => u.Username == username);
            }

            if (recipient == null)
                return Fail(StatusCodes.Status404NotFound, "Recipient not found");

            if (recipient.Id == currentUserId)
                return Fail(StatusCodes.Status400BadRequest, "Cannot start a conversation with yourself");

            var canMessage = await _policy.CanMessageAsync(recipient, currentUserId);
            if (!canMessage)
                return Fail(StatusCodes.Status403Forbidden, "You cannot message this user based on their privacy settings");

            var conversation = await _db.Conversations
                .Where(c => c.Participants.Count == 2 &&
                            c.Participants.Any(p => p.UserId == currentUserId) &&
                            c.Participants.Any(p => p.UserId == recipient.Id))
                .OrderByDescending(c => c.LastMessageAt)
                .FirstOrDefaultAsync();

            var isNew = false;
            if (conversation == null)
            {
                var now = DateTime.UtcNow;
                conversation = new Conversation
                {
                    Id = Guid.NewGuid(),
                    CreatedAt = now,
                    LastMessageAt = now,
                    Participants =
                    {
                        new ConversationParticipant
                        {
                            Id = Guid.NewGuid(),
                            UserId = currentUserId,
                            LastReadAt = now
                        },
                        new ConversationParticipant
                        {
                            Id = Guid.NewGuid(),
                            UserId = recipient.Id
                        }
                    }
                };

                _db.Conversations.Add(conversation);

                try
                {
                    await _db.SaveChangesAsync();
                    isNew = true;
                }
                catch (DbUpdateException)
                {
                    _db.ChangeTracker.Clear();

                    conversation = await _db.Conversations
                        .Where(c => c.Participants.Count == 2 &&
                                    c.Participants.Any(p => p.UserId == currentUserId) &&
                                    c.Participants.Any(p => p.UserId == recipient.Id))
                        .OrderByDescending(c => c.LastMessageAt)
                        .FirstOrDefaultAsync();

                    if (conversation == null)
                        throw;
                }
            }

            var otherUser = new ConversationUserDto
            {
                Id = recipient.Id,
                Name = recipient.Name,
                Username = recipient.Username,
                AvatarUrl = recipient.AvatarUrl,
                LastSeenAt = recipient.LastSeenAt
            };
            ApplyPresence(otherUser);

            return Ok(new ApiResponse<StartConversationResultDto>
            {
                Data = new StartConversationResultDto
                {
                    ConversationId = conversation.Id,
                    OtherUser = otherUser,
                    IsNew = isNew
                }
            });
        }

        [HttpGet("conversations/{id}")]
        public async Task<IActionResult> GetConversation(Guid id, [FromQuery] int page = 1, [FromQuery] int pageSize = 50)
        {
            var currentUserId = CurrentUserId!.Value;

            page = Math.Max(1, page);
            pageSize = Math.Clamp(pageSize, 1, 100);

            var participants = await _db.ConversationParticipants
                .Where(p => p.ConversationId == id)
                .ToListAsync();

            var mine = participants.FirstOrDefault(p => p.UserId == currentUserId);

            if (mine == null)
                return Fail(StatusCodes.Status404NotFound, "Conversation not found");

            var otherId = participants.FirstOrDefault(p => p.UserId != currentUserId)?.UserId;

            var otherUser = await _db.Users
                .Where(u => u.Id == otherId)
                .Select(u => new ConversationUserDto
                {
                    Id = u.Id,
                    Name = u.Name,
                    Username = u.Username,
                    AvatarUrl = u.AvatarUrl,
                    LastSeenAt = u.LastSeenAt
                })
                .FirstOrDefaultAsync()
                ?? new ConversationUserDto { Id = Guid.Empty, Name = "Unknown", Username = "unknown" };

            ApplyPresence(otherUser);

            var total = await _db.Messages.CountAsync(m => m.ConversationId == id);

            var messages = await _db.Messages
                .Where(m => m.ConversationId == id)
                .OrderByDescending(m => m.CreatedAt)
                .ThenByDescending(m => m.Id)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(m => new MessageDto
                {
                    Id = m.Id,
                    Content = m.Content,
                    PostId = m.PostId,
                    CreatedAt = m.CreatedAt,
                    IsMine = m.SenderId == currentUserId,
                    Sender = new AuthorDto
                    {
                        Id = m.Sender.Id,
                        Name = m.Sender.Name,
                        Username = m.Sender.Username,
                        AvatarUrl = m.Sender.AvatarUrl
                    }
                })
                .ToListAsync();

            messages.Reverse();

            await AttachPosts(messages, currentUserId);

            if (mine.LastReadAt == null || mine.LastReadAt < DateTime.UtcNow)
            {
                mine.LastReadAt = DateTime.UtcNow;
                await _db.SaveChangesAsync();
                _delivery.ClearUnreadPreviews(id, currentUserId);
            }

            return Ok(new ApiResponse<ConversationThreadDto>
            {
                Data = new ConversationThreadDto
                {
                    Id = id,
                    OtherUser = otherUser,
                    Messages = messages,
                    HasMore = total > page * pageSize
                }
            });
        }

        [HttpPost]
        public async Task<IActionResult> SendMessage([FromBody] SendMessageDto dto)
        {
            var currentUserId = CurrentUserId!.Value;

            var content = dto.Content?.Trim();
            var hasPost = dto.PostId != null && dto.PostId != Guid.Empty;

            if (string.IsNullOrEmpty(content) && !hasPost)
                return Fail(StatusCodes.Status400BadRequest, "A message needs text or a shared post");

            if (content is { Length: > MaxContentLength })
                return Fail(StatusCodes.Status400BadRequest, $"Messages can be at most {MaxContentLength} characters");

            var recipient = await _db.Users.FirstOrDefaultAsync(u => u.Username == dto.RecipientUsername);

            if (recipient == null)
                return Fail(StatusCodes.Status404NotFound, "User not found");

            if (recipient.Id == currentUserId)
                return Fail(StatusCodes.Status400BadRequest, "You can't message yourself");

            if (!await _policy.CanMessageAsync(recipient, currentUserId))
                return Fail(StatusCodes.Status403Forbidden, $"{recipient.Name} isn't accepting messages right now");

            PostDto? postDto = null;

            if (hasPost)
            {
                var postId = dto.PostId!.Value;

                var visibleToRecipient = await _db.Posts
                    .Where(p => p.Id == postId)
                    .WhereVisibleTo(recipient.Id)
                    .AnyAsync();

                if (!visibleToRecipient)
                    return Fail(StatusCodes.Status403Forbidden, "You can't share this post with this person");

                postDto = await _db.Posts
                    .Where(p => p.Id == postId)
                    .WhereVisibleTo(currentUserId)
                    .Select(PostDto.Projection(currentUserId, includeCommunity: true))
                    .FirstOrDefaultAsync();

                if (postDto == null)
                    return Fail(StatusCodes.Status404NotFound, "Post not found");
            }

            var now = DateTime.UtcNow;

            var conversation = await _db.Conversations
                .Where(c => c.Participants.Count == 2 &&
                            c.Participants.Any(p => p.UserId == currentUserId) &&
                            c.Participants.Any(p => p.UserId == recipient.Id))
                .OrderByDescending(c => c.LastMessageAt)
                .FirstOrDefaultAsync();

            if (conversation == null)
            {
                conversation = new Conversation
                {
                    Id = Guid.NewGuid(),
                    CreatedAt = now,
                    LastMessageAt = now,
                    Participants =
                    {
                        new ConversationParticipant
                        {
                            Id = Guid.NewGuid(),
                            UserId = currentUserId,
                            LastReadAt = now
                        },
                        new ConversationParticipant
                        {
                            Id = Guid.NewGuid(),
                            UserId = recipient.Id
                        }
                    }
                };

                _db.Conversations.Add(conversation);

                try
                {
                    await _db.SaveChangesAsync();
                }
                catch (DbUpdateException)
                {
                    // Another request created the conversation concurrently.
                    _db.ChangeTracker.Clear();

                    conversation = await _db.Conversations
                        .Where(c => c.Participants.Count == 2 &&
                                    c.Participants.Any(p => p.UserId == currentUserId) &&
                                    c.Participants.Any(p => p.UserId == recipient.Id))
                        .OrderByDescending(c => c.LastMessageAt)
                        .FirstOrDefaultAsync();

                    if (conversation == null)
                        throw;
                }
            }

            conversation.LastMessageAt = now;

            var mine = await _db.ConversationParticipants
                .FirstAsync(p => p.ConversationId == conversation.Id && p.UserId == currentUserId);

            mine.LastReadAt = now;

            var message = new Message
            {
                Id = Guid.NewGuid(),
                ConversationId = conversation.Id,
                SenderId = currentUserId,
                Content = string.IsNullOrEmpty(content) ? null : content,
                PostId = hasPost ? dto.PostId : null,
                CreatedAt = now
            };

            _db.Messages.Add(message);

            await _db.SaveChangesAsync();

            var sender = await _db.Users.FirstAsync(u => u.Id == currentUserId);

            // Mirror the stored message to whoever the recipient has connected right now, and to the
            // sender's own other tabs and devices. This runs after the commit so a client that reacts by
            // fetching always finds the row, and it deliberately ignores RequestAborted: the message
            // exists either way, so a caller hanging up must not silently swallow the notification.
            // Content is opaque here, so encrypted and plain messages take the same route. A post-only
            // message carries no content and used to skip this entirely, which made it the one message
            // that arrived silently; it now fans out with an empty payload, and the client announces it
            // ("Shared a post") exactly like a text one.
            var recipientParticipant = await _db.ConversationParticipants
                .FirstOrDefaultAsync(p => p.ConversationId == conversation.Id && p.UserId == recipient.Id);

            var unreadCount = await _db.Messages
                .CountAsync(m => m.ConversationId == conversation.Id && m.SenderId == currentUserId && (recipientParticipant == null || recipientParticipant.LastReadAt == null || m.CreatedAt > recipientParticipant.LastReadAt));

            await _delivery.DeliverAsync(
                recipient.Id,
                currentUserId,
                new EncryptedMessageEnvelope
                {
                    SenderId = currentUserId.ToString(),
                    EncryptedPayload = message.Content ?? string.Empty,
                    SentAt = message.CreatedAt,
                    MessageId = message.Id.ToString(),
                    ConversationId = conversation.Id.ToString()
                },
                senderName: sender.Name,
                senderAvatarUrl: sender.AvatarUrl,
                previewText: !string.IsNullOrWhiteSpace(dto.PreviewText) ? dto.PreviewText.Trim() : (!string.IsNullOrEmpty(content) && !content.StartsWith("ENC:") ? content : null),
                unreadCount: Math.Max(1, unreadCount));

            return Ok(new ApiResponse<SendMessageResultDto>
            {
                Message = "Message sent",
                Data = new SendMessageResultDto
                {
                    ConversationId = conversation.Id,
                    Message = new MessageDto
                    {
                        Id = message.Id,
                        Content = message.Content,
                        PostId = message.PostId,
                        Post = postDto,
                        CreatedAt = message.CreatedAt,
                        IsMine = true,
                        Sender = new AuthorDto
                        {
                            Id = sender.Id,
                            Name = sender.Name,
                            Username = sender.Username,
                            AvatarUrl = sender.AvatarUrl
                        }
                    }
                }
            });
        }

        [HttpGet("recipients")]
        public async Task<IActionResult> GetRecipients()
        {
            var currentUserId = CurrentUserId!.Value;

            var ids = await _db.Follows
                .Where(f => f.FollowerId == currentUserId || f.FollowingId == currentUserId)
                .Select(f => f.FollowerId == currentUserId ? f.FollowingId : f.FollowerId)
                .Distinct()
                .ToListAsync();

            ids.Remove(currentUserId);

            var recipients = await _db.Users
                .Where(u => ids.Contains(u.Id))
                .Select(u => new MessageRecipientDto
                {
                    Id = u.Id,
                    Name = u.Name,
                    Username = u.Username,
                    AvatarUrl = u.AvatarUrl,
                    MessagesFrom = u.MessagesFrom.ToString().ToLower(),
                    CanMessage = u.MessagesFrom == MessagesFrom.Everyone ||
                        (u.MessagesFrom == MessagesFrom.Followers &&
                         u.Followers.Any(f => f.FollowerId == currentUserId))
                })
                .ToListAsync();

            recipients = recipients
                .OrderByDescending(r => r.CanMessage)
                .ThenBy(r => r.Name)
                .ToList();

            return Ok(new ApiResponse<List<MessageRecipientDto>>
            {
                Count = recipients.Count,
                Data = recipients
            });
        }

        /// <summary>
        /// Fills in the live half of a conversation participant. Called after the query, because
        /// "is this person connected right now?" is process-local state that no SQL projection can see.
        /// </summary>
        private void ApplyPresence(ConversationUserDto user)
        {
            user.IsOnline = _presence.IsOnline(user.Id);

            // While online, LastSeenAt is only "when the current connection opened", which the UI never
            // shows. Dropping it keeps the payload consistent with the presence event, which sends no
            // time for an online user.
            if (user.IsOnline)
                user.LastSeenAt = null;
        }

        private async Task AttachPosts(List<MessageDto> messages, Guid currentUserId)
        {
            var postIds = messages
                .Where(m => m.PostId != null)
                .Select(m => m.PostId!.Value)
                .Distinct()
                .ToList();

            if (postIds.Count == 0)
                return;

            var posts = await _db.Posts
                .Where(p => postIds.Contains(p.Id))
                .WhereVisibleTo(currentUserId)
                .Select(PostDto.Projection(currentUserId, includeCommunity: true))
                .ToListAsync();

            var byId = posts.ToDictionary(p => p.Id);

            foreach (var message in messages)
            {
                if (message.PostId != null && byId.TryGetValue(message.PostId.Value, out var post))
                    message.Post = post;
            }
        }
    }
}
