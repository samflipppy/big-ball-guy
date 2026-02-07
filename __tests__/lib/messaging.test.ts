import { describe, it, expect, beforeEach } from 'vitest';
import {
  createChannel,
  sendMessage,
  getMessages,
  markAsRead,
  getUnreadCount,
  _resetMessagingState,
} from '@/lib/messaging';
import type { MessageAttachment } from '@/lib/messaging';

// ---- Setup ----

beforeEach(() => {
  _resetMessagingState();
});

// ---- createChannel ----

describe('createChannel()', () => {
  it('creates a channel with the given name and type', () => {
    const channel = createChannel('Coaches', ['user-1', 'user-2'], 'group');
    expect(channel.name).toBe('Coaches');
    expect(channel.type).toBe('group');
    expect(channel.id).toBeDefined();
  });

  it('trims the channel name', () => {
    const channel = createChannel('  Team Chat  ', ['user-1'], 'team');
    expect(channel.name).toBe('Team Chat');
  });

  it('includes all members', () => {
    const channel = createChannel('Staff', ['user-1', 'user-2', 'user-3'], 'group');
    expect(channel.members).toEqual(['user-1', 'user-2', 'user-3']);
  });

  it('throws for empty channel name', () => {
    expect(() => createChannel('', ['user-1'], 'team')).toThrow('Channel name is required');
  });

  it('throws for no members', () => {
    expect(() => createChannel('Empty', [], 'team')).toThrow('At least one member is required');
  });

  it('throws for invalid channel type', () => {
    expect(() => createChannel('Bad', ['user-1'], 'invalid')).toThrow('Invalid channel type');
  });

  it('requires exactly 2 members for direct channels', () => {
    expect(() => createChannel('DM', ['user-1'], 'direct')).toThrow(
      'Direct channels must have exactly 2 members',
    );
  });

  it('creates direct channel with 2 members', () => {
    const channel = createChannel('DM', ['user-1', 'user-2'], 'direct');
    expect(channel.type).toBe('direct');
    expect(channel.members).toHaveLength(2);
  });

  it('generates unique channel IDs', () => {
    const c1 = createChannel('C1', ['user-1'], 'team');
    const c2 = createChannel('C2', ['user-1'], 'team');
    expect(c1.id).not.toBe(c2.id);
  });
});

// ---- sendMessage ----

describe('sendMessage()', () => {
  it('sends a message to a channel', () => {
    const channel = createChannel('Chat', ['user-1', 'user-2'], 'group');
    const msg = sendMessage(channel.id, 'Hello!');
    expect(msg.content).toBe('Hello!');
    expect(msg.channelId).toBe(channel.id);
    expect(msg.id).toBeDefined();
  });

  it('trims message content', () => {
    const channel = createChannel('Chat', ['user-1', 'user-2'], 'group');
    const msg = sendMessage(channel.id, '  Hi there  ');
    expect(msg.content).toBe('Hi there');
  });

  it('sets a timestamp', () => {
    const channel = createChannel('Chat', ['user-1', 'user-2'], 'group');
    const msg = sendMessage(channel.id, 'Hello');
    expect(msg.timestamp).toBeDefined();
    expect(new Date(msg.timestamp).getTime()).toBeGreaterThan(0);
  });

  it('includes attachments when provided', () => {
    const channel = createChannel('Chat', ['user-1', 'user-2'], 'group');
    const attachment: MessageAttachment = {
      id: 'att-1',
      type: 'play',
      name: 'Sweep Right',
      url: '/plays/sweep-right',
    };
    const msg = sendMessage(channel.id, 'Check this play', [attachment]);
    expect(msg.attachments).toHaveLength(1);
    expect(msg.attachments![0].name).toBe('Sweep Right');
  });

  it('throws for empty channel ID', () => {
    expect(() => sendMessage('', 'Hello')).toThrow('Channel ID is required');
  });

  it('throws for empty content', () => {
    const channel = createChannel('Chat', ['user-1', 'user-2'], 'group');
    expect(() => sendMessage(channel.id, '')).toThrow('Message content is required');
  });

  it('throws for unknown channel', () => {
    expect(() => sendMessage('nonexistent', 'Hello')).toThrow('Channel not found');
  });

  it('generates unique message IDs', () => {
    const channel = createChannel('Chat', ['user-1', 'user-2'], 'group');
    const m1 = sendMessage(channel.id, 'First');
    const m2 = sendMessage(channel.id, 'Second');
    expect(m1.id).not.toBe(m2.id);
  });
});

// ---- getMessages ----

describe('getMessages()', () => {
  it('returns messages from a channel', () => {
    const channel = createChannel('Chat', ['user-1', 'user-2'], 'group');
    sendMessage(channel.id, 'Hello');
    sendMessage(channel.id, 'World');
    const msgs = getMessages(channel.id);
    expect(msgs).toHaveLength(2);
  });

  it('returns empty array for unknown channel', () => {
    const msgs = getMessages('nonexistent');
    expect(msgs).toHaveLength(0);
  });

  it('respects limit parameter', () => {
    const channel = createChannel('Chat', ['user-1', 'user-2'], 'group');
    for (let i = 0; i < 10; i++) {
      sendMessage(channel.id, `Message ${i}`);
    }
    const msgs = getMessages(channel.id, 3);
    expect(msgs).toHaveLength(3);
  });

  it('returns most recent messages when limited', () => {
    const channel = createChannel('Chat', ['user-1', 'user-2'], 'group');
    for (let i = 0; i < 5; i++) {
      sendMessage(channel.id, `Message ${i}`);
    }
    const msgs = getMessages(channel.id, 2);
    expect(msgs[0].content).toBe('Message 3');
    expect(msgs[1].content).toBe('Message 4');
  });

  it('supports "before" pagination', () => {
    const channel = createChannel('Chat', ['user-1', 'user-2'], 'group');
    sendMessage(channel.id, 'First');
    const second = sendMessage(channel.id, 'Second');
    sendMessage(channel.id, 'Third');
    const msgs = getMessages(channel.id, 50, second.id);
    expect(msgs).toHaveLength(1);
    expect(msgs[0].content).toBe('First');
  });

  it('throws for empty channel ID', () => {
    expect(() => getMessages('')).toThrow('Channel ID is required');
  });
});

// ---- markAsRead ----

describe('markAsRead()', () => {
  it('marks a message as read', () => {
    const channel = createChannel('Chat', ['user-1', 'user-2'], 'group');
    const msg = sendMessage(channel.id, 'Hello');
    expect(msg.readAt).toBeUndefined();
    const result = markAsRead(msg.id);
    expect(result).toBe(true);
    const msgs = getMessages(channel.id);
    expect(msgs[0].readAt).toBeDefined();
  });

  it('returns false for unknown message ID', () => {
    expect(markAsRead('nonexistent')).toBe(false);
  });

  it('throws for empty message ID', () => {
    expect(() => markAsRead('')).toThrow('Message ID is required');
  });
});

// ---- getUnreadCount ----

describe('getUnreadCount()', () => {
  it('returns 0 for user with no channels', () => {
    expect(getUnreadCount('user-1')).toBe(0);
  });

  it('returns 0 for empty user ID', () => {
    expect(getUnreadCount('')).toBe(0);
  });

  it('counts unread messages for a user', () => {
    const channel = createChannel('Chat', ['user-1', 'user-2'], 'group');
    sendMessage(channel.id, 'Hello from user-1'); // sent by user-1 (first member)
    // user-2 has 1 unread message from user-1
    expect(getUnreadCount('user-2')).toBe(1);
  });

  it('does not count messages sent by the user', () => {
    const channel = createChannel('Chat', ['user-1', 'user-2'], 'group');
    sendMessage(channel.id, 'Hello'); // sent by user-1
    // user-1 sent this message, so should have 0 unread
    expect(getUnreadCount('user-1')).toBe(0);
  });

  it('decreases after marking as read', () => {
    const channel = createChannel('Chat', ['user-1', 'user-2'], 'group');
    const msg = sendMessage(channel.id, 'Hello');
    expect(getUnreadCount('user-2')).toBe(1);
    markAsRead(msg.id);
    expect(getUnreadCount('user-2')).toBe(0);
  });

  it('counts across multiple channels', () => {
    const c1 = createChannel('C1', ['user-1', 'user-2'], 'group');
    const c2 = createChannel('C2', ['user-1', 'user-2', 'user-3'], 'group');
    sendMessage(c1.id, 'Msg 1');
    sendMessage(c2.id, 'Msg 2');
    // user-2 is in both channels, has 2 unread
    expect(getUnreadCount('user-2')).toBe(2);
  });
});
