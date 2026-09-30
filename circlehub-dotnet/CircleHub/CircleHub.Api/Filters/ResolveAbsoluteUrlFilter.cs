using System.Collections;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;

namespace CircleHub.Api.Filters
{
    public class ResolveAbsoluteUrlFilter : IAsyncResultFilter
    {
        public Task OnResultExecutionAsync(ResultExecutingContext context, ResultExecutionDelegate next)
        {
            if (context.Result is ObjectResult { Value: not null } objectResult)
            {
                var baseUrl = $"{context.HttpContext.Request.Scheme}://{context.HttpContext.Request.Host}";
                RewriteObject(objectResult.Value, baseUrl, new HashSet<object>(ReferenceEqualityComparer.Instance));
            }

            return next();
        }

        private static void RewriteObject(object value, string baseUrl, HashSet<object> visited)
        {
            if (!visited.Add(value))
                return;

            foreach (var property in value.GetType().GetProperties())
            {
                if (!property.CanRead)
                    continue;

                var propertyValue = property.GetValue(value);
                if (propertyValue is null)
                    continue;

                if (property.PropertyType == typeof(string))
                {
                    var text = (string)propertyValue;
                    if (text.StartsWith("/uploads/", StringComparison.Ordinal) && property.CanWrite)
                        property.SetValue(value, baseUrl + text);
                    continue;
                }

                if (property.PropertyType.IsValueType || property.PropertyType == typeof(object))
                    continue;

                if (propertyValue is IEnumerable collection)
                {
                    foreach (var item in collection)
                    {
                        if (item is not null && item is not string)
                            RewriteObject(item, baseUrl, visited);
                    }

                    continue;
                }

                RewriteObject(propertyValue, baseUrl, visited);
            }
        }
    }
}