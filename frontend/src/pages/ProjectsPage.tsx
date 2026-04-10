import { useEffect, useState } from 'react'
import { FolderPlus } from 'lucide-react'
import { useProjects } from '../hooks/useProjects'
import { Navbar } from '../components/Navbar'
import { ProjectCard } from '../components/ProjectCard'
import { ProjectModal } from '../components/ProjectModal'
import { EmptyState } from '../components/EmptyState'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { Button } from '../components/ui/button'

export default function ProjectsPage() {
  const { projects, isLoading, error, fetchProjects, createProject } = useProjects()
  const [modalOpen, setModalOpen] = useState(false)

  useEffect(() => {
    void fetchProjects()
  }, [fetchProjects])

  if (isLoading) return <LoadingSpinner />

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between gap-3 mb-6">
          <h1 className="text-2xl font-bold">Projects</h1>
          <Button onClick={() => setModalOpen(true)} className="shrink-0">
            <FolderPlus className="w-4 h-4" />
            New Project
          </Button>
        </div>

        {error && (
          <div className="bg-destructive/10 text-destructive text-sm rounded-md px-4 py-3 mb-4">
            {error}
          </div>
        )}

        {projects.length === 0 ? (
          <EmptyState
            icon={<FolderPlus className="w-10 h-10" />}
            message="No projects yet. Create your first project to get started."
            action={
              <Button onClick={() => setModalOpen(true)}>Create Project</Button>
            }
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        )}
      </main>

      <ProjectModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={async (data) => {
          await createProject(data.name, data.description)
        }}
      />
    </div>
  )
}
