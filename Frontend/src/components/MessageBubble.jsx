import { formatTime } from '../utils/dates'

export default function MessageBubble({ message, me }) {
  const mine = message.sender?.id === me.id
  return (
    <div className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[80%] rounded-3xl px-5 py-3 sm:max-w-[65%] ${mine ? 'rounded-tr-xl bg-brand-600 text-white' : 'rounded-tl-xl bg-white text-slate-900 shadow-card'}`}>
        <p className="whitespace-pre-wrap break-words text-base">{message.content}</p>
        <p className={`mt-1 flex items-center justify-end gap-1 text-sm ${mine ? 'text-brand-100' : 'text-slate-500'}`}>
          {formatTime(message.sentAt)}
          {mine && <span>{message.read ? '· Read' : '· Sent'}</span>}
        </p>
      </div>
    </div>
  )
}
