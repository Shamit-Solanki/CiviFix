import React,{useEffect,useState} from 'react';
import {createRoot} from 'react-dom/client';
import './style.css';
const API=import.meta.env.VITE_API_URL||'http://localhost:5000/api';
function App(){
 const [issues,setIssues]=useState([]),[status,setStatus]=useState('Connecting...');
 useEffect(()=>{
  fetch(`${API}/health`).then(r=>r.json()).then(()=>setStatus('API connected')).catch(()=>setStatus('API unavailable'));
  fetch(`${API}/issues`).then(r=>r.json()).then(x=>setIssues(x.issues||[])).catch(()=>{});
 },[]);
 return <><nav><b>CiviFix</b><span>Crowdsourced Civic Issue Resolution</span></nav>
 <main><p className="eyebrow">SMART CIVIC REPORTING</p><h1>Report. Support. Resolve.</h1>
 <p className="lead">Citizens report civic problems, communities increase priority, and authorities can act.</p>
 <div className="status">{status}</div>
 <section><h2>Live Issues</h2>{issues.length?<div>{issues.map(i=><article key={i.id}><h3>#{i.id} — {i.title}</h3><p>{i.category} · {i.department}</p><b>Priority {i.priority_score}</b> · {i.supporter_count} supporters</article>)}</div>:<p>No issues yet. Your PostgreSQL database is ready for the first report.</p>}</section>
 </main></>;
}
createRoot(document.getElementById('root')).render(<App/>);
