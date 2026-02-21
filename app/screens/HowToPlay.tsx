import './Screen.css'

export default function HowToPlay() {
  return (
    <div className="screen screen--how">
      <h2 className="screen-title">How to play</h2>
      <div className="screen-content screen-content--centered">
        <p><strong>Goal:</strong> Break all bricks without losing the ball.</p>
        <p><strong>Controls:</strong> Move your finger to move the paddle. Tap to launch the ball.</p>
        <p><strong>Power-ups:</strong></p>
        <ul className="screen-list">
          <li>♥ Red heart — +1 life</li>
          <li>Yellow «3» — multiball</li>
        </ul>
        <p><strong>Levels:</strong> 20 levels. Clear all bricks to advance. Good luck!</p>
      </div>
    </div>
  )
}
