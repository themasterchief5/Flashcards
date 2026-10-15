import { useEffect, useMemo, useRef, useState } from 'react'
import './App.css'

const starterText = `apple - jablko
window - okno
book - ksiazka
sunrise - wschod slonca
journey - podroz`
const starterCards = [
  { front: 'apple', back: 'jablko' },
  { front: 'window', back: 'okno' },
  { front: 'book', back: 'ksiazka' },
  { front: 'sunrise', back: 'wschod slonca' },
  { front: 'journey', back: 'podroz' },
]

function parseCards(text) {
  return text.split('\n').map((line) => line.trim()).map((line) => line.split(/\s+[-–—]\s+/, 2).map((part) => part.trim())).filter(([front, back]) => front && back).map(([front, back]) => ({ front, back }))
}
function shuffle(cards) { return [...cards].sort(() => Math.random() - 0.5) }

function App() {
  const [text, setText] = useState(starterText)
  const [cards, setCards] = useState(starterCards)
  const [side, setSide] = useState('front')
  const [screen, setScreen] = useState('setup')
  const [deck, setDeck] = useState([])
  const [index, setIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [known, setKnown] = useState([])
  const [unknown, setUnknown] = useState([])
  const [slide, setSlide] = useState('')
  const [isAdvancing, setIsAdvancing] = useState(false)
  const swipeStart = useRef(null)
  const swipeTriggered = useRef(false)
  const [dragOffset, setDragOffset] = useState(0)
  const currentCard = deck[index]
  const remaining = deck.length - index
  const percent = deck.length ? Math.round((index / deck.length) * 100) : 0
  const dragProgress = Math.min(Math.abs(dragOffset) / 120, 1)
  const visibleCard = useMemo(() => currentCard ? { primary: side === 'front' ? currentCard.front : currentCard.back, secondary: side === 'front' ? currentCard.back : currentCard.front } : null, [currentCard, side])

  useEffect(() => {
    const handleKey = (event) => {
      if (screen !== 'study' || isAdvancing) return
      if (event.key === ' ' || event.key === 'Enter') { event.preventDefault(); setFlipped((value) => !value) }
      if (event.key === 'ArrowLeft') rateCard(false)
      if (event.key === 'ArrowRight') rateCard(true)
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  })

  function beginStudy(retryCards = cards) {
    const nextDeck = shuffle(retryCards)
    setDeck(nextDeck); setIndex(0); setKnown([]); setUnknown([]); setFlipped(false); setScreen(nextDeck.length ? 'study' : 'setup')
  }
  function updateText(value) { setText(value); setCards(parseCards(value)) }
  function handlePointerDown(event) {
    if (event.button !== undefined && event.button !== 0) return
    event.currentTarget.setPointerCapture(event.pointerId)
    swipeStart.current = { x: event.clientX, y: event.clientY }
    swipeTriggered.current = false
  }
  function handlePointerMove(event) {
    if (!swipeStart.current || isAdvancing) return
    const rawOffset = event.clientX - swipeStart.current.x
    const maxOffset = Math.min(event.currentTarget.offsetWidth * 0.32, 180)
    setDragOffset(Math.max(-maxOffset, Math.min(rawOffset, maxOffset)))
  }
  function handlePointerUp(event) {
    if (!swipeStart.current) return
    const deltaX = event.clientX - swipeStart.current.x
    const deltaY = event.clientY - swipeStart.current.y
    swipeStart.current = null
    setDragOffset(0)
    if (Math.abs(deltaX) < 60 || Math.abs(deltaX) <= Math.abs(deltaY) || isAdvancing) return
    swipeTriggered.current = true
    rateCard(deltaX > 0)
  }
  function handleCardClick() {
    if (swipeTriggered.current) { swipeTriggered.current = false; return }
    if (!isAdvancing) setFlipped((value) => !value)
  }
  function rateCard(isKnown) {
    if (!currentCard || isAdvancing) return
    setIsAdvancing(true)
    setSlide(isKnown ? 'slide-right' : 'slide-left')
    if (isKnown) setKnown((items) => [...items, currentCard]); else setUnknown((items) => [...items, currentCard])
    window.setTimeout(() => { setSlide(''); setIsAdvancing(false); if (index + 1 >= deck.length) setScreen('complete'); else { setIndex((value) => value + 1); setFlipped(false) } }, 260)
  }
  function resetToSetup() { setScreen('setup'); setDeck([]); setFlipped(false); setIsAdvancing(false) }

  return <main className="app-shell">
    <header className="topbar"><button className="brand" type="button" onClick={resetToSetup}><span className="brand-mark">✦</span><span>MEMORY<span className="brand-accent">.exe</span></span></button><div className="status"><span className="status-dot" /> LOCAL MODE <span className="status-slash">//</span> READY</div></header>
    {screen === 'setup' && <section className="setup-view page-in"><div className="eyebrow">FLASHCARD CONSOLE <span>v1.0</span></div><h1>Put it in<br /><em>memory.</em></h1><p className="intro">Paste your word pairs, choose a direction, and learn at your own pace.</p><div className="setup-grid"><div className="input-panel panel"><div className="panel-heading"><span className="panel-icon">▤</span><span>INPUT DECK</span><span className="line" /><span className="count-label">{cards.length} CARDS</span></div><textarea value={text} onChange={(event) => updateText(event.target.value)} spellCheck="false" aria-label="Flashcard list" /><div className="format-note"><span>↳</span> format: term A - term B <span className="valid">● SYNTAX OK</span></div></div><div className="settings-panel panel"><div className="panel-heading"><span className="panel-icon">⚙</span><span>SESSION SETUP</span></div><p className="setting-label">FRONT SIDE</p><div className="segmented"><button className={side === 'front' ? 'selected' : ''} onClick={() => setSide('front')} type="button">A <span>→</span> B</button><button className={side === 'back' ? 'selected' : ''} onClick={() => setSide('back')} type="button">B <span>→</span> A</button></div><p className="setting-label space-top">SHUFFLE MODE <span className="on-pill">ON</span></p><div className="shuffle-row"><span>Randomize every session</span><span className="toggle"><i /></span></div><button className="start-button" type="button" onClick={() => beginStudy()} disabled={!cards.length}>START SESSION <span>→</span></button></div></div><div className="tip"><span>TIP</span> Edit the sample deck above or paste your own word pairs.</div></section>}
    {screen === 'study' && visibleCard && <section className="study-view page-in"><div className="study-head"><div><div className="eyebrow">SESSION IN PROGRESS</div><h2>Keep the momentum.</h2></div><button className="exit-button" onClick={resetToSetup} type="button">× EXIT</button></div><div className="progress-meta"><span>PROGRESS</span><strong>{String(index + 1).padStart(2, '0')} <small>/ {String(deck.length).padStart(2, '0')}</small></strong></div><div className="progress-track"><div style={{ width: `${Math.max(percent, 3)}%` }} /></div><div className="card-stage"><div className="swipe-indicator swipe-indicator-left" style={{ opacity: dragOffset < -18 ? 0.2 + dragProgress * 0.8 : 0.12 }}><span>←</span><small>STILL LEARNING</small></div><div className="swipe-indicator swipe-indicator-right" style={{ opacity: dragOffset > 18 ? 0.2 + dragProgress * 0.8 : 0.12 }}><small>GOT IT</small><span>→</span></div><div className={`flashcard ${slide}`} style={!slide && dragOffset ? { transform: `translateX(${dragOffset}px) rotate(${dragOffset / 20}deg)` } : undefined}><div className={`flashcard-inner ${flipped ? 'is-flipped' : ''}`} onClick={handleCardClick} onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp} onPointerCancel={() => { swipeStart.current = null; setDragOffset(0) }} role="button" tabIndex="0" aria-label="Flip flashcard"><div className="card-face card-front"><span className="card-tag">{side === 'front' ? 'TERM A' : 'TERM B'}</span><span className="word">{visibleCard.primary}</span><span className="flip-hint">CLICK TO FLIP <b>↻</b></span></div><div className="card-face card-back"><span className="card-tag">ANSWER</span><span className="word">{visibleCard.secondary}</span><span className="flip-hint">CLICK TO FLIP <b>↻</b></span></div></div></div></div><div className="action-row"><button className="rate rate-no" disabled={isAdvancing} onClick={() => rateCard(false)} type="button"><span>←</span><div><b>STILL LEARNING</b><small>needs another look</small></div></button><div className="card-counter">{remaining - 1} LEFT</div><button className="rate rate-yes" disabled={isAdvancing} onClick={() => rateCard(true)} type="button"><div><b>GOT IT</b><small>I know this</small></div><span>→</span></button></div><div className="keyboard-hint"><kbd>SPACE</kbd> flip <kbd>←</kbd><kbd>→</kbd> rate</div><div className="swipe-hint">SWIPE LEFT / RIGHT TO RATE</div></section>}
    {screen === 'complete' && <section className="complete-view page-in"><div className="complete-mark">✓</div><div className="eyebrow">SESSION COMPLETE</div><h1>Nice work.<br /><em>Keep going.</em></h1><p className="intro">You made it through the whole deck. Here is your session summary:</p><div className="results"><div><strong>{known.length}</strong><span>GOT IT</span></div><div><strong>{unknown.length}</strong><span>TO REVIEW</span></div><div><strong>{deck.length}</strong><span>TOTAL</span></div></div><div className="complete-actions"><button className="start-button" type="button" onClick={() => beginStudy(unknown)} disabled={!unknown.length}>REVIEW {unknown.length} CARDS <span>→</span></button><button className="ghost-button" type="button" onClick={resetToSetup}>NEW SESSION <span>↗</span></button></div></section>}
    <footer><span>BUILT FOR FOCUS</span><span>♥</span><span>NO ACCOUNT REQUIRED</span></footer>
  </main>
}
export default App
