import { useEffect, useRef, useState } from 'react'
import './App.css'

const navigation = ['Landing', 'Login', 'Register', 'Activity', 'Booking', 'Payment']
const mediaTabs = ['Image', 'Video', 'Audio']
const starterFiles = [
  { name: 'Hotel lobby.jpg', type: 'Image', detail: '2.1 MB' },
  { name: 'Island sunset.mp4', type: 'Video', detail: '18.4 MB' },
  { name: 'Ocean ambience.mp3', type: 'Audio', detail: '4.8 MB' },
]

function Icon({ name }) {
  const paths = {
    play: <path d="m8 5 8 7-8 7V5Z" />,
    stop: <path d="M7 7h10v10H7z" />,
    trash: <><path d="M5 7h14M10 11v5m4-5v5M9 7l1-2h4l1 2m-8 0 1 12h8l1-12" /></>,
    view: <><path d="M2.5 12s3.5-5 9.5-5 9.5 5 9.5 5-3.5 5-9.5 5-9.5-5-9.5-5Z" /><circle cx="12" cy="12" r="2.5" /></>,
    close: <path d="m7 7 10 10M17 7 7 17" />,
  }
  return <svg className={`icon-${name}`} viewBox="0 0 24 24" aria-hidden="true">{paths[name]}</svg>
}

function App() {
  const [activePage, setActivePage] = useState('Landing')
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [activeMediaTab, setActiveMediaTab] = useState('Image')
  const [files, setFiles] = useState(starterFiles)
  const [playingFile, setPlayingFile] = useState(null)
  const [viewingVideo, setViewingVideo] = useState(null)
  const [libraryMessage, setLibraryMessage] = useState('')
  const [chatMessages, setChatMessages] = useState([])
  const [isChatLoading, setIsChatLoading] = useState(false)
  const [htmlPreview, setHtmlPreview] = useState(null)
  const [exploreButtonColor, setExploreButtonColor] = useState('#7562e8')
  const [landingHeroImage, setLandingHeroImage] = useState(null)
  const audioPlayer = useRef(null)
  const objectUrls = useRef(new Set())
  const visibleFiles = files.filter((file) => file.type === activeMediaTab)

  useEffect(() => () => {
    audioPlayer.current?.pause()
    objectUrls.current.forEach((source) => URL.revokeObjectURL(source))
  }, [])

  function handleImport(event) {
    const importedFiles = Array.from(event.target.files ?? []).flatMap((file) => {
      const type = file.type.startsWith('audio/') ? 'Audio' : file.type.startsWith('video/') ? 'Video' : file.type.startsWith('image/') ? 'Image' : null
      if (!type) return []
      const source = URL.createObjectURL(file)
      objectUrls.current.add(source)
      return [{ id: crypto.randomUUID(), name: file.name, type, detail: `${(file.size / 1024 / 1024).toFixed(1)} MB`, source }]
    })
    setFiles((current) => [...importedFiles, ...current])
    event.target.value = ''
  }

  function deleteFile(file) {
    audioPlayer.current?.pause()
    if (file.source) { URL.revokeObjectURL(file.source); objectUrls.current.delete(file.source) }
    if (landingHeroImage?.source === file.source) setLandingHeroImage(null)
    setPlayingFile(null)
    setFiles((current) => current.filter((item) => item !== file))
  }

  function toggleAudio(file) {
    if (!file.source) return
    if (playingFile === file.id) { audioPlayer.current?.pause(); setPlayingFile(null); return }
    audioPlayer.current?.pause()
    audioPlayer.current = new Audio(file.source)
    audioPlayer.current.onended = () => setPlayingFile(null)
    audioPlayer.current.play()
    setPlayingFile(file.id)
  }

  async function sendChatMessage() {
    const message = libraryMessage.trim()
    if (!message || isChatLoading) return

    const history = chatMessages.map(({ role, content }) => ({ role, content }))
    const importedImages = files.filter((file) => file.type === 'Image' && file.source).map((file) => file.name)
    setChatMessages((current) => [...current, { role: 'user', content: message }])
    setLibraryMessage('')
    setIsChatLoading(true)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, history, importedImages }),
      })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error || 'Unable to contact the assistant.')
      const previewAction = payload.action?.type === 'preview_html' && typeof payload.action.html === 'string' && payload.action.html.trim()
        ? { title: typeof payload.action.title === 'string' ? payload.action.title : 'Generated page preview', html: payload.action.html }
        : null
      setChatMessages((current) => [...current, { role: 'assistant', content: payload.reply, previewAction }])
      if (payload.action?.type === 'set_explore_button_color' && /^#[0-9a-f]{6}$/i.test(payload.action.color)) {
        setExploreButtonColor(payload.action.color)
      }
      if (payload.action?.type === 'set_landing_hero_image') {
        const image = files.find((file) => file.type === 'Image' && file.source && file.name === payload.action.fileName)
        if (image) setLandingHeroImage({ name: image.name, source: image.source })
      }
    } catch (error) {
      setChatMessages((current) => [...current, { role: 'error', content: error.message }])
    } finally {
      setIsChatLoading(false)
    }
  }

  return <div className={isSidebarOpen ? 'layout' : 'layout sidebar-collapsed'}>
    <aside className="sidebar"><div className="sidebar-heading"><a className="brand" href="#landing" onClick={() => setActivePage('Landing')}>Kaojai<span>.ai</span></a><button className="toggle-button" type="button" onClick={() => setIsSidebarOpen((open) => !open)} aria-label="Toggle sidebar">{isSidebarOpen ? '<<' : '>>'}</button></div><nav className="navigation">{navigation.map((item) => <button className={activePage === item ? 'nav-button active' : 'nav-button'} key={item} type="button" onClick={() => setActivePage(item)} title={item}><span className="nav-mark">{item.charAt(0)}</span><span className="nav-label">{item}</span></button>)}<div className="nav-divider" /><button className={activePage === 'Docs' ? 'nav-button active' : 'nav-button'} type="button" onClick={() => setActivePage('Docs')} title="Docs"><span className="nav-mark">D</span><span className="nav-label">Docs</span></button></nav><p className="sidebar-footer">(c) 2026 Kaojai.ai</p></aside>
    <main className="content"><div className="topbar"><p>Welcome back</p><button className="profile" type="button">JD</button></div><section className={landingHeroImage && activePage === 'Landing' ? 'hero hero-with-image' : 'hero'}><div className="hero-copy"><p className="eyebrow">{activePage}</p><h1>{activePage === 'Landing' ? 'Find your next perfect stay.' : `${activePage} page`}</h1><p className="description">{activePage === 'Landing' ? 'Plan memorable trips with a simple, comfortable booking experience.' : `This is the ${activePage.toLowerCase()} section of your application.`}</p><button className="primary-button" style={{ backgroundColor: exploreButtonColor }} type="button">Explore destinations</button></div>{landingHeroImage && activePage === 'Landing' && <div className="landing-hero-image"><img src={landingHeroImage.source} alt={landingHeroImage.name} /><span>Designed for your next stay</span></div>}</section></main>
    <aside className="right-sidebar"><section className="data-panel"><div className="panel-title"><h2>Data library</h2><span>{files.length}</span></div><div className="media-tabs">{mediaTabs.map((tab) => <button key={tab} className={activeMediaTab === tab ? 'media-tab active' : 'media-tab'} type="button" onClick={() => setActiveMediaTab(tab)}>{tab}</button>)}</div><div className="data-list">{visibleFiles.length ? visibleFiles.map((file, index) => <article className="data-item" key={file.id ?? `${file.name}-${index}`}>
      {file.type === 'Image' && file.source ? <img className="image-thumb" src={file.source} alt="" /> : <div className={`file-icon ${file.type.toLowerCase()}`}>{file.type.charAt(0)}</div>}
      <div className="file-details"><h3>{file.name}</h3><p>{file.type} - {file.detail}</p></div>
      <div className="card-actions">{file.type === 'Video' && <button className="icon-button" type="button" disabled={!file.source} onClick={() => setViewingVideo(file)} aria-label={`View ${file.name}`}><Icon name="view" /></button>}{file.type === 'Audio' && <button className="icon-button" type="button" disabled={!file.source} onClick={() => toggleAudio(file)} aria-label={playingFile === file.id ? `Stop ${file.name}` : `Play ${file.name}`}><Icon name={playingFile === file.id ? 'stop' : 'play'} /></button>}<button className="icon-button delete-button" type="button" onClick={() => deleteFile(file)} aria-label={`Delete ${file.name}`}><Icon name="trash" /></button></div>
    </article>) : <p className="empty-state">No {activeMediaTab.toLowerCase()} files yet.</p>}</div><label className="import-button"><input type="file" accept="image/*,video/*,audio/*" multiple onChange={handleImport} /><span>+</span> Import media<small>Images, videos and audio files</small></label><div className="library-message"><label htmlFor="library-message">Ask Kaojai.ai</label>{chatMessages.length > 0 && <div className="chat-history" aria-live="polite">{chatMessages.map((chat, index) => <div className={`chat-entry ${chat.role}`} key={`${chat.role}-${index}`}><p className={`chat-bubble ${chat.role}`}>{chat.content}</p>{chat.previewAction && <button className="preview-button" type="button" onClick={() => setHtmlPreview({ title: chat.previewAction.title, html: createSafePreviewDocument(chat.previewAction.html) })}>Preview page</button>}</div>)}{isChatLoading && <p className="chat-bubble assistant">Thinking...</p>}</div>}<textarea id="library-message" rows="3" value={libraryMessage} onChange={(event) => setLibraryMessage(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); sendChatMessage() } }} placeholder="Ask about your stay..." /><button type="button" disabled={!libraryMessage.trim() || isChatLoading} onClick={sendChatMessage}>{isChatLoading ? 'Sending...' : 'Send'}</button></div></section></aside>
    {viewingVideo && <div className="video-modal" role="dialog" aria-modal="true" aria-label="Video preview" onClick={() => setViewingVideo(null)}><section onClick={(event) => event.stopPropagation()}><button className="modal-close" type="button" onClick={() => setViewingVideo(null)} aria-label="Close video preview"><Icon name="close" /></button><h2>{viewingVideo.name}</h2><video src={viewingVideo.source} controls autoPlay /></section></div>}
    {htmlPreview && <div className="html-preview-modal" role="dialog" aria-modal="true" aria-label={htmlPreview.title} onClick={() => setHtmlPreview(null)}><section onClick={(event) => event.stopPropagation()}><header><div><p>Engine-generated HTML</p><h2>{htmlPreview.title}</h2></div><button className="modal-close" type="button" onClick={() => setHtmlPreview(null)} aria-label="Close generated page preview"><Icon name="close" /></button></header><iframe title={htmlPreview.title} sandbox="" srcDoc={htmlPreview.html} /></section></div>}
  </div>
}

export default App

// The response remains isolated from the React application: no scripts, forms,
// popups, or same-origin access are allowed by the empty iframe sandbox.
function createSafePreviewDocument(html) {
  const csp = "default-src 'none'; img-src https: data:; style-src 'unsafe-inline'; font-src https: data:"
  const content = html.trim().slice(0, 100000)
  if (/<!doctype|<html[\s>]/i.test(content)) {
    return content.replace(/<head(\s[^>]*)?>/i, (head) => `${head}<meta http-equiv="Content-Security-Policy" content="${csp}">`)
  }
  return `<!doctype html><html><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="${csp}"><style>body{margin:0;padding:24px;font-family:Inter,system-ui,sans-serif;color:#123b43;background:#fff}*{box-sizing:border-box}</style></head><body>${content}</body></html>`
}
