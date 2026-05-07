import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useUpdatePassword } from '@/hooks/useAuth'

// ─── Schema ───────────────────────────────────────────────────────────────────

const schema = z
  .object({
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirm:  z.string(),
  })
  .refine((d) => d.password === d.confirm, {
    message: 'Passwords do not match',
    path: ['confirm'],
  })

type ResetPasswordForm = z.infer<typeof schema>

// ─── Component ────────────────────────────────────────────────────────────────

export default function ResetPassword() {
  const { mutate: updatePassword, isPending, error } = useUpdatePassword()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordForm>({
    resolver: zodResolver(schema),
  })

  const onSubmit = ({ password }: ResetPasswordForm) => updatePassword(password)

  return (
    <div className="min-h-screen bg-[#F0F0F0] flex items-center justify-center px-4 font-sans">
      <div className="w-full max-w-95">
        <div className="bg-white rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.05)] p-8 pt-9 border border-gray-100">

          <h1 className="text-[26px] font-bold text-gray-900 mb-2 tracking-tight">
            Reset password
          </h1>
          <p className="text-[13px] text-gray-500 mb-6 leading-relaxed">
            Please enter your new password. Make sure to remember your password.
          </p>

          {error && (
            <div className="mb-4 px-3 py-2 rounded-md bg-red-50 border border-red-100 text-sm text-red-600">
              {error.message}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">

            {/* New password */}
            <div>
              <label htmlFor="reset-password" className="block text-[13px] font-medium text-gray-500 mb-1.5">
                Password
              </label>
              <input
                id="reset-password"
                type="password"
                autoComplete="new-password"
                className={`w-full px-3 py-2.5 rounded-md border text-sm outline-none transition
                  focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                  ${errors.password ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-white'}`}
                {...register('password')}
              />
              {errors.password && (
                <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>
              )}
            </div>

            {/* Confirm password */}
            <div>
              <label htmlFor="reset-confirm" className="block text-[13px] font-medium text-gray-500 mb-1.5">
                Confirm password
              </label>
              <input
                id="reset-confirm"
                type="password"
                autoComplete="new-password"
                className={`w-full px-3 py-2.5 rounded-md border text-sm outline-none transition
                  focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                  ${errors.confirm ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-white'}`}
                {...register('confirm')}
              />
              {errors.confirm && (
                <p className="mt-1 text-xs text-red-500">{errors.confirm.message}</p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isPending}
              className="w-full py-2.5 px-4 rounded-md bg-[#3341A5] text-white text-sm font-medium
                hover:bg-[#283382] active:bg-[#202966] disabled:opacity-60 disabled:cursor-not-allowed
                transition-colors mt-2 flex items-center justify-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24"
                fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v14a2 2 0 0 1-2 2z" />
                <polyline points="17 21 17 13 7 13 7 21" />
                <polyline points="7 3 7 8 15 8" />
              </svg>
              {isPending ? 'Saving…' : 'Change password'}
            </button>

          </form>
        </div>
      </div>
    </div>
  )
}
