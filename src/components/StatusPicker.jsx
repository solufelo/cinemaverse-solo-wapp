import { STATUS_LABELS, WATCH_STATUSES } from '../../shared/constants.ts'
import { STATUS_STYLES } from './ui'

/**
 * Four statuses as radio buttons. `md` is the composer's 2x2 of labelled plates;
 * `sm` is a compact icon row for cards (each still announces its label).
 */
export default function StatusPicker({ value, onChange, size = 'md', labelledBy, disabled }) {
  const compact = size === 'sm'
  return (
    <div className={compact ? 'grid grid-cols-4 gap-1' : 'grid grid-cols-2 gap-2'} role="radiogroup" aria-labelledby={labelledBy}>
      {WATCH_STATUSES.map((s) => {
        const on = value === s
        const st = STATUS_STYLES[s]
        const Icon = st.icon
        return (
          <button
            key={s}
            type="button"
            role="radio"
            aria-checked={on}
            aria-label={compact ? STATUS_LABELS[s] : undefined}
            title={compact ? STATUS_LABELS[s] : undefined}
            disabled={disabled}
            onClick={() => onChange(s)}
            className={`group/st relative flex items-center rounded-[4px] border transition duration-200 active:scale-[0.97] disabled:opacity-50 ${
              compact ? 'h-10 justify-center' : 'h-14 gap-3 px-4'
            } ${on ? `${st.ring} ${st.text}` : 'border-white/[0.09] text-slate-400 hover:border-white/25 hover:text-white'}`}
          >
            <Icon className={compact ? 'h-4 w-4' : 'h-4 w-4 shrink-0'} strokeWidth={on ? 2.5 : 1.75} />
            {compact ? null : (
              <span className="font-mono text-[11.5px] font-medium uppercase tracking-[0.12em]">{STATUS_LABELS[s]}</span>
            )}
            {on && !compact ? <span className={`ml-auto h-1.5 w-1.5 ${st.bg}`} aria-hidden="true" /> : null}
          </button>
        )
      })}
    </div>
  )
}
