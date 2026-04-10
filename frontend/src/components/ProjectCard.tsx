import { useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import { FolderOpen, CheckSquare } from 'lucide-react'
import type { Project } from '../lib/types'

export function ProjectCard({ project }: { project: Project }) {
  const navigate = useNavigate()

  return (
    <div
      onClick={() => navigate(`/projects/${project.id}`)}
      className="bg-white border border-border rounded-lg p-5 cursor-pointer hover:border-primary/50 hover:shadow-sm transition-all"
    >
      <div className="flex items-start gap-3">
        <div className="p-2 bg-primary/10 rounded-md shrink-0">
          <FolderOpen className="w-4 h-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium truncate">{project.name}</h3>
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
            <span>
              {format(new Date(project.createdAt), 'MMM d, yyyy')}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
