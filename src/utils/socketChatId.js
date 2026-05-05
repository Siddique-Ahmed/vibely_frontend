/**
 * Stable chat id string from REST or Socket.IO payloads (ObjectId object, $oid, or string).
 */
export function getSocketChatId(message) {
  if (!message) return "";
  const raw = message.chat_id ?? message.chat;
  if (raw == null || raw === "") return "";
  if (typeof raw === "string") return raw;
  if (typeof raw === "object" && typeof raw.$oid === "string") return raw.$oid;
  if (typeof raw === "object" && typeof raw.toHexString === "function")
    return raw.toHexString();
  try {
    return String(raw);
  } catch {
    return "";
  }
}

export function getSocketSenderId(message) {
  if (!message?.sender) return "";
  const s = message.sender;
  if (typeof s === "string") return s;
  if (typeof s === "object" && s._id != null) {
    const id = s._id;
    if (typeof id === "string") return id;
    if (typeof id === "object" && typeof id.$oid === "string") return id.$oid;
    return String(id);
  }
  return "";
}
