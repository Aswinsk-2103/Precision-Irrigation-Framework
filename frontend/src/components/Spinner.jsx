import { Loader2 } from 'lucide-react'

export default function Spinner({ text = 'Loading...' }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-3">
      <Loader2 size={32} className="animate-spin text-primary" />
      <p className="text-text-muted text-sm">{text}</p>
    </div>
  )
}
