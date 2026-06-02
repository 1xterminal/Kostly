import type { ReactNode } from 'react'

type Tone = 'blue' | 'green' | 'orange' | 'red' | 'gray'

const toneText: Record<Tone, string> = {
  blue: 'text-[#3045AF]',
  green: 'text-[#14B95B]',
  orange: 'text-[#D7440A]',
  red: 'text-[#D6420F]',
  gray: 'text-[#858585]',
}

const pillTone: Record<Tone, string> = {
  blue: 'border-[#70B9EA] bg-[#EAF6FF] text-[#0876BC]',
  green: 'border-[#5FE091] bg-[#E9FFF2] text-[#11B95A]',
  orange: 'border-[#F29D76] bg-[#FFF2ED] text-[#D7440A]',
  red: 'border-[#F0B4A4] bg-[#FFF1EE] text-[#D6420F]',
  gray: 'border-[#C7C7C7] bg-[#EFEFEF] text-[#6F7785]',
}

export function DashboardCanvas({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <section className={`mx-auto min-h-[calc(100vh-136px)] w-full rounded-[28px] border border-[#C8C8C8] bg-[#EFEFEF] px-4 py-7 sm:px-8 lg:px-12 ${className}`}>
      {children}
    </section>
  )
}

export function DashboardSearchRow({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div className={`mx-auto w-full max-w-3xl ${className}`}>
      {children}
    </div>
  )
}

export function MetricTile({
  label,
  value,
  active,
  onClick,
  tone = 'blue',
}: {
  label: string
  value: number | string
  active?: boolean
  onClick?: () => void
  tone?: Tone
}) {
  const Component = onClick ? 'button' : 'div'

  return (
    <Component
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={`min-h-[70px] rounded-md border px-4 py-3 text-left transition ${active
        ? 'border-[#9AA7DE] bg-[#FAFAFA] text-[#3045AF] shadow-[0_2px_6px_rgba(48,69,175,0.22)]'
        : 'border-[#C8C8C8] bg-[#F2F2F2] text-[#111111] hover:border-[#AFAFAF]'
      }`}
    >
      <p className={`text-[22px] font-bold leading-none ${active ? 'text-[#3045AF]' : toneText[tone]}`}>{value}</p>
      <p className={`mt-2 text-[14px] font-medium ${active ? 'text-[#3045AF]' : 'text-[#111111]'}`}>{label}</p>
    </Component>
  )
}

export function StatusPill({
  children,
  tone = 'gray',
}: {
  children: ReactNode
  tone?: Tone
}) {
  return (
    <span className={`inline-flex items-center justify-center rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] ${pillTone[tone]}`}>
      {children}
    </span>
  )
}

export function TableShell({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div className={`overflow-hidden rounded-md border border-[#C8C8C8] bg-[#F7F7F7] shadow-[0_2px_4px_rgba(0,0,0,0.12)] ${className}`}>
      <div className="overflow-x-auto">
        {children}
      </div>
    </div>
  )
}
