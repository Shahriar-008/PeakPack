'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useMutation } from '@tanstack/react-query';
import { Target, Users, User, ChevronRight, ChevronLeft, Check } from 'lucide-react';
import { usersApi, packsApi } from '@/lib/api';
import { useUserStore } from '@/store/user';
import { Button, Input, Card, Textarea } from '@/components/ui';
import type { GoalType } from '@/types';

const GOAL_OPTIONS: { type: GoalType; emoji: string; label: string; desc: string }[] = [
  { type: 'weight_loss', emoji: '??', label: 'Weight Loss', desc: 'Lose fat, get leaner' },
  { type: 'muscle_gain', emoji: '??', label: 'Muscle Gain', desc: 'Build strength and mass' },
  { type: 'endurance', emoji: '??', label: 'Endurance', desc: 'Run farther, last longer' },
  { type: 'clean_eating', emoji: '??', label: 'Clean Eating', desc: 'Dial in nutrition habits' },
  { type: 'custom', emoji: '??', label: 'Custom Goal', desc: 'Define your own objective' },
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
      setStepError(err?.response?.data?.error?.message || 'Could not finish onboarding. Please try again.');
    },
  });

  const steps = [
    { n: 1, icon: Target, label: 'Goal' },
    { n: 2, icon: Users, label: 'Pack' },
    { n: 3, icon: User, label: 'Profile' },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[rgb(var(--background))]">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-60 w-[500px] h-[500px] bg-indigo-500/8 rounded-full blur-[140px]" />
        <div className="absolute bottom-1/4 -right-60 w-[500px] h-[500px] bg-violet-500/6 rounded-full blur-[140px]" />
      </div>

      <div className="w-full max-w-md relative">
        <div className="flex items-center justify-center gap-3 mb-8">
          {steps.map(({ n, icon: Icon, label }, idx) => (
            <div key={n} className="flex items-center gap-3">
              <div className="flex flex-col items-center gap-1">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                  step >= n
                    ? 'bg-gradient-to-br from-indigo-500 to-violet-500 shadow-lg shadow-indigo-500/30'
                    : 'bg-white/8 border border-white/10'
                }`}>
                  {step > n ? <Check className="w-4 h-4 text-white" /> : <Icon className={`w-4 h-4 ${step >= n ? 'text-white' : 'text-gray-500'}`} />}
                </div>
                <span className={`text-[10px] font-medium ${step >= n ? 'text-indigo-400' : 'text-gray-600'}`}>{label}</span>
              </div>
              {idx < steps.length - 1 && <div className={`w-12 h-px mt-[-16px] transition-colors ${step > n ? 'bg-indigo-500' : 'bg-white/10'}`} />}
            </div>
          ))}
        </div>

        <Card className="overflow-hidden">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div key="s1" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }} className="p-6 space-y-5">
                <div>
                  <h2 className="text-xl font-black mb-1">What&apos;s your main goal?</h2>
                  <p className="text-sm text-[rgb(var(--muted-foreground))]">This helps your Pack understand what you&apos;re working toward.</p>
                </div>

                <div className="space-y-2">
                  {GOAL_OPTIONS.map(({ type, emoji, label, desc }) => (
                    <button
                      key={type}
                      onClick={() => setGoalType(type)}
                      className={`w-full flex items-center gap-4 p-4 rounded-xl border text-left transition-all ${goalType === type ? 'border-indigo-500/50 bg-indigo-500/10' : 'border-white/8 hover:border-white/20'}`}
                    >
                      <span className="text-2xl">{emoji}</span>
                      <div>
                        <p className={`text-sm font-semibold ${goalType === type ? 'text-indigo-400' : ''}`}>{label}</p>
                        <p className="text-xs text-[rgb(var(--muted-foreground))]">{desc}</p>
                      </div>
                      {goalType === type && <Check className="w-4 h-4 text-indigo-400 ml-auto" />}
                    </button>
                  ))}
                </div>

                {goalType === 'custom' && (
                  <Input label="Describe your goal" id="goal-desc" placeholder="e.g. Run a 5K by July..." value={goalDesc} onChange={(e) => setGoalDesc(e.target.value)} />
                )}

                <Button className="w-full" onClick={() => { setStepError(null); setStep(2); }}>
                  Next <ChevronRight className="w-4 h-4" />
                </Button>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div key="s2" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }} className="p-6 space-y-5">
                <div>
                  <h2 className="text-xl font-black mb-1">Join or create a Pack</h2>
                  <p className="text-sm text-[rgb(var(--muted-foreground))]">Accountability is better together.</p>
                </div>

                <div className="space-y-2">
                  {[
                    { key: 'create', emoji: '???', label: 'Create a Pack', desc: 'Start your own group' },
                    { key: 'join', emoji: '??', label: 'Join with code', desc: 'Enter an invite code' },
                    { key: 'skip', emoji: '??', label: 'Skip for now', desc: 'You can join later' },
                  ].map(({ key, emoji, label, desc }) => (
                    <button
                      key={key}
                      onClick={() => { setStepError(null); setPackAction(key as typeof packAction); }}
                      className={`w-full flex items-center gap-4 p-4 rounded-xl border text-left transition-all ${packAction === key ? 'border-indigo-500/50 bg-indigo-500/10' : 'border-white/8 hover:border-white/20'}`}
                    >
                      <span className="text-2xl">{emoji}</span>
                      <div>
                        <p className={`text-sm font-semibold ${packAction === key ? 'text-indigo-400' : ''}`}>{label}</p>
                        <p className="text-xs text-[rgb(var(--muted-foreground))]">{desc}</p>
                      </div>
                    </button>
                  ))}
                </div>

                <AnimatePresence>
                  {packAction === 'create' && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="space-y-3">
                      <Input label="Pack Name" id="pack-name" placeholder="The Grindset" value={packName} onChange={(e) => setPackName(e.target.value)} />
                      <Textarea label="Description (optional)" id="pack-desc" placeholder="What are you all training for?" rows={2} value={packDesc} onChange={(e) => setPackDesc(e.target.value)} />
                    </motion.div>
                  )}
                  {packAction === 'join' && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                      <Input label="Invite Code" id="invite-code" placeholder="e.g. ABC12345" value={inviteCode} onChange={(e) => setInviteCode(e.target.value)} />
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="flex gap-3">
                  <Button variant="secondary" onClick={() => setStep(1)} className="flex-shrink-0">
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button
                    className="flex-1"
                    loading={creatingPack || joiningPack}
                    disabled={!packAction || (packAction === 'create' && packName.trim().length < 2) || (packAction === 'join' && inviteCode.trim().length < 4)}
                    onClick={() => {
                      setStepError(null);
                      if (packAction === 'create') createPack();
                      else if (packAction === 'join') joinPack();
                      else setStep(3);
                    }}
                  >
                    {packAction === 'create' ? 'Create Pack' : packAction === 'join' ? 'Join Pack' : 'Skip'} <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
                {stepError && <p className="text-sm text-red-400">{stepError}</p>}
              </motion.div>
            )}

            {step === 3 && (
              <motion.div key="s3" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }} className="p-6 space-y-5">
                <div>
                  <h2 className="text-xl font-black mb-1">One last thing</h2>
                  <p className="text-sm text-[rgb(var(--muted-foreground))]">Let your Pack know who you are.</p>
                </div>

                <Textarea
                  label="Bio (optional)"
                  id="bio"
                  placeholder="Tell your Pack a bit about yourself..."
                  rows={3}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                />

                <div className="flex gap-3">
                  <Button variant="secondary" onClick={() => setStep(2)} className="flex-shrink-0">
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button
                    className="flex-1"
                    loading={finishing}
                    onClick={() => {
                      setStepError(null);
                      finish();
                    }}
                  >
                    Let&apos;s Go
                  </Button>
                </div>
                {stepError && <p className="text-sm text-red-400">{stepError}</p>}
              </motion.div>
            )}
          </AnimatePresence>
        </Card>
      </div>
    </div>
  );
}
