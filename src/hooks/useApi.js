import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "../services/apiClient";

// ─── Posts hooks ─────────────────────────────────────────────────────────────

/** GET /api/v1/posts?page=&limit= */
export const usePosts = (page = 1, limit = 10) => {
  return useQuery({
    queryKey: ["posts", page, limit],
    queryFn: () =>
      apiClient.get("/posts", { params: { page, limit } }).then((res) => res.data),
  });
};

/** GET /api/v1/posts/follower/post?page=&limit= */
export const useFeedPosts = (page = 1, limit = 10) => {
  return useQuery({
    queryKey: ["feedPosts", page, limit],
    queryFn: () =>
      apiClient
        .get("/posts/follower/post", { params: { page, limit } })
        .then((res) => res.data),
  });
};

/** GET /api/v1/posts/:postId */
export const usePost = (postId) => {
  return useQuery({
    queryKey: ["post", postId],
    queryFn: () => apiClient.get(`/posts/${postId}`).then((res) => res.data),
    enabled: !!postId,
  });
};

/** GET /api/v1/posts/user — current logged-in user's posts */
export const useMyPosts = (page = 1, limit = 20) => {
  return useQuery({
    queryKey: ["myPosts", page, limit],
    queryFn: () =>
      apiClient.get("/posts/user", { params: { page, limit } }).then((res) => res.data),
  });
};

/** GET /api/v1/posts/user/:userId — posts for a specific user's profile */
export const useUserProfilePosts = (profileOwnerId, page = 1, limit = 20) => {
  return useQuery({
    queryKey: ["userProfilePosts", profileOwnerId, page, limit],
    queryFn: () =>
      apiClient
        .get(`/posts/user/${profileOwnerId}`, { params: { page, limit } })
        .then((res) => res.data),
    enabled: !!profileOwnerId,
  });
};

/** POST /api/v1/posts/create */
export const useCreatePost = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (formData) =>
      apiClient.post("/posts/create", formData).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"], exact: false });
      queryClient.invalidateQueries({ queryKey: ["feedPosts"], exact: false });
      queryClient.invalidateQueries({ queryKey: ["myPosts"], exact: false });
    },
  });
};

/** PUT /api/v1/posts/update/:postId */
export const useUpdatePost = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ postId, data }) =>
      apiClient.put(`/posts/update/${postId}`, data).then((res) => res.data),
    onSuccess: (_, { postId }) => {
      queryClient.invalidateQueries({ queryKey: ["posts"], exact: false });
      queryClient.invalidateQueries({ queryKey: ["post", postId] });
    },
  });
};

/** DELETE /api/v1/posts/delete/:postId */
export const useDeletePost = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (postId) =>
      apiClient.delete(`/posts/delete/${postId}`).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"], exact: false });
      queryClient.invalidateQueries({ queryKey: ["feedPosts"], exact: false });
      queryClient.invalidateQueries({ queryKey: ["myPosts"], exact: false });
    },
  });
};

/** POST /api/v1/posts/share/:postId */
export const useSharePost = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (postId) =>
      apiClient.post(`/posts/share/${postId}`).then((res) => res.data),
    onSuccess: (_, postId) => {
      queryClient.invalidateQueries({ queryKey: ["posts"], exact: false });
      queryClient.invalidateQueries({ queryKey: ["feedPosts"], exact: false });
      queryClient.invalidateQueries({ queryKey: ["post", postId] });
    },
  });
};

// ─── User hooks ──────────────────────────────────────────────────────────────

/** GET /api/v1/users/my-profile */
export const useMyProfile = () => {
  return useQuery({
    queryKey: ["myProfile"],
    queryFn: () => apiClient.get("/users/my-profile").then((res) => res.data),
  });
};

/** GET /api/v1/users/user-profile/:identifier */
export const useUserProfile = (identifier) => {
  return useQuery({
    queryKey: ["userProfile", identifier],
    queryFn: () =>
      apiClient.get(`/users/user-profile/${identifier}`).then((res) => res.data),
    enabled: !!identifier,
  });
};

/** GET /api/v1/users/search-user?query=&limit= */
export const useSearchUsers = (query, limit = 20) => {
  return useQuery({
    queryKey: ["searchUsers", query, limit],
    queryFn: () =>
      apiClient
        .get("/users/search-user", { params: { query, limit } })
        .then((res) => res.data),
    enabled: !!query && query.trim().length > 0,
  });
};

/** GET /api/v1/users/posts/:userId — any user's posts for profile page */
export const useGetUserPosts = (userId, page = 1, limit = 20) => {
  return useQuery({
    queryKey: ["userPosts", userId, page, limit],
    queryFn: () =>
      apiClient
        .get(`/users/posts/${userId}`, { params: { page, limit } })
        .then((res) => res.data),
    enabled: !!userId,
  });
};

/** PUT /api/v1/users/update-profile — multipart/form-data with profile_picture and/or cover_picture */
export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (formData) =>
      apiClient
        .put("/users/update-profile", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        })
        .then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myProfile"] });
      queryClient.invalidateQueries({ queryKey: ["userProfile"] });
    },
  });
};

/** POST /api/v1/users/update-privacy-settings */
export const useUpdatePrivacySettings = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (privacyData) =>
      apiClient
        .post("/users/update-privacy-settings", privacyData)
        .then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myProfile"] });
      queryClient.invalidateQueries({ queryKey: ["userProfile"] });
    },
  });
};

/** GET /api/v1/users/notification-preferences */
export const useNotificationPreferences = () => {
  return useQuery({
    queryKey: ["notificationPreferences"],
    queryFn: () =>
      apiClient.get("/users/notification-preferences").then((res) => res.data),
  });
};

/** PUT /api/v1/users/notification-preferences */
export const useUpdateNotificationPreferences = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (preferences) =>
      apiClient
        .put("/users/notification-preferences", preferences)
        .then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notificationPreferences"] });
    },
  });
};

// ─── Comments hooks ───────────────────────────────────────────────────────────

/** GET /api/v1/comments/:postId?page=&limit= */
export const useComments = (postId, page = 1, limit = 10) => {
  return useQuery({
    queryKey: ["comments", postId, page, limit],
    queryFn: () =>
      apiClient
        .get(`/comments/${postId}`, { params: { page, limit } })
        .then((res) => res.data),
    enabled: !!postId,
  });
};

/** POST /api/v1/comments/create/:postId */
export const useCreateComment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ postId, content, parentCommentId }) =>
      apiClient
        .post(`/comments/create/${postId}`, { content, parentCommentId })
        .then((res) => res.data),
    onSuccess: (_, { postId }) => {
      queryClient.invalidateQueries({ queryKey: ["comments", postId], exact: false });
      queryClient.invalidateQueries({ queryKey: ["post", postId] });
      queryClient.invalidateQueries({ queryKey: ["posts"], exact: false });
      queryClient.invalidateQueries({ queryKey: ["feedPosts"], exact: false });
    },
  });
};

/** PUT /api/v1/comments/update/:commentId */
export const useUpdateComment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ commentId, content }) =>
      apiClient
        .put(`/comments/update/${commentId}`, { content })
        .then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments"], exact: false });
      queryClient.invalidateQueries({ queryKey: ["posts"], exact: false });
      queryClient.invalidateQueries({ queryKey: ["feedPosts"], exact: false });
    },
  });
};

/** DELETE /api/v1/comments/delete/:commentId */
export const useDeleteComment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (commentId) =>
      apiClient.delete(`/comments/delete/${commentId}`).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments"], exact: false });
      queryClient.invalidateQueries({ queryKey: ["posts"], exact: false });
      queryClient.invalidateQueries({ queryKey: ["feedPosts"], exact: false });
    },
  });
};

// ─── Likes hooks ──────────────────────────────────────────────────────────────

/** GET /api/v1/likes?targetId=&targetType=&page=&limit= */
export const useLikes = (targetId, targetType, page = 1, limit = 10) => {
  return useQuery({
    queryKey: ["likes", targetId, targetType, page, limit],
    queryFn: () =>
      apiClient
        .get("/likes", { params: { targetId, targetType, page, limit } })
        .then((res) => res.data),
    enabled: !!targetId,
  });
};

/** POST /api/v1/likes/toggle */
export const useToggleLike = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ targetId, targetType, reactionType = "like" }) =>
      apiClient
        .post("/likes/toggle", { targetId, targetType, reactionType })
        .then((res) => res.data),
    onSuccess: (_, { targetId, targetType }) => {
      queryClient.invalidateQueries({ queryKey: ["likes", targetId] });
      queryClient.invalidateQueries({ queryKey: ["posts"], exact: false });
      queryClient.invalidateQueries({ queryKey: ["feedPosts"], exact: false });
      if (targetType === "Post") {
        queryClient.invalidateQueries({ queryKey: ["post", targetId] });
      }
    },
  });
};

/** GET /api/v1/likes/check?targetId=&targetType= */
export const useIsLiked = (targetId, targetType) => {
  return useQuery({
    queryKey: ["isLiked", targetId, targetType],
    queryFn: () =>
      apiClient
        .get("/likes/check", { params: { targetId, targetType } })
        .then((res) => res.data),
    enabled: !!targetId,
  });
};

// ─── Bookmarks hooks ──────────────────────────────────────────────────────────

/** GET /api/v1/bookmarks?page=&limit= */
export const useBookmarks = (page = 1, limit = 10) => {
  return useQuery({
    queryKey: ["bookmarks", page, limit],
    queryFn: () =>
      apiClient
        .get("/bookmarks", { params: { page, limit } })
        .then((res) => res.data),
  });
};

/** PUT /api/v1/bookmarks/toggle/:postId */
export const useToggleBookmark = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (postId) =>
      apiClient.put(`/bookmarks/toggle/${postId}`).then((res) => res.data),
    onSuccess: (_, postId) => {
      queryClient.invalidateQueries({ queryKey: ["bookmarks"], exact: false });
      queryClient.invalidateQueries({ queryKey: ["posts"], exact: false });
      queryClient.invalidateQueries({ queryKey: ["feedPosts"], exact: false });
      queryClient.invalidateQueries({ queryKey: ["post", postId] });
    },
  });
};

/** GET /api/v1/bookmarks/check/:postId */
export const useIsBookmarked = (postId) => {
  return useQuery({
    queryKey: ["isBookmarked", postId],
    queryFn: () =>
      apiClient.get(`/bookmarks/check/${postId}`).then((res) => res.data),
    enabled: !!postId,
  });
};

// ─── Follow hooks ─────────────────────────────────────────────────────────────

/** GET /api/v1/follow/followers?page=&limit= */
export const useFollowers = (page = 1, limit = 10) => {
  return useQuery({
    queryKey: ["followers", page, limit],
    queryFn: () =>
      apiClient
        .get("/follow/followers", { params: { page, limit } })
        .then((res) => res.data),
  });
};

/** GET /api/v1/follow/following?page=&limit= */
export const useFollowing = (page = 1, limit = 10) => {
  return useQuery({
    queryKey: ["following", page, limit],
    queryFn: () =>
      apiClient
        .get("/follow/following", { params: { page, limit } })
        .then((res) => res.data),
  });
};

/** POST /api/v1/follow/toggle/:targetUserId */
export const useToggleFollow = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (targetUserId) =>
      apiClient
        .post(`/follow/toggle/${targetUserId}`)
        .then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["followers"] });
      queryClient.invalidateQueries({ queryKey: ["following"] });
    },
  });
};

/** GET /api/v1/follow/isFollowing/:targetUserId */
export const useIsFollowing = (targetUserId) => {
  return useQuery({
    queryKey: ["isFollowing", targetUserId],
    queryFn: () =>
      apiClient
        .get(`/follow/isFollowing/${targetUserId}`)
        .then((res) => res.data),
    enabled: !!targetUserId,
  });
};

// ─── Notifications hooks ──────────────────────────────────────────────────────

/** GET /api/v1/notifications?page=&limit=&status= */
export const useNotifications = (page = 1, limit = 10, status = "unread") => {
  return useQuery({
    queryKey: ["notifications", page, limit, status],
    queryFn: () =>
      apiClient
        .get("/notifications", { params: { page, limit, status } })
        .then((res) => res.data),
  });
};

/** GET /api/v1/notifications/unreadCount */
export const useUnreadCount = () => {
  return useQuery({
    queryKey: ["unreadCount"],
    queryFn: () =>
      apiClient.get("/notifications/unreadCount").then((res) => res.data),
    refetchInterval: 30000, // poll every 30s
  });
};

/** PUT /api/v1/notifications/read/:notificationId */
export const useMarkAsRead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (notificationId) =>
      apiClient
        .put(`/notifications/read/${notificationId}`)
        .then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["unreadCount"] });
    },
  });
};

/** PUT /api/v1/notifications/readAll */
export const useMarkAllAsRead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () =>
      apiClient.put("/notifications/readAll").then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["unreadCount"] });
    },
  });
};

/** DELETE /api/v1/notifications/delete/:notificationId */
export const useDeleteNotification = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (notificationId) =>
      apiClient
        .delete(`/notifications/delete/${notificationId}`)
        .then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
};

/** DELETE /api/v1/notifications/clearAll */
export const useClearAllNotifications = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () =>
      apiClient.delete("/notifications/clearAll").then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["unreadCount"] });
    },
  });
};
