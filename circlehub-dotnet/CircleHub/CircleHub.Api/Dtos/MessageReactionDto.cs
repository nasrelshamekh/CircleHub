using System;
using System.Collections.Generic;

namespace CircleHub.Api.Dtos
{
    public class MessageReactionDto
    {
        public string Emoji { get; set; } = null!;
        public int Count { get; set; }
        public bool ReactedByMe { get; set; }
        public List<AuthorDto> Users { get; set; } = [];
    }

    public class SetMessageReactionDto
    {
        public string Emoji { get; set; } = null!;
    }

    public class MessageReactionUpdatedEventDto
    {
        public Guid MessageId { get; set; }
        public Guid ConversationId { get; set; }
        public List<MessageReactionDto> Reactions { get; set; } = [];
    }
}
