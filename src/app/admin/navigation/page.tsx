'use client'

import { useEffect, useState } from 'react'
import AdminSidebar from '@/components/AdminSidebar'

interface NavLink {
  id: string
  label: string
  url: string
  openInNew: boolean
  sortOrder: number
  groupId: string | null
}

interface NavGroup {
  id: string
  label: string
  sortOrder: number
  links: NavLink[]
}

interface NavData {
  groups: NavGroup[]
  topLevelLinks: NavLink[]
}

interface CmsPageOption {
  id: string
  title: string
  slug: string
}

const emptyLink = (): Omit<NavLink, 'id' | 'groupId'> => ({
  label: '',
  url: '',
  openInNew: false,
  sortOrder: 0,
})

export default function NavigationAdminPage() {
  const [navData, setNavData] = useState<NavData>({ groups: [], topLevelLinks: [] })
  const [loading, setLoading] = useState(true)
  const [cmsPages, setCmsPages] = useState<CmsPageOption[]>([])

  // Group editing state
  const [editingGroup, setEditingGroup] = useState<NavGroup | null>(null)
  const [newGroupLabel, setNewGroupLabel] = useState('')
  const [showNewGroup, setShowNewGroup] = useState(false)

  // Link editing state
  const [editingLink, setEditingLink] = useState<NavLink | null>(null)
  const [showNewLink, setShowNewLink] = useState<{ groupId: string | null } | null>(null)
  const [newLinkForm, setNewLinkForm] = useState(emptyLink())

  const token = () => localStorage.getItem('token')
  const authHeader = () => ({ Authorization: `Bearer ${token()}`, 'Content-Type': 'application/json' })

  const fetchCmsPages = async () => {
    const res = await fetch('/api/admin/pages', { headers: authHeader() })
    if (res.ok) {
      const data = await res.json()
      setCmsPages(data.map((p: any) => ({ id: p.id, title: p.title, slug: p.slug })))
    }
  }

  const fetchNav = async () => {
    const res = await fetch('/api/admin/navigation', { headers: authHeader() })
    if (res.ok) setNavData(await res.json())
    setLoading(false)
  }

  useEffect(() => { fetchNav(); fetchCmsPages() }, [])

  // --- Group actions ---
  const createGroup = async () => {
    if (!newGroupLabel.trim()) return
    const maxOrder = Math.max(0, ...navData.groups.map((g) => g.sortOrder))
    await fetch('/api/admin/navigation/groups', {
      method: 'POST',
      headers: authHeader(),
      body: JSON.stringify({ label: newGroupLabel.trim(), sortOrder: maxOrder + 1 }),
    })
    setNewGroupLabel('')
    setShowNewGroup(false)
    fetchNav()
  }

  const updateGroup = async (group: NavGroup, label: string) => {
    await fetch(`/api/admin/navigation/groups/${group.id}`, {
      method: 'PUT',
      headers: authHeader(),
      body: JSON.stringify({ label, sortOrder: group.sortOrder }),
    })
    setEditingGroup(null)
    fetchNav()
  }

  const deleteGroup = async (id: string) => {
    if (!confirm('Delete this group and all its links?')) return
    await fetch(`/api/admin/navigation/groups/${id}`, { method: 'DELETE', headers: authHeader() })
    fetchNav()
  }

  const moveGroup = async (group: NavGroup, dir: 'up' | 'down') => {
    const sorted = [...navData.groups].sort((a, b) => a.sortOrder - b.sortOrder)
    const idx = sorted.findIndex((g) => g.id === group.id)
    const swapIdx = dir === 'up' ? idx - 1 : idx + 1
    if (swapIdx < 0 || swapIdx >= sorted.length) return
    const swap = sorted[swapIdx]
    await Promise.all([
      fetch(`/api/admin/navigation/groups/${group.id}`, {
        method: 'PUT', headers: authHeader(),
        body: JSON.stringify({ label: group.label, sortOrder: swap.sortOrder }),
      }),
      fetch(`/api/admin/navigation/groups/${swap.id}`, {
        method: 'PUT', headers: authHeader(),
        body: JSON.stringify({ label: swap.label, sortOrder: group.sortOrder }),
      }),
    ])
    fetchNav()
  }

  // --- Link actions ---
  const createLink = async (groupId: string | null) => {
    if (!newLinkForm.label.trim() || !newLinkForm.url.trim()) return
    const existingLinks = groupId
      ? navData.groups.find((g) => g.id === groupId)?.links ?? []
      : navData.topLevelLinks
    const maxOrder = Math.max(0, ...existingLinks.map((l) => l.sortOrder))
    await fetch('/api/admin/navigation/links', {
      method: 'POST',
      headers: authHeader(),
      body: JSON.stringify({ ...newLinkForm, groupId, sortOrder: maxOrder + 1 }),
    })
    setShowNewLink(null)
    setNewLinkForm(emptyLink())
    fetchNav()
  }

  const updateLink = async (link: NavLink) => {
    if (!editingLink) return
    await fetch(`/api/admin/navigation/links/${link.id}`, {
      method: 'PUT',
      headers: authHeader(),
      body: JSON.stringify({
        label: editingLink.label,
        url: editingLink.url,
        openInNew: editingLink.openInNew,
        groupId: link.groupId,
        sortOrder: link.sortOrder,
      }),
    })
    setEditingLink(null)
    fetchNav()
  }

  const deleteLink = async (id: string) => {
    if (!confirm('Delete this link?')) return
    await fetch(`/api/admin/navigation/links/${id}`, { method: 'DELETE', headers: authHeader() })
    fetchNav()
  }

  const moveLink = async (link: NavLink, dir: 'up' | 'down', links: NavLink[]) => {
    const sorted = [...links].sort((a, b) => a.sortOrder - b.sortOrder)
    const idx = sorted.findIndex((l) => l.id === link.id)
    const swapIdx = dir === 'up' ? idx - 1 : idx + 1
    if (swapIdx < 0 || swapIdx >= sorted.length) return
    const swap = sorted[swapIdx]
    await Promise.all([
      fetch(`/api/admin/navigation/links/${link.id}`, {
        method: 'PUT', headers: authHeader(),
        body: JSON.stringify({ label: link.label, url: link.url, openInNew: link.openInNew, groupId: link.groupId, sortOrder: swap.sortOrder }),
      }),
      fetch(`/api/admin/navigation/links/${swap.id}`, {
        method: 'PUT', headers: authHeader(),
        body: JSON.stringify({ label: swap.label, url: swap.url, openInNew: swap.openInNew, groupId: swap.groupId, sortOrder: link.sortOrder }),
      }),
    ])
    fetchNav()
  }

  const CmsPagePicker = ({ onSelect }: { onSelect: (title: string, slug: string) => void }) => (
    cmsPages.length > 0 ? (
      <select
        className="sf-input text-sm"
        defaultValue=""
        onChange={(e) => {
          const page = cmsPages.find((p) => p.id === e.target.value)
          if (page) onSelect(page.title, `/${page.slug}`)
          e.target.value = ''
        }}
      >
        <option value="" disabled>Link to CMS page…</option>
        {cmsPages.map((p) => (
          <option key={p.id} value={p.id}>{p.title}</option>
        ))}
      </select>
    ) : null
  )

  const LinkRow = ({ link, links }: { link: NavLink; links: NavLink[] }) => {
    const isEditing = editingLink?.id === link.id
    return (
      <div className="flex items-center gap-2 py-2 px-3 bg-white border border-gray-200 rounded mb-1">
        {isEditing ? (
          <>
            <div className="flex-1 flex flex-col gap-1">
              <input
                className="sf-input text-sm w-full"
                value={editingLink.label}
                onChange={(e) => setEditingLink({ ...editingLink, label: e.target.value })}
                placeholder="Label"
              />
              <div className="flex gap-1">
                <input
                  className="sf-input flex-1 text-sm font-mono"
                  value={editingLink.url}
                  onChange={(e) => setEditingLink({ ...editingLink, url: e.target.value })}
                  placeholder="URL or /path"
                />
                <CmsPagePicker
                  onSelect={(title, slug) =>
                    setEditingLink({ ...editingLink, label: editingLink.label || title, url: slug })
                  }
                />
              </div>
            </div>
            <label className="flex items-center gap-1 text-xs text-gray-600 whitespace-nowrap">
              <input
                type="checkbox"
                checked={editingLink.openInNew}
                onChange={(e) => setEditingLink({ ...editingLink, openInNew: e.target.checked })}
              />
              New tab
            </label>
            <button onClick={() => updateLink(link)} className="sf-btn sf-btn-primary text-xs px-2 py-1">Save</button>
            <button onClick={() => setEditingLink(null)} className="sf-btn sf-btn-secondary text-xs px-2 py-1">Cancel</button>
          </>
        ) : (
          <>
            <span className="flex-1 text-sm font-medium text-gray-800">{link.label}</span>
            <span className="flex-1 text-sm text-gray-500 font-mono truncate">{link.url}</span>
            {link.openInNew && <span className="text-xs text-gray-400 whitespace-nowrap">↗ New tab</span>}
            <div className="flex gap-1 ml-auto">
              <button onClick={() => moveLink(link, 'up', links)} className="text-gray-400 hover:text-gray-600 px-1" title="Move up">↑</button>
              <button onClick={() => moveLink(link, 'down', links)} className="text-gray-400 hover:text-gray-600 px-1" title="Move down">↓</button>
              <button onClick={() => setEditingLink({ ...link })} className="text-primary-600 hover:text-primary-900 text-sm px-1">Edit</button>
              <button onClick={() => deleteLink(link.id)} className="text-red-600 hover:text-red-900 text-sm px-1">Delete</button>
            </div>
          </>
        )}
      </div>
    )
  }

  const NewLinkForm = ({ groupId }: { groupId: string | null }) => (
    <div className="flex items-center gap-2 py-2 px-3 bg-blue-50 border border-blue-200 rounded mt-1">
      <div className="flex-1 flex flex-col gap-1">
        <input
          className="sf-input text-sm w-full"
          value={newLinkForm.label}
          onChange={(e) => setNewLinkForm({ ...newLinkForm, label: e.target.value })}
          placeholder="Label (e.g. History)"
        />
        <div className="flex gap-1">
          <input
            className="sf-input flex-1 text-sm font-mono"
            value={newLinkForm.url}
            onChange={(e) => setNewLinkForm({ ...newLinkForm, url: e.target.value })}
            placeholder="URL or /path"
          />
          <CmsPagePicker
            onSelect={(title, slug) =>
              setNewLinkForm({ ...newLinkForm, label: newLinkForm.label || title, url: slug })
            }
          />
        </div>
      </div>
      <label className="flex items-center gap-1 text-xs text-gray-600 whitespace-nowrap">
        <input
          type="checkbox"
          checked={newLinkForm.openInNew}
          onChange={(e) => setNewLinkForm({ ...newLinkForm, openInNew: e.target.checked })}
        />
        New tab
      </label>
      <button onClick={() => createLink(groupId)} className="sf-btn sf-btn-primary text-xs px-2 py-1">Add</button>
      <button onClick={() => { setShowNewLink(null); setNewLinkForm(emptyLink()) }} className="sf-btn sf-btn-secondary text-xs px-2 py-1">Cancel</button>
    </div>
  )

  const sortedGroups = [...navData.groups].sort((a, b) => a.sortOrder - b.sortOrder)
  const sortedTopLinks = [...navData.topLevelLinks].sort((a, b) => a.sortOrder - b.sortOrder)

  return (
    <div className="min-h-screen bg-gray-100 flex">
      <AdminSidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between flex-shrink-0 z-10">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Navigation Manager</h2>
            <p className="text-sm text-gray-500 mt-0.5">Manage the public website navigation menu</p>
          </div>
        </header>

        <main className="flex-1 p-6 overflow-y-auto space-y-6">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
            </div>
          ) : (
            <>
              {/* Top-level links (no dropdown) */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-800">Top-Level Links</h3>
                  <p className="text-xs text-gray-500">Appear directly in the nav bar (no dropdown)</p>
                </div>
                {sortedTopLinks.length === 0 && (
                  <p className="text-sm text-gray-400 italic mb-2">No top-level links yet.</p>
                )}
                {sortedTopLinks.map((link) => (
                  <LinkRow key={link.id} link={link} links={sortedTopLinks} />
                ))}
                {showNewLink?.groupId === null ? (
                  <NewLinkForm groupId={null} />
                ) : (
                  <button
                    onClick={() => { setShowNewLink({ groupId: null }); setNewLinkForm(emptyLink()) }}
                    className="mt-2 text-sm text-primary-600 hover:text-primary-800"
                  >
                    + Add Link
                  </button>
                )}
              </div>

              {/* Dropdown groups */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-800 text-lg">Dropdown Groups</h3>
                  <button
                    onClick={() => setShowNewGroup(true)}
                    className="sf-btn sf-btn-primary"
                  >
                    + Add Group
                  </button>
                </div>

                {showNewGroup && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center gap-3">
                    <input
                      className="sf-input flex-1"
                      value={newGroupLabel}
                      onChange={(e) => setNewGroupLabel(e.target.value)}
                      placeholder="Group label (e.g. The District)"
                      onKeyDown={(e) => e.key === 'Enter' && createGroup()}
                      autoFocus
                    />
                    <button onClick={createGroup} className="sf-btn sf-btn-primary">Create</button>
                    <button onClick={() => { setShowNewGroup(false); setNewGroupLabel('') }} className="sf-btn sf-btn-secondary">Cancel</button>
                  </div>
                )}

                {sortedGroups.length === 0 && !showNewGroup && (
                  <div className="bg-white rounded-lg border border-gray-200 p-8 text-center text-gray-500">
                    <p>No dropdown groups yet. Add one to create a dropdown menu.</p>
                  </div>
                )}

                {sortedGroups.map((group) => {
                  const isEditingThis = editingGroup?.id === group.id
                  const sortedLinks = [...group.links].sort((a, b) => a.sortOrder - b.sortOrder)
                  return (
                    <div key={group.id} className="bg-white rounded-lg shadow-sm border border-gray-200">
                      {/* Group header */}
                      <div className="flex items-center gap-3 px-5 py-3 border-b border-gray-100 bg-gray-50 rounded-t-lg">
                        {isEditingThis ? (
                          <>
                            <input
                              className="sf-input flex-1 font-semibold"
                              value={editingGroup.label}
                              onChange={(e) => setEditingGroup({ ...editingGroup, label: e.target.value })}
                              onKeyDown={(e) => e.key === 'Enter' && updateGroup(group, editingGroup.label)}
                              autoFocus
                            />
                            <button onClick={() => updateGroup(group, editingGroup.label)} className="sf-btn sf-btn-primary text-xs px-2 py-1">Save</button>
                            <button onClick={() => setEditingGroup(null)} className="sf-btn sf-btn-secondary text-xs px-2 py-1">Cancel</button>
                          </>
                        ) : (
                          <>
                            <h4 className="font-semibold text-gray-800 flex-1">{group.label}</h4>
                            <span className="text-xs text-gray-400">{group.links.length} link{group.links.length !== 1 ? 's' : ''}</span>
                            <button onClick={() => moveGroup(group, 'up')} className="text-gray-400 hover:text-gray-600 px-1" title="Move group up">↑</button>
                            <button onClick={() => moveGroup(group, 'down')} className="text-gray-400 hover:text-gray-600 px-1" title="Move group down">↓</button>
                            <button onClick={() => setEditingGroup({ ...group })} className="text-primary-600 hover:text-primary-900 text-sm">Rename</button>
                            <button onClick={() => deleteGroup(group.id)} className="text-red-600 hover:text-red-900 text-sm">Delete Group</button>
                          </>
                        )}
                      </div>

                      {/* Links in group */}
                      <div className="p-4">
                        {sortedLinks.length === 0 && (
                          <p className="text-sm text-gray-400 italic mb-2">No links in this group yet.</p>
                        )}
                        {sortedLinks.map((link) => (
                          <LinkRow key={link.id} link={link} links={sortedLinks} />
                        ))}
                        {showNewLink?.groupId === group.id ? (
                          <NewLinkForm groupId={group.id} />
                        ) : (
                          <button
                            onClick={() => { setShowNewLink({ groupId: group.id }); setNewLinkForm(emptyLink()) }}
                            className="mt-2 text-sm text-primary-600 hover:text-primary-800"
                          >
                            + Add Link
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  )
}
