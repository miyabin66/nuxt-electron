// @ts-nocheck
import nuxtConfig from '../renderer/nuxt.config'
const http = require('http')
const path = require('path')
const { Nuxt, Builder } = require('nuxt')
const electron = require('electron')

nuxtConfig.rootDir = path.resolve('src/renderer')

const isDev = nuxtConfig.dev

const nuxt = new Nuxt(nuxtConfig)
const builder = new Builder(nuxt)
const server = http.createServer(nuxt.render)

let _NUXT_URL_ = ''

if (isDev) {
  builder.build().catch(() => {
    process.exit(1)
  })
  server.listen()
  _NUXT_URL_ = `http://localhost:${server.address().port}`
} else {
  _NUXT_URL_ =
    'file://' + path.resolve(__dirname, '../../dist/public/index.html')
}

let win: any = null
const app = electron.app
const newWin = () => {
  win = new electron.BrowserWindow({
    width: 1400,
    height: 1000,
    webPreferences: {
      preload: path.resolve(path.join(__dirname, 'preload.js')),
    },
  })
  win.on('closed', () => (win = null))
  if (isDev) {
    const {
      default: installExtension,
      VUEJS_DEVTOOLS,
    } = require('electron-devtools-installer')
    installExtension(VUEJS_DEVTOOLS.id)
      .then(() => {
        win.webContents.openDevTools()
      })
    const pollServer = () => {
      http
        .get(_NUXT_URL_, (res: any) => {
          if (res.statusCode === 200) {
            win.loadURL(_NUXT_URL_)
          } else {
            setTimeout(pollServer, 300)
          }
        })
        .on('error', pollServer)
    }
    pollServer()
  } else {
    return win.loadURL(_NUXT_URL_)
  }
}
app.on('ready', newWin)
app.on('window-all-closed', () => app.quit())
app.on('activate', () => win === null && newWin())
