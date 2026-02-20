import { useState } from 'react'
import { isNicknameTaken } from '../nicknameStorage'
import ArkanoidHeader from '../components/ArkanoidHeader'
import './SetNickname.css'

const NICK_MIN = 2
const NICK_MAX = 24
const NICK_REG = /^[a-zA-Z0-9_]+$/

type Props = {
  address: string
  setNickname: (address: string, value: string) => void
  onDone: () => void
}

export default function SetNickname({ address, setNickname, onDone }: Props) {
  const [value, setValue] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = value.trim()
    setError(null)
    if (trimmed.length < NICK_MIN) {
      setError(`At least ${NICK_MIN} characters`)
      return
    }
    if (trimmed.length > NICK_MAX) {
      setError(`At most ${NICK_MAX} characters`)
      return
    }
    if (!NICK_REG.test(trimmed)) {
      setError('Only letters, numbers and _')
      return
    }
    if (isNicknameTaken(trimmed, address)) {
      setError('This nickname is already taken')
      return
    }
    setNickname(address, trimmed)
    onDone()
  }

  return (
    <div className="set-nickname">
      <ArkanoidHeader />
      <div className="set-nickname-form-wrap">
        <h2 className="set-nickname-title">Choose a nickname</h2>
        <p className="set-nickname-subtitle">It will be visible on the leaderboard. Nicknames are unique.</p>
        <form onSubmit={handleSubmit} className="set-nickname-form">
          <input
            type="text"
            className="set-nickname-input"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="nickname"
            maxLength={NICK_MAX}
            autoComplete="username"
          />
          {error && <p className="set-nickname-error">{error}</p>}
          <button type="submit" className="set-nickname-submit">
            Done
          </button>
        </form>
      </div>
    </div>
  )
}
