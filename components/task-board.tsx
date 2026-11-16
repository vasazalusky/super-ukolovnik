"use client"

import { FormEvent, useEffect, useMemo, useState } from "react"
import { ArrowRight, ArrowUp, Check, ChevronDown, Flag, Gauge, MoreHorizontal, Plus, RotateCcw, Trash2, X } from "lucide-react"

type Status = "todo" | "progress" | "done"
type Priority = "low" | "medium" | "high"
type Task = { id: string; title: string; details: string; status: Status; priority: Priority; createdAt: number }

const storageKey = "pitstop-tasks-v1"
const initialTasks: Task[] = [
  { id: "starter-1", title: "Naplánovat týdenní priority", details: "Vybrat tři věci, které posunou týden dopředu.", status: "todo", priority: "high", createdAt: 3 },
  { id: "starter-2", title: "Dokončit návrh prezentace", details: "Poslední kontrola slidů a export do PDF.", status: "progress", priority: "medium", createdAt: 2 },
  { id: "starter-3", title: "Odpovědět na zprávy", details: "Pročistit inbox před koncem dne.", status: "done", priority: "low", createdAt: 1 },
]
const lanes: { id: Status; label: string; sub: string }[] = [
  { id: "todo", label: "Na startu", sub: "Čeká na zelenou" },
  { id: "progress", label: "V boxech", sub: "Právě se řeší" },
  { id: "done", label: "V cíli", sub: "Hotovo, další kolo" },
]
const nextStatus: Record<Status, Status> = { todo: "progress", progress: "done", done: "todo" }
const priorityLabel: Record<Priority, string> = { low: "Nízká", medium: "Střední", high: "Vysoká" }

export function TaskBoard() {
  const [tasks, setTasks] = useState<Task[]>(initialTasks)
  const [ready, setReady] = useState(false)
  const [filter, setFilter] = useState<"all" | "active" | "done">("all")
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Task | null>(null)
  const [title, setTitle] = useState("")
  const [details, setDetails] = useState("")
  const [priority, setPriority] = useState<Priority>("medium")

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(storageKey)
      if (saved !== null) {
        const parsed: unknown = JSON.parse(saved)
        if (Array.isArray(parsed)) setTasks(parsed as Task[])
      }
    } catch {
      window.localStorage.removeItem(storageKey)
    }
    setReady(true)
  }, [])

  useEffect(() => {
    if (ready) window.localStorage.setItem(storageKey, JSON.stringify(tasks))
  }, [ready, tasks])

  const completed = tasks.filter((task) => task.status === "done").length
  const active = tasks.filter((task) => task.status !== "done").length
  const progress = tasks.length ? Math.round((completed / tasks.length) * 100) : 0
  const visibleTasks = useMemo(() => tasks.filter((task) => filter === "all" || (filter === "active" ? task.status !== "done" : task.status === "done")), [filter, tasks])

  function openNew() {
    setEditing(null)
    setTitle("")
    setDetails("")
    setPriority("medium")
    setModalOpen(true)
  }

  function openEdit(task: Task) {
    setEditing(task)
    setTitle(task.title)
    setDetails(task.details)
    setPriority(task.priority)
    setModalOpen(true)
  }

  function saveTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const cleanTitle = title.trim()
    if (!cleanTitle) return
    if (editing) {
      setTasks((current) => current.map((task) => task.id === editing.id ? { ...task, title: cleanTitle, details: details.trim(), priority } : task))
    } else {
      setTasks((current) => [{ id: crypto.randomUUID(), title: cleanTitle, details: details.trim(), status: "todo", priority, createdAt: Date.now() }, ...current])
    }
    setModalOpen(false)
  }

  function moveTask(id: string) {
    setTasks((current) => current.map((task) => task.id === id ? { ...task, status: nextStatus[task.status] } : task))
  }

  function deleteTask(id: string) {
    setTasks((current) => current.filter((task) => task.id !== id))
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <a href="#top" className="brand" aria-label="Pitstop domů"><span className="brand-mark"><Flag /></span><span>PIT<span className="brand-red">STOP</span><small>TVŮJ ÚKOLOVNÍK</small></span></a>
        <div className="topbar-right"><span className="session-pill"><span className="live-dot" /> OSOBNÍ BOARD</span><span className="avatar">P</span></div>
      </header>

      <section className="hero" id="top">
        <div className="hero-copy">
          <div className="eyebrow"><span className="eyebrow-line" /> BOXOVÁ ULICE / TVŮJ DENNÍ PLÁN</div>
          <h1>Každý den.<br /><span>Nový závod.</span></h1>
          <p>Všechny úkoly na jedné trati. Přesuň je do cíle svým tempem.</p>
        </div>
        <div className="hero-stat" aria-label={`Dokončeno ${progress} procent`}>
          <div className="stat-top"><span>DENNÍ TEMPO</span><Gauge /></div>
          <strong>{progress}<small>%</small></strong>
          <div className="progress-track"><span style={{ width: `${progress}%` }} /></div>
          <div className="stat-bottom"><span>{completed} dokončeno</span><span>{active} zbývá</span></div>
        </div>
      </section>

      <section className="board-section" aria-label="Úkoly">
        <div className="board-toolbar">
          <div><div className="section-kicker">PŘEHLED ZÁVODU</div><h2>Tvoje trať <span className="task-count">{tasks.length.toString().padStart(2, "0")} ÚKOLŮ</span></h2></div>
          <div className="toolbar-actions">
            <div className="filter-group" aria-label="Filtrovat úkoly">
              {([ ["all", "Vše"], ["active", "Aktivní"], ["done", "Hotové"] ] as const).map(([value, label]) => (
                <button key={value} type="button" className={`filter-button ${filter === value ? "selected" : ""}`} onClick={() => setFilter(value)} aria-pressed={filter === value}>{label}</button>
              ))}
            </div>
            <button type="button" className="add-button" onClick={openNew}><Plus /> <span>Nový úkol</span></button>
          </div>
        </div>

        <div className="lane-grid">
          {lanes.map((lane, index) => {
            const laneTasks = visibleTasks.filter((task) => task.status === lane.id)
            return <section className={`lane lane-${lane.id}`} key={lane.id} aria-labelledby={`lane-${lane.id}`}>
              <div className="lane-heading"><div className="lane-title-wrap"><span className={`lane-index lane-index-${lane.id}`}>0{index + 1}</span><div><h3 id={`lane-${lane.id}`}>{lane.label}</h3><p>{lane.sub}</p></div></div><span className="lane-count">{laneTasks.length.toString().padStart(2, "0")}</span></div>
              <div className="lane-cards">
                {laneTasks.map((task) => <article className="task-card" key={task.id}>
                  <div className="task-card-top"><span className={`priority priority-${task.priority}`}><i />{priorityLabel[task.priority]}</span><div className="task-menu">
                    <button type="button" className="icon-button" aria-label={`Upravit úkol ${task.title}`} onClick={() => openEdit(task)}><MoreHorizontal /></button>
                    <button type="button" className="icon-button delete-button" aria-label={`Smazat úkol ${task.title}`} onClick={() => deleteTask(task.id)}><Trash2 /></button>
                  </div></div>
                  <button type="button" className="task-title-button" onClick={() => openEdit(task)}><h4>{task.title}</h4></button>
                  {task.details && <p className="task-details">{task.details}</p>}
                  <div className="task-card-bottom"><span className="task-id">PIT-{task.id.slice(-4).toUpperCase()}</span><button type="button" className={`move-button ${task.status === "done" ? "move-restart" : ""}`} onClick={() => moveTask(task.id)} aria-label={task.status === "done" ? `Vrátit ${task.title} na začátek` : `Posunout ${task.title} do další fáze`}>
                    {task.status === "todo" ? <>Do boxů <ArrowRight /></> : task.status === "progress" ? <>Dokončit <Check /></> : <>Znovu <RotateCcw /></>}
                  </button></div>
                </article>)}
                {laneTasks.length === 0 && <div className="empty-lane"><span className="empty-icon">{lane.id === "done" ? <Check /> : <Flag />}</span><p>{filter !== "all" ? "Žádné úkoly v tomto filtru." : lane.id === "done" ? "Zatím žádný dojezd." : "Čeká na svůj start."}</p>{lane.id === "todo" && filter === "all" && <button type="button" onClick={openNew}>Přidat úkol <Plus /></button>}</div>}
              </div>
            </section>
          })}
        </div>
      </section>

      <footer className="footer"><span><span className="footer-mark">P.</span> Dobré tempo. Čistá trať.</span><span>ULOŽENO V TOMTO PROHLÍŽEČI <span className="storage-dot" /></span></footer>

      {modalOpen && <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setModalOpen(false) }}>
        <section className="task-modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
          <div className="modal-top"><span className="section-kicker">{editing ? "UPRAVIT ZÁZNAM" : "NOVÝ ZÁZNAM"}</span><button type="button" className="icon-button modal-close" aria-label="Zavřít" onClick={() => setModalOpen(false)}><X /></button></div>
          <h2 id="modal-title">{editing ? "Uprav úkol" : "Připrav se na start."}</h2>
          <p className="modal-description">Malý krok na trati. Velký rozdíl v cíli.</p>
          <form onSubmit={saveTask}>
            <label htmlFor="task-title">NÁZEV ÚKOLU</label><input autoFocus id="task-title" required maxLength={80} value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Např. dokončit prezentaci" />
            <label htmlFor="task-details">POZNÁMKA <span>(VOLITELNÉ)</span></label><textarea id="task-details" maxLength={180} value={details} onChange={(event) => setDetails(event.target.value)} placeholder="Pár slov k úkolu…" rows={3} />
            <label htmlFor="task-priority">PRIORITA</label><div className="select-wrap"><select id="task-priority" value={priority} onChange={(event) => setPriority(event.target.value as Priority)}><option value="low">Nízká</option><option value="medium">Střední</option><option value="high">Vysoká</option></select><ChevronDown /></div>
            <div className="modal-actions"><button type="button" className="cancel-button" onClick={() => setModalOpen(false)}>Zrušit</button><button type="submit" className="save-button">{editing ? "Uložit změny" : "Přidat na trať"}<ArrowUp /></button></div>
          </form>
        </section>
      </div>}
    </main>
  )
}
