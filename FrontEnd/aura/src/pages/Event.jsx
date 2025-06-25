"use client"

import { useState, useEffect } from "react"
import { Calendar, Clock, CheckCircle, LogOut, ChevronDown } from "lucide-react"
import axios from "axios"
import { useNavigate } from "react-router-dom"
import { CreateEventForm } from "./CreateEventForm"
// import {MediaRoom} from "./MediaRoom";

const EventLandingPage = () => {
  const [showCalendar, setShowCalendar] = useState(false)
  const [eventCode, setEventCode] = useState("")
  const [selectedDate, setSelectedDate] = useState("")
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const navigate = useNavigate()
  const [myEvents, setMyEvents] = useState("")
  const [pastEvents, setPastEvents] = useState("")
  const [upcomingEvents, setUpcomingEvents] = useState("")

  useEffect(() => {
    axios
      .get(`${import.meta.env.VITE_BACKEND_URL}/getEvents`, { withCredentials: true })
      .then((response) => {
        console.log("Fetched Events:", response.data)
        setMyEvents(response.data.myEvents)
        setPastEvents(response.data.pastEvents)
        setUpcomingEvents(response.data.upcomingEvents)
        setIsAuthenticated(true)
      })
      .catch((error) => {
        console.error("Failed to fetch events:", error)
        navigate("/")
      })
      .finally(() => {
        setIsLoading(false)
      })
  }, [navigate])
  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen text-lg">Authenticating...</div>
  }

  if (!isAuthenticated) {
    return null // Prevent any content from rendering if not authenticated
  }

  const fetchMyEvents = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/getEvents`, { withCredentials: true })
      if (response.status === 200) {
        // console.log("Fetched Events:", response.data.myEvents)
        setMyEvents(response.data.myEvents)
      }
    } catch (error) {
      console.error("Failed to fetch events:", error.message)
      alert("Unable to fetch events. Please try again.")
    }
  }

  const handleEventCreated = () => {
    fetchMyEvents()
  }

  const formatDateTime = (dateTime) => {
    const dateObj = new Date(dateTime)
    const date = dateObj.toISOString().split("T")[0] // YYYY-MM-DD
    const time = dateObj.toISOString().split("T")[1].slice(0, 5) // HH:MM
    return { date, time }
  }

  const handleJoinEvent = (e) => {
    e.preventDefault()
    console.log("Joining event with code:", eventCode)
  }

  const handleCreateEvent = (e) => {
    e.preventDefault()
    console.log("Creating event:", "on", selectedDate)
    setShowCalendar(false)
  }

  const handleLogout = async () => {
    try {
      const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/logout`, {}, { withCredentials: true })
      if (response.status === 200) {
        console.log("Signing Off...")
        navigate("/")
      }
    } catch (error) {
      console.error("Error logging out:", error)
      alert("Logout failed. Please try again.")
    }
  }

  const startBroadcast = async (eventId) => {
    try {

      fetch(`${import.meta.env.VITE_BACKEND_URL}/startEvent/startBroadcasting`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-type": "application/json" },
        body: JSON.stringify({ eventId }),
      }).catch(error => console.error("❌ Fetch error:", error));

      navigate('/liveStream');

    } catch (error) {
      console.log(error);
    }

  }

  const joinBroadcast = async (eventId) => {

    try {

      navigate('/joinLiveStream' ,{ state: { eventId: eventId } } );

      fetch("http://localhost:3000/joinEvent/joinBroadcasting", {
        method: "POST",
        credentials: "include",
        headers: { "Content-type": "application/json" },
        body: JSON.stringify({ eventId }),
      }).catch(error => console.error("❌ Fetch error:", error));

      setTimeout(()=>{
        navigate('/joinLiveStream');
      }, 1000);

    } catch (error) {
      console.log(error);

    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 to-pink-100 dark:from-[#3a4f9f] dark:to-[#9ab2ec] transition-colors duration-200">
      {/* Header with Logo */}
      <header className="bg-white/80 backdrop-blur-sm dark:bg-gray-800/90 shadow-lg sticky top-0 z-50">
        <div className="container mx-auto px-4 py-6 flex items-center">
          <div className="text-4xl font-bold  bg-gradient-to-r from-[#e2a1a2] to-[#A01959] bg-clip-text text-transparent">
            OPEN-AURA
          </div>
          <nav className="ml-auto flex items-center">
            <a
              href="#about"
              className="mx-4 text-gray-600 dark:text-gray-300 hover:text-[#A04142] dark:hover:text-[#A01959] transition-colors duration-300 relative after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-[#A04142] dark:after:bg-[#A01959] after:scale-x-0 hover:after:scale-x-100 after:transition-transform after:duration-300"
            >
              {/* About
            </a>
            <a
              href="#events"
              className="mx-4 text-gray-600 dark:text-gray-300 hover:text-[#A04142] dark:hover:text-[#A01959] transition-colors duration-300 relative after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-[#A04142] dark:after:bg-[#A01959] after:scale-x-0 hover:after:scale-x-100 after:transition-transform after:duration-300"
            > */}
              Events
            </a>
            <a
              href="#contact"
              className="mx-4 text-gray-600 dark:text-gray-300 hover:text-[#A04142] dark:hover:text-[#A01959] transition-colors duration-300 relative after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-[#A04142] dark:after:bg-[#A01959] after:scale-x-0 hover:after:scale-x-100 after:transition-transform after:duration-300"
            >
              Contact
            </a>
            <div className="relative ml-4">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
              >
                Settings
                <ChevronDown className="ml-1 h-4 w-4" />
              </button>
              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 z-10">
                  <button
                    onClick={handleLogout}
                    className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 w-full text-left"
                  >
                    <LogOut className="inline-block mr-2" />
                    Logout
                  </button>
                </div>
              )}
            </div>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="absolute inset-0 bg-grid-pattern opacity-5 pointer-events-none" />
        {/* My Events Section */}
        <div className="min-h-[500px] bg-gradient-to-br from-rose-50 to-pink-100 dark:from-[#3a4f9f] dark:to-[#9ab2ec] transition-colors duration-200">
          <h2 className="text-4xl font-bold mb-6 bg-gradient-to-r from-[#e2a1a2] to-[#A01959] bg-clip-text text-transparent">
            My Events
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {myEvents.length > 0 ? (
              myEvents.map((event) => {
                // Format the event date and time
                console.log("image path", event.thumbnail);
                const { date, time } = formatDateTime(event.eventDateTime)
                const event_id = event.eventId
                console.log(event_id);
                return (
                  <div
                    key={event._id}
                    className="bg-white/80 dark:bg-[#9ab2ec] rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden backdrop-blur-sm border border-rose-100 dark:border-gray-700"
                  >
                    <img
                      src={`${import.meta.env.VITE_BACKEND_URL}${event.thumbnail}`}
                      alt={event.name}
                      className="w-full h-48 object-cover hover:scale-105 transition-transform duration-300"
                    />
                    <div className="p-4">
                      <h4 className="font-bold text-lg mb-2 dark:text-[#A04142]">{event.title}</h4>
                      <div className="text-gray-600 dark:text-black text-sm mb-2">
                        <span className="mr-4">📅 {date}</span>
                        <span>🕒 {time}</span>
                      </div>
                      <button
                        onClick={() => startBroadcast(event_id)}
                        className="w-full bg-gradient-to-r from-[#A04142] to-[#A01959] text-white py-3 rounded-lg hover:scale-105 transition-all duration-300 font-medium shadow-md hover:shadow-xl dark:from-[#151E3E] dark:to-[#1E2B4A] dark:hover:from-[#A04142] dark:hover:to-[#A01959]"
                      >
                        Start Broadcast
                      </button>
                    </div>
                  </div>
                )
              })
            ) : (
              <p className="text-center text-gray-600 dark:text-gray-300">No events found.</p>
            )}
          </div>
        </div>

        {/* About Section */}
        { <section id="about" className="mb-12">
          <h2 className="text-4xl font-bold mb-6 bg-gradient-to-r from-[#e2a1a2] to-[#A01959] bg-clip-text text-transparent">About Us</h2>
          <p className="text-gray-700 dark:text-gray-300">
            EventHub is your go-to platform for creating and joining exciting events. Whether you&apos;re hosting a
            webinar, planning a meetup, or attending a conference, we&apos;ve got you covered with easy-to-use tools and
            a vibrant community.
          </p>
        </section> }

        {/* Event Blocks */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {/* Join Event Block */}
          {
           <div className="bg-white/90 dark:bg-gray-800/90 p-8 rounded-xl shadow-xl backdrop-blur-sm border border-rose-100 dark:border-gray-700">
            <h3 className="text-4xl font-bold mb-6 bg-gradient-to-r from-[#e2a1a2] to-[#A01959] bg-clip-text text-transparent">Join an Event</h3>
            <form onSubmit={handleJoinEvent}>
              <input
                type="text"
                placeholder="Enter event code"
                className="w-full p-3 mb-4 border border-rose-100 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#A04142] dark:focus:ring-[#A01959] transition-all duration-300 outline-none dark:bg-gray-700 dark:text-white"
                value={eventCode}
                onChange={(e) => setEventCode(e.target.value)}
              />
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-[#A04142] to-[#A01959] text-white py-3 rounded-lg hover:scale-105 transition-all duration-300 font-medium shadow-md hover:shadow-xl dark:from-[#151E3E] dark:to-[#1E2B4A] dark:hover:from-[#A04142] dark:hover:to-[#A01959]"
              >
                Join Event
              </button>
            </form>
          </div> 
          }

          {/* Create Event Block */}
          {<CreateEventForm onEventCreated={handleEventCreated} />}
        </div>

        {/* Events Section */}
        <section id="events" className="mb-12">
          <h2 className="text-3xl font-bold mb-8 dark:text-white"></h2>

          {/* Upcoming Events */}
          <div className="min-h-[500px] bg-gradient-to-br from-rose-50 to-pink-100 dark:from-[#3a4f9f] dark:to-[#9ab2ec] transition-colors duration-200">
            <h2 className="text-4xl font-bold mb-6 bg-gradient-to-r from-[#e2a1a2] to-[#A01959] bg-clip-text text-transparent">
              Upcoming Events
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {upcomingEvents.length > 0 ? (
                upcomingEvents.map((event) => {
                  // Format the event date and time
                  const { date, time } = formatDateTime(event.eventDateTime)
                  const join_id = event.eventId
                  console.log(join_id);


                  return (
                    <div
                      key={event._id}
                      className="bg-black/80 dark:bg-[#9ab2ec] rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden backdrop-blur-sm border border-rose-100 dark:border-gray-700"
                    >
                      <img
                        src={`${import.meta.env.VITE_BACKEND_URL}${event.thumbnail}`}
                        alt={event.name}
                        className="w-full h-48 object-cover hover:scale-105 transition-transform duration-300"
                      />
                      <div className="p-4">
                        <h4 className="font-bold text-xl mb-2 dark:text-[#A04142]">{event.title}</h4>
                        <div className="text-gray-600 dark:text-black text-sm mb-2">
                          <span className="mr-4">📅 {date}</span>
                          <span>🕒 {time}</span>
                        </div>
                        <button
                          onClick={() => joinBroadcast(join_id)}
                          className="w-full bg-gradient-to-r from-[#A04142] to-[#A01959] text-white py-3 rounded-lg hover:scale-105 transition-all duration-300 font-medium shadow-md hover:shadow-xl dark:from-[#151E3E] dark:to-[#1E2B4A] dark:hover:from-[#A04142] dark:hover:to-[#A01959]"
                        >
                          Join Event
                        </button>
                      </div>
                    </div>
                  )
                })
              ) : (
                <p className="text-center text-gray-600 dark:text-gray-300">No events found.</p>
              )}
            </div>
          </div>

          {/* Past Events */}
          <div className="min-h-[500px] bg-gradient-to-br from-rose-50 to-pink-100 dark:from-[#3a4f9f] dark:to-[#9ab2ec] transition-colors duration-200">
            <h2 className="text-4xl font-bold mb-6 bg-gradient-to-r from-[#e2a1a2] to-[#A01959] bg-clip-text text-transparent">
              Past Events
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pastEvents.map((event) => {
                const { date, time } = formatDateTime(event.eventDateTime)

                return (
                  <div
                    key={event._id}
                    className="bg-black/80 dark:bg-[#9ab2ec] rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden backdrop-blur-sm border border-rose-100 dark:border-gray-700"
                  >
                    <img
                      src={`${import.meta.env.VITE_BACKEND_URL}${event.thumbnail}`}
                      alt={event.name}
                      className="w-full h-48 object-cover hover:scale-105 transition-transform duration-300"
                    />
                    <div className="p-4">
                      <h4 className="font-bold text-lg mb-2 dark:text-[#A04142]">{event.title}</h4>
                      <div className="flex items-center text-gray-600 dark:text-black text-sm">
                        <Calendar className="mr-2 h-4 w-4" />
                        <span className="mr-4">{date}</span>
                        <Clock className="mr-2 h-4 w-4" />
                        <span>{time}</span>
                      </div>
                      <div className="mt-2 flex items-center text-green-600 dark:text-green-400 text-sm">
                        <CheckCircle className="mr-2 h-4 w-4" />
                        <span>Completed</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* Contact Us Section */}
        <section id="contact" className="mb-12">
          <h2 className="text-4xl font-bold mb-6 bg-gradient-to-r from-[#e2a1a2] to-[#A01959] bg-clip-text text-transparent">Contact Us</h2>
          <p className="text-gray-700 dark:text-gray-300 mb-4">Have questions or need support? Reach out to us!</p>
          <div>
            <p className="text-gray-700 dark:text-gray-300">Email: support@eventhub.com</p>
            <p className="text-gray-700 dark:text-gray-300">Phone: (123) 456-7890</p>
          </div>
        </section>
      </main>

      {/* Calendar Popup */}
      {showCalendar && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg">
            <h3 className="text-2xl font-bold mb-4 dark:text-white">Select Event Date</h3>
            <input
              type="date"
              className="w-full p-2 mb-4 border rounded dark:bg-gray-700 dark:text-white dark:border-gray-600"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
            <div className="flex justify-end">
              <button
                onClick={() => setShowCalendar(false)}
                className="bg-gray-300 text-gray-700 py-2 px-4 rounded mr-2 hover:bg-gray-400 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateEvent}
                className="bg-[#A04142] text-white py-2 px-4 rounded hover:bg-[#A01959] dark:bg-[#151E3E] dark:hover:bg-[#A04142]"
              >
                Create Event
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default EventLandingPage

