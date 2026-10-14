import { readRules } from '@/lib/rules/source'

// The rules only change when the repository does, so serve the file captured at build time.
export const dynamic = 'force-static'

export async function GET() {
  const markdown = await readRules()
  if (markdown === null) {
    return new Response('Rules file not found.', {
      status: 404,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    })
  }
  return new Response(markdown, { headers: { 'Content-Type': 'text/markdown; charset=utf-8' } })
}
