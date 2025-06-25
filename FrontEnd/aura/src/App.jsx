import { BrowserRouter as Router, Route, Routes } from "react-router-dom"
import Home from "./pages/Home"
import Login from "./pages/Login"
import Signup from "./pages/Signup"
import Event from "./pages/Event"
import MediasoupRouting from "./pages/MediasoupStartRouting";
import MediasoupJoinRouting from "./pages/MediasoupJoinRouting";

export default function App() {
  return (
    <Router>
      <div className="relative min-h-screen">
        <div className="relative z-10">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path ="/event" element={<Event/>}></Route>
            <Route path="/liveStream" element={<MediasoupRouting></MediasoupRouting>}></Route>
            <Route path="/joinLiveStream" element={<MediasoupJoinRouting></MediasoupJoinRouting>}></Route>
          </Routes>
        </div>
      </div>
    </Router>
  )
}

