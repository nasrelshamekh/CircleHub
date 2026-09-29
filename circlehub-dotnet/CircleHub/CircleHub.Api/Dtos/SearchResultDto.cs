namespace CircleHub.Api.Dtos
{
    public class SearchResultDto
    {
        public List<SearchUserDto> Users { get; set; } = new();
        public List<CommunityListItemDto> Communities { get; set; } = new();
        public List<PostDto> Posts { get; set; } = new();
    }
}
