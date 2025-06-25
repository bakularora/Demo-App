"use client"

import { useEffect, useRef, useState } from "react"
import io from "socket.io-client"
import * as mediasoupClient from "mediasoup-client"
import { Mic, Volume2, Video, X } from "lucide-react"

const VideoStreamingApp = () => {
  let [device, setDevice] = useState(null)
  const [sendTransport, setSendTransport] = useState(null)
  const [recvTransport, setRecvTransport] = useState(null)
  const [currentRoomId, setCurrentRoomId] = useState(null)
  const [existingProducers, setExistingProducers] = useState([])
  const socketRef = useRef(null)
  const myVideoRef = useRef(null)

  const [isMuted, setIsMuted] = useState(false)
  const [isSpeakerOn, setIsSpeakerOn] = useState(true)
  const [isCameraOn, setIsCameraOn] = useState(true)

  useEffect(() => {
    // Initialize Socket.IO connection
    socketRef.current = io(`${import.meta.env.VITE_BACKEND_URL}`)

    socketRef.current.on("connect", () => {
      console.log(" Connected to server:", socketRef.current.id)

      setTimeout(() => {
        console.log(" Emitting startBroadcastStreaming")
        socketRef.current.emit("startBroadcastStreaming")
      }, 1000)
    })

    socketRef.current.on("connect_error", (error) => {
      console.error(" Socket connection error:", error)
    })

    socketRef.current.on("startBroadcasting", () => {
      console.log("Received startBroadcasting")
      startBroadcast()
    })
    // Listen for existing producers
    socketRef.current.on("existingProducers", (producers) => {
      console.log("Received existing producers:", producers)
      setExistingProducers(producers)
    })

    // Cleanup on component unmount
    return () => {
      socketRef.current.disconnect()
    }
  }, [])

  //  Get Router Capabilities
  function getRouterCapabilities(roomId) {
    return new Promise((resolve, reject) => {
      socketRef.current.emit("getRouterRtpCapabilities", { roomId }, (rtpCapabilities) => {
        if (!rtpCapabilities) {
          console.error(" Failed to fetch router capabilities")
          reject("No RTP Capabilities received")
          return
        }

        try {
          device = new mediasoupClient.Device()
          device
            .load({ routerRtpCapabilities: rtpCapabilities })
            .then(() => {
              console.log("🎛 Router capabilities loaded:", device.rtpCapabilities)
              setDevice(device)
              resolve()
            })
            .catch((error) => {
              console.error(" Failed to load device capabilities:", error)
              reject(error)
            })
        } catch (error) {
          console.error(" Error loading device:", error)
          reject(error)
        }
      })
    })
  }

  //  Join a Room (For Viewers)
  const joinRoom = async (roomId) => {
    return new Promise((resolve, reject) => {
      socketRef.current.emit("joinRoom", { roomId }, async (response) => {
        if (response.error) {
          console.error(" Error joining room:", response.error)
          reject(response.error)
        } else {
          console.log(` Joined Room: ${roomId}`)
          setCurrentRoomId(roomId)
          await getRouterCapabilities(roomId)
          resolve()
        }
      })
    })
  }

  //  Start Broadcasting Media
  async function startBroadcast() {
    try {
      // Step 1: Emit "startBroadcasting" to create a room
      const response = await new Promise((resolve, reject) => {
        socketRef.current.emit("startBroadcast", (response) => {
          if (response.error) {
            console.error(" Error starting broadcast:", response.error)
            reject(response.error)
          } else {
            console.log(` Broadcasting started! Room ID: ${response.roomId}`)
            setCurrentRoomId(response.roomId)
            resolve(response)
          }
        })
      })

      console.log(response.roomId)

      // Step 2: Initialize router capabilities for the room
      await getRouterCapabilities(response.roomId)

      // if (!device) {
      //     console.error(" Device not initialized");
      //     return;
      // }

      // Step 3: Get user media (audio and video)
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      if (myVideoRef.current) {
        myVideoRef.current.srcObject = stream
      }

      // Step 4: Create a send transport
      console.log("🎥 Requesting send transport creation...")
      const transportParams = await new Promise((resolve, reject) => {
        socketRef.current.emit("createTransport", { roomId: response.roomId, isProducer: true }, (response) => {
          if (!response || !response.id) {
            console.error(" Invalid transport parameters received")
            reject("Invalid transport parameters")
          } else {
            resolve(response)
          }
        })
      })

      console.log(" Send Transport params received:", transportParams)
      const newSendTransport = device.createSendTransport(transportParams)
      setSendTransport(newSendTransport)

      // Step 5: Set up transport event listeners
      newSendTransport.on("connect", ({ dtlsParameters }, callback, errback) => {
        console.log(" Connecting send transport...")
        socketRef.current.emit(
          "connectTransport",
          { roomId: response.roomId, transportId: newSendTransport.id, dtlsParameters },
          (response) => {
            if (response.error) {
              console.error(" Error connecting transport:", response.error)
              errback(response.error)
            } else {
              console.log(" Send transport connected!")
              callback()
            }
          },
        )
      })

      newSendTransport.on("produce", async ({ kind, rtpParameters }, callback, errback) => {
        console.log("🎙 Producing ${kind} track...")
        socketRef.current.emit(
          "produce",
          { roomId: response.roomId, transportId: newSendTransport.id, kind, rtpParameters },
          (response) => {
            if (response.error) {
              errback(response.error)
            } else {
              callback({ id: response.producerId })
            }
          },
        )
      })

      // Step 6: Produce each track (audio and video)
      for (const track of stream.getTracks()) {
        await newSendTransport.produce({ track })
      }

      console.log(" Broadcasting started")
    } catch (error) {
      console.error(" Error in startBroadcast:", error)
    }
  }

  //  Join an Event as Viewer
  const joinEvent = async (roomId) => {
    await joinRoom(roomId)

    if (!device) {
      console.error(" Device not initialized")
      return
    }

    console.log(" Joining event...")
    console.log(" Requesting receive transport creation...")
    socketRef.current.emit("createTransport", { roomId, isProducer: false }, async (transportParams) => {
      if (!transportParams || !transportParams.id) {
        console.error(" Invalid transport parameters received")
        return
      }

      console.log(" Receive Transport params received:", transportParams)
      const newRecvTransport = device.createRecvTransport(transportParams)
      setRecvTransport(newRecvTransport)

      newRecvTransport.on("connect", ({ dtlsParameters }, callback, errback) => {
        console.log(" Connecting receive transport...")
        socketRef.current.emit(
          "connectTransport",
          { roomId, transportId: newRecvTransport.id, dtlsParameters },
          (response) => {
            if (response.error) {
              console.error(" Error connecting transport:", response.error)
              errback(response.error)
            } else {
              console.log(" Receive transport connected!")
              callback()
            }
          },
        )
      })

      // 🔹 Listen for new producers
      socketRef.current.on("newProducer", async ({ producerId, kind }) => {
        console.log(` [NEW PRODUCER RECEIVED] ID: ${producerId}, Kind: ${kind}`)
        await consumeStream(roomId, producerId)
      })

      console.log(" Ready to receive streams")
    })
  }

  //  Consume a Producer's Stream
  const consumeStream = async (roomId, producerId) => {
    if (!recvTransport) {
      console.error(" Receive transport not initialized")
      return
    }

    console.log(" Requesting to consume producer: ${producerId}")

    socketRef.current.emit(
      "consume",
      { roomId, producerId, rtpCapabilities: device.rtpCapabilities, transportId: recvTransport.id },
      async (response) => {
        if (response.error) {
          console.error(" Error consuming stream:", response.error)
          return
        }

        console.log(" Consuming stream response received:", response)

        try {
          const consumer = await recvTransport.consume({
            id: response.id,
            producerId: response.producerId,
            kind: response.kind,
            rtpParameters: response.rtpParameters,
          })

          console.log(` Successfully consumed ${response.kind} stream`)

          // Create a media element for the stream
          const mediaElement = document.createElement(response.kind === "video" ? "video" : "audio")
          mediaElement.autoplay = true
          mediaElement.playsInline = true
          mediaElement.srcObject = new MediaStream([consumer.track])
          document.body.appendChild(mediaElement)

          console.log(` ${response.kind} stream attached to DOM`)
        } catch (error) {
          console.error(" Error consuming stream:", error)
        }
      },
    )
  }

  const toggleMicrophone = () => {
    setIsMuted(!isMuted)
    // Get all audio tracks from the video element's srcObject
    if (myVideoRef.current && myVideoRef.current.srcObject) {
      const stream = myVideoRef.current.srcObject
      stream.getAudioTracks().forEach((track) => {
        // Toggle the enabled state (opposite of isMuted)
        track.enabled = isMuted
        console.log(`Microphone ${isMuted ? "enabled" : "disabled"}`)
      })
    }
  }

  // const toggleSpeaker = () => {
  //   if (myVideoRef.current) {
  //     myVideoRef.current.muted = isSpeakerOn
  //     console.log(`Speaker ${isSpeakerOn ? "disabled" : "enabled"}`)
  //   }
  //   setIsSpeakerOn(!isSpeakerOn)
  // }

  const toggleCamera = () => {
    setIsCameraOn(!isCameraOn)
    // Get all video tracks from the video element's srcObject
    if (myVideoRef.current && myVideoRef.current.srcObject) {
      const stream = myVideoRef.current.srcObject
      stream.getVideoTracks().forEach((track) => {
        // Toggle the enabled state (opposite of isCameraOn)
        track.enabled = !isCameraOn
        console.log(`Camera ${isCameraOn ? "disabled" : "enabled"}`)
      })
    }
  }

  const endBroadcast = () => {
    // Stop all media tracks
    if (myVideoRef.current && myVideoRef.current.srcObject) {
      const stream = myVideoRef.current.srcObject
      stream.getTracks().forEach((track) => {
        track.stop()
      })
    }

    // Close transports if they exist
    if (sendTransport.current) {
      sendTransport.current.close()
    }

    if (recvTransport.current) {
      recvTransport.current.close()
    }

    // Notify server that we're leaving (if needed)
    if (socketRef.current && currentRoomId) {
      socketRef.current.emit("leaveBroadcast", { roomId: currentRoomId })
    }

    // Navigate away
    window.location.href = "/event"
  }
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-400 to-blue-200 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <h1 className="text-4xl font-bold text-center mb-8 text-rose-800">OPEN-AURA</h1>
        <div className="flex justify-center mb-8">
          <div className="w-full max-w-4xl aspect-video bg-rose-900 rounded-2xl overflow-hidden shadow-lg">
            <video ref={myVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
          </div>
        </div>
        <div className="flex justify-center gap-6 mt-6">
          <button
            onClick={toggleMicrophone}
            className={`p-4 rounded-full shadow-lg transition-all duration-300 ease-in-out ${
              isMuted ? "bg-rose-300 text-rose-800" : "bg-rose-800 text-rose-100"
            } hover:bg-rose-700 hover:text-rose-100 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-opacity-50`}
          >
            <Mic className="w-6 h-6" />
          </button>
          {/* <button
            onClick={toggleSpeaker}
            className={`p-4 rounded-full shadow-lg transition-all duration-300 ease-in-out ${
              isSpeakerOn ? "bg-rose-800 text-rose-100" : "bg-rose-300 text-rose-800"
            } hover:bg-rose-700 hover:text-rose-100 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-opacity-50`}
          >
            <Volume2 className="w-6 h-6" />
          </button> */}
          <button
            onClick={toggleCamera}
            className={`p-4 rounded-full shadow-lg transition-all duration-300 ease-in-out ${
              isCameraOn ? "bg-rose-800 text-rose-100" : "bg-rose-300 text-rose-800"
            } hover:bg-rose-700 hover:text-rose-100 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-opacity-50`}
          >
            <Video className="w-6 h-6" />
          </button>
          <button
            onClick={endBroadcast}
            className="p-4 bg-red-600 text-white rounded-full shadow-lg transition-all duration-300 ease-in-out hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        {/* <div className="mt-12 bg-white bg-opacity-70 p-6 rounded-2xl shadow-lg backdrop-blur-sm">
          <h3 className="text-2xl font-semibold mb-4 text-rose-800">Active Viewers</h3>
          <ul className="space-y-3">
            {existingProducers.map((producer) => (
              <li key={producer.producerId} className="p-4 bg-rose-50 rounded-lg shadow-md text-rose-800">
                {producer.kind} - {producer.producerId}
              </li>
            ))}
          </ul>
        </div> */}
      </div>
    </div>
  )
}

export default VideoStreamingApp

