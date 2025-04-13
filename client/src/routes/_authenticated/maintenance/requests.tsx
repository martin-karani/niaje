import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/maintenance/requests')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/_authenticated/maintenance/requests"!</div>
}
