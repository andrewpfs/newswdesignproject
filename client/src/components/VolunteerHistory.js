import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { authFetch, isAuthenticated, getUserId } from "../utils/auth";
import "../App.css";

const VolunteerHistory = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // all, completed, upcoming, cancelled
  const [searchTerm, setSearchTerm] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate("/login");
    } else {
      fetchHistory();
    }
  }, [navigate]);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const userId = getUserId();
      if (!userId) {
        navigate("/login");
        return;
      }
      
      const response = await authFetch(
        `http://localhost:3001/api/history?userId=${userId}`
      );
      
      if (response.ok) {
        const data = await response.json();
        setHistory(data.data || []);
      } else if (response.status === 401 || response.status === 403) {
        navigate("/login");
      }
    } catch (error) {
      console.error("Failed to fetch history:", error);
      if (error.message === "Unauthorized") {
        navigate("/login");
      }
    }
    setLoading(false);
  };

  const getFilteredHistory = () => {
    let filtered = history;

    // Apply status filter
    if (filter !== "all") {
      filtered = filtered.filter((item) => item.status === filter);
    }

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (item) =>
          item.eventName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.eventLocation.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered;
  };

  const getStatusBadge = (status) => {
    const badges = {
      completed: { label: "Completed", class: "status-completed" },
      upcoming: { label: "Upcoming", class: "status-upcoming" },
      cancelled: { label: "Cancelled", class: "status-cancelled" },
      "in-progress": { label: "In Progress", class: "status-progress" },
    };
    return badges[status] || { label: status, class: "" };
  };

  const getStatusCounts = () => {
    return {
      all: history.length,
      completed: history.filter((h) => h.status === "completed").length,
      upcoming: history.filter((h) => h.status === "upcoming").length,
      cancelled: history.filter((h) => h.status === "cancelled").length,
    };
  };

  const filteredHistory = getFilteredHistory();
  const statusCounts = getStatusCounts();

  return (
    <div className="history-page">
      <div className="container-wide">
        <div className="history-header">
          <div>
            <h1>Volunteer History</h1>
            <p className="subtitle">
              Track all your volunteer participation and event history
            </p>
          </div>
          <button 
            className="mark-all-btn" 
            onClick={fetchHistory}
            title="Refresh"
          >
            Refresh
          </button>
        </div>

        <div className="history-controls">
          <div className="search-box">
            <input
              type="text"
              placeholder="Search events..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>

          <div className="history-filters">
            <button
              className={`filter-btn ${filter === "all" ? "active" : ""}`}
              onClick={() => setFilter("all")}
            >
              All ({statusCounts.all})
            </button>
            <button
              className={`filter-btn ${filter === "upcoming" ? "active" : ""}`}
              onClick={() => setFilter("upcoming")}
            >
              Upcoming ({statusCounts.upcoming})
            </button>
            <button
              className={`filter-btn ${filter === "completed" ? "active" : ""}`}
              onClick={() => setFilter("completed")}
            >
              Completed ({statusCounts.completed})
            </button>
            <button
              className={`filter-btn ${filter === "cancelled" ? "active" : ""}`}
              onClick={() => setFilter("cancelled")}
            >
              Cancelled ({statusCounts.cancelled})
            </button>
          </div>
        </div>

        {loading && <div className="loading">Loading history...</div>}

        {!loading && history.length === 0 && (
          <div className="empty-state">
            <h3>No volunteer history yet</h3>
            <p>When you participate in events, they'll appear here</p>
          </div>
        )}

        {!loading && filteredHistory.length === 0 && history.length > 0 && (
          <div className="empty-state">
            <p>No events found matching your criteria</p>
          </div>
        )}

        {!loading && filteredHistory.length > 0 && (
          <div className="history-table-container">
            <table className="history-table">
              <thead>
                <tr>
                  <th>Event Name</th>
                  <th>Date</th>
                  <th>Location</th>
                  <th>Skills Required</th>
                  <th>Urgency</th>
                  <th>Duration</th>
                  <th>Status</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                {filteredHistory.map((item) => {
                  const statusInfo = getStatusBadge(item.status);
                  return (
                    <tr key={item.id} className={`row-${item.status}`}>
                      <td className="event-name">{item.eventName}</td>
                      <td>{(() => {
                        // Format date without timezone conversion
                        if (!item.eventDate) return 'N/A';
                        const dateStr = item.eventDate.toString();
                        // Parse YYYY-MM-DD format directly to avoid timezone issues
                        if (dateStr.includes('-')) {
                          const datePart = dateStr.split('T')[0];
                          const [year, month, day] = datePart.split('-');
                          // Create date in local timezone (not UTC)
                          const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
                          return date.toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' });
                        }
                        // Fallback for other formats
                        const date = new Date(item.eventDate);
                        return date.toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' });
                      })()}</td>
                      <td>{item.eventLocation}</td>
                      <td>
                        <div className="skills-pills">
                          {(() => {
                            const skills = Array.isArray(item.requiredSkills) 
                              ? item.requiredSkills 
                              : (typeof item.requiredSkills === 'string' 
                                  ? (() => {
                                      try {
                                        return JSON.parse(item.requiredSkills);
                                      } catch {
                                        return [];
                                      }
                                    })()
                                  : []);
                            return skills.length > 0 ? skills.map((skill, idx) => (
                              <span key={idx} className="skill-pill">
                                {skill}
                              </span>
                            )) : <span>None</span>;
                          })()}
                        </div>
                      </td>
                      <td>
                        <span className={`urgency-badge urgency-${item.urgency}`}>
                          {item.urgency}
                        </span>
                      </td>
                      <td>
                        {item.startTime && item.endTime ? (
                          <>
                            {(() => {
                              // Format time - handle both string and Date formats
                              const formatTime = (time) => {
                                if (!time) return '';
                                
                                let timeStr = '';
                                
                                // If it's a string (HH:MM:SS or HH:MM format from database)
                                if (typeof time === 'string') {
                                  timeStr = time;
                                }
                                // If it's a Date object (Sequelize might convert TIME to Date)
                                else if (time instanceof Date) {
                                  // Extract just the time portion
                                  const hours = time.getHours().toString().padStart(2, '0');
                                  const minutes = time.getMinutes().toString().padStart(2, '0');
                                  const seconds = time.getSeconds().toString().padStart(2, '0');
                                  timeStr = `${hours}:${minutes}:${seconds}`;
                                }
                                // If it's an object with time properties
                                else if (time && typeof time === 'object') {
                                  // Handle Sequelize TIME type which might be an object
                                  timeStr = time.toString();
                                }
                                else {
                                  timeStr = time.toString();
                                }
                                
                                // Parse the time string and convert to 12-hour format
                                const parts = timeStr.split(':');
                                if (parts.length >= 2) {
                                  const hours = parseInt(parts[0]) || 0;
                                  const minutes = (parts[1] || '00').padStart(2, '0');
                                  const hour12 = hours === 0 ? 12 : (hours > 12 ? hours - 12 : hours);
                                  const ampm = hours >= 12 ? 'PM' : 'AM';
                                  return `${hour12}:${minutes} ${ampm}`;
                                }
                                
                                return timeStr;
                              };
                              return `${formatTime(item.startTime)} - ${formatTime(item.endTime)}`;
                            })()}
                          </>
                        ) : (
                          "N/A"
                        )}
                      </td>
                      <td>
                        <span className={`status-badge ${statusInfo.class}`}>
                          {statusInfo.label}
                        </span>
                      </td>
                      <td className="description-cell">
                        {item.eventDescription}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {!loading && filteredHistory.length > 0 && (
          <div className="history-summary">
            <p>
              Showing {filteredHistory.length} of {history.length} events
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default VolunteerHistory;

