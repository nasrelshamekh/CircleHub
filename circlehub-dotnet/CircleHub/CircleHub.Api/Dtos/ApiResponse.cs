using System.Text.Json.Serialization;

namespace CircleHub.Api.Dtos
{
    public class ApiResponse<T>
    {
        public bool Success { get; init; } = true;

        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public string? Message { get; init; }

        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public int? Count { get; init; }

        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public T? Data { get; init; }

        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public PageMeta? Meta { get; init; }
    }

    public class PageMeta
    {
        public int Page { get; init; }
        public int PageSize { get; init; }
        public int Total { get; init; }
        public int TotalPages { get; init; }
        public bool HasNext { get; init; }
    }

    public class ApiErrorResponse
    {
        public bool Success { get; init; }
        public string Message { get; init; } = string.Empty;
    }
}
