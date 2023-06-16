// import './style.css'
// import javascriptLogo from './javascript.svg'
// import router from './routes/user.routes.js'
import http from "http"

import express from 'express'
import fs from "fs/promises"
import formidable from 'formidable'
import sockjs from 'sockjs'

const PORT = process.env.PORT || 3000
// console.log(process.env)
console.log('This is URL: ' + process.env.URL)
console.log('This is HOST: ' + process.env.HOST)

const app = express()
const server = http.createServer(app).listen(PORT, () => {
  console.log('First server started')
})

const echo = sockjs.createServer({ prefix:'/echo' })
let clients = []
let clientNames = {}

echo.on('connection', function(conn) {
  console.log('Connection')
  // Посылаем ID нового пользователяy
  const name = `Client${Math.round(Math.random()*1000)}`
  conn.write('Your name is: ' + name)
  clientNames[conn.id] = name
  
  // Сообщаем всем пользователям о коннекте новго
  clients.forEach(client => client.connect.write(name + ' connected!'))
  clients.push({name, id:conn.id, connect:conn})
  console.log(clients)

  conn.on('data', function(message) {
    console.log('ID: ' + conn.id)
    console.log('Data from ' + clientNames[conn.id] + ': ' + message)

    // Broadcast messages to other clients
    clients.forEach(client => client.connect.write(clientNames[conn.id]+ ':: ' + message))
  })

  // conn.write('something' + Math.round(Math.random()*1000))

  conn.on('close', function(ev) {
    console.log('close: ' + conn.id)
    clients.forEach(client => client.connect.write(clientNames[conn.id]+ ' disconnected!'))
    clients = clients.filter(client => client.id !== conn.id)
    console.log(clients)
  })
})
echo.installHandlers(server, { prefix:'/echo' })

// const useRouter = require('./routes/user.routes')

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
app.use('/static',express.static('public'))
app.use('/files',express.static('files'))

console.log(await directoryRider())

app.get("/help", (req, res) => {
	res.send("Here is some HELP: " + process.env.URL_REMOTE)
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
        <input class="input button" value="Lalala">
        <button class="button sendMessage">Send Message</button>
        <button class="button clear">Clear</button>
      </div>
      <div class="chatBox">
      </div>
    </div>
  `
  const scriptTemplate = `
    <script>
      // let sock = new SockJS('http://localhost:3000/echo');
      let sock
      let wsConnection
      let connected = false
      const connectButton = document.querySelector('.connect')
      const disconnectButton = document.querySelector('.disconnect')
      const sendMessageButton = document.querySelector('.sendMessage')
      const clearButton = document.querySelector('.clear')
      const input = document.querySelector('.input')
      const status = document.querySelector('.status')
      const chat = document.querySelector('.chatBox')

      connectButton.addEventListener('click', () => { if (!connected) connectSocket() })
      disconnectButton.addEventListener('click', disconnectSocket)
      sendMessageButton.addEventListener('click', sendMessage)
      clearButton.addEventListener('click', clearChat)

      function disconnectSocket () {
        if (wsConnection) wsConnection.close()
        if (sock) sock.close()
      }
      function connectSocket () {
        sock = new SockJS('${process.env.HOST ? 'https://' + process.env.HOST + '/echo' : 'http://localhost:3000/echo'}');
        sock.onopen = function() {
          changeStatus(0)
          connected = true
          console.log('Connection open')
          // sock.send('test')
        }
      
        sock.onmessage = function(e) {
          console.log('Message from server: ', e.data)
          const record = document.createElement('div')
          record.innerText = e.data
          const firstChild = chat.children[0]
          if (firstChild) {
            chat.insertBefore(record, firstChild)
          } else {
            chat.appendChild(record)
          }
        }
      
        sock.onclose = function() {
          changeStatus(1)
          connected = false
          console.log('Connection close')
        }
      }

      function sendMessage () {
        if (connected && sock) sock.send(input.value)
      }

      function clearChat () {
        chat.innerHTML = ''
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

app.get('/download', (req, res) => {
  const path = process.cwd() + '/files/' + req.query.name
  console.log(path)
  // res.send(`<img style='max-height: 100%; max-width: 100%' src='/${req.query.name}'>`)
  if (req.query.name) {
    // res.sendFile(path)
    res.download(path)
  }
})

app.get('/path', (req, res) => {
  res.send(process.cwd())
})

let nn = await directoryRider()
app.get('/map', async (req, res) => {
  res.json(
    [{
      url: 'https://file-server-u2kw.onrender.com/download?name=cow_edit_ver1.glb',
      description: 'Cow1',
      position: {x: -6, y: 0, z: -3},
      scale: 1
    },
    {
      url: 'https://file-server-u2kw.onrender.com/download?name=cow_edit_ver1.glb',
      description: 'Cow2',
      position: {x: -8, y: 0, z: -3},
      scale: 1
    }]
  )
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
      const newpath = process.cwd() + '/files/' + files.filename.originalFilename
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

// app.listen(PORT, () => {
// 	console.log("Started api service on port: " + PORT)
//   console.log("Current directory:", process.cwd())
// })

async function directoryRider () {
  // let filesNameArray = []  
  return await fs.readdir(process.cwd() + '/files', (err, files) => {
    if (err) console.log(err)
  })
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
        <link href="/static/style.css" rel="stylesheet">
        <script src="https://cdn.jsdelivr.net/npm/sockjs-client@1/dist/sockjs.min.js"></script>
      </head>
      <body style="margin: 0">
          <div class="header">
            <a href="/"><h3 style="color: #f0ffff">File Server</h3></a>
            <a href="/socket"><h3 style="color: #f0ffff">Socket test</h3></a>
          </div>
          <div style="padding: 10px">${content}</div>
      </body>
    </html>
  `
}
