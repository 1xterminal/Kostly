import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { KeyRound, LogOut, Mail, Phone, Save, UserRound } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { useSignOut, authKeys } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'

type OwnerProfile = {
  id: string
  name: string
  email: string
  phone_number: string | null
  role: string
}

export default function Profile() {
  const queryClient = useQueryClient()
  const { mutate: signOut, isPending: isSigningOut } = useSignOut()
  const [profile, setProfile] = useState<OwnerProfile | null>(null)
  const [name, setName] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSavingProfile, setIsSavingProfile] = useState(false)
  const [isSavingPassword, setIsSavingPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    async function loadProfile() {
      setIsLoading(true)
      setError(null)

      try {
        const { data: userData, error: userError } = await supabase.auth.getUser()
        if (userError || !userData.user) throw userError ?? new Error('Not authenticated')

        const { data, error: profileError } = await supabase
          .from('users')
          .select('id, name, email, phone_number, role')
          .eq('id', userData.user.id)
          .single()

        if (profileError) throw profileError
        if (!isMounted) return

        setProfile(data)
        setName(data.name ?? '')
        setPhoneNumber(data.phone_number ?? '')
      } catch (e: unknown) {
        if (isMounted) setError((e as Error).message)
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    void loadProfile()

    return () => {
      isMounted = false
    }
  }, [])

  const handleProfileSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!profile) return

    setIsSavingProfile(true)
    setError(null)
    setSuccess(null)

    try {
      const nextName = name.trim()
      const nextPhone = phoneNumber.trim() || null

      if (!nextName) throw new Error('Name is required')

      const { data, error: updateError } = await supabase
        .from('users')
        .update({ name: nextName, phone_number: nextPhone })
        .eq('id', profile.id)
        .select('id, name, email, phone_number, role')
        .single()

      if (updateError) throw updateError

      await supabase.auth.updateUser({
        data: {
          full_name: nextName,
          name: nextName,
        },
      })

      setProfile(data)
      queryClient.invalidateQueries({ queryKey: authKeys.session })
      setSuccess('Profile updated.')
    } catch (e: unknown) {
      setError((e as Error).message)
    } finally {
      setIsSavingProfile(false)
    }
  }

  const handlePasswordSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSavingPassword(true)
    setError(null)
    setSuccess(null)

    try {
      if (newPassword.length < 6) throw new Error('Password must be at least 6 characters')
      if (newPassword !== confirmPassword) throw new Error('Passwords do not match')

      const { error: passwordError } = await supabase.auth.updateUser({
        password: newPassword,
      })

      if (passwordError) throw passwordError

      setNewPassword('')
      setConfirmPassword('')
      setSuccess('Password changed.')
    } catch (e: unknown) {
      setError((e as Error).message)
    } finally {
      setIsSavingPassword(false)
    }
  }

  if (isLoading) {
    return <div className="p-6 text-sm text-gray-500">Loading profile...</div>
  }

  return (
    <div className="mx-auto max-w-5xl space-y-5 p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-950">Profile</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage owner account information and password.
          </p>
        </div>

        <button
          onClick={() => signOut()}
          disabled={isSigningOut}
          className="inline-flex items-center rounded-md border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
        >
          <LogOut className="mr-2 h-4 w-4" />
          {isSigningOut ? 'Signing out...' : 'Sign Out'}
        </button>
      </div>

      {(error || success) && (
        <div className={`rounded-md border px-4 py-3 text-sm ${error ? 'border-red-200 bg-red-50 text-red-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}>
          {error ?? success}
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
        <form onSubmit={handleProfileSave} className="rounded-lg border border-gray-200 bg-white p-6 shadow">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-md bg-blue-50 text-[#3B5998]">
              <UserRound className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-950">Owner Info</h2>
              <p className="text-sm text-gray-500">This is shown inside the dashboard.</p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-semibold text-gray-800">Full Name</label>
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-800">Phone Number</label>
              <input
                value={phoneNumber}
                onChange={(event) => setPhoneNumber(event.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-semibold text-gray-800">Email</label>
            <div className="mt-1 flex items-center rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-500">
              <Mail className="mr-2 h-4 w-4" />
              {profile?.email}
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              type="submit"
              disabled={isSavingProfile}
              className="inline-flex items-center rounded-md bg-[#3B5998] px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-50"
            >
              <Save className="mr-2 h-4 w-4" />
              {isSavingProfile ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </form>

        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow">
          <div className="mb-5 h-16 w-16 rounded-full bg-gray-200" />
          <p className="text-2xl font-bold text-gray-950">{profile?.name}</p>
          <p className="mt-1 text-sm text-gray-500">{profile?.role === 'owner' ? 'Owner / Manager' : profile?.role}</p>
          <div className="mt-5 space-y-3 text-sm text-gray-600">
            <div className="flex items-center">
              <Mail className="mr-3 h-4 w-4 text-gray-400" />
              {profile?.email}
            </div>
            <div className="flex items-center">
              <Phone className="mr-3 h-4 w-4 text-gray-400" />
              {profile?.phone_number || 'No phone number'}
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handlePasswordSave} className="rounded-lg border border-gray-200 bg-white p-6 shadow">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-md bg-gray-100 text-gray-700">
            <KeyRound className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-950">Change Password</h2>
            <p className="text-sm text-gray-500">Updates the current owner login password.</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-semibold text-gray-800">New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-800">Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="submit"
            disabled={isSavingPassword}
            className="inline-flex items-center rounded-md bg-[#3B5998] px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-50"
          >
            <KeyRound className="mr-2 h-4 w-4" />
            {isSavingPassword ? 'Changing...' : 'Change Password'}
          </button>
        </div>
      </form>
    </div>
  )
}
