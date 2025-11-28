import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { authFetch, isAuthenticated, getUserId } from "../utils/auth";
import "../App.css";

const Notifications = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // all, unread, read

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate("/login");
    } else {
      fetchNotifications();
    }
  }, [navigate]);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const userId = getUserId();
      if (!userId) {
        navigate("/login");
        return;
      }
      
      const response = await authFetch(
        `http://localhost:3001/api/notifications?userId=${userId}`
      );
      
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.data || []);
      } else if (response.status === 401 || response.status === 403) {
        navigate("/login");
      }
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
      if (error.message === "Unauthorized") {
        navigate("/login");
      }
    }
    setLoading(false);
  };

  const markAsRead = async (notificationId) => {
    try {
      const response = await authFetch(
        `http://localhost:3001/api/notifications/${notificationId}/read`,
        {
          method: "PUT",
        }
      );

      if (response.ok) {
        // Update local state
        setNotifications((prev) =>
          prev.map((notif) =>
            notif.id === notificationId ? { ...notif, read: true } : notif
          )
        );
        // Refresh to get latest count
        fetchNotifications();
      }
    } catch (error) {
      console.error("Failed to mark as read:", error);
      if (error.message === "Unauthorized") {
        navigate("/login");
      }
    }
  };

  const markAllAsRead = async () => {
    try {
      const unreadIds = notifications
        .filter((n) => !n.read)
        .map((n) => n.id);

      for (const id of unreadIds) {
        await markAsRead(id);
      }
    } catch (error) {
      console.error("Failed to mark all as read:", error);
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      const response = await authFetch(
        `http://localhost:3001/api/notifications/${notificationId}`,
        {
          method: "DELETE",
        }
      );

      if (response.ok) {
        setNotifications((prev) =>
          prev.filter((notif) => notif.id !== notificationId)
        );
      }
    } catch (error) {
      console.error("Failed to delete notification:", error);
      if (error.message === "Unauthorized") {
        navigate("/login");
      }
    }
  };

  const getFilteredNotifications = () => {
    switch (filter) {
      case "unread":
        return notifications.filter((n) => !n.read);
      case "read":
        return notifications.filter((n) => n.read);
      default:
        return notifications;
    }
  };

  const getNotificationIcon = (type) => {
    // Return empty or use text labels instead of emojis
    return "";
  };

  const filteredNotifications = getFilteredNotifications();
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="notifications-page">
      <div className="container-wide">
        <div className="notifications-header">
          <div>
            <h1>Notifications</h1>
            {unreadCount > 0 && (
              <span className="unread-badge">{unreadCount} unread</span>
            )}
          </div>
          <div>
            <button 
              className="mark-all-btn" 
              onClick={fetchNotifications}
              title="Refresh"
            >
              Refresh
            </button>
            {unreadCount > 0 && (
              <button className="mark-all-btn" onClick={markAllAsRead}>
                Mark All as Read
              </button>
            )}
          </div>
        </div>

        <div className="notifications-filters">
          <button
            className={`filter-btn ${filter === "all" ? "active" : ""}`}
            onClick={() => setFilter("all")}
          >
            All ({notifications.length})
          </button>
          <button
            className={`filter-btn ${filter === "unread" ? "active" : ""}`}
            onClick={() => setFilter("unread")}
          >
            Unread ({unreadCount})
          </button>
          <button
            className={`filter-btn ${filter === "read" ? "active" : ""}`}
            onClick={() => setFilter("read")}
          >
            Read ({notifications.length - unreadCount})
          </button>
        </div>

        {loading && <div className="loading">Loading notifications...</div>}

        {!loading && notifications.length === 0 && (
          <div className="empty-state">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="64"
              height="64"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
            </svg>
            <h3>No notifications yet</h3>
            <p>When you receive notifications, they'll appear here</p>
          </div>
        )}

        {!loading && filteredNotifications.length === 0 && notifications.length > 0 && (
          <div className="empty-state">
            <p>No {filter} notifications</p>
          </div>
        )}

        {!loading && filteredNotifications.length > 0 && (
          <div className="notifications-list">
            {filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`notification-card ${
                  !notification.read ? "unread" : ""
                }`}
              >
                <div className="notification-icon">
                  {getNotificationIcon(notification.type)}
                </div>
                <div className="notification-content">
                  <div className="notification-header">
                    <span className={`notification-type type-${notification.type}`}>
                      {notification.type}
                    </span>
                    <span className="notification-time">
                      {new Date(notification.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="notification-message">{notification.message}</p>
                  {notification.eventName && (
                    <p className="notification-event">
                      <strong>Event:</strong> {notification.eventName}
                    </p>
                  )}
                </div>
                <div className="notification-actions">
                  {!notification.read && (
                    <button
                      className="action-btn"
                      onClick={() => markAsRead(notification.id)}
                      title="Mark as read"
                    >
                      ✓
                    </button>
                  )}
                    <button
                      className="action-btn delete"
                      onClick={() => deleteNotification(notification.id)}
                      title="Delete"
                    >
                      Delete
                    </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;

