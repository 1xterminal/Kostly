import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link } from 'react-router'
import { useSignIn } from '@/hooks/useAuth'
import { emailSchema } from '@/lib/validation'

// ─── Schema ───────────────────────────────────────────────────────────────────

const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

type LoginForm = z.infer<typeof loginSchema>

// ─── Component ────────────────────────────────────────────────────────────────

export default function Login() {
  const { mutate: signIn, isPending, error } = useSignIn()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = (data: LoginForm) => signIn(data)

  return (
    <div className="min-h-screen bg-[#F0F0F0] flex items-center justify-center px-4 font-sans">
      <div className="w-full max-w-95">
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.05)] p-8 pt-9 border border-gray-100">
          <h1 className="text-[26px] font-bold text-gray-900 mb-6 tracking-tight">Login</h1>

          {/* API error */}
          {error && (
            <div className="mb-4 px-3 py-2 rounded-md bg-red-50 border border-red-100 text-sm text-red-600">
              {error.message}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-[13px] font-medium text-gray-500 mb-1.5">
                Email
              </label>
              <input
                id="email"
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

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-[13px] font-medium text-gray-500 mb-1.5">
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                className={`w-full px-3 py-2.5 rounded-md border text-sm outline-none transition
                  focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                  ${errors.password ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-white'}`}
                {...register('password')}
              />
              {errors.password && (
                <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>
              )}
            </div>

            {/* Forgot Password */}
            <div className="pt-1">
              <Link
                to="/forgot-password"
                className="text-[13px] text-gray-700 underline hover:text-gray-900"
              >
                Forgot password?
              </Link>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isPending}
              className="w-full py-2.5 px-4 rounded-md bg-[#3341A5] text-white text-sm font-medium
                hover:bg-[#283382] active:bg-[#202966] disabled:opacity-60 disabled:cursor-not-allowed
                transition-colors mt-6 flex items-center justify-center gap-2"
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                width="16" 
                height="16" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              >
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                <polyline points="10 17 15 12 10 7" />
                <line x1="15" y1="12" x2="3" y2="12" />
              </svg>
              {isPending ? 'Logging In…' : 'Log In'}
            </button>

          </form>
        </div>
      </div>
    </div>
  )
}
