import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import { FolderOpen, CheckSquare, Trash2 } from 'lucide-react'
import type { Project } from '../lib/types'
import { Button } from './ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from './ui/dialog'

interface ProjectCardProps {
  project: Project
  onDelete?: () => Promise<void>
}

export function ProjectCard({ project, onDelete }: ProjectCardProps) {
  const navigate = useNavigate()
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  async function handleDelete() {
    if (!onDelete) return
    setIsDeleting(true)
    setDeleteError(null)
    try {
      await onDelete()
      setDeleteOpen(false)
    } catch {
      setDeleteError('Failed to delete project. Please try again.')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <>
      <div
        onClick={() => navigate(`/projects/${project.id}`)}
        className="relative glass rounded-2xl p-5 cursor-pointer hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200"
      >
        {/* Delete button — only rendered for the owner */}
        {onDelete && (
          <button
            onClick={(e) => { e.stopPropagation(); setDeleteOpen(true) }}
            className="absolute top-3 right-3 p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
            aria-label={`Delete ${project.name}`}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}

        <div className="flex items-start gap-3">
          <div className="p-2 bg-primary/10 rounded-md shrink-0">
            <FolderOpen className="w-4 h-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            {/* Extra right padding when delete button is present */}
            <h3 className={`font-medium truncate ${onDelete ? 'pr-6' : ''}`}>
              {project.name}
            </h3>
            {project.description && (
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                {project.description}
              </p>
            )}
            <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
              {project._count !== undefined && (
                <span className="flex items-center gap-1">
                  <CheckSquare className="w-3.5 h-3.5" />
                  {project._count.tasks} task{project._count.tasks !== 1 ? 's' : ''}
                </span>
              )}
              <span>{format(new Date(project.createdAt), 'MMM d, yyyy')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation dialog */}
      <Dialog
        open={deleteOpen}
        onOpenChange={(open) => { if (!isDeleting) setDeleteOpen(open) }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Project</DialogTitle>
          </DialogHeader>

          <div className="text-sm text-muted-foreground space-y-2 py-1">
            <p>
              This will permanently delete{' '}
              <span className="font-semibold text-foreground">{project.name}</span>{' '}
              and all its tasks.
            </p>
            <p className="font-medium text-destructive">
              This action cannot be undone.
            </p>
          </div>

          {deleteError && (
            <p className="text-sm text-destructive">{deleteError}</p>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting…' : 'Delete Project'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
