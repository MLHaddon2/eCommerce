import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import router from './routes/index.js';
import axios from 'axios';
import path from 'path';

dotenv.config();
const app = express();
const port = process.env.PORT || 5001;

var allowlist = process.env.ALLOW_LIST || 'http://localhost:3000';

var corsOptionsDelegate = function (req, callback) {
    var corsOptions = {
      origin: process.env.CLIENT_ORIGIN || true,
      credentials: true,
      optionsSuccessStatus: 200
    };
    
    if (allowlist.indexOf(req.header('Origin')) !== -1) {
        corsOptions = { origin: true } // reflect (enable) the requested origin in the CORS response
    } else {
        corsOptions = { origin: false } // disable CORS for this request
    }
    callback(null, corsOptions) // callback expects two parameters: error and options
};

// Middlewares
app.use(cors(corsOptionsDelegate));
app.use(express.json());
app.use(cookieParser());
// Serve static files from the React app build directory
app.use('/api', router);
app.get('/proxy', async (req, res) => {
    try {
      const response = await axios.get('https://api.ipify.org?format=json');
      res.json(response.data);
    } catch (error) {
      res.status(500).send('Server Error With API');
    }
});

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'client/build')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'client/build/index.html'));
  });
}

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});