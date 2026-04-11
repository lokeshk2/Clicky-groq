import { MODEL_OPTIONS } from '@shared/types'

export function ModelPicker({
  value,
  onChange
}: {
  value: string
  onChange: (v: string) => void
}): JSX.Element {
  return (
    <label className="flex flex-col gap-1 text-xs text-zinc-400">
      Model
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1.5 text-sm text-white outline-none focus:border-sky-500"
      >
        {MODEL_OPTIONS.map((m) => (
          <option key={m.id} value={m.id}>
            {m.label}
          </option>
        ))}
      </select>
    </label>
  )
}
