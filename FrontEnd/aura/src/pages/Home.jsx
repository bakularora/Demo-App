import { motion } from "framer-motion"
import FloatingPaths from "../components/floatingPath"


// eslint-disable-next-line react/prop-types
const OpenAura = ({ title = "Open Aura" }) => {
  const words = title.split(" ")

  const handleRedirect = (url) => {
    window.location.href = url
  }

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-white dark:bg-neutral-950">
      <div className="absolute inset-0">
        <FloatingPaths position={1} />
        <FloatingPaths position={-1} />
      </div>

      <div className="relative z-10 container mx-auto px-4 md:px-6 text-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 2 }}
          className="max-w-4xl mx-auto"
        >
          <h1 className="text-5xl sm:text-7xl md:text-8xl font-bold mb-16 tracking-tighter">
            {words.map((word, wordIndex) => (
              <span key={wordIndex} className="inline-block mr-4 last:mr-0">
                {word.split("").map((letter, letterIndex) => (
                  <motion.span
                    key={`${wordIndex}-${letterIndex}`}
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{
                      delay: wordIndex * 0.1 + letterIndex * 0.03,
                      type: "spring",
                      stiffness: 150,
                      damping: 25,
                    }}
                    className="inline-block text-transparent bg-clip-text bg-gradient-to-r from-neutral-900 to-neutral-700/80 dark:from-white dark:to-white/80"
                  >
                    {letter}
                  </motion.span>
                ))}
              </span>
            ))}
          </h1>

          <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
            <button
              onClick={() => handleRedirect("/login")}
              className="px-8 py-4 text-lg font-semibold rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors duration-300 shadow-lg hover:shadow-xl"
            >
              Login
            </button>

            <button
              onClick={() => handleRedirect("/signup")}
              className="px-8 py-4 text-lg font-semibold rounded-xl bg-purple-600 text-white hover:bg-purple-700 transition-colors duration-300 shadow-lg hover:shadow-xl"
            >
              Sign Up
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default OpenAura

