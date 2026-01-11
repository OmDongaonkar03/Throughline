import express from 'express';
import cookieParser from 'cookie-parser';
import logger from 'morgan';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

app.use(
  cors({
    origin: 'http://localhost:8080', // Adjust as needed for your frontend URL
    credentials: true,
  })
);

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

export default app;