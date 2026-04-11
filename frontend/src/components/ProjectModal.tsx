import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Textarea } from './ui/textarea'
import type { Project } from '../lib/types'

interface ProjectModalProps {
  open: boolean
  onClose: () => void
  onSubmit: (data: { name: string; description?: string }) => Promise<void>
  project?: Project
}

export function ProjectModal({ open, onClose, onSubmit, project }: ProjectModalProps) {
  const [name, setName] = useState(project?.name ?? '')
  const [description, setDescription] = useState(project?.description ?? '')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [nameError, setNameError] = useState<string | null>(null)

  const isEdit = !!project

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) {
      setNameError('Name is required')
      return
    }
    setNameError(null)
    setIsSubmitting(true)
    try {
      await onSubmit({ name: name.trim(), description: description.trim() || undefined })
      onClose()
    } catch {
      // toast fired by the hook / caller
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Project' : 'New Project'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="project-name">Name *</Label>
            <Input
              id="project-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Project name"
              maxLength={200}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="project-desc">Description</Label>
            <Textarea
              id="project-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description"
              rows={3}
              maxLength={1000}
            />
          </div>

          {nameError && <p className="text-sm text-destructive">{nameError}</p>}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving…' : isEdit ? 'Save' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
