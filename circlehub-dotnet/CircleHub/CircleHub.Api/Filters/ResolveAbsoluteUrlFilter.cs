using System.Collections;
using System.Collections.Concurrent;
using System.Reflection;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;

namespace CircleHub.Api.Filters
{
    public class ResolveAbsoluteUrlFilter : IAsyncResultFilter
    {
        private static readonly ConcurrentDictionary<Type, PropertyInfo[]> InspectablePropertiesCache = new();

        public Task OnResultExecutionAsync(ResultExecutingContext context, ResultExecutionDelegate next)
        {
            if (context.Result is ObjectResult { Value: not null } objectResult)
            {
                ResolveUrls(objectResult.Value, context.HttpContext.Request);
            }

            return next();
        }

        public static void ResolveUrls(object? value, HttpRequest request)
        {
            if (value is null)
                return;

            var baseUrl = $"{request.Scheme}://{request.Host}";
            RewriteObject(value, baseUrl, new HashSet<object>(ReferenceEqualityComparer.Instance));
        }

        private static PropertyInfo[] GetInspectableProperties(Type type) =>
            InspectablePropertiesCache.GetOrAdd(type, static t =>
                t.GetProperties(BindingFlags.Public | BindingFlags.Instance)
                    .Where(static p =>
                        p.CanRead &&
                        p.GetIndexParameters().Length == 0 &&
                        !p.PropertyType.IsValueType &&
                        p.PropertyType != typeof(object) &&
                        (p.PropertyType != typeof(string) || p.CanWrite))
                    .ToArray());

        private static void RewriteObject(object value, string baseUrl, HashSet<object> visited)
        {
            if (value is string)
                return;

            if (!visited.Add(value))
                return;

            foreach (var property in GetInspectableProperties(value.GetType()))
            {
                var propertyValue = property.GetValue(value);
                if (propertyValue is null)
                    continue;

                if (propertyValue is string text)
                {
                    if (text.Length > 9 && text[0] == '/' && text.StartsWith("/uploads/", StringComparison.Ordinal))
                    {
                        property.SetValue(value, baseUrl + text);
                    }

                    continue;
                }

                if (propertyValue is IEnumerable collection)
                {
                    foreach (var item in collection)
                    {
                        if (item is not null && item is not string && !item.GetType().IsValueType)
                            RewriteObject(item, baseUrl, visited);
                    }

                    continue;
                }

                RewriteObject(propertyValue, baseUrl, visited);
            }
        }
    }
}
