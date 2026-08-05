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

  return <div className={isSidebarOpen ? 'layout' : 'layout sidebar-collapsed'}>
    <aside className="sidebar"><div className="sidebar-heading"><a className="brand" href="#landing" onClick={() => setActivePage('Landing')}>stay<span>easy</span></a><button className="toggle-button" type="button" onClick={() => setIsSidebarOpen((open) => !open)} aria-label="Toggle sidebar">{isSidebarOpen ? '<<' : '>>'}</button></div><nav className="navigation">{navigation.map((item) => <button className={activePage === item ? 'nav-button active' : 'nav-button'} key={item} type="button" onClick={() => setActivePage(item)} title={item}><span className="nav-mark">{item.charAt(0)}</span><span className="nav-label">{item}</span></button>)}</nav><p className="sidebar-footer">(c) 2026 StayEasy</p></aside>
    <main className="content"><div className="topbar"><p>Welcome back</p><button className="profile" type="button">JD</button></div><section className="hero"><p className="eyebrow">{activePage}</p><h1>{activePage === 'Landing' ? 'Find your next perfect stay.' : `${activePage} page`}</h1><p className="description">{activePage === 'Landing' ? 'Plan memorable trips with a simple, comfortable booking experience.' : `This is the ${activePage.toLowerCase()} section of your application.`}</p><button className="primary-button" type="button">Explore destinations</button></section></main>
    <aside className="right-sidebar"><section className="data-panel"><div className="panel-title"><h2>Data library</h2><span>{files.length}</span></div><div className="media-tabs">{mediaTabs.map((tab) => <button key={tab} className={activeMediaTab === tab ? 'media-tab active' : 'media-tab'} type="button" onClick={() => setActiveMediaTab(tab)}>{tab}</button>)}</div><div className="data-list">{visibleFiles.length ? visibleFiles.map((file, index) => <article className="data-item" key={file.id ?? `${file.name}-${index}`}>
      {file.type === 'Image' && file.source ? <img className="image-thumb" src={file.source} alt="" /> : <div className={`file-icon ${file.type.toLowerCase()}`}>{file.type.charAt(0)}</div>}
      <div className="file-details"><h3>{file.name}</h3><p>{file.type} - {file.detail}</p></div>
      <div className="card-actions">{file.type === 'Video' && <button className="icon-button" type="button" disabled={!file.source} onClick={() => setViewingVideo(file)} aria-label={`View ${file.name}`}><Icon name="view" /></button>}{file.type === 'Audio' && <button className="icon-button" type="button" disabled={!file.source} onClick={() => toggleAudio(file)} aria-label={playingFile === file.id ? `Stop ${file.name}` : `Play ${file.name}`}><Icon name={playingFile === file.id ? 'stop' : 'play'} /></button>}<button className="icon-button delete-button" type="button" onClick={() => deleteFile(file)} aria-label={`Delete ${file.name}`}><Icon name="trash" /></button></div>
    </article>) : <p className="empty-state">No {activeMediaTab.toLowerCase()} files yet.</p>}</div><label className="import-button"><input type="file" accept="image/*,video/*,audio/*" multiple onChange={handleImport} /><span>+</span> Import media<small>Images, videos and audio files</small></label></section></aside>
    {viewingVideo && <div className="video-modal" role="dialog" aria-modal="true" aria-label="Video preview" onClick={() => setViewingVideo(null)}><section onClick={(event) => event.stopPropagation()}><button className="modal-close" type="button" onClick={() => setViewingVideo(null)} aria-label="Close video preview"><Icon name="close" /></button><h2>{viewingVideo.name}</h2><video src={viewingVideo.source} controls autoPlay /></section></div>}
  </div>
}

export default App
