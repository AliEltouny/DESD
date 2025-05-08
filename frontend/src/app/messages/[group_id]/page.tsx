"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import { baseApi } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import { useUser } from "@/contexts/UserContext";

interface Message {
  id: number;
  sender: { id: number; username: string; full_name: string };
  content: string;
  created_at: string;
}

interface GroupInfo {
  id: number;
  name: string;
  members: { id: number; username: string; full_name: string }[];
}

const GroupMessagesPage = () => {
  const { group_id } = useParams();
  const { isAuthenticated } = useAuth();
  const { user } = useUser();
  const [messages, setMessages] = useState<Message[]>([]);
  const [groupInfo, setGroupInfo] = useState<GroupInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<
    "connecting" | "connected" | "disconnected"
  >("connecting");
  const socketRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const messageContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Improved debounced typing indicator to prevent excessive WebSocket messages
  const debouncedTypingRef = useRef<NodeJS.Timeout | null>(null);

  // Helper functions for UI elements
  function getInitials(name: string) {
    if (!name) return "?";
    const parts = name.trim().split(" ");
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  function timeAgo(dateString: string) {
    const now = new Date();
    const date = new Date(dateString);
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return date.toLocaleDateString();
  }

  // Fetch initial messages and group info
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [messagesRes, groupInfoRes] = await Promise.all([
          baseApi.get(`/api/messages/`, { params: { group: group_id } }),
          baseApi.get(`/api/message-groups/${group_id}/`),
        ]);
        setMessages(messagesRes.data);
        setGroupInfo(groupInfoRes.data);
      } catch (err: any) {
        setError("Failed to load chat data.");
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    };
    if (group_id) fetchData();
  }, [group_id]);

  // WebSocket connection with improved retry logic and connection status tracking
  useEffect(() => {
    if (!group_id || !user) return;

    let retryCount = 0;
    const maxRetries = 5;
    let ws: WebSocket | null = null;
    let reconnectTimer: NodeJS.Timeout | null = null;

    // Get token from different sources
    const getToken = (): string | null => {
      // Check in cookie
      const getCookie = (name: string): string | null => {
        if (typeof document === "undefined") return null;
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) {
          const tokenPart = parts.pop();
          return tokenPart ? tokenPart.split(";").shift() || null : null;
        }
        return null;
      };

      // Try multiple sources
      let token = getCookie("accessToken");

      // If still no token, try localStorage
      if (!token && typeof window !== "undefined") {
        token = localStorage.getItem("accessToken");
      }

      return token;
    };

    // Create connection function with better stability
    const createConnection = () => {
      // Clear any existing reconnect timer
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
        reconnectTimer = null;
      }

      if (retryCount >= maxRetries) {
        setError("Could not establish connection after multiple attempts.");
        setConnectionStatus("disconnected");
        return;
      }

      const token = getToken();

      if (!token) {
        console.error("No authentication token found for WebSocket connection");
        setError("Authentication error. Please log in again.");
        setConnectionStatus("disconnected");
        return;
      }

      setConnectionStatus("connecting");

      // Use secure WebSocket (wss) for production or ws for development
      const protocol = window.location.protocol === "https:" ? "wss" : "ws";
      const host =
        window.location.hostname === "localhost"
          ? "localhost:8000"
          : window.location.host;

      // Connect to correct WebSocket URL with token in query string
      const wsUrl = `${protocol}://${host}/ws/messages/${group_id}/?token=${token}`;

      console.log(
        `Connecting to WebSocket (attempt ${retryCount + 1}/${maxRetries + 1})...`
      );

      // Close any existing connection properly
      if (socketRef.current && socketRef.current.readyState !== WebSocket.CLOSED) {
        socketRef.current.close();
      }

      // Create WebSocket connection with error handling
      try {
        ws = new WebSocket(wsUrl);
        socketRef.current = ws;

        ws.onopen = () => {
          console.log("WebSocket connection established");
          setError(null);
          setConnectionStatus("connected");
          retryCount = 0; // Reset retry count on successful connection
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);

            // Handle different message types
            if (data.type === "typing") {
              setIsTyping(data.user_id !== user?.id && data.typing);
            } else if (data.content) {
              // Regular message
              setMessages((prev) => [...prev, data]);
              setIsTyping(false);
            }
          } catch (err) {
            console.error("Error parsing WebSocket message:", err);
          }
        };

        ws.onerror = (event) => {
          console.error("WebSocket error:", event);
        };

        ws.onclose = (event) => {
          console.log(`WebSocket closed with code ${event.code}`);
          setConnectionStatus("disconnected");

          // Don't retry for normal closure
          if (event.code === 1000) return;

          // Retry with exponential backoff
          const retryDelay = Math.min(1000 * 2 ** retryCount, 10000);
          retryCount++;

          if (retryCount <= maxRetries) {
            console.log(`Retrying connection in ${retryDelay}ms...`);
            reconnectTimer = setTimeout(createConnection, retryDelay);
          } else {
            setError("Connection lost. Please refresh the page to reconnect.");
          }
        };
      } catch (error) {
        console.error("Error creating WebSocket connection:", error);
        setConnectionStatus("disconnected");

        // Try to reconnect
        const retryDelay = Math.min(1000 * 2 ** retryCount, 10000);
        retryCount++;

        if (retryCount <= maxRetries) {
          reconnectTimer = setTimeout(createConnection, retryDelay);
        } else {
          setError("Failed to connect. Please refresh the page to try again.");
        }
      }
    };

    // Start the connection
    createConnection();

    // Clean up function with better handling
    return () => {
      console.log("Cleaning up WebSocket connection");
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
      }
      if (socketRef.current) {
        // Use proper close code for intentional closure
        socketRef.current.close(1000, "Component unmounting");
        socketRef.current = null;
      }
    };
  }, [group_id, user]);

  // Improved typing indicator with debouncing to prevent WebSocket spam
  const handleTyping = useCallback(() => {
    if (
      !socketRef.current ||
      socketRef.current.readyState !== WebSocket.OPEN ||
      !user
    )
      return;

    // Cancel any existing timeout
    if (debouncedTypingRef.current) {
      clearTimeout(debouncedTypingRef.current);
    }

    // Debounce the typing indicator
    debouncedTypingRef.current = setTimeout(() => {
      // Double-check connection is still active
      if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
        // Send typing indicator
        try {
          socketRef.current.send(
            JSON.stringify({
              type: "typing",
              typing: true,
              group_id: group_id,
            })
          );

          // Set timeout to stop typing indicator
          if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
          }

          typingTimeoutRef.current = setTimeout(() => {
            if (
              socketRef.current &&
              socketRef.current.readyState === WebSocket.OPEN
            ) {
              socketRef.current.send(
                JSON.stringify({
                  type: "typing",
                  typing: false,
                  group_id: group_id,
                })
              );
            }
          }, 3000);
        } catch (error) {
          console.error("Error sending typing indicator:", error);
        }
      }
    }, 300); // Debounce typing events by 300ms
  }, [group_id, user]);

  // Scroll to latest message with improved handling
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Auto-focus input on mount
  useEffect(() => {
    if (!loading && inputRef.current) {
      inputRef.current.focus();
    }
  }, [loading]);

  // Improved send function with better error handling and proper message structure
  const handleSend = useCallback(
    (e?: React.FormEvent) => {
      if (e) e.preventDefault();

      // Don't attempt to send if input is empty or connection is not ready
      if (
        !input.trim() ||
        !socketRef.current ||
        socketRef.current.readyState !== WebSocket.OPEN
      ) {
        return;
      }

      // Set sending state to provide user feedback
      setSending(true);

      try {
        // Create message with explicit content field
        const msg = {
          content: input.trim(), // Ensure content is properly set and trimmed
          group_id: group_id,
        };

        console.log("Sending message:", JSON.stringify(msg));
        
        // Send the message through WebSocket
        socketRef.current.send(JSON.stringify(msg));

        // Clear input after successful send
        setInput("");

        // Clear typing indicator
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);

          // Send typing stopped notification
          if (
            socketRef.current &&
            socketRef.current.readyState === WebSocket.OPEN
          ) {
            socketRef.current.send(
              JSON.stringify({
                type: "typing",
                typing: false,
                group_id: group_id,
              })
            );
          }
        }
      } catch (error) {
        console.error("Error sending message:", error);
        setError("Failed to send message. Please try again.");
      } finally {
        // Always reset sending state
        setSending(false);

        // Focus back on input
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }
    },
    [input, group_id]
  );

  // Keyboard event handler for Enter key and other shortcuts
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      // Send message on Enter (without shift)
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault(); // Prevent default to avoid form submission/newline
        handleSend();
      }
    },
    [handleSend]
  );

  // Optimized and safer input change handler
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setInput(e.target.value);
      // Only trigger typing indicator if there's actually text
      if (e.target.value.trim()) {
        handleTyping();
      }
    },
    [handleTyping]
  );

  // Group messages by date (unchanged)
  const groupedMessages = messages.reduce(
    (groups: Record<string, Message[]>, message) => {
      const date = new Date(message.created_at).toLocaleDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(message);
      return groups;
    },
    {}
  );

  // Function to get the display name for a chat header
  const getGroupDisplayName = () => {
    // If it has a name, use it
    if (groupInfo?.name) return groupInfo.name;
    
    // For direct messages, show the other person's name (receiver)
    if (groupInfo?.members && groupInfo.members.length > 0 && user) {
      // Filter out the current user to find the other person
      const otherMembers = groupInfo.members.filter(member => 
        member.username !== "rayen" && 
        member.username !== user.username &&
        member.id !== user.id
      );
      
      // If we found other members, show their name
      if (otherMembers.length > 0) {
        return otherMembers[0].full_name || otherMembers[0].username;
      }
    }
    
    // Fallback: show "Chat"
    return "Chat";
  };

  // Get initials for the chat avatar
  const getChatAvatarInitials = () => {
    const displayName = getGroupDisplayName();
    return getInitials(displayName);
  };

  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col bg-gray-50">
      {/* Connection status indicator */}
      {connectionStatus !== "connected" && (
        <div
          className={`px-4 py-1.5 text-sm text-center font-medium ${
            connectionStatus === "connecting"
              ? "bg-yellow-50 text-yellow-700 border-b border-yellow-200"
              : "bg-red-50 text-red-700 border-b border-red-200"
          }`}
        >
          {connectionStatus === "connecting"
            ? "Connecting to chat..."
            : "Disconnected. Messages won't send until reconnected."}
        </div>
      )}

      {/* Chat header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 shadow-sm flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg">
            {getChatAvatarInitials()}
          </div>
          <div>
            <h1 className="font-semibold text-lg text-gray-900">
              {getGroupDisplayName()}
            </h1>
            <p className="text-xs text-gray-500">
              {groupInfo?.members?.length
                ? `${groupInfo.members.length} members`
                : "Loading members..."}
            </p>
          </div>
        </div>
        <button className="rounded-full p-2 hover:bg-gray-100 transition-colors">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-5 h-5 text-gray-600"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5z"
            />
          </svg>
        </button>
      </header>

      {/* Chat messages */}
      <div
        ref={messageContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-6"
      >
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="flex flex-col items-center space-y-2">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="text-gray-500">Loading messages...</p>
            </div>
          </div>
        ) : error ? (
          <div className="bg-red-50 p-4 rounded-lg border border-red-200 text-red-600 text-center">
            <p>{error}</p>
            <button className="mt-2 text-blue-600 hover:underline text-sm font-medium">
              Try Again
            </button>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-8 h-8 text-gray-400"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <p className="font-medium mb-1">No messages yet</p>
            <p className="text-sm text-center max-w-xs">
              Be the first to start the conversation! Send a message to get
              started.
            </p>
          </div>
        ) : (
          <>
            {Object.entries(groupedMessages).map(([date, dateMessages]) => (
              <div key={date} className="space-y-4">
                <div className="flex items-center">
                  <div className="flex-1 border-t border-gray-200"></div>
                  <span className="px-3 text-xs text-gray-500 bg-gray-50">
                    {date}
                  </span>
                  <div className="flex-1 border-t border-gray-200"></div>
                </div>

                {dateMessages.map((msg, index) => {
                  const isMe = user && msg.sender?.id === user.id;
                  const showAvatar =
                    index === 0 ||
                    dateMessages[index - 1]?.sender?.id !== msg.sender?.id;

                  return (
                    <div
                      key={msg.id || msg.created_at}
                      className={`flex ${
                        isMe ? "justify-end" : "justify-start"
                      } ${showAvatar ? "mt-3" : "mt-1"}`}
                    >
                      {!isMe && (
                        <div
                          className={`flex-shrink-0 mr-2 ${
                            !showAvatar && "invisible"
                          }`}
                        >
                          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white font-medium text-sm">
                            {getInitials(
                              msg.sender?.full_name ||
                                msg.sender?.username ||
                                ""
                            )}
                          </div>
                        </div>
                      )}
                      <div className={`max-w-[70%] group`}>
                        {showAvatar && !isMe && (
                          <div className="text-xs text-gray-500 ml-1 mb-1">
                            {msg.sender?.full_name || msg.sender?.username || ""}
                          </div>
                        )}
                        <div
                          className={`px-4 py-2 rounded-2xl shadow-sm text-sm ${
                            isMe
                              ? "bg-blue-600 text-white"
                              : "bg-green-500 text-white"
                          }`}
                        >
                          <div>{msg.content}</div>
                        </div>
                        <div
                          className={`text-xs mt-1 opacity-0 group-hover:opacity-100 transition-opacity ${
                            isMe ? "text-right mr-1" : "ml-1"
                          } text-gray-400`}
                        >
                          {msg.created_at ? timeAgo(msg.created_at) : ""}
                        </div>
                      </div>
                      {isMe && (
                        <div
                          className={`flex-shrink-0 ml-2 ${
                            !showAvatar && "invisible"
                          }`}
                        >
                          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center text-white font-medium text-sm">
                            {getInitials(
                              user.full_name || user.username || ""
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
            <div ref={messagesEndRef} />

            {/* Typing indicator */}
            {isTyping && (
              <div className="flex items-center mt-2 ml-10">
                <div className="flex space-x-1">
                  <div
                    className="w-2 h-2 rounded-full bg-gray-400 animate-pulse"
                    style={{ animationDelay: "0ms" }}
                  ></div>
                  <div
                    className="w-2 h-2 rounded-full bg-gray-400 animate-pulse"
                    style={{ animationDelay: "300ms" }}
                  ></div>
                  <div
                    className="w-2 h-2 rounded-full bg-gray-400 animate-pulse"
                    style={{ animationDelay: "600ms" }}
                  ></div>
                </div>
                <span className="ml-2 text-xs text-gray-500">
                  Someone is typing...
                </span>
              </div>
            )}
          </>
        )}
      </div>

      {/* Message input with improved handling */}
      <div className="bg-white border-t border-gray-200 p-4">
        <form onSubmit={handleSend} className="flex items-center gap-2">
          <button
            type="button"
            className="p-2 rounded-full text-gray-500 hover:bg-gray-100 transition-colors"
            title="Attach files"
            disabled={connectionStatus !== "connected"}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-5 h-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13"
              />
            </svg>
          </button>
          <div className="relative flex-1">
            <input
              ref={inputRef}
              type="text"
              className="w-full border rounded-full px-4 py-2.5 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-transparent bg-gray-50"
              placeholder={
                connectionStatus === "connected"
                  ? "Type a message..."
                  : "Reconnecting..."
              }
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              disabled={connectionStatus !== "connected" || sending}
              autoComplete="off" // Prevent browser autocomplete from interfering
              spellCheck="true"
              aria-label="Message input"
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 rounded-full text-gray-400 hover:text-gray-600"
              title="Emoji"
              disabled={connectionStatus !== "connected"}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-5 h-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.182 15.182a4.5 4.5 0 01-6.364 0M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75zm-.375 0h.008v.015h-.008V9.75zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75zm-.375 0h.008v.015h-.008V9.75z"
                />
              </svg>
            </button>
          </div>
          <button
            type="submit"
            className={`p-2.5 rounded-full ${
              !input.trim() || sending || connectionStatus !== "connected"
                ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                : "bg-blue-600 text-white hover:bg-blue-700"
            } transition-colors flex items-center justify-center`}
            disabled={
              !input.trim() || sending || connectionStatus !== "connected"
            }
            title="Send message"
          >
            {sending ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="w-5 h-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"
                />
              </svg>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default GroupMessagesPage;
