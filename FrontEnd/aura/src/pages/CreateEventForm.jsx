"use client";

import { useState } from "react";
import { Calendar, Clock } from "lucide-react";
import axios from "axios";

export function CreateEventForm({ onEventCreated }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventTime, setEventTime] = useState("");
  const [image, setImage] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Create FormData object to send the image and event details
    const formData = new FormData();
    formData.append("title", title);
    formData.append("description", description);
    formData.append("eventDate", eventDate);
    formData.append("eventTime", eventTime);
    if (image) {
      formData.append("image", image);
    }

    try {
      const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/createEvent`, formData, {
        headers: { "Content-Type": "multipart/form-data" }, // Important for file uploads
        withCredentials: true,
      });

      if (response.status === 200) {
        alert("Event created successfully!");

        // Reset form fields
        setTitle("");
        setDescription("");
        setEventDate("");
        setEventTime("");
        setImage(null);

        // Call the callback if provided
        if (onEventCreated) onEventCreated(response.data);
      } else {
        alert("Failed to create event. Unexpected response status.");
      }
    } catch (error) {
      console.error("Failed to create event:", error.response.data || error.message);
      alert("Failed to create event. Please try again.");
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
      <h3 className="text-4xl font-bold mb-6 bg-gradient-to-r from-[#e2a1a2] to-[#A01959] bg-clip-text text-transparent">Create an Event</h3>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Event Title"
          className="w-full p-2 mb-4 border rounded dark:bg-gray-700 dark:text-white dark:border-gray-600"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          aria-label="Event Title"
          required
        />
        <textarea
          placeholder="Event Description"
          className="w-full p-2 mb-4 border rounded dark:bg-gray-700 dark:text-white dark:border-gray-600"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          aria-label="Event Description"
          required
        />
        <div className="flex mb-4">
          <div className="flex items-center mr-4">
            <Calendar className="mr-2 h-5 w-5 text-gray-500 dark:text-gray-400" />
            <input
              type="date"
              className="p-2 border rounded dark:bg-gray-700 dark:text-white dark:border-gray-600"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              aria-label="Event Date"
              required
            />
          </div>
          <div className="flex items-center">
            <Clock className="mr-2 h-5 w-5 text-gray-500 dark:text-gray-400" />
            <input
              type="time"
              className="p-2 border rounded dark:bg-gray-700 dark:text-white dark:border-gray-600"
              value={eventTime}
              onChange={(e) => setEventTime(e.target.value)}
              aria-label="Event Time"
              required
            />
          </div>
        </div>

        {/* Image Upload Field */}
        <div className="mb-4">
          <label className="block mb-2 text-gray-700 dark:text-gray-300">Upload Event Image</label>
          <input
            type="file"
            name="image"
            accept="image/*"
            onChange={(e) => setImage(e.target.files[0] || null)}
            className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white dark:border-gray-600"
            aria-label="Event Image"
          />
        </div>

        <button
          type="submit"
          className="w-full bg-gradient-to-r from-[#A04142] to-[#A01959] text-white py-3 rounded-lg hover:scale-105 transition-all duration-300 font-medium shadow-md hover:shadow-xl dark:from-[#151E3E] dark:to-[#1E2B4A] dark:hover:from-[#A04142] dark:hover:to-[#A01959]"
        >
          Create Event
        </button>
      </form>
    </div>
  );
}
