import React, { useState } from 'react'

export default function QueryInput({ onSend, loading }) {
  const [text, setText] = useState('')
  
  const submit = (e) => {
    e.preventDefault()
    if (!text.trim()) return
    onSend(text.trim())
    setText('')
  }
  
  return (
    <form onSubmit={submit} className="query-input">
      <input 
        value={text} 
        onChange={e => setText(e.target.value)} 
        placeholder="Ask about your banking data..." 
        disabled={loading}
      />
      <button type="submit" disabled={loading || !text.trim()}>
        {loading ? '⏳' : '➤'} {loading ? 'Processing...' : 'Ask'}
      </button>
    </form>
  )
}
