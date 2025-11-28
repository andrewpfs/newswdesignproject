import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { authFetch, isAuthenticated, isAdmin } from "../utils/auth";
import "../App.css";

const SKILLS = [
  "Communication",
  "Teamwork",
  "Organized",
  "Adaptability",
  "Driving",
  "English",
  "Spanish",
];

const URGENCY_LEVELS = ["low", "medium", "high", "critical"];

const EventForm = () => {
  const navigate = useNavigate();
  const [eventName, setEventName] = useState("");
  const [eventDescription, setEventDescription] = useState("");
  const [eventLocation, setEventLocation] = useState("");
  const [requiredSkills, setRequiredSkills] = useState([]);
  const [urgency, setUrgency] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [skillsOpen, setSkillsOpen] = useState(false);
  const [urgencyOpen, setUrgencyOpen] = useState(false);

  // Check authentication and admin role
  useEffect(() => {
    if (!isAuthenticated()) {
      navigate("/login");
    } else if (!isAdmin()) {
      navigate("/profile");
    }
  }, [navigate]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.dropdown')) {
        setSkillsOpen(false);
        setUrgencyOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const toggleSkill = (skill) => {
    setRequiredSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (requiredSkills.length === 0 || !urgency) {
      alert("Please select at least one skill and an urgency level.");
      return;
    }

    const data = {
      eventName,
      eventDescription,
      eventLocation,
      requiredSkills,
      urgency,
      eventDate,
      startTime,
      endTime,
    };

    try {
      const res = await authFetch("http://localhost:3001/api/events", {
        method: "POST",
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (res.ok && result.success) {
        alert(result.message || "Event created successfully!");
        // Clear form
        setEventName("");
        setEventDescription("");
        setEventLocation("");
        setRequiredSkills([]);
        setUrgency("");
        setEventDate("");
        setStartTime("");
        setEndTime("");
      } else {
        const errorMsg = result.errors 
          ? result.errors.join(", ") 
          : (result.error || "Failed to create event.");
        alert("Error: " + errorMsg);
      }
    } catch (err) {
      console.error(err);
      if (err.message === "Unauthorized") {
        navigate("/login");
      } else {
        alert("Server error. Please try again later.");
      }
    }
  };

  return (
    <div className="legacy-screen">
      <h1>Create Event</h1>
      <form onSubmit={handleSubmit}>
        <label htmlFor="eventName">Event Name</label>
        <input
          id="eventName"
          type="text"
          value={eventName}
          onChange={(e) => setEventName(e.target.value)}
          maxLength="100"
          required
        />

        <label htmlFor="eventDescription">Event Description</label>
        <textarea
          id="eventDescription"
          rows="4"
          value={eventDescription}
          onChange={(e) => setEventDescription(e.target.value)}
          required
        />

        <label htmlFor="eventLocation">Location</label>
        <textarea
          id="eventLocation"
          rows="2"
          value={eventLocation}
          onChange={(e) => setEventLocation(e.target.value)}
          autoComplete="off"
          required
        />

        <label>Required Skills</label>
        <div className="dropdown">
          <button
            type="button"
            className="dropbtn"
            onClick={() => setSkillsOpen((prev) => !prev)}
          >
            Select Skills ▼
          </button>
          <div className={`dropdown-content ${skillsOpen ? "show" : ""}`}>
            {SKILLS.map((skill) => (
              <label key={skill}>
                <input
                  type="checkbox"
                  value={skill}
                  checked={requiredSkills.includes(skill)}
                  onChange={() => toggleSkill(skill)}
                />{" "}
                {skill}
              </label>
            ))}
          </div>
        </div>

        <label>Urgency</label>
        <div className="dropdown">
          <button
            type="button"
            className="dropbtn"
            onClick={() => setUrgencyOpen((prev) => !prev)}
          >
            {urgency ? urgency : "Select Urgency ▼"}
          </button>
          <div className={`dropdown-content ${urgencyOpen ? "show" : ""}`}>
            {URGENCY_LEVELS.map((level) => (
              <a
                href="#"
                key={level}
                onClick={(e) => {
                  e.preventDefault();
                  setUrgency(level);
                  setUrgencyOpen(false);
                }}
              >
                {level.charAt(0).toUpperCase() + level.slice(1)}
              </a>
            ))}
          </div>
        </div>

        <label htmlFor="eventDate">Event Date</label>
        <input
          id="eventDate"
          type="date"
          value={eventDate}
          onChange={(e) => setEventDate(e.target.value)}
          required
        />

        <label htmlFor="startTime">Event Start Time</label>
        <input
          id="startTime"
          type="text"
          value={startTime}
          onChange={(e) => setStartTime(e.target.value)}
          placeholder="e.g., 09:00 or 14:30"
          required
        />

        <label htmlFor="endTime">Event End Time</label>
        <input
          id="endTime"
          type="text"
          value={endTime}
          onChange={(e) => setEndTime(e.target.value)}
          placeholder="e.g., 17:00 or 18:30"
          required
        />

        <button type="submit">Create Event</button>
      </form>
    </div>
  );
};

export default EventForm;

