import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link } from 'react-router'
import { useResetPassword } from '@/hooks/useAuth'
import { emailSchema } from '@/lib/validation'

// ─── Schema ───────────────────────────────────────────────────────────────────

const schema = z.object({
  email: emailSchema,
})

type ForgotPasswordForm = z.infer<typeof schema>

// ─── Component ────────────────────────────────────────────────────────────────

export default function ForgotPassword() {
  const [sent, setSent] = useState(false)
  const { mutate: sendReset, isPending, error } = useResetPassword()

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<ForgotPasswordForm>({
    resolver: zodResolver(schema),
  })

  const onSubmit = ({ email }: ForgotPasswordForm) => {
    sendReset(email, { onSuccess: () => setSent(true) })
  }

  return (
    <div className="min-h-screen bg-[#F0F0F0] flex items-center justify-center px-4 font-sans">
      <div className="w-full max-w-95">
        <div className="bg-white rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.05)] p-8 pt-9 border border-gray-100">
          <div className="mb-7 flex items-center gap-4">
            <img
              src="/kostly-logo.png"
              alt=""
              className="h-16 w-16 rounded-2xl"
            />
            <div>
              <p className="text-3xl font-extrabold tracking-tight text-gray-950">Kostly</p>
              <p className="text-sm font-medium text-gray-500">Owner dashboard</p>
            </div>
          </div>

          {sent ? (
            /* ── Success state ── */
            <div className="text-center py-4">
              <div className="w-12 h-12 rounded-full bg-green-50 border border-green-100 flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24"
                  fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <h1 className="text-[22px] font-bold text-gray-900 mb-2">Check your inbox</h1>
              <p className="text-[13px] text-gray-500 mb-6">
                We sent a reset link to <span className="font-medium text-gray-700">{getValues('email')}</span>.
                Check your spam folder if you don't see it.
              </p>
              <Link
                to="/login"
                className="text-[13px] text-[#3341A5] hover:underline font-medium"
              >
                ← Back to login
              </Link>
            </div>
          ) : (
            /* ── Form state ── */
            <>
              <h1 className="text-[26px] font-bold text-gray-900 mb-2 tracking-tight">
                Forgot password?
              </h1>
              <p className="text-[13px] text-gray-500 mb-6 leading-relaxed">
                Enter the email address for your owner account. We will send a reset
                password link to your inbox.
              </p>

              {error && (
                <div className="mb-4 px-3 py-2 rounded-md bg-red-50 border border-red-100 text-sm text-red-600">
                  {error.message}
                </div>
              )}

              <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
                <div>
                  <label htmlFor="forgot-email" className="block text-[13px] font-medium text-gray-500 mb-1.5">
                    Email
                  </label>
                  <input
                    id="forgot-email"
                    type="email"
                    autoComplete="email"
                    className={`w-full px-3 py-2.5 rounded-md border text-sm outline-none transition
                      focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                      ${errors.email ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-white'}`}
                    {...register('email')}
                  />
                  {errors.email && (
                    <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>
                  )}
                </div>

                {/* Send reset link */}
                <button
                  type="submit"
                  disabled={isPending}
                  className="w-full py-2.5 px-4 rounded-md bg-[#3341A5] text-white text-sm font-medium
                    hover:bg-[#283382] active:bg-[#202966] disabled:opacity-60 disabled:cursor-not-allowed
                    transition-colors flex items-center justify-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24"
                    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="22" y1="2" x2="11" y2="13" />
                    <polygon points="22 2 15 22 11 13 2 9 22 2" />
                  </svg>
                  {isPending ? 'Sending…' : 'Send a Reset Link'}
                </button>

                {/* Cancel */}
                <Link
                  to="/login"
                  className="w-full py-2.5 px-4 rounded-md border border-gray-300 text-[#3341A5] text-sm
                    font-medium hover:bg-gray-50 transition-colors flex items-center justify-center"
                >
                  Cancel
                </Link>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
