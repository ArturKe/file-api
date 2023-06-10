// import './style.css'
// import javascriptLogo from './javascript.svg'
// import router from './routes/user.routes.js'
// import https from "https"

import express from 'express'
import fs from "fs/promises"
import formidable from 'formidable'

const app = express()
// const useRouter = require('./routes/user.routes')

const PORT = process.env.PORT || 3000
// console.log(process.env)
console.log('This is URL: ' + process.env.URL)

import os from "os"
console.log("Home directory:" + os.homedir())

// app.use(express.static('dist'));

app.get("/help", (req, res) => {
	res.send("Here is some HELP: " + process.env.URL_REMOTE)
})

app.get("/upload", (req, res) => {
	res.send(`
    <html>
      <header>
      </header>
      <body>
        <form method="post" enctype="multipart/form-data">
          <p>Приветули!Выберите файл!</p>
          <p>Доступна загрузка файлов: PNG, JPG, GIF, SVG</p>
          <input type="file" id="file" name="filename" multiple="multiple" placeholder="File">
          <input type="submit" value="Upload">
        </form>
      </body>
    </html>
  `)
})

app.use(express.json())
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

app.get('/download', (req, res) => {
  const path = process.cwd() + '/public/' + req.query.name
  console.log(path)
  res.send(`<img style='max-width: 100%' src='/${req.query.name}'>`);
  // if (req.query.name) res.sendFile(process.cwd() + `/public/${req.query.name}`)
  // res.sendFile(process.cwd() + '/public/vite.svg')
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
  // console.log(req.url)

  // const form = formidable({});
  // form.parse(req, (err, fields, files) => {
  //   if (err) {
  //     next(err)
  //     return
  //   }
  //   res.json({ fields, files })
  // })

  const form = new formidable.IncomingForm()
  form.parse(req, function (err, fields, files) {
    console.log(files)
    const template = `
      <html>
        <header>
        </header>
        <body>
          <form method="post" enctype="multipart/form-data">
            <p>Файл загружен! Загрузить еще?</p>
            <p>Доступна загрузка файлов: PNG, JPG, GIF, SVG</p>
            <input type="file" id="file" name="filename" multiple="multiple" placeholder="File">
            <input type="submit" value="Upload">
          </form>
        </body>
      </html>
    `
    if (files.filename.size && ['image/jpeg', 'image/svg+xml', 'image/gif', 'image/png'].includes(files.filename.mimetype)) {
      const oldpath = files.filename.filepath
      console.log(oldpath)
      const newpath = process.cwd() + '/public/' + files.filename.originalFilename
      console.log(newpath)

      fs.copyFile(oldpath, newpath, 0, function (err) {
        if (err) throw err
      }).then(async () => {
        const list = await directoryRider()
        res.send(template + arrayToList(list))
      })
    } else { res.send('Файл не выбран! Доступна загрузка файлов: PNG, JPG, GIF, SVG') }

    // fs.rename(oldpath, newpath, function (err) {
    //   if (err) throw err
    //   res.send(template)
    // })
      // res.write('File uploaded and moved!');
      // res.end()
  })
})

app.get('/*', async (req, res) => {
  const list = await directoryRider()
	res.send(`
    <html>
      <header>
      </header>
      <body>
          <p>Добро пожаловать на Файл Сервер!</p>
          <p>Приветули!Выберите файл!</p>
          <p><a href="/upload">Загрузить файл</a></p>
      </body>
    </html>
  ` + arrayToList(list))
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
