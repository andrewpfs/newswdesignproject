import { useState } from "react";
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
      const res = await fetch("http://localhost:3001/create-event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (res.ok) {
        alert(result.message || "Event created successfully!");
        setEventName("");
        setEventDescription("");
        setEventLocation("");
        setRequiredSkills([]);
        setUrgency("");
        setEventDate("");
        setStartTime("");
        setEndTime("");
      } else {
        alert("Error: " + (result.error || "Failed to create event."));
      }
    } catch (err) {
      console.error(err);
      alert("Server error. Please try again later.");
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
          type="time"
          value={startTime}
          onChange={(e) => setStartTime(e.target.value)}
          required
        />

        <label htmlFor="endTime">Event End Time</label>
        <input
          id="endTime"
          type="time"
          value={endTime}
          onChange={(e) => setEndTime(e.target.value)}
          required
        />

        <button type="submit">Create Event</button>
      </form>
    </div>
  );
};

export default EventForm;

