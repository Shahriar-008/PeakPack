'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { packsApi } from '@/lib/api';
import { useUserStore } from '@/store/user';
import { useSockets } from '@/hooks/useSocket';
import { Modal, Input, Textarea } from '@/components/ui';
import type { CheckIn, PackMember } from '@/types';

const styles = {
  glassPanel: { backdropFilter: 'blur(20px)', borderTop: '1px solid rgba(255, 255, 255, 0.1)' },
  cardSurface: { border: '1px solid rgba(255, 255, 255, 0.1)', background: 'linear-gradient(135deg, #2a2a2a, #0e0e0e)' },
  glowAccent: { boxShadow: '0 0 20px rgba(255, 90, 31, 0.15)' },
  textGlow: { textShadow: '0 0 10px rgba(255, 90, 31, 0.3)' },
};

function CreatePackModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [goal, setGoal] = useState('custom');

  const { mutate, isPending } = useMutation({
    mutationFn: () => packsApi.create({ name, description: desc || undefined, goalType: goal }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-pack'] });
      onClose();
    },
  });

  return (
    <Modal open={open} onClose={onClose} title="Create Pack">
      <div className="space-y-4">
        <Input label="Pack Name" id="new-pack-name" placeholder="The Grindset" value={name} onChange={(e) => setName(e.target.value)} />
        <Textarea label="Description" id="new-pack-desc" rows={2} placeholder="What's your pack about?" value={desc} onChange={(e) => setDesc(e.target.value)} />
        <button 
          disabled={!name || isPending} 
          onClick={() => mutate()}
          className="w-full bg-primary-container text-black font-label-bold py-2 rounded uppercase tracking-wider disabled:opacity-50 hover:shadow-[inset_0_0_10px_rgba(255,255,255,0.4)] transition-all"
        >
          {isPending ? 'Creating...' : 'Create Pack 🔥'}
        </button>
      </div>
    </Modal>
  );
}

function JoinPackModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [code, setCode] = useState('');

  const { mutate, isPending, error } = useMutation({
    mutationFn: () => packsApi.join(code),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-pack'] });
      onClose();
    },
  });

  return (
    <Modal open={open} onClose={onClose} title="Join a Pack">
      <div className="space-y-4">
        <Input label="Invite Code" id="join-code" placeholder="abc12345" value={code} onChange={(e) => setCode(e.target.value)} />
        {error && <p className="text-sm text-red-400">{(error as any)?.response?.data?.error?.message || 'Failed to join'}</p>}
        <button 
          disabled={!code || isPending} 
          onClick={() => mutate()}
          className="w-full bg-primary-container text-black font-label-bold py-2 rounded uppercase tracking-wider disabled:opacity-50 hover:shadow-[inset_0_0_10px_rgba(255,255,255,0.4)] transition-all"
        >
          {isPending ? 'Joining...' : 'Join Pack'}
        </button>
      </div>
    </Modal>
  );
}

export default function PackPage() {
  const { user } = useUserStore();
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [activeTab, setActiveTab] = useState<'feed' | 'challenges'>('feed');
  const [copied, setCopied] = useState(false);
  const loaderRef = useRef<HTMLDivElement>(null);

  const { data: myPack, isLoading: loadingPack } = useQuery({
    queryKey: ['my-pack'],
    queryFn: packsApi.getMine,
    retry: false,
  });

  const { data: members = [] } = useQuery({
    queryKey: ['pack-members', myPack?.id],
    queryFn: () => packsApi.getMembers(myPack!.id),
    enabled: !!myPack?.id,
  });

  const {
    data: feedPages,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['pack-feed', myPack?.id],
    queryFn: ({ pageParam = 1 }) => packsApi.getFeed(myPack!.id, pageParam, 20),
    getNextPageParam: (last: any) => last.pagination?.hasMore ? last.pagination.page + 1 : undefined,
    initialPageParam: 1,
    enabled: !!myPack?.id && activeTab === 'feed',
  });

  const allFeed: CheckIn[] = feedPages?.pages.flatMap((p: any) => p.data) ?? [];

  useEffect(() => {
    if (!loaderRef.current || !hasNextPage) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) fetchNextPage();
    });
    obs.observe(loaderRef.current);
    return () => obs.disconnect();
  }, [hasNextPage, fetchNextPage]);

  useSockets({
    onNewCheckIn: useCallback(() => {
      queryClient.invalidateQueries({ queryKey: ['pack-feed', myPack?.id] });
    }, [queryClient, myPack?.id]),
  });

  const copyInvite = () => {
    if (myPack) {
      navigator.clipboard.writeText(`${window.location.origin}/join/${myPack.inviteCode}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loadingPack) {
    return (
      <main className="max-w-7xl mx-auto px-margin pt-lg flex justify-center py-24">
        <div className="w-8 h-8 rounded-full border-2 border-primary-container border-t-transparent animate-spin"></div>
      </main>
    );
  }

  // ── No Pack ───────────────────────────────────────────────
  if (!myPack) {
    return (
      <main className="max-w-7xl mx-auto px-margin pt-lg flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-surface-container-highest to-surface border-2 border-primary-container flex items-center justify-center mb-6 shadow-[0_0_20px_rgba(255,90,31,0.4)]">
          <span className="material-symbols-outlined text-3xl text-primary-container" style={{ fontVariationSettings: "'FILL' 1" }}>groups</span>
        </div>
        <h1 className="font-h1 text-h1 text-on-surface mb-2 uppercase">No Pack</h1>
        <p className="font-body-md text-on-surface-variant max-w-sm mb-8">Accountability is better together. Create or join a Pack to start dominating the leaderboards.</p>
        
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <button 
            onClick={() => setShowCreate(true)}
            className="bg-primary-container text-black font-label-bold py-3 px-8 rounded uppercase tracking-wider hover:shadow-[inset_0_0_10px_rgba(255,255,255,0.4)] transition-all active:scale-95 flex justify-center items-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">add</span> Create Pack
          </button>
          <button 
            onClick={() => setShowJoin(true)}
            className="bg-surface-container-high border border-white/10 text-white hover:border-white/30 font-label-bold py-3 px-8 rounded uppercase tracking-wider transition-all active:scale-95 flex justify-center items-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">link</span> Join Pack
          </button>
        </div>

        <CreatePackModal open={showCreate} onClose={() => setShowCreate(false)} />
        <JoinPackModal open={showJoin}  onClose={() => setShowJoin(false)}  />
      </main>
    );
  }

  // ── Pack View ─────────────────────────────────────────────
  return (
    <main className="max-w-7xl mx-auto px-margin md:px-lg pt-lg pb-24 md:pb-lg flex flex-col gap-lg text-on-background">
      {/* Header / Hero Card */}
      <section className="rounded-xl p-md md:p-xl relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-end gap-md" style={{ ...styles.cardSurface, ...styles.glowAccent }}>
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary-container rounded-full blur-[100px] opacity-20 pointer-events-none translate-x-1/3 -translate-y-1/3"></div>
        <div className="flex flex-col gap-sm relative z-10 w-full md:w-auto">
          <div className="flex items-center gap-xs text-primary-container font-label-bold text-label-bold tracking-widest uppercase mb-xs">
            <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>local_fire_department</span>
            Pack Streak: {myPack.packStreak || 0}
          </div>
          <h1 className="font-h1 text-h1 text-on-surface uppercase" style={styles.textGlow}>{myPack.name}</h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant max-w-md">{myPack.description || 'Goal: Elite Performance'}</p>
        </div>
        <button 
          onClick={copyInvite}
          className="relative z-10 w-full md:w-auto bg-primary-container text-black font-label-bold text-label-bold uppercase px-md py-sm rounded flex justify-center items-center gap-xs hover:shadow-[inset_0_0_10px_rgba(255,255,255,0.4)] transition-all active:scale-95"
        >
          <span className="material-symbols-outlined text-[18px]">{copied ? 'check' : 'content_copy'}</span>
          {copied ? 'Copied' : 'Copy Invite'}
        </button>
      </section>

      {/* Member Grid (Bento style horizontal scroll) */}
      <section className="flex flex-col gap-md">
        <div className="flex items-center justify-between">
          <h2 className="font-h3 text-h3 text-on-surface uppercase tracking-tight">The Squad</h2>
          <span className="font-label-bold text-label-bold text-outline-variant">{members.length} Members</span>
        </div>
        <div className="flex gap-sm overflow-x-auto pb-xs snap-x" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {(members as any[]).map((m) => {
            const isMe = m.user.id === user?.id;
            const checkedIn = m.checkedInToday;
            
            return (
              <div key={m.id} className="snap-start flex flex-col items-center gap-xs min-w-[80px]">
                <div className={`relative w-16 h-16 rounded-full border-2 ${isMe ? 'border-primary-container shadow-[0_0_15px_rgba(255,90,31,0.2)]' : 'border-surface-container-highest'} p-[2px]`}>
                  {m.user.avatarKey ? (
                    <img className={`w-full h-full object-cover rounded-full ${checkedIn ? '' : 'grayscale opacity-70'}`} src={m.user.avatarKey} alt={m.user.name} />
                  ) : (
                    <div className={`w-full h-full rounded-full flex items-center justify-center font-h3 ${isMe ? 'bg-primary-container/20 text-primary-container' : 'bg-surface-container-highest text-on-surface-variant'}`}>
                      {m.user.name.charAt(0)}
                    </div>
                  )}
                  {checkedIn ? (
                    <div className="absolute bottom-0 right-0 w-4 h-4 bg-tertiary-container rounded-full border-2 border-background flex items-center justify-center shadow-[0_0_8px_rgba(0,168,76,0.5)]">
                      <span className="material-symbols-outlined text-[10px] text-on-tertiary-container font-bold">check</span>
                    </div>
                  ) : (
                    <div className="absolute bottom-0 right-0 w-4 h-4 bg-surface-container-highest rounded-full border-2 border-background flex items-center justify-center">
                      <span className="material-symbols-outlined text-[10px] text-on-surface-variant font-bold">hourglass_empty</span>
                    </div>
                  )}
                </div>
                <span className={`font-label-bold text-label-bold text-[12px] ${isMe ? 'text-primary-container text-glow' : (checkedIn ? 'text-on-surface' : 'text-on-surface-variant')} text-center truncate w-full`}>
                  {isMe ? 'You' : m.user.name.split(' ')[0]}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      {/* Main Content Area */}
      <section className="flex flex-col gap-md lg:grid lg:grid-cols-12 lg:gap-lg">
        {/* Left Column / Main Feed */}
        <div className="lg:col-span-8 flex flex-col gap-md">
          {/* Segmented Tabs */}
          <div className="flex p-xs bg-surface-container-high rounded-full w-full md:w-max border border-white/10">
            <button 
              onClick={() => setActiveTab('feed')}
              className={`flex-1 md:w-32 py-xs px-sm rounded-full font-label-bold text-label-bold text-center uppercase tracking-wide transition-colors ${activeTab === 'feed' ? 'bg-surface-bright text-primary shadow-[0_2px_10px_rgba(0,0,0,0.5)]' : 'text-on-surface-variant hover:text-on-surface'}`}
            >
              Feed
            </button>
            <button 
              onClick={() => setActiveTab('challenges')}
              className={`flex-1 md:w-32 py-xs px-sm rounded-full font-label-bold text-label-bold text-center uppercase tracking-wide transition-colors ${activeTab === 'challenges' ? 'bg-surface-bright text-primary shadow-[0_2px_10px_rgba(0,0,0,0.5)]' : 'text-on-surface-variant hover:text-on-surface'}`}
            >
              Challenges
            </button>
          </div>

          {/* Feed Cards Container */}
          {activeTab === 'feed' && (
            <div className="flex flex-col gap-md">
              {allFeed.length === 0 ? (
                <div className="text-center py-10 text-on-surface-variant font-body-md">
                  No activity in the pack yet. Check in to get things started!
                </div>
              ) : (
                allFeed.map((ci) => {
                  const isClean = ci.mealType === 'clean';
                  const isRest = ci.isRestDay;
                  
                  return (
                    <article key={ci.id} className="rounded-xl p-md flex flex-col gap-sm" style={styles.cardSurface}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-sm">
                          <div className="w-10 h-10 rounded-full overflow-hidden border border-white/10 bg-surface-container flex items-center justify-center font-bold text-on-surface">
                            {ci.user?.avatarKey ? <img src={ci.user.avatarKey} alt="" className="w-full h-full object-cover" /> : (ci.user?.name?.[0] || '?')}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-label-bold text-label-bold text-on-surface">
                              {ci.userId === user?.id ? 'You' : ci.user?.name} {isRest ? 'took a rest day' : 'completed a session'}
                            </span>
                            <span className="font-body-md text-[12px] text-outline-variant">
                              {new Date(ci.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        {ci.mealType && (
                          <div className={`bg-surface-container-highest border px-sm py-xs rounded-full flex items-center gap-xs ${isClean ? 'border-tertiary-container/30' : 'border-error-container/30'}`}>
                            <span className={`material-symbols-outlined text-[14px] ${isClean ? 'text-tertiary-container' : 'text-error'}`}>{isClean ? 'restaurant' : 'local_pizza'}</span>
                            <span className={`font-label-bold text-[10px] uppercase tracking-wider ${isClean ? 'text-tertiary-container' : 'text-error'}`}>{ci.mealType}</span>
                          </div>
                        )}
                      </div>

                      {/* Summary */}
                      <div className="bg-surface-container-lowest rounded-lg p-sm border border-white/5 flex flex-col gap-xs my-xs">
                        <h3 className="font-h3 text-[20px] text-on-surface uppercase tracking-tight">
                          {isRest ? 'Rest & Recovery' : (ci.workoutType || 'Training Session')}
                        </h3>
                        {!isRest && (
                          <div className="flex gap-md mt-xs">
                            <div className="flex flex-col">
                              <span className="font-label-bold text-[10px] text-outline-variant uppercase tracking-widest">Duration</span>
                              <span className="font-label-bold text-label-bold text-on-surface">60 min</span>
                            </div>
                            <div className="flex flex-col">
                              <span className="font-label-bold text-[10px] text-outline-variant uppercase tracking-widest">XP Earned</span>
                              <span className="font-label-bold text-label-bold text-primary">+{ci.xpEarned}</span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Reaction Bar */}
                      <div className="flex items-center gap-sm mt-xs">
                        <button className="bg-surface-container border border-white/10 hover:border-primary-container/50 hover:bg-white/5 px-sm py-xs rounded-full flex items-center gap-xs transition-all active:scale-95">
                          <span className="text-[16px]">🔥</span>
                          <span className="font-label-bold text-[12px] text-on-surface-variant">Like</span>
                        </button>
                      </div>
                    </article>
                  );
                })
              )}
              
              <div ref={loaderRef} className="py-4 flex justify-center">
                {isFetchingNextPage && <div className="w-6 h-6 rounded-full border-2 border-primary-container border-t-transparent animate-spin"></div>}
              </div>
            </div>
          )}

          {activeTab === 'challenges' && (
            <div className="text-center py-10 text-on-surface-variant font-body-md rounded-xl" style={styles.cardSurface}>
              Pack challenges coming soon.
            </div>
          )}
        </div>

        {/* Right Column / Sidebar */}
        <div className="hidden lg:flex lg:col-span-4 flex-col gap-md">
          {/* Pack MVP */}
          <div className="rounded-xl p-md border-t-2 border-t-secondary-fixed-dim" style={styles.cardSurface}>
            <h3 className="font-h3 text-[20px] text-on-surface uppercase tracking-tight mb-sm flex items-center gap-xs">
              <span className="material-symbols-outlined text-secondary-fixed-dim" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
              Pack MVP
            </h3>
            {members.length > 0 ? (
              <div className="flex items-center gap-sm bg-surface-container-lowest p-sm rounded-lg border border-white/5">
                <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-secondary-fixed-dim relative bg-surface-container flex items-center justify-center">
                  {(members as any[])[0]?.user?.avatarKey ? (
                    <img className="w-full h-full object-cover" src={(members as any[])[0]?.user?.avatarKey} alt="" />
                  ) : (
                    <span className="font-bold text-secondary-fixed-dim">{(members as any[])[0]?.user?.name?.[0]}</span>
                  )}
                </div>
                <div className="flex flex-col">
                  <span className="font-label-bold text-label-bold text-on-surface">{(members as any[])[0]?.user?.name}</span>
                  <span className="font-body-md text-[12px] text-secondary-fixed-dim">Highest Level</span>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </section>
    </main>
  );
}
