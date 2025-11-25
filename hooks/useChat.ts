import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';
import { ChatMessage } from '@/components/chat/ChatBubble';

export interface Conversation {
  id: string;
  user1_id: string;
  user2_id: string;
  last_message?: string;
  last_message_at?: string;
  unread_count: number;
  created_at: string;
}

export function useChat(conversationId?: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [typing, setTyping] = useState(false);
  const channelRef = useRef<RealtimeChannel | null>(null);

  // Load conversations list
  const loadConversations = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('conversations')
        .select(`
          *,
          user1:profiles!conversations_user1_id_fkey(id, username, avatar_url),
          user2:profiles!conversations_user2_id_fkey(id, username, avatar_url)
        `)
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
        .order('last_message_at', { ascending: false });

      if (error) throw error;
      setConversations(data || []);
    } catch (error) {
      console.error('Error loading conversations:', error);
    }
  }, []);

  // Load messages for a conversation
  const loadMessages = useCallback(async (convId: string) => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', convId)
        .order('created_at', { ascending: true })
        .limit(100);

      if (error) throw error;
      setMessages(data || []);

      // Mark messages as read
      await markMessagesAsRead(convId);
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Send a message
  const sendMessage = useCallback(async (
    receiverId: string,
    text: string,
    imageUrl?: string,
    productId?: string
  ) => {
    try {
      setSending(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Get or create conversation
      let convId = conversationId;

      if (!convId) {
        const { data: existingConv } = await supabase
          .from('conversations')
          .select('id')
          .or(
            `and(user1_id.eq.${user.id},user2_id.eq.${receiverId}),` +
            `and(user1_id.eq.${receiverId},user2_id.eq.${user.id})`
          )
          .single();

        if (existingConv) {
          convId = existingConv.id;
        } else {
          const { data: newConv, error: convError } = await supabase
            .from('conversations')
            .insert({
              user1_id: user.id,
              user2_id: receiverId,
            })
            .select()
            .single();

          if (convError) throw convError;
          convId = newConv.id;
        }
      }

      // Send message
      const { error } = await supabase
        .from('messages')
        .insert({
          conversation_id: convId,
          sender_id: user.id,
          text,
          image_url: imageUrl,
          product_id: productId,
          delivered: true,
          read: false,
        });

      if (error) throw error;

      // Update conversation last message
      await supabase
        .from('conversations')
        .update({
          last_message: text,
          last_message_at: new Date().toISOString(),
        })
        .eq('id', convId);

      return true;
    } catch (error) {
      console.error('Error sending message:', error);
      return false;
    } finally {
      setSending(false);
    }
  }, [conversationId]);

  // Mark messages as read
  const markMessagesAsRead = useCallback(async (convId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from('messages')
        .update({ read: true })
        .eq('conversation_id', convId)
        .neq('sender_id', user.id)
        .eq('read', false);

      // Reset unread count
      await supabase
        .from('conversations')
        .update({ unread_count: 0 })
        .eq('id', convId);
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  }, []);

  // Send typing indicator
  const sendTyping = useCallback(async (isTyping: boolean) => {
    if (!conversationId) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Broadcast typing status via realtime
      const channel = supabase.channel(`conversation:${conversationId}`);
      channel.send({
        type: 'broadcast',
        event: 'typing',
        payload: {
          user_id: user.id,
          is_typing: isTyping,
        },
      });
    } catch (error) {
      console.error('Error sending typing indicator:', error);
    }
  }, [conversationId]);

  // Subscribe to realtime updates
  useEffect(() => {
    if (!conversationId) return;

    const channel = supabase
      .channel(`conversation:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          setMessages(current => [...current, payload.new as ChatMessage]);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          setMessages(current =>
            current.map(msg =>
              msg.id === payload.new.id ? (payload.new as ChatMessage) : msg
            )
          );
        }
      )
      .on('broadcast', { event: 'typing' }, (payload: any) => {
        setTyping(payload.payload.is_typing);
      })
      .subscribe();

    channelRef.current = channel;

    // Load messages
    loadMessages(conversationId);

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, loadMessages]);

  // Load conversations on mount
  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // Delete a message
  const deleteMessage = useCallback(async (messageId: string) => {
    try {
      const { error } = await supabase
        .from('messages')
        .delete()
        .eq('id', messageId);

      if (error) throw error;

      setMessages(current => current.filter(msg => msg.id !== messageId));
      return true;
    } catch (error) {
      console.error('Error deleting message:', error);
      return false;
    }
  }, []);

  // Get unread count
  const getUnreadCount = useCallback(() => {
    return conversations.reduce((sum, conv) => sum + (conv.unread_count || 0), 0);
  }, [conversations]);

  return {
    messages,
    conversations,
    loading,
    sending,
    typing,
    sendMessage,
    deleteMessage,
    markMessagesAsRead,
    sendTyping,
    loadConversations,
    getUnreadCount,
  };
}

export default useChat;
