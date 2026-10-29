import { apiClient } from "./apiClient";

export async function search(params) {
  const searchParams =
    typeof params === "string"
      ? { q: params }
      : {
          q: params?.q ?? "",
          type: params?.type,
          sort: params?.sort,
          mediaOnly: params?.mediaOnly,
        };

  const cleanParams = Object.fromEntries(
    Object.entries(searchParams).filter(
      ([, v]) => v !== undefined && v !== null && v !== ""
    )
  );

  const response = await apiClient.get("/search", { params: cleanParams });
  return response.data;
}
