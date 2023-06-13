// import './style.css'
// import javascriptLogo from './javascript.svg'
// import router from './routes/user.routes.js'
import http from "http"

import express from 'express'
import fs from "fs/promises"
import formidable from 'formidable'
import sockjs from 'sockjs'

const app = express()
const server = http.createServer()
console.log(server)

// import WebSocket, { WebSocketServer } from 'ws'
// const wss = new WebSocketServer({port: 443})
// console.log(wss.clients)

// wss.on('connection', function connection(ws) {
//   console.log('WS Соединение установлено!')
//   console.log(wss.clients)
//   ws.on('error', console.error)

//   ws.on('message', function message(data) {
//     console.log('received: %s', data)
//   })
//   setInterval(() => {
//     ws.send('something' + Math.round(Math.random()*2000))
//   }, 2000)
  
// })

const echo = sockjs.createServer()
echo.on('connection', function(conn) {
  console.log('Connection')
  conn.on('data', function(message) {
    console.log('Data')
    conn.write(message)
  })
  conn.on('close', function() {console.log('close')});
})
// console.log(echo)
// echo.attach(app)
echo.installHandlers(server, { prefix:'/echo' })
server.listen(80, '0.0.0.0')


// const useRouter = require('./routes/user.routes')

const PORT = process.env.PORT || 3000
// console.log(process.env)
console.log('This is URL: ' + process.env.URL)
console.log('This is HOST: ' + process.env.HOST)

import os from "os"
console.log("Home directory: " + os.homedir())
console.log("Host name: " + os.hostname())


// app.use(express.static('dist'));

app.use(express.json())
app.use(function(req, res, next) {
  res.header('Access-Control-Allow-Origin', req.get('Origin') || '*');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE');
  res.header('Access-Control-Expose-Headers', 'Content-Length');
  res.header('Access-Control-Allow-Headers', 'Accept, Authorization, Content-Type, X-Requested-With, Range');
  if (req.method === 'OPTIONS') {
    return res.send(200);
  } else {
    return next();
  }
})
app.use(express.static('public'))

// // Middelware, voor alle /api/* request
// app.all('/api/*', function(req, res, next) 
// {
//   // Set respons header (geen idee of dit compleet is)
//   res.header("Access-Control-Allow-Origin","*");
//   res.header("Access-Control-Allow-Methods","GET,PUT,POST,DELETE,OPTIONS");
//   res.header("Access-Control-Allow-Headers","X-Requested-With,Content-type,Accept,X-Access-Token,X-Key");

//   // Set response contenttype
//   res.contentType('application/json');

//   next();
// });

console.log(await directoryRider())

app.get("/help", (req, res) => {
	res.send("Here is some HELP: " + process.env.URL_REMOTE)
})

app.get("/upload", async(req, res) => {
  const bodyTemplate = `
    <form method="post" enctype="multipart/form-data">
      <p>Приветули!Выберите файл!</p>
      <p>Доступна загрузка файлов: PNG, JPG, GIF, SVG</p>
      <input type="file" id="file" name="filename" multiple="multiple" placeholder="File">
      <input class="button" type="submit" value="Upload">
    </form>
  `
	res.send(mainTemplate(bodyTemplate + arrayToList(await directoryRider())))
})

app.get('/socket', (req, res) => {
  const bodyTemplate = `
    <div>
      <h2>Sockets</h2>
      <div>Здесь будет тестирование сокетов</div>
      <br>
      <div class="buttons">
        <div class="status disconnected"></div>
        <button class="button connect">Connect web socket</button>
        <button class="button disconnect">Disconnect web socket</button>
      </div>
      <br>
      <div>
        <button class="wsButton sendMessage">Send Message</button>
      </div>
    </div>
  `
  const scriptTemplate = `
    <script>
      // let sock = new SockJS('http://localhost:3001/echo');
      let sock = new SockJS('https://${process.env.HOST}/echo');
      console.log(sock)
      sock.onopen = function() {
          console.log('open')
          sock.send('test')
      }
    
      sock.onmessage = function(e) {
          console.log('message', e.data)
          sock.close()
      }
    
      sock.onclose = function() {
          console.log('close')
      }

      let wsConnection
      let connected = false
      const connectButton = document.querySelector('.connect')
      const disconnectButton = document.querySelector('.disconnect')
      const sendMessageButton = document.querySelector('.sendMessage')
      const status = document.querySelector('.status')

      connectButton.addEventListener('click', wsConnect)
      disconnectButton.addEventListener('click', () => {if (wsConnection) wsConnection.close() })
      sendMessageButton.addEventListener('click', sendMessage)

      function wsConnect () {
        wsConnection = new WebSocket("wss://${process.env.HOST || 'localhost'}")
        changeStatus(2)
        wsConnection.onopen = function() {
          console.log("Соединение установлено.")
          changeStatus(0)
          connected = true
        }

        wsConnection.onclose = function(event) {
          if (event.wasClean) {
            console.log('Соединение закрыто чисто')
            changeStatus(1)
            connected = false
          } else {
            console.log('Обрыв соединения') // например, "убит" процесс сервера
            changeStatus(1)
            connected = false
          }
          console.log('Код: ' + event.code + ' причина: ' + event.reason)
        }

        wsConnection.onmessage = function(event) {
          console.log('Получены данные: ' + event.data);
        }
      }

      function sendMessage () {
        if (connected) wsConnection.send('Hello from Client!');
      }

      function changeStatus (st = 0) {
        const allSt = {0: 'connected', 1: 'disconnected', 2: 'connecting'}
        status.className=''
        status.classList.add('status')
        status.classList.add(allSt[st] ? allSt[st] : allSt[1])
        return
      }
    </script>
  `
  res.send(mainTemplate(bodyTemplate + scriptTemplate))
})

app.get('/download', (req, res) => {
  const path = process.cwd() + '/public/' + req.query.name
  console.log(path)
  // res.send(`<img style='max-height: 100%; max-width: 100%' src='/${req.query.name}'>`)
  if (req.query.name) res.sendFile(process.cwd() + `/public/${req.query.name}`)
})

app.get('/path', (req, res) => {
  res.send(process.cwd())
})

let nn = await directoryRider()
app.get('/list', async (req, res) => {
  const rr = await directoryRider()
  console.log(rr)
  res.send(rr)
})

app.post('/upload', (req, res) => {
  console.log('Host Name req: ' + req.hostname)
  console.log('Host Name Header req: ' + req.header("host"))
  // console.log(req.url)

  // const form = formidable({});
  // form.parse(req, (err, fields, files) => {
  //   if (err) {
  //     next(err)
  //     return
  //   }
  //   res.json({ fields, files })
  // })

  //Create an instance of the form object
  const form = new formidable.IncomingForm()
  // form.on('progress', (bytesReceived, bytesExpected) => {})
  // form.on('file', (formname, file) => {
  //   // same as fileBegin, except
  //   // it is too late to change file.filepath
  //   // file.hash is available if options.hash was used
  // })
  form.parse(req, function (err, fields, files) {
    console.log(files)

    const template = `
      <form method="post" enctype="multipart/form-data">
        <p>Файл загружен! Загрузить еще?</p>
        <p>Доступна загрузка файлов: PNG, JPG, GIF, SVG</p>
        <input type="file" id="file" name="filename" multiple="multiple" placeholder="File">
        <input class="button" type="submit" value="Upload">
      </form>
    `
    console.log(files.filename.mimetype)
    if (files.filename.size && ['image/jpeg', 'image/svg+xml', 'image/gif', 'image/png', 'model/gltf-binary', 'model/obj', 'application/octet-stream'].includes(files.filename.mimetype)) {
      const oldpath = files.filename.filepath
      console.log(oldpath)
      const newpath = process.cwd() + '/public/' + files.filename.originalFilename
      console.log(newpath)

      fs.copyFile(oldpath, newpath, 0, function (err) {
        if (err) throw err
      }).then(async () => {
        const list = await directoryRider()
        res.send(mainTemplate(template + arrayToList(list)))
      })
    } else { res.send(mainTemplate('Файл не выбран! Доступна загрузка файлов: PNG, JPG, GIF, SVG')) }

      // res.write('File uploaded and moved!');
      // res.end()
  })
})

app.get('/*', async (req, res) => {
  const list = await directoryRider()
  const bodyTemplate = `
    <h2>Добро пожаловать на Файл Сервер!</h2>
    <p>Приветули!Выберите файл!</p>
    <p><a href="/upload">Загрузить файл</a></p>
  `
	res.send(mainTemplate(bodyTemplate + arrayToList(list)))
})

app.listen(PORT, () => {
	console.log("Started api service on port: " + PORT)
  console.log("Current directory:", process.cwd())
})

async function directoryRider () {
  // let filesNameArray = []  
  return await fs.readdir(process.cwd() + '/public', (err, files) => {
    if (err) console.log(err)
  })
  // fs.readdir(process.cwd() + '/public', async (err, files) => {
  //   if (err) {
  //     console.log(err)
  //     return filesNameArray
  //   } else {
  //     // console.log("\nCurrent directory filenames:")
  //     files.forEach(file => {
  //       filesNameArray.push(file)
  //       // console.log(file)
  //     })
  //     // console.log(filesNameArray)
  //     return filesNameArray
  //   }
  // })
  // return filesNameArray
}

function arrayToList (arr = []) {
  const list = []
  arr.forEach(element => {
    list.push(`<a href='/download?name=${element}'><li>${element}</li></a>`)
  })
  if (list.length) {
    return `<br><p>Список файлов:</p><ul>${
      list.join(' ')
    }</ul>`
  }
  return
}

function mainTemplate (content = '') {
  return `
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>File server</title>
        <link href="/style.css" rel="stylesheet">
        <script src="https://cdn.jsdelivr.net/npm/sockjs-client@1/dist/sockjs.min.js"></script>
      </head>
      <body style="margin: 0">
          <div style="width:100%; padding: 0 15px; background:#527cb3; display: flex; flex-direction: row; gap: 15px;">
            <div class="header">
              <a href="/"><h3 style="color: #f0ffff">File Server</h3></a>
              <a href="/socket"><h3 style="color: #f0ffff">Socket test</h3></a>
            </div>
          </div>
          <div style="padding: 10px">${content}</div>
      </body>
    </html>
  `
}
