import { useState, useEffect } from "react";
import "../App.css";

const VolunteerHistory = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // all, completed, upcoming, cancelled
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      // Get user ID from localStorage (mock auth)
      const userId = localStorage.getItem("userId") || "1";
      
      const response = await fetch(
        `http://localhost:3001/api/history?userId=${userId}`
      );
      
      if (response.ok) {
        const data = await response.json();
        setHistory(data.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch history:", error);
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
        <h1>Volunteer History</h1>
        <p className="subtitle">
          Track all your volunteer participation and event history
        </p>

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
                      <td>{new Date(item.eventDate).toLocaleDateString()}</td>
                      <td>{item.eventLocation}</td>
                      <td>
                        <div className="skills-pills">
                          {item.requiredSkills?.map((skill, idx) => (
                            <span key={idx} className="skill-pill">
                              {skill}
                            </span>
                          ))}
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
                            {item.startTime} - {item.endTime}
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

