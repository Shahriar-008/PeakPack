'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { usersApi } from '@/lib/api';
import { useUserStore } from '@/store/user';
import Link from 'next/link';

const styles = {
  cardSurface: { background: 'linear-gradient(135deg, #1A1A1A 0%, #121212 100%)', border: '1px solid rgba(255, 255, 255, 0.1)' },
  glowAccent: { boxShadow: '0 0 15px rgba(255, 90, 31, 0.3)' }
};

export default function EditProfilePage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, updateUser } = useUserStore();
  
  const fileRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(user?.name ?? '');
  const [bio, setBio] = useState(user?.bio ?? '');

  const { mutate: saveProfile, isPending: saving } = useMutation({
    mutationFn: () => usersApi.updateMe({ name, bio }),
    onSuccess: (updated) => {
      updateUser(updated);
      router.push('/profile');
    },
  });

  const { mutate: uploadAvatar, isPending: uploading } = useMutation({
    mutationFn: (file: File) => usersApi.uploadAvatar(file),
    onSuccess: (data) => {
      updateUser({ avatarKey: data.avatarUrl });
      queryClient.invalidateQueries({ queryKey: ['me'] });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveProfile();
  };

  return (
    <main className="flex-grow flex items-center justify-center p-margin pb-24 md:pb-xl text-on-background min-h-[calc(100vh-150px)]">
      <div className="w-full max-w-xl rounded-xl p-lg flex flex-col gap-lg shadow-2xl" style={styles.cardSurface}>
        {/* Header */}
        <header className="text-center">
          <h1 className="font-h2 text-h2 text-on-surface mb-xs">Edit Profile</h1>
          <p className="font-body-md text-body-md text-zinc-400">Update your athletic identity.</p>
        </header>

        <form onSubmit={handleSubmit} className="flex flex-col gap-md">
          {/* Avatar Upload */}
          <div className="flex flex-col items-center gap-sm">
            <div 
              onClick={() => fileRef.current?.click()}
              className="relative group cursor-pointer w-32 h-32 rounded-full overflow-hidden border-2 border-surface-variant flex items-center justify-center bg-surface-container" 
              style={styles.glowAccent}
            >
              {user?.avatarKey ? (
                <img 
                  alt="User Avatar" 
                  className={`w-full h-full object-cover transition-opacity duration-300 ${uploading ? 'opacity-50' : 'group-hover:opacity-50'}`} 
                  src={user.avatarKey} 
                />
              ) : (
                <span className={`text-5xl font-black text-white/20 transition-opacity duration-300 ${uploading ? 'opacity-50' : 'group-hover:opacity-10'}`}>
                  {user?.name?.charAt(0).toUpperCase() || 'A'}
                </span>
              )}
              
              <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 ${uploading ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                {uploading ? (
                  <div className="w-8 h-8 border-4 border-white/50 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <span className="material-symbols-outlined text-white text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>photo_camera</span>
                )}
              </div>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && uploadAvatar(e.target.files[0])}
            />
            <button 
              onClick={() => fileRef.current?.click()}
              className="font-label-bold text-label-bold text-primary-container hover:text-white transition-colors" 
              type="button"
              disabled={uploading}
            >
              Change Photo
            </button>
          </div>

          {/* Fields */}
          <div className="flex flex-col gap-gutter">
            <div className="flex flex-col gap-xs group">
              <label className="font-label-bold text-label-bold text-zinc-300 uppercase tracking-wide" htmlFor="displayName">Display Name</label>
              <input 
                id="displayName" 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-[#1A1A1A] border-0 border-b-2 border-white/10 focus:border-primary-container focus:ring-0 transition-colors font-body-lg text-body-lg text-on-surface w-full p-sm rounded-t" 
                required
              />
            </div>
            <div className="flex flex-col gap-xs group">
              <label className="font-label-bold text-label-bold text-zinc-300 uppercase tracking-wide" htmlFor="bio">Bio</label>
              <textarea 
                id="bio" 
                rows={4}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="bg-[#1A1A1A] border-0 border-b-2 border-white/10 focus:border-primary-container focus:ring-0 transition-colors font-body-md text-body-md text-on-surface w-full p-sm rounded-t resize-none"
                placeholder="Tell us about your fitness journey..."
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row-reverse gap-sm pt-margin mt-margin border-t border-white/5">
            <button 
              type="submit"
              disabled={saving}
              className="bg-primary-container text-black hover:shadow-[inset_0_0_10px_rgba(255,255,255,0.2)] font-label-bold text-label-bold uppercase py-sm px-xl rounded flex-1 sm:flex-none text-center transition-all disabled:opacity-50 flex justify-center items-center h-[42px]" 
            >
              {saving ? (
                <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin"></div>
              ) : (
                'Save Changes'
              )}
            </button>
            <Link 
              href="/profile"
              className="font-label-bold text-label-bold text-zinc-400 hover:text-white transition-colors py-sm px-xl text-center border border-transparent hover:border-white/10 rounded flex items-center justify-center" 
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </main>
  );
}
