import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

// Pasta opcional de origem para copiar fotos novas durante o desenvolvimento.
// As fotos ja versionadas em public/fotos-noite-rapaziada sao a fonte de
// verdade do build e da producao; este caminho so evita duplicar o trabalho
// de copia manual na sua maquina.
const PHOTOS_SOURCE = 'Fotos Noite da Rapaziada'
const PHOTOS_DEST = 'public/fotos-noite-rapaziada'

function copyPhotosPlugin() {
  return {
    name: 'copy-photos',
    async buildStart() {
      if (!fs.existsSync(PHOTOS_SOURCE)) {
        console.log('Pasta de origem de fotos nao encontrada, usando as fotos em public/:', PHOTOS_SOURCE)
        return
      }
      
      if (!fs.existsSync(PHOTOS_DEST)) {
        fs.mkdirSync(PHOTOS_DEST, { recursive: true })
      }
      
      const copyFolder = (src, dest) => {
        if (!fs.existsSync(dest)) {
          fs.mkdirSync(dest, { recursive: true })
        }
        
        const entries = fs.readdirSync(src, { withFileTypes: true })
        
        for (const entry of entries) {
          const srcPath = path.join(src, entry.name)
          const destPath = path.join(dest, entry.name)
          
          if (entry.isDirectory()) {
            copyFolder(srcPath, destPath)
          } else if (entry.isFile() && /\.(jpg|jpeg|png|gif|webp)$/i.test(entry.name)) {
            fs.copyFileSync(srcPath, destPath)
          }
        }
      }
      
      copyFolder(PHOTOS_SOURCE, PHOTOS_DEST)
      console.log('Photos copied to public folder')
    },
    configureServer(server) {
      if (!fs.existsSync(PHOTOS_SOURCE)) return

      server.middlewares.use('/fotos-noite-rapaziada', (req, res, next) => {
        const filePath = path.join(PHOTOS_SOURCE, decodeURIComponent(req.url.split('?')[0]))
        if (filePath.startsWith(path.resolve(PHOTOS_SOURCE)) && fs.existsSync(filePath)) {
          res.sendFile(filePath)
        } else {
          next()
        }
      })
    }
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), copyPhotosPlugin()],
  server: {
    fs: {
      allow: ['..']
    }
  }
})