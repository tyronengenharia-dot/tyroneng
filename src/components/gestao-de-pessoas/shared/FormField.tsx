'use client'

interface FormFieldProps {
  label: string
  required?: boolean
  children: React.ReactNode
  hint?: string
}

export function FormField({ label, required, children, hint }: FormFieldProps) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {children}
      {hint && <p className="text-xs text-gray-600">{hint}</p>}
    </div>
  )
}

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export function Input({ className = '', ...props }: InputProps) {
  return (
    <input
      {...props}
      className={`
        w-full px-3.5 py-2.5 bg-[#1a1a1a] border border-white/8 rounded-xl text-sm text-white
        placeholder:text-gray-600 focus:outline-none focus:border-white/20 transition-colors
        ${className}
      `}
    />
  )
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options: { value: string; label: string }[]
}

export function Select({ options, className = '', ...props }: SelectProps) {
  return (
    <select
      {...props}
      className={`
        w-full px-3.5 py-2.5 bg-[#1a1a1a] border border-white/8 rounded-xl text-sm text-white
        focus:outline-none focus:border-white/20 transition-colors appearance-none cursor-pointer
        ${className}
      `}
    >
      {options.map(o => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  )
}

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

export function Textarea({ className = '', ...props }: TextareaProps) {
  return (
    <textarea
      {...props}
      className={`
        w-full px-3.5 py-2.5 bg-[#1a1a1a] border border-white/8 rounded-xl text-sm text-white
        placeholder:text-gray-600 focus:outline-none focus:border-white/20 transition-colors resize-none
        ${className}
      `}
    />
  )
}
