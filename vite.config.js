import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'
import { pathToFileURL } from 'node:url'
import path from 'node:path'
import fs from 'node:fs'

// 개발 중 `npm run dev` 만으로 /api/* 서버 함수를 실행해 주는 플러그인 (배포 때는 Vercel 이 담당)
function localApi(env) {
  Object.assign(process.env, env) // VITE_ 없는 비밀 키도 서버 함수에서 읽히도록
  return {
    name: 'local-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith('/api/')) return next()
        const url = new URL(req.url, 'http://localhost')
        const name = url.pathname.replace('/api/', '')
        const file = path.resolve('api', name + '.js')
        if (!/^[\w-]+$/.test(name) || !fs.existsSync(file)) { res.statusCode = 404; return res.end('{"error":"not found"}') }
        req.query = Object.fromEntries(url.searchParams)
        if (req.method === 'POST') {
          let raw = ''
          for await (const c of req) raw += c
          try { req.body = raw ? JSON.parse(raw) : {} } catch { req.body = {} }
        }
        res.status = (c) => { res.statusCode = c; return res }
        res.json = (o) => { res.setHeader('Content-Type', 'application/json; charset=utf-8'); res.end(JSON.stringify(o)) }
        try {
          const mod = await import(pathToFileURL(file).href + '?t=' + fs.statSync(file).mtimeMs)
          await mod.default(req, res)
        } catch (e) { res.status(500).json({ error: e.message }) }
      })
    },
  }
}

export default defineConfig(({ mode }) => ({
  plugins: [react(), localApi(loadEnv(mode, process.cwd(), ''))],
}))
