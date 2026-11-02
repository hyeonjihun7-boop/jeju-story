import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase } from '../lib/supabase'
import { askAgent, fetchToday } from '../api/client'
import { SAMPLE_QUESTION, SAMPLE_TRIP } from '../data/sampleTrip'

// 여러 페이지가 함께 쓰는 상태: 닉네임·지역·오늘 데이터·북마크·에이전트 대화
export const useAppStore = create(
  persist(
    (set, get) => ({
      nickname: '',
      setNickname: (nickname) => set({ nickname: nickname.trim() }),

      toasts: [],
      toast: (message, variant = 'ok') => {
        const id = Date.now() + Math.random()
        set({ toasts: [...get().toasts, { id, message, variant }] })
        setTimeout(() => set({ toasts: get().toasts.filter((t) => t.id !== id) }), 2600)
      },

      // 선택한 지역 + 오늘의 날씨/대기질/옷차림/하루 칸 (홈·탐험·에이전트가 공유)
      place: '제주시',
      today: null,
      todayLoading: false,
      todayError: '',
      loadToday: async (place = get().place) => {
        set({ place, todayLoading: true, todayError: '' })
        try { set({ today: await fetchToday(place) }) }
        catch (e) { set({ todayError: e.message }) }
        finally { set({ todayLoading: false }) }
      },

      // 북마크 — Supabase favorites 테이블
      favorites: [],
      favLoading: false,
      loadFavorites: async () => {
        if (!supabase) return
        set({ favLoading: true })
        const { data, error } = await supabase.from('favorites').select('*')
          .eq('nickname', get().nickname || '익명').order('created_at', { ascending: false })
        set({ favLoading: false })
        if (error) return get().toast(error.message, 'danger')
        set({ favorites: data })
      },
      toggleFavorite: async ({ kind, id, title, note }) => {
        if (!supabase) return get().toast('Supabase 설정(.env.local)이 필요해요', 'warn')
        const nickname = get().nickname || '익명'
        const found = get().favorites.find((f) => f.kind === kind && f.item_id === String(id))
        if (found) {
          const { error } = await supabase.from('favorites').delete().eq('id', found.id)
          if (error) return get().toast(error.message, 'danger')
          set({ favorites: get().favorites.filter((f) => f.id !== found.id) })
          return get().toast('북마크를 해제했어요')
        }
        const { data, error } = await supabase.from('favorites')
          .insert({ nickname, kind, item_id: String(id), title, note }).select().single()
        if (error) return get().toast(error.message, 'danger')
        set({ favorites: [data, ...get().favorites] })
        get().toast('북마크에 담았어요')
      },

      // 에이전트 대화 — 페이지를 옮겨도 유지, 답변이 끝나면 Supabase chat_logs 에 기록
      messages: [],
      chatLoading: false,
      sendMessage: async (text) => {
        const history = get().messages.map((m) => ({ role: m.role, content: m.text }))
        set({ messages: [...get().messages, { role: 'user', text }], chatLoading: true })
        try {
          const { answer, steps } = await askAgent(text, history)
          set({ messages: [...get().messages, { role: 'assistant', text: answer, steps }] })
          if (supabase) {
            supabase.from('chat_logs').insert({
              nickname: get().nickname || '익명', question: text, answer, tools: steps.map((s) => s.tool),
            }).then(() => {})
          }
        } catch (e) {
          set({ messages: [...get().messages, { role: 'assistant', text: '⚠ ' + e.message, steps: [] }] })
        } finally { set({ chatLoading: false }) }
      },
      clearChat: () => set({ messages: [] }),
      // AI 없이 예시 일정을 대화에 넣는다 (한도·느림 대비 안전장치)
      showSampleTrip: () => set({ messages: [...get().messages, { role: 'user', text: SAMPLE_QUESTION }, { role: 'assistant', text: SAMPLE_TRIP, steps: [], sample: true }] }),

      // 내 여행 일정 — Supabase trips 테이블
      trips: [],
      tripsLoading: false,
      tripsError: '',
      loadTrips: async () => {
        if (!supabase) return
        set({ tripsLoading: true, tripsError: '' })
        const { data, error } = await supabase.from('trips').select('*')
          .eq('nickname', get().nickname || '익명').order('created_at', { ascending: false })
        set({ tripsLoading: false })
        if (error) return set({ tripsError: error.code === 'PGRST205' ? 'trips 테이블이 아직 없어요 (supabase/schema.sql 실행 필요)' : error.message })
        set({ trips: data })
      },
      saveTrip: async ({ title, question, content, tools }) => {
        if (!supabase) { get().toast('Supabase 설정(.env.local)이 필요해요', 'warn'); return false }
        const { data, error } = await supabase.from('trips')
          .insert({ nickname: get().nickname || '익명', title, question, content, tools }).select().single()
        if (error) {
          get().toast(error.code === 'PGRST205' ? 'trips 테이블이 아직 없어요 — Supabase에서 schema.sql 을 실행해 주세요' : error.message, 'danger')
          return false
        }
        set({ trips: [data, ...get().trips] })
        get().toast('내 일정에 저장했어요')
        return true
      },
      deleteTrip: async (id) => {
        if (!supabase) return
        const { error } = await supabase.from('trips').delete().eq('id', id)
        if (error) return get().toast(error.message, 'danger')
        set({ trips: get().trips.filter((t) => t.id !== id) })
        get().toast('일정을 지웠어요')
      },
    }),
    {
      name: 'today-jeju-store',
      partialize: (s) => ({ nickname: s.nickname, place: s.place }),
    },
  ),
)
