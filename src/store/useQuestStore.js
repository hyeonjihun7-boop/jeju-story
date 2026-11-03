import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { supabase } from '../lib/supabase'
import { useAppStore } from './useAppStore'

export const COURSE_TAG = 'explorer-course' // trips.tools 에 넣어 "탐험가들이 만든 코스"만 골라 보는 표시

const nick = () => useAppStore.getState().nickname || '익명'
const toast = (m, v) => useAppStore.getState().toast(m, v)

// 사진이 든 일지가 저장 한도를 넘겨도 앱이 멈추지 않게
const safeStorage = createJSONStorage(() => ({
  getItem: (k) => { try { return localStorage.getItem(k) } catch { return null } },
  setItem: (k, v) => { try { localStorage.setItem(k, v) } catch { toast('저장 공간이 가득 찼어요. 오래된 일지 사진을 지워 주세요', 'warn') } },
  removeItem: (k) => { try { localStorage.removeItem(k) } catch { /* 무시 */ } },
}))

// 탐험하기 상태: 스탬프·일지·내가 만든 코스. 이 기기에 먼저 저장하고, Supabase 가 있으면 스탬프·코스는 함께 올린다.
export const useQuestStore = create(
  persist(
    (set, get) => ({
      stamps: [], // { spotId, kind, name, at, demo }
      journal: [], // { id, spotId, place, text, photo, lat, lon, at }
      courses: [], // { id, title, at }

      addStamp: async (spot, demo = false) => {
        if (get().stamps.some((s) => s.spotId === spot.id)) return false
        const stamp = { spotId: spot.id, kind: spot.kind, name: spot.name, at: new Date().toISOString(), demo }
        set({ stamps: [...get().stamps, stamp] })
        if (supabase && !demo) { // 데모 스탬프는 서버 기록에 올리지 않는다
          supabase.from('stamps').upsert({ nickname: nick(), spot_id: spot.id, kind: spot.kind, name: spot.name }, { onConflict: 'nickname,spot_id' }).then(() => {})
        }
        return true
      },
      // 다른 기기에서 찍은 스탬프를 합친다 (stamps 테이블이 없으면 조용히 건너뜀)
      syncStamps: async () => {
        if (!supabase) return
        const { data, error } = await supabase.from('stamps').select('spot_id,kind,name,created_at').eq('nickname', nick())
        if (error || !data) return
        const have = new Set(get().stamps.map((s) => s.spotId))
        const add = data.filter((r) => !have.has(r.spot_id)).map((r) => ({ spotId: r.spot_id, kind: r.kind, name: r.name, at: r.created_at, demo: false }))
        if (add.length) set({ stamps: [...get().stamps, ...add] })
      },
      // 이 기기와 서버(내 닉네임) 스탬프를 모두 지운다. 서버는 delete 정책이 없으면 못 지우므로 알려 준다.
      resetStamps: async () => {
        set({ stamps: [] })
        if (!supabase) return
        const { data, error } = await supabase.from('stamps').delete().eq('nickname', nick()).select('id')
        if (error) toast(error.message, 'danger')
        else if (data.length === 0) toast('이 기기 기록을 지웠어요 (서버 기록은 삭제 권한이 없거나 없었어요)', 'warn')
        else toast('스탬프를 모두 지웠어요')
      },

      addJournal: (entry) => set({ journal: [{ id: crypto.randomUUID(), at: new Date().toISOString(), ...entry }, ...get().journal] }),
      removeJournal: (id) => set({ journal: get().journal.filter((j) => j.id !== id) }),

      // 내 코스를 trips 테이블에 저장 → /trip/:id 공유 링크가 그대로 동작한다
      saveCourse: async ({ title, content }) => {
        if (!supabase) { toast('Supabase 설정(.env.local)이 필요해요', 'warn'); return null }
        const { data, error } = await supabase.from('trips')
          .insert({ nickname: nick(), title, question: '탐험 코스 만들기', content, tools: [COURSE_TAG] }).select().single()
        if (error) { toast(error.message, 'danger'); return null }
        set({ courses: [{ id: data.id, title, at: data.created_at }, ...get().courses] })
        return data.id
      },
    }),
    {
      name: 'jeju-quest-store',
      storage: safeStorage,
      partialize: (s) => ({ stamps: s.stamps, journal: s.journal, courses: s.courses }),
    },
  ),
)
