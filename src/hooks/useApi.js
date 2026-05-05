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

/** GET /api/v1/messages/:chatId?page=&limit= */
export const useMessages = (chatId, page = 1, limit = 50) => {
  return useQuery({
    queryKey: ["messages", chatId, page, limit],
    queryFn: () =>
      apiClient
        .get(`/messages/${chatId}`, { params: { page, limit } })
        .then((res) => res.data),
    enabled: !!chatId,
  });
};

/** GET /api/v1/messages/search-messages/:chatId */
export const useSearchMessages = (chatId, q = "", page = 1, limit = 50) => {
  return useQuery({
    queryKey: ["searchMessages", chatId, q, page, limit],
    queryFn: () =>
      apiClient
        .get(`/messages/search-messages/${chatId}`, { params: { q, page, limit } })
        .then((res) => res.data),
    enabled: !!chatId && !!q,
  });
};

/** POST /api/v1/messages/send-message */
export const useSendMessage = (options = {}) => {
  const queryClient = useQueryClient();
  return useMutation({
    ...options,
    mutationFn: ({ chatId, content, type = "text", mediaFiles = [], reply_to = null }) => {
      const formData = new FormData();
      formData.append("chatId", chatId);
      formData.append("content", content || "");
      formData.append("type", type);
      if (reply_to) formData.append("reply_to", reply_to);
      mediaFiles.forEach((file) => formData.append("media", file));

      return apiClient
        .post("/messages/send-message", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        })
        .then((res) => res.data);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["messages", variables.chatId], exact: true });
      queryClient.invalidateQueries({ queryKey: ["chats"], exact: false });
    },
  });
};

/** GET /api/v1/chats/all-chats */
export const useChats = (page = 1, limit = 20) => {
  return useQuery({
    queryKey: ["chats", page, limit],
    queryFn: () =>
      apiClient
        .get("/chats/all-chats", { params: { page, limit } })
        .then((res) => res.data),
  });
};

/** GET /api/v1/chats/archived-chats */
export const useArchivedChats = (page = 1, limit = 20) => {
  return useQuery({
    queryKey: ["archivedChats", page, limit],
    queryFn: () =>
      apiClient
        .get("/chats/archived-chats", { params: { page, limit } })
        .then((res) => res.data),
  });
};

/** GET /api/v1/chats/unread-count */
export const useUnreadMessageCount = (enabled = true) => {
  return useQuery({
    queryKey: ["unreadMessageCount"],
    queryFn: () =>
      apiClient.get("/chats/unread-count").then((res) => res.data),
    refetchInterval: 90000, // poll every 90s (reduces duplicate traffic vs 30s)
    enabled, // Only fetch if authenticated
  });
};

/** GET /api/v1/chats/chat-detail/:chatId */
export const useChatDetail = (chatId) => {
  return useQuery({
    queryKey: ["chatDetail", chatId],
    queryFn: () => apiClient.get(`/chats/chat-detail/${chatId}`).then((res) => res.data),
    enabled: !!chatId,
  });
};

/** GET /api/v1/chats/single-chat/:chatId */
export const useSingleChat = (chatId) => {
  return useQuery({
    queryKey: ["singleChat", chatId],
    queryFn: () => apiClient.get(`/chats/single-chat/${chatId}`).then((res) => res.data),
    enabled: !!chatId,
  });
};

/** POST /api/v1/chats/create-chat */
export const useCreateChat = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (recieverId) =>
      apiClient
        .post("/chats/create-chat", { recieverId })
        .then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chats"], exact: false });
      queryClient.invalidateQueries({ queryKey: ["messages"], exact: false });
    },
  });
};

/** PUT /api/v1/messages/mark-seen/:chatId */
export const useMarkAsSeen = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (chatId) =>
      apiClient.put(`/messages/mark-seen/${chatId}`).then((res) => res.data),
    onSuccess: (_, chatId) => {
      queryClient.invalidateQueries({ queryKey: ["chats"] });
      queryClient.invalidateQueries({ queryKey: ["messages", chatId] });
      queryClient.invalidateQueries({ queryKey: ["unreadMessageCount"] });
    },
  });
};

/** PUT /api/v1/messages/delete-for-everyone/:messageId */
export const useDeleteMessageForEveryone = (options = {}) => {
  const queryClient = useQueryClient();
  const { onSuccess: userOnSuccess, ...rest } = options;
  return useMutation({
    ...rest,
    mutationFn: (messageId) =>
      apiClient.put(`/messages/delete-for-everyone/${messageId}`).then((res) => res.data),
    onSuccess: async (data, vars, ctx) => {
      await queryClient.invalidateQueries({ queryKey: ["messages"], exact: false });
      await queryClient.invalidateQueries({ queryKey: ["chats"], exact: false });
      await queryClient.refetchQueries({
        predicate: (q) =>
          Array.isArray(q.queryKey) && q.queryKey[0] === "messages",
      });
      await userOnSuccess?.(data, vars, ctx);
    },
  });
};

/** PUT /api/v1/messages/delete-for-me/:messageId */
export const useDeleteMessageForMe = (options = {}) => {
  const queryClient = useQueryClient();
  const { onSuccess: userOnSuccess, ...rest } = options;
  return useMutation({
    ...rest,
    mutationFn: (messageId) =>
      apiClient.put(`/messages/delete-for-me/${messageId}`).then((res) => res.data),
    onSuccess: async (data, vars, ctx) => {
      await queryClient.invalidateQueries({ queryKey: ["messages"], exact: false });
      await queryClient.refetchQueries({
        predicate: (q) =>
          Array.isArray(q.queryKey) && q.queryKey[0] === "messages",
      });
      await userOnSuccess?.(data, vars, ctx);
    },
  });
};

/** PUT /api/v1/messages/edit-message/:messageId */
export const useEditMessage = (options = {}) => {
  const queryClient = useQueryClient();
  return useMutation({
    ...options,
    mutationFn: ({ messageId, content }) =>
      apiClient.put(`/messages/edit-message/${messageId}`, { content }).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages"], exact: false });
    },
  });
};

/** PUT /api/v1/messages/react-message/:messageId */
export const useReactToMessage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ messageId, reaction }) =>
      apiClient.post(`/messages/react-message/${messageId}`, { reaction }).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages"], exact: false });
    },
  });
};

/** DELETE /api/v1/messages/remove-reaction/:messageId */
export const useRemoveReaction = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (messageId) =>
      apiClient.delete(`/messages/remove-reaction/${messageId}`).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages"], exact: false });
    },
  });
};

/** PUT /api/v1/messages/pin-message/:messageId */
export const usePinMessage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (messageId) =>
      apiClient.put(`/messages/pin-message/${messageId}`).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages"], exact: false });
    },
  });
};

/** PUT /api/v1/messages/unpin-message/:messageId */
export const useUnpinMessage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (messageId) =>
      apiClient.put(`/messages/unpin-message/${messageId}`).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages"], exact: false });
    },
  });
};

/** POST /api/v1/messages/forward-message/:messageId */
export const useForwardMessage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ messageId, targetChats }) =>
      apiClient.post(`/messages/forward-message/${messageId}`, { targetChats }).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chats"] });
      queryClient.invalidateQueries({ queryKey: ["messages"] });
    },
  });
};

/** POST /api/v1/messages/reply-message/:messageId */
export const useReplyMessage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ messageId, content, mediaFiles = [] }) => {
      const formData = new FormData();
      formData.append("content", content);
      mediaFiles.forEach((file) => formData.append("media", file));
      return apiClient.post(`/messages/reply-message/${messageId}`, formData).then((res) => res.data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages"], exact: false });
    },
  });
};

// ─── Extended Chat hooks ──────────────────────────────────────────────────────

/** DELETE /api/v1/chats/delete-chat/:chatId */
export const useDeleteChat = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (chatId) => apiClient.delete(`/chats/delete-chat/${chatId}`).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chats"] });
    },
  });
};

/** PUT /api/v1/chats/archive-chat/:chatId */
export const useArchiveChat = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (chatId) => apiClient.put(`/chats/archive-chat/${chatId}`).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chats"] });
      queryClient.invalidateQueries({ queryKey: ["archivedChats"] });
    },
  });
};

/** DELETE /api/v1/chats/clear-chat/:chatId — clear history for current user only */
export const useClearChat = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (chatId) =>
      apiClient.delete(`/chats/clear-chat/${chatId}`).then((res) => res.data),
    onSuccess: (_, chatId) => {
      queryClient.invalidateQueries({ queryKey: ["messages", chatId] });
      queryClient.invalidateQueries({ queryKey: ["chatDetail", chatId] });
      queryClient.invalidateQueries({ queryKey: ["chats"] });
    },
  });
};

/** POST /api/v1/blocks/toggle/:blockUserId */
export const useToggleBlock = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (blockUserId) =>
      apiClient.post(`/blocks/toggle/${blockUserId}`).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chats"] });
    },
  });
};

/** PUT /api/v1/chats/mute-chat/:chatId */
export const useMuteChat = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (chatId) => apiClient.put(`/chats/mute-chat/${chatId}`).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chats"] });
    },
  });
};

/** DELETE /api/v1/chats/leave-group/:groupId */
export const useLeaveGroup = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (groupId) =>
      apiClient.delete(`/chats/leave-group/${groupId}`).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chats"] });
    },
  });
};

/** PUT /api/v1/chats/update-group-info/:groupId — JSON or multipart FormData */
export const useUpdateGroupInfo = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ groupId, data }) =>
      apiClient.put(`/chats/update-group-info/${groupId}`, data).then((res) => res.data),
    onSuccess: (_, { groupId }) => {
      queryClient.invalidateQueries({ queryKey: ["chats"], exact: false });
      queryClient.invalidateQueries({ queryKey: ["singleChat", groupId] });
      queryClient.invalidateQueries({ queryKey: ["chatDetail", groupId] });
    },
  });
};

/** POST /api/v1/chats/make-admin/:groupId */
export const useMakeAdmin = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ groupId, memberId }) =>
      apiClient
        .post(`/chats/make-admin/${groupId}`, { memberId })
        .then((res) => res.data),
    onSuccess: (_, { groupId }) => {
      queryClient.invalidateQueries({ queryKey: ["chats"], exact: false });
      queryClient.invalidateQueries({ queryKey: ["singleChat", groupId] });
      queryClient.invalidateQueries({ queryKey: ["chatDetail", groupId] });
    },
  });
};

/** POST /api/v1/chats/remove-admin/:groupId */
export const useRemoveAdmin = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ groupId, memberId }) =>
      apiClient
        .post(`/chats/remove-admin/${groupId}`, { memberId })
        .then((res) => res.data),
    onSuccess: (_, { groupId }) => {
      queryClient.invalidateQueries({ queryKey: ["chats"], exact: false });
      queryClient.invalidateQueries({ queryKey: ["singleChat", groupId] });
      queryClient.invalidateQueries({ queryKey: ["chatDetail", groupId] });
    },
  });
};

/** DELETE /api/v1/chats/remove-member/:groupId — body `{ memberId }` (axios data) */
export const useRemoveMember = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ groupId, memberId }) =>
      apiClient
        .delete(`/chats/remove-member/${groupId}`, {
          data: { memberId },
        })
        .then((res) => res.data),
    onSuccess: (_, { groupId }) => {
      queryClient.invalidateQueries({ queryKey: ["chats"], exact: false });
      queryClient.invalidateQueries({ queryKey: ["singleChat", groupId] });
      queryClient.invalidateQueries({ queryKey: ["chatDetail", groupId] });
    },
  });
};

/** POST /api/v1/chats/add-members/:groupId */
export const useAddGroupMembers = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ groupId, memberIds }) =>
      apiClient
        .post(`/chats/add-members/${groupId}`, { memberIds })
        .then((res) => res.data),
    onSuccess: (_, { groupId }) => {
      queryClient.invalidateQueries({ queryKey: ["chats"], exact: false });
      queryClient.invalidateQueries({ queryKey: ["singleChat", groupId] });
      queryClient.invalidateQueries({ queryKey: ["chatDetail", groupId] });
    },
  });
};

/** POST /api/v1/chats/approve-request/:groupId */
export const useApproveJoinRequest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ groupId, requestUserId }) =>
      apiClient
        .post(`/chats/approve-request/${groupId}`, { requestUserId })
        .then((res) => res.data),
    onSuccess: (_, { groupId }) => {
      queryClient.invalidateQueries({ queryKey: ["chats"], exact: false });
      queryClient.invalidateQueries({ queryKey: ["singleChat", groupId] });
      queryClient.invalidateQueries({ queryKey: ["chatDetail", groupId] });
    },
  });
};

/** POST /api/v1/chats/reject-request/:groupId */
export const useRejectJoinRequest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ groupId, requestUserId }) =>
      apiClient
        .post(`/chats/reject-request/${groupId}`, { requestUserId })
        .then((res) => res.data),
    onSuccess: (_, { groupId }) => {
      queryClient.invalidateQueries({ queryKey: ["chats"], exact: false });
      queryClient.invalidateQueries({ queryKey: ["singleChat", groupId] });
      queryClient.invalidateQueries({ queryKey: ["chatDetail", groupId] });
    },
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

/** GET /api/v1/users/search-user-for-mention?query= */
export const useSearchUsersForMention = (query) => {
  return useQuery({
    queryKey: ["searchUsersForMention", query],
    queryFn: () =>
      apiClient
        .get("/users/search-user-for-mention", { params: { query } })
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
export const useUnreadCount = (enabled = true) => {
  return useQuery({
    queryKey: ["unreadCount"],
    queryFn: () =>
      apiClient.get("/notifications/unreadCount").then((res) => res.data),
    refetchInterval: 90000, // poll every 90s (reduces duplicate traffic vs 30s)
    enabled, // Only fetch if authenticated
  });
};

/** PUT /api/v1/notifications/read/:notificationId */
export const useMarkAsRead = (options = {}) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (notificationId) =>
      apiClient
        .put(`/notifications/read/${notificationId}`)
        .then((res) => res.data),
    ...options,
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["unreadCount"] });
      if (typeof options.onSuccess === "function") {
        options.onSuccess(data, variables, context);
      }
    },
  });
};

/** PUT /api/v1/notifications/readAll */
export const useMarkAllAsRead = (options = {}) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () =>
      apiClient.put("/notifications/readAll").then((res) => res.data),
    ...options,
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["unreadCount"] });
      if (typeof options.onSuccess === "function") {
        options.onSuccess(data, variables, context);
      }
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
/** GET /api/v1/follow/followers */
export const useFollowers = (page = 1, limit = 100) => {
  return useQuery({
    queryKey: ["followers", page, limit],
    queryFn: () => apiClient.get("/follow/followers", { params: { page, limit } }).then(res => res.data)
  });
};

/** GET /api/v1/follow/following */
export const useFollowing = (page = 1, limit = 100) => {
  return useQuery({
    queryKey: ["following", page, limit],
    queryFn: () => apiClient.get("/follow/following", { params: { page, limit } }).then(res => res.data)
  });
};

/** POST /api/v1/chats/create-group */
export const useCreateGroup = (options = {}) => {
  const queryClient = useQueryClient();
  return useMutation({
    ...options,
    mutationFn: (formData) => apiClient.post("/chats/create-group", formData).then(res => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chats"] });
    }
  });
};

/** POST /api/v1/users/logout */
export const useLogout = () => {
  return useMutation({
    mutationFn: () => apiClient.post("/users/logout").then((res) => res.data),
  });
};

/** POST /api/v1/users/deactive-user */
export const useDeactivateUser = () => {
  return useMutation({
    mutationFn: () => apiClient.post("/users/deactive-user").then((res) => res.data),
  });
};

