namespace CircleHub.Api.Enums
{
    /// <summary>
    /// Who is allowed to start a direct conversation with the user.
    /// Everyone: any user. Followers: the user's followers. None: nobody.
    /// </summary>
    public enum MessagesFrom
    {
        Everyone,
        Followers,
        None
    }
}
