import React, { useEffect, useRef, useState } from 'react'

export default function VoiceControls({ onQuery }) {
  const recognitionRef = useRef(null)
  const [isListening, setIsListening] = useState(false)
  const [isSupported, setIsSupported] = useState(true)

  useEffect(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setIsSupported(false)
      return
    }
    
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    const recognition = new SpeechRecognition()
    recognition.lang = 'en-US'
    recognition.interimResults = false
    recognition.continuous = false
    
    recognition.onstart = () => {
      setIsListening(true)
    }
    
    recognition.onresult = (e) => {
      const text = e.results[0][0].transcript
      onQuery(text)
      setIsListening(false)
    }
    
    recognition.onerror = (e) => {
      console.error('Speech recognition error:', e.error)
      setIsListening(false)
    }
    
    recognition.onend = () => {
      setIsListening(false)
    }
    
    recognitionRef.current = recognition
  }, [onQuery])

  const start = () => {
    if (recognitionRef.current && !isListening) {
      try {
        recognitionRef.current.start()
      } catch (err) {
        console.error('Failed to start recognition:', err)
      }
    }
  }

  if (!isSupported) {
    return null // Hide button if not supported
  }

  return (
    <div className="voice-controls">
      <button 
        onClick={start} 
        disabled={isListening}
        className={isListening ? 'listening' : ''}
      >
        🎤 {isListening ? 'Listening...' : 'Speak'}
      </button>
    </div>
  )
}
