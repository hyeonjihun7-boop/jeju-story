import { create } from 'zustand'

// 화면 연출 신호: kind = stamp(도장) · levelup(레벨업) · badge(코스 완주)
export const useFxStore = create((set, get) => ({
  seq: 0,
  fx: null, // { kind, title, sub }
  fire: (kind, data = {}) => set({ seq: get().seq + 1, fx: { kind, ...data } }),
  clear: (seq) => { if (get().seq === seq) set({ fx: null }) },
}))
