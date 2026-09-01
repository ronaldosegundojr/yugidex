import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

const PHOTOS_SOURCE = 'C:/Users/Ronaldo/Desktop/yugidex/Fotos Noite da Rapaziada'
const PHOTOS_DEST = 'public/fotos-noite-rapaziada'

function copyPhotosPlugin() {
  return {
    name: 'copy-photos',
    async buildStart() {
      if (!fs.existsSync(PHOTOS_SOURCE)) {
        console.warn('Photos source folder not found:', PHOTOS_SOURCE)
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
      server.middlewares.use('/fotos-noite-rapaziada', (req, res, next) => {
        const filePath = path.join(PHOTOS_SOURCE, req.url)
        if (fs.existsSync(filePath)) {
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