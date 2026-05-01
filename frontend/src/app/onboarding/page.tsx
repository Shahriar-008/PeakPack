'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useMutation } from '@tanstack/react-query';
import { usersApi, packsApi } from '@/lib/api';
import { useUserStore } from '@/store/user';
import type { GoalType } from '@/types';

const GOAL_OPTIONS: { type: GoalType; icon: string; label: string; desc: string; image: string; color: string; border: string; glow: string }[] = [
  { 
    type: 'weight_loss', 
    icon: 'local_fire_department', 
    label: 'Weight Loss', 
    desc: 'Shed pounds through high-intensity circuits and caloric deficit tracking.',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD_KlcM_vxckc5Y5CT0Y28q7CPdkO11_WK-KWc7iDDvN70351rdMkPZK3HU_q4WmvuVVB9ZXQJvKqH0HQmALby769ysrTNMO2buXKB2yL-95YsV3YZlsGcY7U90K3t_FgTcwywt-SfrYBKgpfZFDCQGzThVX89L6NbFR5X2SyG7PTjSIfY3ro91DxpE5yITbOQUAiwysVXTsI637G0MwZBW7HQLmsaQhK2JKYhdX0HxtmI5GMNQCaIuNPKMSIbzVn1eaOxnjpZsC3s',
    color: 'text-primary-container',
    border: 'group-hover:border-primary-container',
    glow: 'bg-primary-container'
  },
  { 
    type: 'muscle_gain', 
    icon: 'fitness_center', 
    label: 'Muscle Gain', 
    desc: 'Hypertrophy-focused programming designed to build serious mass and strength.',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBYEtJtQ49E-PPx8zjH_4fjOyItp9yoLz7opNPD66bHH38E-Nk6mzVSnaIYupSXz3uCAhZpOCCFhd95m_kVs6WFsVYY10Tbeu3G4chE8Rbp1d96O1aC-VN-38TYcvuuN6o3oaUL7ZmBl99kfUBh3dP8Ye41JFcVmwBFi5RIxS2_fSN84amFkxKWYcgux1zE1k1yg2NQKtMmteS05KKNsowaBgE6nszD21BX9rsGtgyZsARR-7XOrsKVWfq2JG06btJeV_DOLSa4j1o',
    color: 'text-secondary-container',
    border: 'group-hover:border-secondary-container',
    glow: 'bg-secondary-container'
  },
  { 
    type: 'endurance', 
    icon: 'directions_run', 
    label: 'Endurance', 
    desc: 'Elevate your VO2 max and stamina for long-distance performance.',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBiJetCrdjLyiw_9lLz5bK6-28K2fHwc3UyD98d3JBBI-IwGatolKwFbTvYXUtV_NFbJY_TsQ4T_nd9cXBeQOqxCTBi1KV15kwCR_0dF8HTM74qGT2rkFE7Hjr3zJ0Mnnmqr0vQVm1k-6qy9G1F4Xk078-r840Yik2RFgeg28NRdTqTgbd3dSPfe3t8KC3kOXe8fMSJ67-Bky98y4Z3xDGNX4uVLnyP9A3QlzuBOqzSvvDFd3s8tywFOSen52iZkdcJ4nJSmEBuUWM',
    color: 'text-tertiary-container',
    border: 'group-hover:border-tertiary-container',
    glow: 'bg-tertiary-container'
  },
  { 
    type: 'clean_eating', 
    icon: 'restaurant', 
    label: 'Clean Eating', 
    desc: 'Focus purely on metabolic health and optimizing your nutritional intake.',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCjpoeKMhTYObmVtN6JMRRz583tQPYaAa0B080agVp4YUdGASB8Ppjvo6g6FfohXBMoEtjgfRfJvZoaaujb7ijLzRIBKl9_oaGDt2G6m2nOvBKlYI29oPRUAjX2PlBDxBbcla-5AhcwUy0q8AuS6CAjq2XvaRKmfRLpfUMRdIVW0tm4Iw2hIW9_1If07MxpH0ukOFrBpvQlibLdW__O0xCFOeD9CpB8NDcNTDGa44BwThL1zeNdbI-6zPeM81YuaUMtXhDtwS7L_cQ',
    color: 'text-primary-fixed-dim',
    border: 'group-hover:border-primary-fixed-dim',
    glow: 'bg-primary-fixed-dim'
  },
  { 
    type: 'custom', 
    icon: 'tune', 
    label: 'Custom Build', 
    desc: 'Mix modalities. Build a hybrid routine that fits your specific performance needs.',
    image: '', // Will use solid gradient
    color: 'text-outline',
    border: 'group-hover:border-white',
    glow: 'bg-white'
  },
];

export default function OnboardingPage() {
  const router = useRouter();
  const { updateUser } = useUserStore();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [goalType, setGoalType] = useState<GoalType>('custom');
  const [goalDesc, setGoalDesc] = useState('');
  const [packAction, setPackAction] = useState<'create' | 'join' | 'skip' | null>(null);
  const [packName, setPackName] = useState('');
  const [packDesc, setPackDesc] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [bio, setBio] = useState('');
  const [stepError, setStepError] = useState<string | null>(null);

  const { mutate: createPack, isPending: creatingPack } = useMutation({
    mutationFn: () => packsApi.create({ name: packName.trim(), description: packDesc || undefined, goalType }),
    onSuccess: () => {
      setStepError(null);
      setStep(3);
    },
    onError: (err: any) => {
      setStepError(err?.response?.data?.error?.message || 'Could not create pack. Please try again.');
    },
  });

  const { mutate: joinPack, isPending: joiningPack } = useMutation({
    mutationFn: () => packsApi.join(inviteCode.trim().toUpperCase()),
    onSuccess: () => {
      setStepError(null);
      setStep(3);
    },
    onError: (err: any) => {
      setStepError(err?.response?.data?.error?.message || 'Could not join pack. Please check the invite code.');
    },
  });

  const { mutate: finish, isPending: finishing } = useMutation({
    mutationFn: async () => {
      await usersApi.updateMe({
        goalType,
        goalDescription: goalDesc || undefined,
        bio: bio || undefined,
        onboardingDone: true,
      });
    },
    onSuccess: () => {
      updateUser({ onboardingDone: true });
      setStepError(null);
      router.push('/dashboard');
    },
    onError: (err: any) => {
      setStepError(
        err?.response?.data?.error?.message ||
        (err?.message?.includes('Network Error') ? 'Could not reach the server. Please check your connection and try again.' : null) ||
        'Could not finish onboarding. Please try again.'
      );
    },
  });

  return (
    <div className="bg-[#0A0A0A] text-on-background min-h-screen flex flex-col font-body-md overflow-x-hidden">
      {/* Top Progress Bar Container */}
      <div className="fixed top-0 left-0 w-full z-50 p-6 bg-[#0A0A0A]/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="text-h3 font-h3 italic text-primary-container tracking-widest hidden sm:block">PEAKPACK</div>
          <div className="flex-1 max-w-md mx-auto h-3 bg-surface-container-high rounded-full overflow-hidden border border-white/10">
            <div 
              className="h-full bg-gradient-to-r from-primary-container to-tertiary-container shadow-[0_0_10px_rgba(255,90,31,0.5)] transition-all duration-500 ease-in-out"
              style={{ width: `${(step / 3) * 100}%` }}
            ></div>
          </div>
          <div className="text-label-bold font-label-bold text-outline uppercase hidden sm:block">Step {step} of 3</div>
        </div>
      </div>

      <main className="flex-grow flex flex-col items-center justify-center p-6 mt-xl mb-xl">
        <div className="w-full max-w-4xl">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div key="s1" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}>
                {/* Step 1: Goal Selection */}
                <div className="text-center mb-xl">
                  <h1 className="text-h1 font-h1 mb-md">Define Your Fire</h1>
                  <p className="text-body-lg font-body-lg text-on-surface-variant max-w-2xl mx-auto">Select your primary objective. This dictates your training intensity, nutrition baseline, and pack recommendations.</p>
                </div>

                {/* Bento Grid for Goals */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-md">
                  {GOAL_OPTIONS.map((goal, idx) => {
                    const isSelected = goalType === goal.type;
                    const isCustom = goal.type === 'custom';
                    
                    return (
                      <button 
                        key={goal.type}
                        onClick={() => setGoalType(goal.type)}
                        className={`relative group bg-gradient-to-br from-[#1A1A1A] to-[#121212] rounded-xl p-6 text-left transition-colors duration-300 overflow-hidden min-h-[200px] flex flex-col justify-end
                          ${isCustom ? 'md:col-span-2 lg:col-span-2' : ''}
                          ${isSelected ? `border-2 ${goal.glow.replace('bg-', 'border-')} shadow-[0_0_20px_rgba(255,90,31,0.2)]` : `border border-white/10 ${goal.border}`}
                        `}
                      >
                        {!isCustom && (
                          <div 
                            className={`absolute inset-0 bg-cover bg-center transition-opacity duration-300 ${isSelected ? 'opacity-50' : 'opacity-30 group-hover:opacity-50'}`} 
                            style={{ backgroundImage: `url('${goal.image}')` }}
                          ></div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent"></div>
                        {isSelected && <div className={`absolute inset-0 ${goal.glow.replace('bg-', 'bg-')}/10`}></div>}
                        
                        <div className={`relative z-10 ${isCustom ? 'flex items-center justify-between w-full' : ''}`}>
                          <div>
                            <span className={`material-symbols-outlined text-[40px] mb-4 transition-transform ${isCustom ? 'text-outline-variant group-hover:text-white' : `${goal.color} group-hover:scale-110`} ${isSelected ? 'icon-fill' : ''}`} style={isSelected ? { fontVariationSettings: "'FILL' 1" } : {}}>
                              {goal.icon}
                            </span>
                            <h3 className={`text-h3 font-h3 mb-2 ${isSelected ? 'text-white' : isCustom ? 'text-outline group-hover:text-white' : ''}`}>
                              {goal.label}
                            </h3>
                            <p className={`text-body-md font-body-md max-w-md ${isSelected ? goal.color : 'text-on-surface-variant'} ${isCustom ? '' : 'line-clamp-2'}`}>
                              {goal.desc}
                            </p>
                          </div>
                          {isCustom && <span className="material-symbols-outlined text-outline text-[32px] group-hover:text-white transition-colors">arrow_forward</span>}
                        </div>
                        
                        <div className={`absolute top-4 right-4 w-6 h-6 rounded-full border-2 flex items-center justify-center
                          ${isSelected ? `${goal.glow.replace('bg-', 'border-')} ${goal.glow}` : `border-white/20 ${goal.border}`}
                        `}>
                          {isSelected ? (
                            <span className="material-symbols-outlined text-white text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>check</span>
                          ) : (
                            <div className={`w-3 h-3 rounded-full ${goal.glow} opacity-0 group-hover:opacity-100 transition-opacity`}></div>
                          )}
                        </div>
                      </button>
                    )
                  })}
                </div>

                {goalType === 'custom' && (
                  <div className="mt-8">
                    <label className="font-label-bold text-label-bold text-on-surface-variant mb-xs uppercase tracking-wide block" htmlFor="goal-desc">
                      Describe your goal
                    </label>
                    <input 
                      className="w-full bg-surface-container-low text-on-surface font-body-md text-body-md px-sm py-sm rounded-none border-0 border-b-2 border-surface-bright focus:ring-0 focus:border-primary-container transition-colors placeholder:text-inverse-on-surface" 
                      id="goal-desc" 
                      placeholder="e.g. Run a 5K by July..." 
                      value={goalDesc} 
                      onChange={(e) => setGoalDesc(e.target.value)} 
                    />
                  </div>
                )}
              </motion.div>
            )}

            {step === 2 && (
              <motion.div key="s2" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}>
                <div className="text-center mb-xl">
                  <h1 className="text-h1 font-h1 mb-md">Join or create a Pack</h1>
                  <p className="text-body-lg font-body-lg text-on-surface-variant max-w-2xl mx-auto">Accountability is better together.</p>
                </div>

                <div className="space-y-4 max-w-lg mx-auto">
                  {[
                    { key: 'create', icon: 'group_add', label: 'Create a Pack', desc: 'Start your own group' },
                    { key: 'join', icon: 'key', label: 'Join with code', desc: 'Enter an invite code' },
                    { key: 'skip', icon: 'skip_next', label: 'Skip for now', desc: 'You can join later' },
                  ].map(({ key, icon, label, desc }) => (
                    <button
                      key={key}
                      onClick={() => { setStepError(null); setPackAction(key as typeof packAction); }}
                      className={`w-full flex items-center gap-4 p-6 rounded-xl border text-left transition-all ${
                        packAction === key 
                          ? 'border-primary-container bg-primary-container/10 shadow-[0_0_20px_rgba(255,90,31,0.15)]' 
                          : 'border-white/10 hover:border-white/20 bg-surface/40'
                      }`}
                    >
                      <span className={`material-symbols-outlined text-[32px] ${packAction === key ? 'text-primary-container' : 'text-on-surface-variant'}`} style={packAction === key ? { fontVariationSettings: "'FILL' 1" } : {}}>{icon}</span>
                      <div>
                        <p className={`text-h3 font-h3 ${packAction === key ? 'text-primary-container' : ''}`}>{label}</p>
                        <p className="text-body-md font-body-md text-on-surface-variant">{desc}</p>
                      </div>
                    </button>
                  ))}
                </div>

                <AnimatePresence>
                  {packAction === 'create' && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="space-y-4 mt-8 max-w-lg mx-auto overflow-hidden">
                      <div>
                        <label className="font-label-bold text-label-bold text-on-surface-variant mb-xs uppercase tracking-wide block" htmlFor="pack-name">Pack Name</label>
                        <input className="w-full bg-surface-container-low text-on-surface font-body-md text-body-md px-sm py-sm rounded-none border-0 border-b-2 border-surface-bright focus:ring-0 focus:border-primary-container transition-colors placeholder:text-inverse-on-surface" id="pack-name" placeholder="The Grindset" value={packName} onChange={(e) => setPackName(e.target.value)} />
                      </div>
                      <div>
                        <label className="font-label-bold text-label-bold text-on-surface-variant mb-xs uppercase tracking-wide block" htmlFor="pack-desc">Description (optional)</label>
                        <textarea className="w-full bg-surface-container-low text-on-surface font-body-md text-body-md px-sm py-sm rounded-none border-0 border-b-2 border-surface-bright focus:ring-0 focus:border-primary-container transition-colors placeholder:text-inverse-on-surface" id="pack-desc" placeholder="What are you all training for?" rows={2} value={packDesc} onChange={(e) => setPackDesc(e.target.value)} />
                      </div>
                    </motion.div>
                  )}
                  {packAction === 'join' && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mt-8 max-w-lg mx-auto overflow-hidden">
                      <label className="font-label-bold text-label-bold text-on-surface-variant mb-xs uppercase tracking-wide block" htmlFor="invite-code">Invite Code</label>
                      <input className="w-full bg-surface-container-low text-on-surface font-body-md text-body-md px-sm py-sm rounded-none border-0 border-b-2 border-surface-bright focus:ring-0 focus:border-primary-container transition-colors placeholder:text-inverse-on-surface" id="invite-code" placeholder="e.g. ABC12345" value={inviteCode} onChange={(e) => setInviteCode(e.target.value)} />
                    </motion.div>
                  )}
                </AnimatePresence>

                {stepError && <p className="text-sm font-label-bold text-error text-center mt-4">{stepError}</p>}
              </motion.div>
            )}

            {step === 3 && (
              <motion.div key="s3" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}>
                <div className="text-center mb-xl">
                  <h1 className="text-h1 font-h1 mb-md">One last thing</h1>
                  <p className="text-body-lg font-body-lg text-on-surface-variant max-w-2xl mx-auto">Let your Pack know who you are.</p>
                </div>

                <div className="max-w-lg mx-auto">
                  <label className="font-label-bold text-label-bold text-on-surface-variant mb-xs uppercase tracking-wide block" htmlFor="bio">Bio (optional)</label>
                  <textarea 
                    className="w-full bg-surface-container-low text-on-surface font-body-md text-body-md px-sm py-sm rounded-none border-0 border-b-2 border-surface-bright focus:ring-0 focus:border-primary-container transition-colors placeholder:text-inverse-on-surface" 
                    id="bio" 
                    placeholder="Tell your Pack a bit about yourself..." 
                    rows={3} 
                    value={bio} 
                    onChange={(e) => setBio(e.target.value)} 
                  />
                  {stepError && <p className="text-sm font-label-bold text-error mt-4">{stepError}</p>}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Bottom Navigation / Action Area */}
      <div className="fixed bottom-0 left-0 w-full p-6 bg-gradient-to-t from-background via-background/90 to-transparent pointer-events-none z-50">
        <div className="max-w-4xl mx-auto flex justify-between items-center pointer-events-auto">
          {step > 1 ? (
            <button 
              className="px-6 py-3 text-label-bold font-label-bold text-on-surface-variant hover:text-white transition-colors"
              onClick={() => { setStepError(null); setStep((s) => (s - 1) as 1 | 2); }}
              disabled={creatingPack || joiningPack || finishing}
            >
              BACK
            </button>
          ) : <div></div>}
          
          <button 
            className={`bg-primary-container text-black font-label-bold text-label-bold uppercase px-8 py-4 rounded-full hover:bg-white transition-all shadow-[0_0_20px_rgba(255,90,31,0.4)] hover:shadow-[0_0_30px_rgba(255,255,255,0.6)] flex items-center gap-2 group active:scale-95 disabled:opacity-50 disabled:pointer-events-none`}
            onClick={() => {
              setStepError(null);
              if (step === 1) {
                setStep(2);
              } else if (step === 2) {
                if (packAction === 'create') createPack();
                else if (packAction === 'join') joinPack();
                else setStep(3);
              } else if (step === 3) {
                finish();
              }
            }}
            disabled={
              creatingPack || joiningPack || finishing ||
              (step === 2 && !packAction) ||
              (step === 2 && packAction === 'create' && packName.trim().length < 2) ||
              (step === 2 && packAction === 'join' && inviteCode.trim().length < 4)
            }
          >
            {creatingPack || joiningPack || finishing ? 'Processing...' : step === 3 ? "Let's Go" : 'Continue'}
            {!(creatingPack || joiningPack || finishing) && <span className="material-symbols-outlined text-[20px] group-hover:translate-x-1 transition-transform">arrow_forward</span>}
          </button>
        </div>
      </div>
    </div>
  );
}
