'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useUserStore } from '@/store/user';
import { useQuery } from '@tanstack/react-query';
import { checkinsApi } from '@/lib/api';

export default function FeedPage() {
  const { user } = useUserStore();
  const [postText, setPostText] = useState('');

  const { data: communityFeed } = useQuery({
    queryKey: ['community-feed'],
    queryFn: () => checkinsApi.getCommunity(1, 10),
  });

  return (
    <main className="max-w-7xl mx-auto px-margin md:px-lg grid grid-cols-1 md:grid-cols-12 gap-lg mt-md pb-24 md:pb-10">
      {/* Feed Area */}
      <div className="md:col-span-8 flex flex-col gap-lg">
        {/* Create Post */}
        <div className="bg-surface rounded-xl border border-white/10 p-md flex flex-col gap-sm shadow-[0_0_20px_rgba(0,0,0,0.5)] bg-gradient-to-br from-[#1A1A1A] to-[#121212]">
          <div className="flex gap-sm items-start">
            <div className="w-12 h-12 rounded-full border border-white/10 overflow-hidden shrink-0">
              <img 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuC54hBjZ5O51zqjO1SkluIrxv3rkoVelN2ahHR8KS2Q4nK_IDj83O7kbHG_gdi_i-_0tR9mcZPSXKjVkVDydYUXJWk7WQTUJnaxuCWi_7oupDUWfk3WFpi_cy74B-kLWGH8twaCTdFTrafacLNs-aiftWgcOE1dHiPDF-DSaSsD0ZvuqY_Gtb6TUQmbR_JyyOmatEcIb6us53iIR6XZjOUxsiZOryb5Y99wnorjp_a9ZZ5JqO9u6EsaKYqqq8NGKw0QuUS1HRuKfqI" 
                alt="User profile" 
                className="w-full h-full object-cover"
              />
            </div>
            <textarea 
              className="w-full bg-transparent border-b-2 border-transparent focus:border-primary-container focus:ring-0 text-on-surface placeholder-white/40 resize-none font-body-md text-body-md h-12 pt-3" 
              placeholder="What's your latest win?"
              value={postText}
              onChange={(e) => setPostText(e.target.value)}
            ></textarea>
          </div>
          <div className="flex justify-between items-center mt-sm border-t border-white/5 pt-sm">
            <div className="flex gap-sm">
              <button className="text-white/40 hover:text-primary-container transition-colors p-2 rounded-full hover:bg-white/5 flex items-center justify-center">
                <span className="material-symbols-outlined">image</span>
              </button>
              <button className="text-white/40 hover:text-primary-container transition-colors p-2 rounded-full hover:bg-white/5 flex items-center justify-center">
                <span className="material-symbols-outlined">videocam</span>
              </button>
              <button className="text-white/40 hover:text-primary-container transition-colors p-2 rounded-full hover:bg-white/5 flex items-center justify-center">
                <span className="material-symbols-outlined">mood</span>
              </button>
            </div>
            <button className="bg-primary-container text-black font-label-bold text-label-bold py-2 px-6 rounded-lg hover:shadow-[inset_0_0_20px_rgba(255,255,255,0.4)] active:scale-95 transition-all shadow-[0_0_20px_rgba(255,90,31,0.2)]">
              Post
            </button>
          </div>
        </div>

        {/* Feed Items */}
        <div className="flex flex-col gap-lg">
          {/* Mock Post 1 */}
          <article className="bg-surface rounded-xl border border-white/10 shadow-[0_0_20px_rgba(0,0,0,0.5)] bg-gradient-to-br from-[#1A1A1A] to-[#121212] overflow-hidden">
            <div className="p-md flex gap-sm items-center border-b border-white/5">
              <img 
                alt="Author" 
                className="w-12 h-12 rounded-full border border-white/10 object-cover" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuACyHK0dMgM9jqB3M_Apai8IqrZfCi_rtqilLJRX5I54yV_UGDwPPpnvTy2TrNLMwec04Ig-XFWWBUhZDd0VjbfyY6_hm2ekCicHUibBpfuvn2eiHCEJTEXdB1hJXdkLXYgAQIxInUtX_U7tIWm5o4OVGiRktwMS9nqqpUU1YLUNP0oMytBVaS-Q58QZndWnisDVhmWNAkecNc_tZcLdt3rrS9tRhM8v6kBFYKRmGXK4FmgQVAJp8DPj5_CS3v4PyhxDuQLJGFpFIo"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-label-bold text-label-bold text-on-surface">Sarah Connor</span>
                  <span className="text-[10px] uppercase tracking-wider bg-secondary-container text-on-secondary px-2 py-0.5 rounded-sm border border-secondary shadow-[0_0_10px_rgba(5,102,217,0.4)]">Elite</span>
                </div>
                <div className="text-on-surface-variant text-sm mt-1">2 hrs ago</div>
              </div>
              <button className="text-white/40 hover:text-white transition-colors">
                <span className="material-symbols-outlined">more_horiz</span>
              </button>
            </div>
            <div className="p-md">
              <p className="font-body-lg text-body-lg text-on-surface mb-md">Crushed a new PR on deadlifts today! 315lbs felt light. The grind is finally paying off. #InnerFire #PeakPerformance</p>
              <div className="rounded-lg overflow-hidden border border-white/10 relative aspect-video">
                <Image 
                  alt="Workout photo" 
                  className="object-cover" 
                  fill
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuCr63LFcaN615CevrFK-HUCeHOinE2iJhswWXfLKu_q7MkdrrZZzkVUA87J7yKhqADx_wzYXHCtiJRqPtKdBGBSelzkhTTZr6SW-GlS45EDGJxI4qmhEL0xRnZhAGX4Tr1214QO3pI5sgsAaHxZMvl4dsNo3a6F1hL2REev1i2c-v2rmzSIr8DYxwT35cxBYIydZEvHr9M6Wld9SiWGcDQBJUDVbUvfrXykTgAI_bYHjPRjTwKEPu73e_UlMKrZNN_3j5QidUJ65Fo"
                />
              </div>
            </div>
            <div className="px-md py-sm border-t border-white/5 flex gap-md">
              <button className="flex items-center gap-2 text-white/40 hover:text-primary-container transition-colors group">
                <span className="material-symbols-outlined group-hover:fill-current">local_fire_department</span>
                <span className="font-label-bold text-label-bold">245</span>
              </button>
              <button className="flex items-center gap-2 text-white/40 hover:text-primary-container transition-colors group">
                <span className="material-symbols-outlined group-hover:fill-current">fitness_center</span>
                <span className="font-label-bold text-label-bold">89</span>
              </button>
              <button className="flex items-center gap-2 text-white/40 hover:text-white transition-colors group ml-auto">
                <span className="material-symbols-outlined group-hover:fill-current">chat_bubble</span>
                <span className="font-label-bold text-label-bold">12</span>
              </button>
            </div>
          </article>
        </div>
      </div>

      {/* Sidebar */}
      <aside className="hidden md:block col-span-4 flex-col gap-lg space-y-lg">
        {/* Trending Packs */}
        <div className="bg-surface rounded-xl border border-white/10 p-md shadow-md bg-gradient-to-br from-[#1A1A1A] to-[#121212]">
          <h3 className="font-h3 text-h3 text-on-surface mb-md border-b border-white/10 pb-sm">Trending Packs</h3>
          <ul className="flex flex-col gap-sm">
            <li className="flex items-center gap-sm p-sm rounded-lg hover:bg-white/5 cursor-pointer transition-colors group">
              <div className="w-10 h-10 rounded-lg bg-surface-container-high flex items-center justify-center border border-white/10 text-primary-container group-hover:shadow-[0_0_15px_rgba(255,90,31,0.3)] transition-shadow">
                <span className="material-symbols-outlined">group</span>
              </div>
              <div className="flex-1">
                <div className="font-label-bold text-label-bold text-on-surface">Night Owls Lifting</div>
                <div className="text-on-surface-variant text-[12px] mt-1">1.2k Members</div>
              </div>
            </li>
            <li className="flex items-center gap-sm p-sm rounded-lg hover:bg-white/5 cursor-pointer transition-colors group">
              <div className="w-10 h-10 rounded-lg bg-surface-container-high flex items-center justify-center border border-white/10 text-primary-container group-hover:shadow-[0_0_15px_rgba(255,90,31,0.3)] transition-shadow">
                <span className="material-symbols-outlined">directions_run</span>
              </div>
              <div className="flex-1">
                <div className="font-label-bold text-label-bold text-on-surface">Urban Sprinters</div>
                <div className="text-on-surface-variant text-[12px] mt-1">850 Members</div>
              </div>
            </li>
          </ul>
        </div>

        {/* Top Athletes */}
        <div className="bg-surface rounded-xl border border-white/10 p-md shadow-md bg-gradient-to-br from-[#1A1A1A] to-[#121212]">
          <h3 className="font-h3 text-h3 text-on-surface mb-md border-b border-white/10 pb-sm">Top Athletes</h3>
          <ul className="flex flex-col gap-sm">
            <li className="flex items-center gap-sm p-sm rounded-lg hover:bg-white/5 cursor-pointer transition-colors">
              <img 
                alt="Athlete" 
                className="w-10 h-10 rounded-full border border-white/10 object-cover" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBF2XASnnFHoEZqUektNkDnXBjfBpxn6nuUvialCGlhIVFh9pMi3YE0tTmrUZkhBYwqP6UyFV4v4lfWJG1M0BmcCZ9URbe0EHqVI7LCATCwRFNeOFPtQJZ5_7k7xc6WqccQoi-A_rkKIXRTJgVhKX6p_agzuE7p_UY1EEibyeDBMsPQZSabGIGSr-7WhVpzdpY-LjveL1XLCgK3D90Wsg6ssZDoFtP2JdSW8VyBMk3mKlfKFDO7N2nt_p9lOUPC96kZyCSWvSFWXTQ"
              />
              <div className="flex-1">
                <div className="font-label-bold text-label-bold text-on-surface">Marcus Vance</div>
                <div className="text-secondary text-[10px] font-bold tracking-widest uppercase mt-1">Legend</div>
              </div>
            </li>
          </ul>
        </div>
      </aside>
    </main>
  );
}
