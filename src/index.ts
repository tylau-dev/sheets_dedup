import express, {Router} from "express";
import dotenv from 'dotenv';
import bodyParser from 'body-parser';
import path from 'path';
import driveRouter from "./drive"
import sheetRouter from "./sheets"
import cors from 'cors';

dotenv.config()

const app = express();
const port = process.env.PORT; // default port to listen

app.use(express.static(path.join(__dirname, 'reactapp/build')));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.json({
    type: ['application/json', 'text/plain']
}))
// app.options('*', (req, res) => {
//     res.setHeader('Access-Control-Allow-Origin', '*');
//     res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
//     res.setHeader('Access-Control-Allow-Methods', 'POST');
//     res.send();
// });

const options: cors.CorsOptions = {
    allowedHeaders: [
      'Origin',
      'X-Requested-With',
      'Content-Type',
      'Accept',
      'X-Access-Token',
    ],
    credentials: true,
    methods: 'GET,HEAD,OPTIONS,PUT,PATCH,POST,DELETE',
    origin: "https://sheetdedupggprod.herokuapp.com",
    preflightContinue: false,
  };
  
  //use cors middleware
  app.use(cors(options));
  


// Default route handler
app.get("/", async (req, res) => {
    res.send("ok");
});
app.use('/', driveRouter);
app.use('/', sheetRouter);

// start the Express server
app.listen(port, () => {
    // tslint:disable-next-line:no-console
    console.log(`server started`);
});
