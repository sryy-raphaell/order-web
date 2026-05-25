'use client'
import { useState, useRef, useEffect } from 'react'

export default function Chatbot() {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Hi! Saya SyRa, asisten IoT kamu. Ada yang bisa saya bantu? Misalnya, tanyakan produk yang sesuai untuk proyek IoT kamu! 🤖'
    }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function sendMessage() {
    if (!input.trim() || loading) return

    const userMessage = { role: 'user', content: input.trim() }
    const newMessages = [...messages, userMessage]
    setMessages(newMessages)
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.filter(m => m.role !== 'assistant' || newMessages.indexOf(m) > 0)
        })
      })

      const data = await res.json()
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.message
      }])
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Maaf, terjadi kesalahan. Silakan coba lagi.'
      }])
    } finally {
      setLoading(false)
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div style={{
      background: 'var(--bg-secondary)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)',
      display: 'flex',
      flexDirection: 'column',
      height: '500px',
      overflow: 'hidden',
    }}>

      {/* Header */}
      <div style={{
        padding: '12px 16px',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
      }}>
        <div style={{
          width: '8px', height: '8px',
          borderRadius: '50%',
          background: 'var(--accent)',
          boxShadow: '0 0 6px var(--accent)',
        }} />
        <p style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)' }}>
          SyRa
        </p>
        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
          Asisten IoT
        </span>
      </div>

      {/* Messages */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '12px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
      }}>
        {messages.map((msg, i) => (
          <div key={i} style={{
            display: 'flex',
            justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
          }}>
            <div style={{
              maxWidth: '85%',
              padding: '8px 12px',
              borderRadius: msg.role === 'user'
                ? '12px 12px 2px 12px'
                : '12px 12px 12px 2px',
              background: msg.role === 'user'
                ? 'var(--accent-subtle)'
                : 'var(--bg-tertiary)',
              border: '1px solid',
              borderColor: msg.role === 'user'
                ? 'rgba(74,222,128,0.2)'
                : 'var(--border)',
              fontSize: '12px',
              color: msg.role === 'user' ? 'var(--accent)' : 'var(--text-secondary)',
              lineHeight: 1.6,
              whiteSpace: 'pre-wrap',
            }}>
              {msg.content}
            </div>
          </div>
        ))}

        {loading && (
          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <div style={{
              padding: '8px 14px',
              borderRadius: '12px 12px 12px 2px',
              background: 'var(--bg-tertiary)',
              border: '1px solid var(--border)',
              fontSize: '12px',
              color: 'var(--text-muted)',
            }}>
              <style>{`
                @keyframes blink {
                  0%, 100% { opacity: 0.3 }
                  50% { opacity: 1 }
                }
                .dot { animation: blink 1.2s infinite; display: inline-block; }
                .dot:nth-child(2) { animation-delay: 0.2s; }
                .dot:nth-child(3) { animation-delay: 0.4s; }
              `}</style>
              <span className="dot">●</span>
              <span className="dot">●</span>
              <span className="dot">●</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div style={{
        padding: '10px 12px',
        borderTop: '1px solid var(--border)',
        display: 'flex',
        gap: '8px',
      }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Tanya kebutuhan IoT kamu..."
          disabled={loading}
          style={{
            flex: 1,
            background: 'var(--bg-tertiary)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)',
            padding: '7px 12px',
            fontSize: '12px',
            color: 'var(--text-primary)',
            outline: 'none',
          }}
        />
        <button
          onClick={sendMessage}
          disabled={loading || !input.trim()}
          style={{
            background: input.trim() && !loading ? 'var(--accent-subtle)' : 'var(--bg-tertiary)',
            border: '1px solid',
            borderColor: input.trim() && !loading ? 'rgba(74,222,128,0.25)' : 'var(--border)',
            color: input.trim() && !loading ? 'var(--accent)' : 'var(--text-muted)',
            borderRadius: 'var(--radius-sm)',
            padding: '7px 12px',
            fontSize: '12px',
            cursor: input.trim() && !loading ? 'pointer' : 'default',
            fontWeight: 500,
            transition: 'all 0.15s',
          }}
        >
          Kirim
        </button>
      </div>

    </div>
  )
}