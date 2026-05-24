import { redirect } from 'next/navigation'

// Redirect permanente da /debates/[id] → /think/[id]
// Mantiene la compatibilità con i vecchi link già indicizzati da Google
export default async function DebatesLegacyPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  redirect(`/think/${id}`)
}
