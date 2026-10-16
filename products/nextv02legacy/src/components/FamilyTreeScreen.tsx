import { useEffect, useState } from 'react'
import { useGameStore } from '../game/store'
import { getStrings } from '../game/strings'
import { requestFamilyTree } from '../game/directorClient'
import type { FamilyMember } from '../game/types'

export default function FamilyTreeScreen() {
  const { profile, goTo } = useGameStore()
  const t = getStrings(profile.language).familyTree
  const [members, setMembers] = useState<FamilyMember[] | null>(null)

  useEffect(() => {
    requestFamilyTree().then(setMembers)
  }, [])

  return (
    <div className="min-h-screen bg-cream-deep flex flex-col items-center px-5 py-8">
      <div className="w-full max-w-md flex flex-col gap-6">
        <header className="flex items-center justify-between">
          <h1 className="font-display text-2xl text-ink">{t.title}</h1>
          <button onClick={() => goTo('home')} className="text-ink-soft text-sm underline">
            {t.back}
          </button>
        </header>

        {members === null && <p className="text-ink-soft text-lg">…</p>}

        {members?.length === 0 && <p className="text-ink-soft text-lg">{t.empty}</p>}

        <div className="flex flex-col gap-3">
          {members?.map((member) => (
            <div key={member.id} className="bg-surface border border-ink/10 rounded-2xl p-5 shadow-sm">
              <p className="text-xs uppercase tracking-wide text-terracotta font-semibold mb-1">
                {member.relationship}
              </p>
              <p className="font-display text-xl text-ink leading-snug">{member.name}</p>
              {member.note && <p className="text-ink-soft text-base mt-1">{member.note}</p>}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
