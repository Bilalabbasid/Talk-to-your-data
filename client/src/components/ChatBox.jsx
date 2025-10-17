import React, { useEffect, useState, useRef } from 'react'
import axios from 'axios'
import MessageBubble from './MessageBubble'
import QueryInput from './QueryInput'
import VoiceControls from './VoiceControls'

export default function ChatBox() {
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    // welcome message
    setMessages([{ 
      id: Date.now(), 
      from: 'bot', 
      text: 'Hi! 👋 Ask me about your banking data.\n\nTry:\n• "What was my biggest transaction last month?"\n• "Show all transactions"\n• "How much did I send to John last year?"' 
    }])
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  async function handleQuery(text) {
    const userMsg = { id: Date.now(), from: 'user', text }
    setMessages(m => [...m, userMsg])
    setLoading(true)

    try {
      const resp = await axios.post('/query', { query: text })
      if (resp.data.error) {
        const bot = { 
          id: Date.now() + 1, 
          from: 'bot', 
          text: '❌ Error: ' + resp.data.error,
          suggestion: resp.data.suggestion 
        }
        setMessages(m => [...m, bot])
      } else {
        const { sql, result, reason } = resp.data
        // build a friendly text from result (very basic fallback)
        let textResp = ''
        if (result.error) {
          textResp = '❌ SQL Error: ' + result.error
        } else if (result.rows) {
          if (result.rows.length === 0) {
            textResp = '📭 No results found.'
          } else {
            textResp = `✅ Found ${result.rows.length} result(s)${reason ? ' (' + reason + ')' : ''}`
          }
        } else if (result.info) {
          textResp = '✅ Operation successful.'
        }

        const botMsg = { 
          id: Date.now() + 2, 
          from: 'bot', 
          text: textResp, 
          meta: { sql, result } 
        }
        setMessages(m => [...m, botMsg])
      }
    } catch (err) {
      const bot = { 
        id: Date.now() + 1, 
        from: 'bot', 
        text: '❌ Server error: ' + err.message 
      }
      setMessages(m => [...m, bot])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="chatbox">
      <div className="messages">
        {messages.map(m => <MessageBubble key={m.id} msg={m} />)}
        <div ref={messagesEndRef} />
      </div>

      <div className="controls">
        <VoiceControls onQuery={handleQuery} />
        <QueryInput onSend={handleQuery} loading={loading} />
      </div>
    </div>
  )
}
