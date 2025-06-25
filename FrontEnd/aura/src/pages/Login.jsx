import { useState } from "react"
import axios from "axios"
import { useNavigate } from "react-router-dom"
import FloatingPaths from "../components/floatingPath"

export default function Login() {
<FloatingPaths/>
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [errors, setErrors] = useState([])
  const navigate = useNavigate()

  const handleAuthviaGoogle = (e) => {
    e.preventDefault()
    setErrors([])

    // Redirect user to the backend's Google OAuth authentication endpoint
    // Include the frontend redirect URL as a parameter
    const redirectUrl = encodeURIComponent(`${window.location.origin}/auth/google/callback`)
    window.location.href = `${import.meta.env.VITE_BACKEND_URL}/auth/google?redirect=${redirectUrl}`
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setErrors([])
    axios
      .post(`${import.meta.env.VITE_BACKEND_URL}/login`,
       { email, password }, 
       { headers: { "Content-Type": "application/json" },
       withCredentials: true })
      .then((result) => {
        console.log(result.data)
        navigate("/event")
      })
      .catch((err) => {
        if (axios.isAxiosError(err) && err.response) {
          if (err.response.status === 400 && err.response.data.errors) {
            const validationErrors = err.response.data.errors.map((error) => error.msg)
            setErrors(validationErrors)
          } else {
            setErrors([err.response.data.error || "An error occurred during login"])
          }
        } else {
          setErrors(["An unexpected error occurred"])
        }
      })
  }

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-white dark:bg-neutral-950">
      <div className="absolute inset-0">
        <FloatingPaths position={1} />
        <FloatingPaths position={-1} />
      </div>
      <div className="relative z-10 w-full max-w-md px-6 py-12 bg-white dark:bg-neutral-900 bg-opacity-80 dark:bg-opacity-80 backdrop-blur-lg rounded-2xl shadow-xl">
        <h2 className="text-4xl font-bold mb-8 text-center text-neutral-900 dark:text-white">Login</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-700 rounded-md shadow-sm placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
              required
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-700 rounded-md shadow-sm placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
              required
            />
          </div>
          <div>
            <button
              type="submit"
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-150 ease-in-out"
            onClick={handleSubmit}>
              Sign In
            </button>
          </div>
          <div className="text-center">
            <div
              className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition duration-150 ease-in-out"
            onClick={handleAuthviaGoogle}
            >
              Log in with Google
            </div>
          </div>
          {errors.length > 0 && (
            <div
              className="mt-4 bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-200 px-4 py-3 rounded relative"
              role="alert"
            >
              {errors.map((error, index) => (
                <p key={index} className="text-sm">
                  {error}
                </p>
              ))}
            </div>
          )}
        </form>
      </div>
    </div>
  )
}

