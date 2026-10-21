import { STATUS_LABELS, WATCH_STATUSES } from '../../shared/constants.ts'
import { STATUS_STYLES } from './ui'

export default function StatusPicker({ value, onChange, size = 'md', labelledBy, disabled }) {
  return (
    <div className={`grid grid-cols-2 gap-2 ${size === 'sm' ? 'sm:grid-cols-4' : ''}`} role="radiogroup" aria-labelledby={labelledBy}>
      {WATCH_STATUSES.map((s) => {
        const on = value === s
        const st = STATUS_STYLES[s]
        return (
          <button
            key={s}
            type="button"
            role="radio"
            aria-checked={on}
            disabled={disabled}
            onClick={() => onChange(s)}
            className={`flex items-center justify-center gap-1.5 rounded-lg border font-display uppercase tracking-wider transition disabled:opacity-50 ${
              size === 'sm' ? 'px-2 py-1.5 text-[10px]' : 'px-3 py-2.5 text-[11px]'
            } ${on ? `${st.ring} ${st.text}` : 'border-white/10 text-slate-400 hover:border-white/25 hover:text-white'}`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${on ? st.bg : 'bg-white/20'}`} />
            {STATUS_LABELS[s]}
          </button>
        )
      })}
    </div>
  )
}
