// Run with: npx tsx scripts/seed-test-data.ts
// Inserts one family, one senior (the "Montserrat" test persona already
// used in pass 1's live tests), and one real pending question — so
// Home's "Family is asking" tile has something real to show instead of
// staying permanently hidden. Safe to re-run: checks for existing test
// data first rather than duplicating it.

import { readFileSync, existsSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'

function loadEnvLocal() {
  const path = new URL('../.env.local', import.meta.url)
  if (!existsSync(path)) return
  const content = readFileSync(path, 'utf-8')
  for (const line of content.split('\n')) {
    const match = line.match(/^([A-Z_]+)=(.*)$/)
    if (match && !process.env[match[1]]) {
      process.env[match[1]] = match[2]
    }
  }
}

loadEnvLocal()

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

async function main() {
  const { data: existingSenior } = await supabase
    .from('seniors')
    .select('id')
    .eq('preferred_name', 'Montserrat')
    .maybeSingle()

  let seniorId = existingSenior?.id as string | undefined
  let familyId: string | undefined

  if (!seniorId) {
    const { data: family, error: familyError } = await supabase
      .from('families')
      .insert({ name: 'Marta (test)', phone: '+34000000001' })
      .select('id')
      .single()
    if (familyError || !family) throw familyError ?? new Error('family insert failed')
    familyId = family.id

    const { data: senior, error: seniorError } = await supabase
      .from('seniors')
      .insert({
        family_id: familyId,
        name: 'Montserrat (test)',
        preferred_name: 'Montserrat',
        phone: '+34000000002',
        language: 'ca',
      })
      .select('id')
      .single()
    if (seniorError || !senior) throw seniorError ?? new Error('senior insert failed')
    seniorId = senior.id
    console.log('Created test family + senior:', { familyId, seniorId })
  } else {
    const { data: senior } = await supabase.from('seniors').select('family_id').eq('id', seniorId).single()
    familyId = senior?.family_id
    console.log('Test senior already exists:', seniorId)
  }

  const { data: existingQuestion } = await supabase
    .from('questions')
    .select('id')
    .eq('senior_id', seniorId)
    .eq('status', 'pending')
    .maybeSingle()

  if (existingQuestion) {
    console.log('A pending question already exists:', existingQuestion.id)
    return
  }

  const { data: question, error: questionError } = await supabase
    .from('questions')
    .insert({
      senior_id: seniorId,
      family_id: familyId,
      text: 'Com vas conèixer el pare?',
      status: 'pending',
    })
    .select('id')
    .single()
  if (questionError || !question) throw questionError ?? new Error('question insert failed')
  console.log('Created pending question:', question.id)
}

main()
  .then(() => {
    console.log('Done.')
    process.exit(0)
  })
  .catch((err) => {
    console.error('Seed failed:', err)
    process.exit(1)
  })
