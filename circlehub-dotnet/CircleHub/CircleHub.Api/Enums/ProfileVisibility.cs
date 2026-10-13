namespace CircleHub.Api.Enums
{
    /// <summary>
    /// Who is allowed to see a user's posts, media and lists.
    /// Public: everyone. Followers: the user's followers. Private: the user alone.
    /// </summary>
    public enum ProfileVisibility
    {
        Public,
        Followers,
        Private
    }
}
