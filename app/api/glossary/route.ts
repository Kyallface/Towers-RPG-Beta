import { readGlossary } from '@/lib/rules/source'

// The glossary only changes when the repository does, so serve the file captured at build time.
export const dynamic = 'force-static'

export async function GET() {
  const json = await readGlossary()
  if (json === null) {
    return new Response('Glossary file not found.', {
      status: 404,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    })
  }
  return new Response(json, { headers: { 'Content-Type': 'application/json; charset=utf-8' } })
}
