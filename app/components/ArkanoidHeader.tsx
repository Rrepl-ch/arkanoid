import './ArkanoidHeader.css'

/**
 * Shared header: row of colored bricks + "Arkanoid" title + tagline.
 * Used in Menu and on the wallet connect screen.
 */
export default function ArkanoidHeader() {
  return (
    <div className="arkanoid-header">
      <div className="arkanoid-header-bricks" aria-hidden>
        {[...Array(8)].map((_, i) => (
          <span key={i} className="arkanoid-header-brick" />
        ))}
      </div>
      <h1 className="arkanoid-header-title">Arkanod</h1>
      <p className="arkanoid-header-tagline">Break the bricks</p>
    </div>
  )
}
