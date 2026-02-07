// ---- In-App Messaging ----
// Provides messaging primitives for coaches, players, and team communication.

// ---- Types ----

export interface MessageAttachment {
  id: string;
  type: 'image' | 'play' | 'formation' | 'file';
  name: string;
  url: string;
  size?: number;
}

export interface Message {
  id: string;
  senderId: string;
  recipientId: string;
  channelId?: string;
  content: string;
  timestamp: string;
  readAt?: string;
  attachments?: MessageAttachment[];
}

export type ChannelType = 'direct' | 'group' | 'team';

export interface MessageChannel {
  id: string;
  name: string;
  members: string[];
  type: ChannelType;
}

// ---- In-memory store (stub; production would use a database) ----

const channels = new Map<string, MessageChannel>();
const messages = new Map<string, Message[]>(); // channelId -> messages
let messageIdCounter = 1;
let channelIdCounter = 1;

// ---- Channel management ----

/**
 * Create a new message channel.
 */
export function createChannel(
  name: string,
  members: string[],
  type: string,
): MessageChannel {
  if (!name || name.trim().length === 0) {
    throw new Error('Channel name is required');
  }

  if (members.length === 0) {
    throw new Error('At least one member is required');
  }

  const validTypes: ChannelType[] = ['direct', 'group', 'team'];
  if (!validTypes.includes(type as ChannelType)) {
    throw new Error(`Invalid channel type: ${type}. Must be one of: ${validTypes.join(', ')}`);
  }

  if (type === 'direct' && members.length !== 2) {
    throw new Error('Direct channels must have exactly 2 members');
  }

  const channel: MessageChannel = {
    id: `channel-${channelIdCounter++}`,
    name: name.trim(),
    members: [...members],
    type: type as ChannelType,
  };

  channels.set(channel.id, channel);
  messages.set(channel.id, []);

  return channel;
}

// ---- Send message ----

/**
 * Send a message to a channel.
 */
export function sendMessage(
  channelId: string,
  content: string,
  attachments?: MessageAttachment[],
): Message {
  if (!channelId || channelId.trim().length === 0) {
    throw new Error('Channel ID is required');
  }

  if (!content || content.trim().length === 0) {
    throw new Error('Message content is required');
  }

  const channel = channels.get(channelId);
  if (!channel) {
    throw new Error(`Channel not found: ${channelId}`);
  }

  const message: Message = {
    id: `msg-${messageIdCounter++}`,
    senderId: channel.members[0], // stub: use first member as sender
    recipientId: channel.members.length > 1 ? channel.members[1] : channel.members[0],
    channelId,
    content: content.trim(),
    timestamp: new Date().toISOString(),
    attachments: attachments ? [...attachments] : undefined,
  };

  const channelMessages = messages.get(channelId) ?? [];
  channelMessages.push(message);
  messages.set(channelId, channelMessages);

  return message;
}

// ---- Retrieve messages ----

/**
 * Get messages from a channel with optional pagination.
 *
 * @param channelId - The channel to fetch messages from
 * @param limit - Maximum number of messages to return (default: 50)
 * @param before - Return messages before this message ID
 */
export function getMessages(
  channelId: string,
  limit: number = 50,
  before?: string,
): Message[] {
  if (!channelId || channelId.trim().length === 0) {
    throw new Error('Channel ID is required');
  }

  const channelMessages = messages.get(channelId);
  if (!channelMessages) {
    return [];
  }

  let filtered = [...channelMessages];

  if (before) {
    const beforeIndex = filtered.findIndex((m) => m.id === before);
    if (beforeIndex > 0) {
      filtered = filtered.slice(0, beforeIndex);
    }
  }

  // Return the most recent messages (up to limit)
  return filtered.slice(-limit);
}

// ---- Read receipts ----

/**
 * Mark a message as read.
 */
export function markAsRead(messageId: string): boolean {
  if (!messageId || messageId.trim().length === 0) {
    throw new Error('Message ID is required');
  }

  for (const channelMessages of messages.values()) {
    const message = channelMessages.find((m) => m.id === messageId);
    if (message) {
      message.readAt = new Date().toISOString();
      return true;
    }
  }

  return false;
}

// ---- Unread count ----

/**
 * Get the count of unread messages for a given user across all channels.
 */
export function getUnreadCount(userId: string): number {
  if (!userId || userId.trim().length === 0) {
    return 0;
  }

  let count = 0;

  for (const [channelId, channelMessages] of messages.entries()) {
    const channel = channels.get(channelId);
    if (!channel || !channel.members.includes(userId)) continue;

    for (const msg of channelMessages) {
      // Count messages not sent by this user that are unread
      if (msg.senderId !== userId && !msg.readAt) {
        count++;
      }
    }
  }

  return count;
}

// ---- Test helpers ----

/**
 * Reset all messaging state. Used for test isolation.
 */
export function _resetMessagingState(): void {
  channels.clear();
  messages.clear();
  messageIdCounter = 1;
  channelIdCounter = 1;
}
