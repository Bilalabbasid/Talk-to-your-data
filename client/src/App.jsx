import React from 'react'
import ChatBox from './components/ChatBox'

export default function App() {
  return (
    <div className="app-root">
      <header className="app-header">
        <h1>💬 Talk to Your Data</h1>
        <p>Ask questions about your banking data in plain English</p>
      </header>
      <main>
        <ChatBox />
      </main>
    </div>
  )
}
