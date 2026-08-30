import { del, get, patch, post } from "../../services/locatexApi";

/**
 * Every call the administrator's dashboard makes, in one place — so a change to a path is
 * a change to one line rather than a search through five components.
 */
export const adminApi = {
  stats: () => get("/admin/stats"),

  reviewQueue: (status = "pending") =>
    get(`/admin/properties?status=${encodeURIComponent(status)}`),
  decide: (propertyId, action, reason) =>
    post(`/properties/${propertyId}/status`, reason ? { action, reason } : { action }),
  feature: (propertyId, isFeatured) =>
    post(`/properties/${propertyId}/featured`, { isFeatured }),

  users: (query = "") => get(`/admin/users${query ? `?${query}` : ""}`),
  setUserStatus: (userId, status) => patch(`/admin/users/${userId}/status`, { status }),

  brokerApplications: () => get("/auth/broker-applications"),
  decideBroker: (userId, decision, reason) =>
    post(`/auth/broker-applications/${userId}`, reason ? { decision, reason } : { decision }),

  contactMessages: (status) =>
    get(`/admin/contact-messages${status ? `?status=${encodeURIComponent(status)}` : ""}`),
  setContactStatus: (id, status, note) =>
    patch(`/admin/contact-messages/${id}`, note ? { status, note } : { status }),

  storage: () => get("/documents/storage"),
  connectStorage: () => post("/admin/storage/connect", {}),
  disconnectStorage: () => post("/admin/storage/disconnect", {}),

  news: () => get("/admin/news"),
  createNews: (item) => post("/admin/news", item),
  updateNews: (id, changes) => patch(`/admin/news/${id}`, changes),
  deleteNews: (id) => del(`/admin/news/${id}`),
};

/**
 * Loads on mount and again on demand.
 *
 * `reload` is what every panel calls after it changes something: re-reading the list is
 * cheap here and is the only way the numbers on screen are the numbers in the database
 * rather than what the browser guessed they became.
 */
export function useAsync(loader, dependencies = []) {
  return { loader, dependencies };
}
