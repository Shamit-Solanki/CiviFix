import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import {pool} from '../db.js';

const makeToken=u=>jwt.sign(
 {id:u.id,name:u.name,email:u.email,role:u.role},
 process.env.JWT_SECRET,{expiresIn:'7d'}
);

export async function register(req,res){
 try{
  const {name,email,password,phone}=req.body;
  if(!name||!email||!password)return res.status(400).json({error:'Name, email and password are required'});
  const hash=await bcrypt.hash(password,12);
  const r=await pool.query(
   `INSERT INTO users(name,email,password_hash,phone) VALUES($1,$2,$3,$4)
    RETURNING id,name,email,phone,role,created_at`,
   [name.trim(),email.trim().toLowerCase(),hash,phone||null]
  );
  res.status(201).json({user:r.rows[0],token:makeToken(r.rows[0])});
 }catch(e){
  if(e.code==='23505')return res.status(409).json({error:'Email already registered'});
  console.error(e);res.status(500).json({error:'Registration failed'});
 }
}

export async function login(req,res){
 try{
  const r=await pool.query('SELECT * FROM users WHERE email=$1',[req.body.email?.trim().toLowerCase()]);
  const u=r.rows[0];
  if(!u||!(await bcrypt.compare(req.body.password||'',u.password_hash)))
   return res.status(401).json({error:'Invalid email or password'});
  const safe={id:u.id,name:u.name,email:u.email,phone:u.phone,role:u.role};
  res.json({user:safe,token:makeToken(safe)});
 }catch(e){console.error(e);res.status(500).json({error:'Login failed'});}
}
export async function me(req,res){
 const r=await pool.query('SELECT id,name,email,phone,role,created_at FROM users WHERE id=$1',[req.user.id]);
 res.json({user:r.rows[0]});
}
