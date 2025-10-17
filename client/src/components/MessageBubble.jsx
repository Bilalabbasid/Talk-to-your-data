import React from 'react'

export default function MessageBubble({ msg }) {
  const cls = msg.from === 'user' ? 'bubble user' : 'bubble bot'
  
  return (
    <div className={cls}>
      <pre style={{ whiteSpace: 'pre-wrap' }}>{msg.text}</pre>
      
      {msg.suggestion && (
        <div className="suggestion">
          💡 {msg.suggestion}
        </div>
      )}
      
      {msg.meta && msg.meta.sql && (
        <div className="sql-display">
          <strong>📝 Generated SQL:</strong>
          <pre><code>{msg.meta.sql}</code></pre>
        </div>
      )}
      
      {msg.meta && msg.meta.result && msg.meta.result.rows && msg.meta.result.rows.length > 0 && (
        <div className="data-table">
          <table>
            <thead>
              <tr>
                {Object.keys(msg.meta.result.rows[0]).map(key => (
                  <th key={key}>{key}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {msg.meta.result.rows.slice(0, 10).map((row, idx) => (
                <tr key={idx}>
                  {Object.values(row).map((val, i) => (
                    <td key={i}>{val !== null ? val.toString() : 'null'}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          {msg.meta.result.rows.length > 10 && (
            <p className="table-note">Showing first 10 of {msg.meta.result.rows.length} results</p>
          )}
        </div>
      )}
    </div>
  )
}
