import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { MessageBubble } from '../components/MessageBubble'

describe('MessageBubble', () => {
  it('renders user message content', () => {
    render(<MessageBubble role="user" content="How do I handle betrayal?" />)
    expect(screen.getByText('How do I handle betrayal?')).toBeInTheDocument()
  })

  it('shows streaming indicator when streaming with no content', () => {
    render(<MessageBubble role="assistant" content="" isStreaming={true} />)
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument()
  })

  it('shows cursor when streaming with content', () => {
    render(<MessageBubble role="assistant" content="Wisdom says" isStreaming={true} />)
    // content renders and cursor is present
    expect(screen.getByText('Wisdom says')).toBeInTheDocument()
    // streaming cursor element
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument()
  })
})
