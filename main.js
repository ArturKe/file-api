// import './style.css'
// import javascriptLogo from './javascript.svg'
// const express = require('express')
// import router from './routes/user.routes.js'
// import https from "https"

import express from 'express'
import fs from "fs"

const app = express()
// const useRouter = require('./routes/user.routes')

const PORT = process.env.PORT || 3000
console.log(process.env)
console.log('This is URL: ' + process.env.URL)

import os from "os"
console.log("Home directory:" + os.homedir())

// app.use(express.static('dist'));

app.get("/help", (req, res) => {
	res.send("Here is some HELP: " + process.env.URL_REMOTE)
})

app.use(express.json())

fs.readdir(process.cwd() + '/public', (err, files) => {
  if (err)
    console.log(err);
  else {
    console.log("\nCurrent directory filenames:");
    files.forEach(file => {
      console.log(file);
    })
  }
})

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
app.use('/api', (req, res) => {
  // res.send('API')
  res.sendFile(process.cwd() + '/public/vite.svg')
})

app.use('/path', (req, res) => {
  res.send(process.cwd())
})

app.get('/*', (req, res) => {
	res.send('НИЧЕГО НЕ НАЙДЕНО!!!')
})

app.listen(PORT, () => {
	console.log("Started api service on port: " + PORT)
  console.log("Current directory:", process.cwd())
})
