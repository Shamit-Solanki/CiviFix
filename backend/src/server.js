import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import {pool} from './db.js';
import authRoutes from './routes/authRoutes.js';
import issueRoutes from './routes/issueRoutes.js';
dotenv.config();
const app=express(),PORT=process.env.PORT||5000;
app.use(cors({origin:process.env.FRONTEND_URL||'http://localhost:5173'}));
app.use(express.json({limit:'2mb'}));
app.use(rateLimit({windowMs:15*60*1000,limit:300}));
app.get('/api/health',async (req,res)=>{
  try{
    const result=await pool.query('SELECT NOW()');
    res.json({
      ok:true,
      service:'CiviFix API',
      database:'connected',
      time:result.rows[0].now
    });
  }catch(e){
    console.error(e);
    res.status(500).json({
      ok:false,
      service:'CiviFix API',
      database:'disconnected'
    });
  }
});
app.use('/api/auth',authRoutes);app.use('/api/issues',issueRoutes);
app.use((req,res)=>res.status(404).json({error:'Route not found'}));
app.listen(PORT,()=>console.log(`CiviFix API: http://localhost:${PORT}`));
