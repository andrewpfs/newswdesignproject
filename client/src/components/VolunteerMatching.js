import { useState, useEffect } from "react";
import "../App.css";

const VolunteerMatching = () => {
  const [events, setEvents] = useState([]);
  const [volunteers, setVolunteers] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [matchedVolunteers, setMatchedVolunteers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // Fetch events on load
  useEffect(() => {
    fetchEvents();
    fetchVolunteers();
  }, []);

  const fetchEvents = async () => {
    try {
      const response = await fetch("http://localhost:3001/api/events");
      if (response.ok) {
        const data = await response.json();
        setEvents(data.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch events:", error);
    }
  };

  const fetchVolunteers = async () => {
    try {
      const response = await fetch("http://localhost:3001/api/matching/volunteers");
      if (response.ok) {
        const data = await response.json();
        setVolunteers(data.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch volunteers:", error);
    }
  };

  const handleEventSelect = async (eventId) => {
    const event = events.find((e) => e.id === parseInt(eventId));
    setSelectedEvent(event);
    setMessage("");

    if (!event) {
      setMatchedVolunteers([]);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `http://localhost:3001/api/matching/suggestions/${eventId}`
      );
      if (response.ok) {
        const data = await response.json();
        setMatchedVolunteers(data.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch matched volunteers:", error);
    }
    setLoading(false);
  };

  const handleAssignVolunteer = async (volunteerId) => {
    if (!selectedEvent) return;

    try {
      const response = await fetch("http://localhost:3001/api/matching/assign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          volunteerId,
          eventId: selectedEvent.id,
        }),
      });

      if (response.ok) {
        setMessage("Volunteer assigned successfully!");
        // Refresh the matched volunteers list
        handleEventSelect(selectedEvent.id);
      } else {
        const result = await response.json();
        setMessage(result.error || "Failed to assign volunteer");
      }
    } catch (error) {
      setMessage("Server error. Please try again.");
    }
  };

  const calculateMatchScore = (volunteer) => {
    if (!selectedEvent || !volunteer.skills) return 0;

    const eventSkills = selectedEvent.requiredSkills || [];
    const volSkills = volunteer.skills || [];

    const matchedSkills = volSkills.filter((skill) =>
      eventSkills.includes(skill)
    );

    return eventSkills.length > 0
      ? Math.round((matchedSkills.length / eventSkills.length) * 100)
      : 0;
  };

  return (
    <div className="matching-page">
      <div className="container-wide">
        <h1>Volunteer Matching</h1>
        <p className="subtitle">
          Match volunteers to events based on their skills and availability
        </p>

        <div className="matching-grid">
          {/* Event Selection */}
          <div className="matching-section">
            <h2>Select Event</h2>
            <select
              onChange={(e) => handleEventSelect(e.target.value)}
              value={selectedEvent?.id || ""}
              className="event-select"
            >
              <option value="">-- Choose an event --</option>
              {events.map((event) => (
                <option key={event.id} value={event.id}>
                  {event.eventName} ({new Date(event.eventDate).toLocaleDateString()})
                </option>
              ))}
            </select>

            {selectedEvent && (
              <div className="event-details">
                <h3>{selectedEvent.eventName}</h3>
                <p><strong>Date:</strong> {new Date(selectedEvent.eventDate).toLocaleDateString()}</p>
                <p><strong>Location:</strong> {selectedEvent.eventLocation}</p>
                <p><strong>Description:</strong> {selectedEvent.eventDescription}</p>
                <p>
                  <strong>Required Skills:</strong>{" "}
                  {selectedEvent.requiredSkills?.join(", ") || "None"}
                </p>
                <p>
                  <strong>Urgency:</strong>{" "}
                  <span className={`urgency-badge urgency-${selectedEvent.urgency}`}>
                    {selectedEvent.urgency}
                  </span>
                </p>
              </div>
            )}
          </div>

          {/* Matched Volunteers */}
          <div className="matching-section">
            <h2>Matching Volunteers</h2>

            {!selectedEvent && (
              <p className="help-text">Select an event to see matched volunteers</p>
            )}

            {selectedEvent && loading && <p>Loading volunteers...</p>}

            {selectedEvent && !loading && matchedVolunteers.length === 0 && (
              <p className="help-text">No volunteers match this event's requirements</p>
            )}

            {selectedEvent && !loading && matchedVolunteers.length > 0 && (
              <div className="volunteer-list">
                {matchedVolunteers.map((volunteer) => {
                  const matchScore = calculateMatchScore(volunteer);
                  return (
                    <div key={volunteer.id} className="volunteer-card">
                      <div className="volunteer-header">
                        <h4>{volunteer.fullName}</h4>
                        <span className={`match-score score-${Math.floor(matchScore / 25)}`}>
                          {matchScore}% Match
                        </span>
                      </div>
                      <p><strong>Skills:</strong> {volunteer.skills?.join(", ") || "None"}</p>
                      <p><strong>Location:</strong> {volunteer.city}, {volunteer.state}</p>
                      <p>
                        <strong>Availability:</strong>{" "}
                        {volunteer.availability?.map(d => new Date(d).toLocaleDateString()).join(", ") || "Not specified"}
                      </p>
                      {volunteer.preferences && (
                        <p className="preferences"><strong>Preferences:</strong> {volunteer.preferences}</p>
                      )}
                      <button
                        className="assign-btn"
                        onClick={() => handleAssignVolunteer(volunteer.userId)}
                        disabled={volunteer.assigned}
                      >
                        {volunteer.assigned ? "Already Assigned" : "Assign to Event"}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {message && (
          <div className={`notice ${message.includes("success") ? "success" : "error"}`}>
            {message}
          </div>
        )}
      </div>
    </div>
  );
};

export default VolunteerMatching;

