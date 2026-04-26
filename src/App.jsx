import { useState, useEffect, useRef, useCallback } from 'react'
import { storage } from './db.js'
import { VERSION, BUILD_DATE } from './version.js'

/* ═══════════ CONSTANTS ═══════════ */
const EXERCISES = {
  0: ['Elevaciones laterales inclinado','Press de banca','Tracción en barra dorsales','Pushdown tríceps','Curl bíceps','Squats','Crunches'],
  1: ['Press banca inclinado','Remo dorsales','Tríceps dips','Hammer curls','Hack squat','Deadlift','Extensión gemelos'],
}
const MUSCLE_MAP = {
  'Elevaciones laterales inclinado':{'Deltoides lateral':1.0,'Deltoides anterior':0.3},
  'Press de banca':{'Pecho':1.0,'Tríceps':0.5,'Deltoides anterior':0.5},
  'Tracción en barra dorsales':{'Dorsal':1.0,'Bíceps':0.5,'Romboides':0.5},
  'Pushdown tríceps':{'Tríceps':1.0},
  'Curl bíceps':{'Bíceps':1.0},
  'Squats':{'Cuádriceps':1.0,'Glúteos':0.8,'Isquiotibiales':0.3,'Core':0.3},
  'Crunches':{'Core':1.0},
  'Press banca inclinado':{'Pecho':1.0,'Deltoides anterior':0.7,'Tríceps':0.5},
  'Remo dorsales':{'Dorsal':1.0,'Romboides':0.7,'Bíceps':0.5},
  'Tríceps dips':{'Tríceps':1.0,'Pecho':0.4},
  'Hammer curls':{'Bíceps':0.8,'Braquial':1.0},
  'Hack squat':{'Cuádriceps':1.0,'Glúteos':0.3},
  'Deadlift':{'Isquiotibiales':1.0,'Glúteos':0.8,'Dorsal':0.7,'Core':0.5},
  'Extensión gemelos':{'Gemelos':1.0},
}
const VOLUME_TARGETS = {
  'Pecho':{mev:10,mavL:12,mavH:20,mrv:22},'Dorsal':{mev:10,mavL:14,mavH:22,mrv:25},
  'Deltoides lateral':{mev:6,mavL:16,mavH:22,mrv:26},'Deltoides anterior':{mev:0,mavL:10,mavH:15,mrv:20},
  'Tríceps':{mev:6,mavL:10,mavH:14,mrv:18},'Bíceps':{mev:6,mavL:14,mavH:20,mrv:26},
  'Braquial':{mev:4,mavL:8,mavH:12,mrv:16},'Cuádriceps':{mev:8,mavL:12,mavH:18,mrv:20},
  'Isquiotibiales':{mev:6,mavL:10,mavH:16,mrv:20},'Glúteos':{mev:4,mavL:8,mavH:16,mrv:20},
  'Gemelos':{mev:8,mavL:12,mavH:16,mrv:20},'Core':{mev:0,mavL:16,mavH:20,mrv:25},
  'Romboides':{mev:6,mavL:10,mavH:16,mrv:20},
}
const BODY_REGIONS = {
  'Pecho':[{x:22,y:20,w:24,h:18}],'Core':[{x:23,y:38,w:22,h:16}],
  'Deltoides lateral':[{x:9,y:19,w:12,h:8},{x:47,y:19,w:12,h:8}],
  'Deltoides anterior':[{x:9,y:22,w:12,h:12},{x:47,y:22,w:12,h:12}],
  'Bíceps':[{x:10,y:31,w:9,h:16},{x:49,y:31,w:9,h:16}],
  'Tríceps':[{x:10,y:28,w:9,h:18},{x:49,y:28,w:9,h:18}],
  'Braquial':[{x:11,y:36,w:7,h:12},{x:50,y:36,w:7,h:12}],
  'Cuádriceps':[{x:20,y:58,w:12,h:26},{x:36,y:58,w:12,h:26}],
  'Isquiotibiales':[{x:20,y:62,w:12,h:22},{x:36,y:62,w:12,h:22}],
  'Glúteos':[{x:20,y:54,w:28,h:8}],'Gemelos':[{x:21,y:86,w:10,h:22},{x:37,y:86,w:10,h:22}],
  'Dorsal':[{x:19,y:22,w:6,h:26},{x:43,y:22,w:6,h:26}],'Romboides':[{x:24,y:20,w:20,h:14}],
}
const REST_PRESETS = [60,90,120,180,240]
const PROGRESSION_DEFAULTS = {
  'Squats':                          {setsTarget:5,repsMin:5, repsMax:8, loadIncrement:2.5,rirTarget:2},
  'Deadlift':                        {setsTarget:5,repsMin:4, repsMax:6, loadIncrement:2.5,rirTarget:2},
  'Press de banca':                  {setsTarget:5,repsMin:6, repsMax:10,loadIncrement:2.5,rirTarget:2},
  'Press banca inclinado':           {setsTarget:5,repsMin:8, repsMax:12,loadIncrement:2.5,rirTarget:2},
  'Tracción en barra dorsales':      {setsTarget:5,repsMin:6, repsMax:10,loadIncrement:2.5,rirTarget:2},
  'Hack squat':                      {setsTarget:5,repsMin:8, repsMax:12,loadIncrement:5.0,rirTarget:2},
  'Remo dorsales':                   {setsTarget:5,repsMin:8, repsMax:12,loadIncrement:2.5,rirTarget:2},
  'Elevaciones laterales inclinado': {setsTarget:5,repsMin:12,repsMax:20,loadIncrement:1.0,rirTarget:2},
  'Pushdown tríceps':                {setsTarget:5,repsMin:10,repsMax:15,loadIncrement:2.5,rirTarget:2},
  'Curl bíceps':                     {setsTarget:5,repsMin:10,repsMax:15,loadIncrement:2.5,rirTarget:2},
  'Tríceps dips':                    {setsTarget:4,repsMin:8, repsMax:12,loadIncrement:0,  rirTarget:2},
  'Hammer curls':                    {setsTarget:5,repsMin:10,repsMax:15,loadIncrement:2.5,rirTarget:2},
  'Extensión gemelos':               {setsTarget:5,repsMin:12,repsMax:20,loadIncrement:2.5,rirTarget:2},
  'Crunches':                        {setsTarget:5,repsMin:15,repsMax:25,loadIncrement:0,  rirTarget:2},
}
const PROG_DEFAULT = {setsTarget:3,repsMin:8,repsMax:12,loadIncrement:2.5,rirTarget:2}
const getProgConfig = (name, userConfig) => ({...PROG_DEFAULT,...(PROGRESSION_DEFAULTS[name]||{}),...(userConfig[name]||{})})
const calc1RM = (load,reps) => { const l=parseFloat(load),r=parseInt(reps); if(!l||!r||r<1)return null; if(r===1)return l; return Math.round(l*(1+r/30)*10)/10 }
const fmt = s => { const h=Math.floor(s/3600),m=Math.floor((s%3600)/60),sc=s%60; return h>0?`${h}:${String(m).padStart(2,'0')}:${String(sc).padStart(2,'0')}`:`${String(m).padStart(2,'0')}:${String(sc).padStart(2,'0')}` }
const getWeekYear = d => { const dt=new Date(d); dt.setHours(0,0,0,0); dt.setDate(dt.getDate()+3-(dt.getDay()+6)%7); const w1=new Date(dt.getFullYear(),0,4); return `${dt.getFullYear()}-W${String(1+Math.round(((dt-w1)/86400000-3+(w1.getDay()+6)%7)/7)).padStart(2,'0')}` }
const EMPTY_SET = {load:'',reps:'',rir:'',done:false}
const defaultSession = d => ({date:new Date().toISOString().split('T')[0],exercises:EXERCISES[d].map(name=>({name,sets:[{...EMPTY_SET}],notes:'',photo:null}))})
const calcAllTimeBests = sessions => { const b={}; for(const d of[0,1])for(const s of(sessions[d]||[]))for(const ex of s.exercises){const best=Math.max(...ex.sets.map(s=>calc1RM(s.load,s.reps)||0));if(best>0&&(!b[ex.name]||best>b[ex.name]))b[ex.name]=best;} return b }
function evaluateProgression(exerciseList, userProgConfig) {
  const results = {}
  for (const ex of exerciseList) {
    const cfg = getProgConfig(ex.name, userProgConfig)
    const done = ex.sets.filter(s => s.done && s.load && s.reps)
    if (!done.length) continue
    const anyBelowMin = done.some(s => parseInt(s.reps) < cfg.repsMin)
    const allAtMax = done.every(s => parseInt(s.reps) >= cfg.repsMax)
    const allRirOk = done.every(s => { if(!s.rir) return true; const v=s.rir==='4+'?4:parseInt(s.rir); return v>=cfg.rirTarget })
    const enoughSets = done.length >= cfg.setsTarget
    const lastLoad = parseFloat(done[done.length-1]?.load) || 0
    let status = 'maintain', suggestedLoad = lastLoad
    if (anyBelowMin) { status = 'down' }
    else if (enoughSets && allAtMax && allRirOk) { status = 'up'; if(cfg.loadIncrement>0) suggestedLoad = Math.round((lastLoad+cfg.loadIncrement)*100)/100 }
    results[ex.name] = {status, suggestedLoad, evaluatedAt: new Date().toISOString()}
  }
  return results
}
function detectStagnation(sessions, dayIdx, exerciseName) {
  const daySess = (sessions[dayIdx]||[]).slice(0,3)
  if (daySess.length < 3) return {stagnant:false, trend:0}
  const rms = daySess.map(s => { const ex=s.exercises.find(e=>e.name===exerciseName); if(!ex)return 0; return Math.max(...ex.sets.map(set=>calc1RM(set.load,set.reps)||0)) })
  if (rms.some(v => !v)) return {stagnant:false, trend:0}
  const trend = rms[0] - rms[2]
  return {stagnant: trend <= 0, trend}
}
function detectFatigueSignals(sessions, userProgConfig) {
  const signals = []
  const all = [...(sessions[0]||[]),...(sessions[1]||[])].sort((a,b)=>new Date(b.savedAt||b.date)-new Date(a.savedAt||a.date))
  const r2 = all.slice(0,2)
  if (r2.length === 2) {
    const rd = []
    for (const sess of r2) for (const ex of sess.exercises) { const cfg=getProgConfig(ex.name,userProgConfig); for (const s of ex.sets.filter(s=>s.done&&s.rir)) { rd.push({rir:s.rir==='4+'?4:parseInt(s.rir),target:cfg.rirTarget}) } }
    if (rd.length >= 4) { const avg=rd.reduce((a,v)=>a+v.rir,0)/rd.length; const tgt=rd.reduce((a,v)=>a+v.target,0)/rd.length; if(avg<=1&&tgt>=2) signals.push('RIR promedio ≤ 1 en últimas 2 sesiones') }
  }
  if (all.length >= 3) {
    let drops=0; const cur=all[0],ago2=all[2]
    for (const ex of cur.exercises) { const prev=ago2.exercises.find(e=>e.name===ex.name); if(!prev)continue; const cRM=Math.max(...ex.sets.map(s=>calc1RM(s.load,s.reps)||0)); const pRM=Math.max(...prev.sets.map(s=>calc1RM(s.load,s.reps)||0)); if(cRM>0&&pRM>0&&cRM<pRM)drops++ }
    if (drops >= 2) signals.push(`Caída de rendimiento en ${drops} ejercicios`)
  }
  const wd = all.filter(s=>s.duration>60)
  if (wd.length >= 6) { const avg=wd.slice(1,6).reduce((a,s)=>a+s.duration,0)/5; if(wd[0].duration>avg*1.5) signals.push('Sesión más lenta de lo habitual') }
  return signals
}
function calcWeekVolume(all,wk){
  const muscles={},tonelaje={}
  for(const d of[0,1])for(const s of(all[d]||[]).filter(s=>getWeekYear(s.date)===wk)){
    for(const ex of s.exercises){const mw=MUSCLE_MAP[ex.name]||{};const done=ex.sets.filter(s=>s.load&&s.reps&&s.done);if(!done.length)continue
    tonelaje[ex.name]=(tonelaje[ex.name]||0)+done.reduce((a,s)=>a+(parseFloat(s.load)||0)*(parseInt(s.reps)||0),0)
    for(const[m,w]of Object.entries(mw))muscles[m]=(muscles[m]||0)+done.length*w}
  }return{muscles,tonelaje}
}

/* ═══════════ STYLES ═══════════ */
const cI = {flex:1,minWidth:0,width:'100%',background:'transparent',border:'none',color:'#f0ece3',padding:'0',fontSize:22,fontWeight:900,textAlign:'center',outline:'none'}
const mBt = {background:'#161616',color:'#ff8c00',border:'1px solid #202020',borderRadius:3,cursor:'pointer',fontSize:13,fontWeight:900,padding:0,flexShrink:0}
const pill = (bg,col) => ({background:bg,color:col,border:'none',borderRadius:5,padding:'5px 12px',fontSize:11,fontWeight:700,cursor:'pointer',fontFamily:"'Barlow Condensed','Arial Narrow',sans-serif"})

/* ═══════════ SVG ANIMATIONS ═══════════ */
const G='#6a6a6a',OR='#ff8c00',BL='#5a9aff'
const ln = (x1,y1,x2,y2,c=G,w=2.5,k='') => <line key={k||`${x1}${y1}${x2}${y2}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke={c} strokeWidth={w} strokeLinecap="round"/>
const ci = (cx,cy,r,c=G,fill='none',k='') => <circle key={k||`${cx}${cy}`} cx={cx} cy={cy} r={r} stroke={c} strokeWidth={2} fill={fill}/>
const StandFront = ({cx=45,color=G}) => <>{ci(cx,8,6,color,'none','h')}{ln(cx,14,cx,56,color,2.5,'t')}{ln(cx,56,cx-7,82,color,2.5,'ll')}{ln(cx-7,82,cx-9,108,color,2.5,'ls')}{ln(cx,56,cx+7,82,color,2.5,'rl')}{ln(cx+7,82,cx+9,108,color,2.5,'rs')}{ln(cx-14,110,cx+22,110,'#333',1.5,'g')}</>
const StandSide = ({color=G}) => <>{ci(45,8,6,color,'none','h')}{ln(45,14,45,56,color,2.5,'t')}{ln(45,56,47,82,color,2.5,'th')}{ln(47,82,46,108,color,2.5,'sh')}{ln(36,110,58,110,'#333',1.5,'g')}</>
const CurlBicepsSVG = () => <svg viewBox="0 0 90 118" width="100%" height="100%"><StandFront/>{ln(45,20,28,42,G,2.5,'lua')}{ln(45,20,62,42,G,2.5,'rua')}<g style={{animation:'pa 3s ease-in-out infinite'}}>{ln(28,42,23,66,OR,2.5,'lfa')}{ln(62,42,67,66,OR,2.5,'rfa')}{ln(17,67,29,67,BL,4,'ld')}{ln(61,67,73,67,BL,4,'rd')}</g><g style={{animation:'pb 3s ease-in-out infinite',opacity:0}}>{ln(28,42,20,32,OR,2.5,'lfb')}{ln(62,42,70,32,OR,2.5,'rfb')}{ln(12,29,24,35,BL,4,'ld2')}{ln(66,35,78,29,BL,4,'rd2')}</g></svg>
const HammerCurlsSVG = () => <svg viewBox="0 0 90 118" width="100%" height="100%"><StandFront/>{ln(45,20,28,42,G,2.5,'lua')}{ln(45,20,62,42,G,2.5,'rua')}<g style={{animation:'pa 3s ease-in-out infinite'}}>{ln(28,42,25,66,OR,2.5,'lfa')}{ln(62,42,65,66,OR,2.5,'rfa')}{ln(25,62,25,74,BL,4,'ld')}{ln(65,62,65,74,BL,4,'rd')}</g><g style={{animation:'pb 3s ease-in-out infinite',opacity:0}}>{ln(28,42,18,34,OR,2.5,'lfb')}{ln(62,42,72,34,OR,2.5,'rfb')}{ln(14,30,14,42,BL,4,'ld2')}{ln(72,30,72,42,BL,4,'rd2')}</g></svg>
const PushdownSVG = () => <svg viewBox="0 0 90 118" width="100%" height="100%">{ln(68,2,68,24,BL,2,'c1')}{ln(68,24,52,30,BL,2,'c2')}{ci(68,2,3,BL,'none','p')}<StandSide/>{ln(45,22,44,44,G,2.5,'ua')}<g style={{animation:'pa 3s ease-in-out infinite'}}>{ln(44,44,52,30,OR,2.5,'fa')}{ln(52,30,56,28,BL,3.5,'bar')}</g><g style={{animation:'pb 3s ease-in-out infinite',opacity:0}}>{ln(44,44,44,68,OR,2.5,'fb')}{ln(40,68,48,68,BL,3.5,'bar2')}</g></svg>
const SquatsSVG = () => <svg viewBox="0 0 90 118" width="100%" height="100%">{ln(20,110,72,110,'#333',1.5,'g')}<g style={{animation:'pa 3s ease-in-out infinite'}}>{ci(50,9,6,G,'none','h')}{ln(12,20,78,20,BL,4,'bar')}{ln(12,14,12,26,BL,3,'p1')}{ln(78,14,78,26,BL,3,'p2')}{ln(50,15,50,56,G,2.5,'t')}{ln(34,20,14,20,G,2.5,'arm')}{ln(50,56,46,82,G,2.5,'th')}{ln(46,82,48,110,G,2.5,'sh')}</g><g style={{animation:'pb 3s ease-in-out infinite',opacity:0}}>{ci(42,26,6,G,'none','h2')}{ln(10,36,74,36,BL,4,'bar2')}{ln(10,30,10,42,BL,3,'p3')}{ln(74,30,74,42,BL,3,'p4')}{ln(42,32,36,68,G,2.5,'t2')}{ln(28,36,12,36,G,2.5,'arm2')}{ln(36,68,56,82,G,2.5,'th2')}{ln(56,82,50,110,G,2.5,'sh2')}</g></svg>
const HackSquatSVG = () => <svg viewBox="0 0 90 118" width="100%" height="100%">{ln(60,10,65,110,'#333',6,'mach')}{ln(20,108,70,108,'#333',1.5,'g')}<g style={{animation:'pa 3s ease-in-out infinite'}}>{ci(42,14,6,G,'none','h')}{ln(42,20,52,56,G,2.5,'t')}{ln(52,56,36,80,OR,2.5,'th')}{ln(36,80,40,108,OR,2.5,'sh')}</g><g style={{animation:'pb 3s ease-in-out infinite',opacity:0}}>{ci(48,18,6,G,'none','h2')}{ln(48,24,56,58,G,2.5,'t2')}{ln(56,58,50,84,OR,2.5,'th2')}{ln(50,84,54,108,OR,2.5,'sh2')}</g></svg>
const DeadliftSVG = () => <svg viewBox="0 0 90 118" width="100%" height="100%">{ln(18,110,72,110,'#333',1.5,'g')}<g style={{animation:'pa 3s ease-in-out infinite'}}>{ci(38,22,6,G,'none','h')}{ln(38,28,46,62,G,2.5,'t')}{ln(44,38,44,70,G,2.5,'arm')}{ln(30,70,60,70,BL,4,'bar')}{ln(30,64,30,76,BL,3,'p1')}{ln(60,64,60,76,BL,3,'p2')}{ln(46,62,54,82,G,2.5,'th')}{ln(54,82,50,110,G,2.5,'sh')}</g><g style={{animation:'pb 3s ease-in-out infinite',opacity:0}}>{ci(48,8,6,G,'none','h2')}{ln(48,14,48,56,G,2.5,'t2')}{ln(46,26,46,62,G,2.5,'arm2')}{ln(30,62,66,62,BL,4,'bar2')}{ln(30,56,30,68,BL,3,'p3')}{ln(66,56,66,68,BL,3,'p4')}{ln(48,56,44,82,G,2.5,'th2')}{ln(44,82,46,110,G,2.5,'sh2')}</g></svg>
const PressBancaSVG = () => <svg viewBox="0 0 90 118" width="100%" height="100%">{ln(10,74,78,74,G,5,'bench')}{ln(10,74,10,84,G,3,'l1')}{ln(78,74,78,84,G,3,'l2')}{ln(8,84,80,84,'#333',1.5,'g')}<g style={{animation:'pa 3s ease-in-out infinite'}}>{ci(18,62,6,G,'none','h')}{ln(22,65,66,65,G,2.5,'body')}{ln(34,65,34,32,OR,2.5,'ua')}{ln(34,32,38,26,OR,2.5,'fa')}{ln(52,65,52,32,OR,2.5,'ua2')}{ln(52,32,56,26,OR,2.5,'fa2')}{ln(28,24,66,24,BL,4,'bar')}{ln(28,18,28,30,BL,3,'p1')}{ln(66,18,66,30,BL,3,'p2')}{ln(62,67,76,84,G,2.5,'legs')}</g><g style={{animation:'pb 3s ease-in-out infinite',opacity:0}}>{ci(18,62,6,G,'none','h2')}{ln(22,65,66,65,G,2.5,'body2')}{ln(34,65,26,60,OR,2.5,'ua3')}{ln(26,60,34,62,OR,2.5,'fa3')}{ln(52,65,60,60,OR,2.5,'ua4')}{ln(60,60,52,62,OR,2.5,'fa4')}{ln(28,62,66,62,BL,4,'bar2')}{ln(28,56,28,68,BL,3,'p3')}{ln(66,56,66,68,BL,3,'p4')}{ln(62,67,76,84,G,2.5,'legs2')}</g></svg>
const PressBancaInclinadoSVG = () => <svg viewBox="0 0 90 118" width="100%" height="100%">{ln(18,90,52,42,G,5,'back')}{ln(52,42,78,58,G,5,'seat')}{ln(18,90,18,100,G,3,'l1')}{ln(78,58,78,100,G,3,'l2')}{ln(10,100,82,100,'#333',1.5,'g')}<g style={{animation:'pa 3s ease-in-out infinite'}}>{ci(36,38,6,G,'none','h')}{ln(38,44,58,72,G,2.5,'body')}{ln(44,52,30,32,OR,2.5,'ua')}{ln(30,32,32,24,OR,2.5,'fa')}{ln(22,20,48,20,BL,4,'bar')}{ln(22,14,22,26,BL,3,'p1')}{ln(48,14,48,26,BL,3,'p2')}</g><g style={{animation:'pb 3s ease-in-out infinite',opacity:0}}>{ci(36,38,6,G,'none','h2')}{ln(38,44,58,72,G,2.5,'body2')}{ln(44,52,32,48,OR,2.5,'ua2')}{ln(32,48,38,42,OR,2.5,'fa2')}{ln(24,40,50,40,BL,4,'bar2')}{ln(24,34,24,46,BL,3,'p3')}{ln(50,34,50,46,BL,3,'p4')}</g></svg>
const TraccionBarraSVG = () => <svg viewBox="0 0 90 118" width="100%" height="100%">{ln(8,10,82,10,BL,4,'bar')}{ln(8,4,8,20,'#888',3,'s1')}{ln(82,4,82,20,'#888',3,'s2')}<g style={{animation:'pa 3s ease-in-out infinite'}}>{ci(45,24,6,G,'none','h')}{ln(45,30,45,72,G,2.5,'t')}{ln(45,22,24,10,OR,2.5,'la')}{ln(45,22,66,10,OR,2.5,'ra')}{ln(45,72,38,98,G,2.5,'ll')}{ln(38,98,36,118,G,2.5,'ls')}{ln(45,72,52,98,G,2.5,'rl')}{ln(52,98,54,118,G,2.5,'rs')}</g><g style={{animation:'pb 3s ease-in-out infinite',opacity:0}}>{ci(45,16,6,G,'none','h2')}{ln(45,22,45,64,G,2.5,'t2')}{ln(45,26,24,10,OR,2.5,'la2')}{ln(45,26,66,10,OR,2.5,'ra2')}{ln(45,64,38,90,G,2.5,'ll2')}{ln(38,90,36,110,G,2.5,'ls2')}{ln(45,64,52,90,G,2.5,'rl2')}{ln(52,90,54,110,G,2.5,'rs2')}</g></svg>
const RemoDorsalesSVG = () => <svg viewBox="0 0 90 118" width="100%" height="100%">{ln(16,110,74,110,'#333',1.5,'g')}<g style={{animation:'pa 3s ease-in-out infinite'}}>{ci(36,24,6,G,'none','h')}{ln(36,30,50,64,G,2.5,'t')}{ln(42,40,44,66,G,2.5,'arm')}{ln(32,66,60,66,BL,4,'bar')}{ln(32,60,32,72,BL,3,'p1')}{ln(60,60,60,72,BL,3,'p2')}{ln(50,64,56,86,G,2.5,'th')}{ln(56,86,52,110,G,2.5,'sh')}</g><g style={{animation:'pb 3s ease-in-out infinite',opacity:0}}>{ci(36,24,6,G,'none','h2')}{ln(36,30,50,64,G,2.5,'t2')}{ln(44,42,60,52,OR,2.5,'ua2')}{ln(60,52,64,48,OR,2.5,'fa2')}{ln(46,52,66,52,BL,4,'bar2')}{ln(46,46,46,58,BL,3,'p3')}{ln(66,46,66,58,BL,3,'p4')}{ln(50,64,56,86,G,2.5,'th2')}{ln(56,86,52,110,G,2.5,'sh2')}</g></svg>
const TricepsDipsSVG = () => <svg viewBox="0 0 90 118" width="100%" height="100%">{ln(20,32,40,32,BL,4,'lb')}{ln(20,22,20,42,'#888',3,'ls')}{ln(40,22,40,42,'#888',3,'rs')}{ln(50,32,70,32,BL,4,'rb')}{ln(50,22,50,42,'#888',3,'ls2')}{ln(70,22,70,42,'#888',3,'rs2')}<g style={{animation:'pa 3s ease-in-out infinite'}}>{ci(45,14,6,G,'none','h')}{ln(45,20,45,60,G,2.5,'t')}{ln(45,26,26,32,G,2.5,'la')}{ln(45,26,64,32,G,2.5,'ra')}{ln(45,60,40,86,G,2.5,'ll')}{ln(40,86,38,108,G,2.5,'ls3')}{ln(45,60,50,86,G,2.5,'rl')}{ln(50,86,52,108,G,2.5,'rs3')}</g><g style={{animation:'pb 3s ease-in-out infinite',opacity:0}}>{ci(45,28,6,G,'none','h2')}{ln(45,34,45,74,G,2.5,'t2')}{ln(45,40,26,32,OR,2.5,'la2')}{ln(45,40,64,32,OR,2.5,'ra2')}{ln(45,74,40,98,G,2.5,'ll2')}{ln(40,98,38,118,G,2.5,'ls4')}{ln(45,74,50,98,G,2.5,'rl2')}{ln(50,98,52,118,G,2.5,'rs4')}</g></svg>
const ElevLateralesSVG = () => <svg viewBox="0 0 90 118" width="100%" height="100%">{ln(20,110,72,110,'#333',1.5,'g')}{ci(32,22,6,G,'none','h')}{ln(32,28,52,62,G,2.5,'t')}{ln(36,34,52,62,G,2.5,'la')}{ln(52,62,52,88,G,2.5,'th')}{ln(52,88,50,110,G,2.5,'sh')}<g style={{animation:'pa 3s ease-in-out infinite'}}>{ln(36,34,30,56,OR,2.5,'fa')}{ci(27,58,4,'none',BL,'d1')}{ln(22,58,32,58,BL,3,'db')}</g><g style={{animation:'pb 3s ease-in-out infinite',opacity:0}}>{ln(36,34,16,28,OR,2.5,'fb')}{ci(13,26,4,'none',BL,'d2')}{ln(8,26,18,26,BL,3,'db2')}</g></svg>
const CrunchesSVG = () => <svg viewBox="0 0 90 118" width="100%" height="100%">{ln(8,82,82,82,'#333',1.5,'g')}<g style={{animation:'pa 3s ease-in-out infinite'}}>{ci(14,74,6,G,'none','h')}{ln(20,78,68,78,G,2.5,'body')}{ln(68,78,72,74,G,2.5,'kn')}{ln(72,74,68,82,G,2.5,'sh')}{ln(10,72,22,70,G,2,'arm')}</g><g style={{animation:'pb 3s ease-in-out infinite',opacity:0}}>{ci(22,58,6,G,'none','h2')}{ln(28,62,58,74,OR,2.5,'body2')}{ln(58,74,66,70,G,2.5,'kn2')}{ln(66,70,64,78,G,2.5,'sh2')}{ln(14,62,26,56,G,2,'arm2')}</g></svg>
const CalfRaiseSVG = () => <svg viewBox="0 0 90 118" width="100%" height="100%">{ln(20,110,70,110,'#333',1.5,'g')}<StandSide/>{ln(45,22,38,44,G,2.5,'ua')}{ln(38,44,36,66,G,2.5,'fa')}<g style={{animation:'pa 3s ease-in-out infinite'}}>{ln(40,108,60,108,G,3,'foot')}</g><g style={{animation:'pb 3s ease-in-out infinite',opacity:0}}>{ln(42,82,44,92,G,2.5,'shin2')}{ln(44,92,60,108,OR,3,'foot2')}{ci(44,92,3,OR,'none','ankle')}</g></svg>

const EXERCISE_SVGS = {
  'Curl bíceps':CurlBicepsSVG,'Hammer curls':HammerCurlsSVG,'Pushdown tríceps':PushdownSVG,
  'Squats':SquatsSVG,'Hack squat':HackSquatSVG,'Deadlift':DeadliftSVG,
  'Press de banca':PressBancaSVG,'Press banca inclinado':PressBancaInclinadoSVG,
  'Tracción en barra dorsales':TraccionBarraSVG,'Remo dorsales':RemoDorsalesSVG,
  'Tríceps dips':TricepsDipsSVG,'Elevaciones laterales inclinado':ElevLateralesSVG,
  'Crunches':CrunchesSVG,'Extensión gemelos':CalfRaiseSVG,
}

function BodyMuscleMap({ name }) {
  const muscles = MUSCLE_MAP[name] || {}
  const bc = '#1c1c1c', oc = '#2e2e2e'
  return (
    <svg viewBox="0 0 68 130" width="100%" height="100%">
      <circle cx={34} cy={9} r={8} fill={bc} stroke={oc} strokeWidth={1.5}/>
      <rect x={31} y={17} width={6} height={4} fill={bc} stroke="none"/>
      <rect x={20} y={21} width={28} height={36} rx={3} fill={bc} stroke={oc} strokeWidth={1.5}/>
      <rect x={8} y={21} width={10} height={26} rx={4} fill={bc} stroke={oc} strokeWidth={1.5}/>
      <rect x={50} y={21} width={10} height={26} rx={4} fill={bc} stroke={oc} strokeWidth={1.5}/>
      <rect x={9} y={48} width={8} height={20} rx={3} fill={bc} stroke={oc} strokeWidth={1.5}/>
      <rect x={51} y={48} width={8} height={20} rx={3} fill={bc} stroke={oc} strokeWidth={1.5}/>
      <rect x={19} y={58} width={13} height={30} rx={4} fill={bc} stroke={oc} strokeWidth={1.5}/>
      <rect x={36} y={58} width={13} height={30} rx={4} fill={bc} stroke={oc} strokeWidth={1.5}/>
      <rect x={20} y={89} width={11} height={26} rx={3} fill={bc} stroke={oc} strokeWidth={1.5}/>
      <rect x={37} y={89} width={11} height={26} rx={3} fill={bc} stroke={oc} strokeWidth={1.5}/>
      <rect x={18} y={114} width={14} height={5} rx={2} fill={bc} stroke={oc} strokeWidth={1}/>
      <rect x={36} y={114} width={14} height={5} rx={2} fill={bc} stroke={oc} strokeWidth={1}/>
      {Object.entries(muscles).map(([muscle,w]) => {
        const color = w>=0.8?'#ff8c00':w>=0.5?'#ffd12d':'#888'
        const opacity = 0.15+w*0.65
        return (BODY_REGIONS[muscle]||[]).map((r,i) => <rect key={`${muscle}${i}`} x={r.x} y={r.y} width={r.w} height={r.h} rx={3} fill={color} opacity={opacity}/>)
      })}
      {Object.entries(muscles).sort((a,b)=>b[1]-a[1]).map(([muscle,w],i) => {
        const color = w>=0.8?'#ff8c00':w>=0.5?'#ffd12d':'#888'
        return <g key={muscle}><circle cx={7} cy={i*10+8} r={3} fill={color}/><text x={12} y={i*10+12} fontSize="6" fill={color} fontFamily="'Barlow Condensed',sans-serif" fontWeight="700">{muscle.toUpperCase()}</text></g>
      })}
    </svg>
  )
}

/* ═══════════ SET ROW ═══════════ */
function SetRow({ s, si, onChange, onDelete, onDone, onUndone, exName, allTimeBests }) {
  const rm = calc1RM(s.load, s.reps)
  const isPR = rm && allTimeBests[exName] && rm >= allTimeBests[exName]
  const canDone = !!(s.load && s.reps)
  return (
    <div style={{background:s.done?'#0a1a0a':'#0d0d0d',border:`1.5px solid ${s.done?'#1e3a1e':isPR?'#4a3800':'#181818'}`,borderRadius:7,marginBottom:6,overflow:'hidden',transition:'background 0.2s'}}>
      <div style={{display:'grid',gridTemplateColumns:'22px 1fr 1fr 72px',gap:6,padding:'6px 8px',alignItems:'center'}}>
        <div style={{width:22,height:22,borderRadius:4,background:s.done?'#1e4a1e':isPR?'#3a2a00':'#181818',color:s.done?'#4caf50':isPR?'#ffd12d':'#555',display:'flex',alignItems:'center',justifyContent:'center',fontSize:s.done?14:11,fontWeight:900}}>
          {s.done?'✓':isPR?'★':si+1}
        </div>
        {/* CARGA */}
        <div style={{display:'flex',gap:3,alignItems:'center',background:'#131313',border:'1px solid #222',borderRadius:6,padding:'3px 2px'}}>
          <button onClick={()=>!s.done&&onChange('load',String(Math.max(0,(parseFloat(s.load)||0)-2.5)))} style={{...mBt,width:28,height:40,opacity:s.done?0.2:1,fontSize:18}}>−</button>
          <div style={{flex:1,textAlign:'center',minWidth:0}}>
            <div style={{fontSize:9,color:'#ff8c0099',letterSpacing:1,fontWeight:800,marginBottom:1}}>CARGA</div>
            <input type="number" inputMode="decimal" value={s.load} onChange={e=>!s.done&&onChange('load',e.target.value)} placeholder="—" readOnly={s.done} style={{...cI,color:s.done?'#4caf50':'#ff8c00'}}/>
            <div style={{fontSize:8,color:'#ff8c0055',fontWeight:700,marginTop:1}}>kg</div>
          </div>
          <button onClick={()=>!s.done&&onChange('load',String((parseFloat(s.load)||0)+2.5))} style={{...mBt,width:28,height:40,opacity:s.done?0.2:1,fontSize:18}}>+</button>
        </div>
        {/* REPS */}
        <div style={{display:'flex',gap:3,alignItems:'center',background:'#131313',border:'1px solid #222',borderRadius:6,padding:'3px 2px'}}>
          <button onClick={()=>!s.done&&onChange('reps',String(Math.max(1,(parseInt(s.reps)||0)-1)))} style={{...mBt,width:28,height:40,opacity:s.done?0.2:1,fontSize:18}}>−</button>
          <div style={{flex:1,textAlign:'center',minWidth:0}}>
            <div style={{fontSize:9,color:'#888',letterSpacing:1,fontWeight:800,marginBottom:1}}>REPS</div>
            <input type="number" inputMode="numeric" value={s.reps} onChange={e=>!s.done&&onChange('reps',e.target.value)} placeholder="—" readOnly={s.done} style={{...cI,color:s.done?'#4caf50':'#f0ece3'}}/>
            <div style={{fontSize:8,color:'#555',fontWeight:700,marginTop:1}}>reps</div>
          </div>
          <button onClick={()=>!s.done&&onChange('reps',String((parseInt(s.reps)||0)+1))} style={{...mBt,width:28,height:40,opacity:s.done?0.2:1,fontSize:18}}>+</button>
        </div>
        {/* ✓ HECHA */}
        {s.done ? (
          <button onClick={onUndone} style={{height:52,background:'#1a4a1a',color:'#4caf50',border:'2px solid #4caf50',borderRadius:6,cursor:'pointer',fontSize:22,fontWeight:900,display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column',gap:1,width:'100%'}}>
            <span>✓</span><span style={{fontSize:8,letterSpacing:1,fontWeight:800}}>HECHA</span>
          </button>
        ) : (
          <button onClick={canDone?onDone:undefined} style={{height:52,background:canDone?'#ff8c00':'#1a1a1a',color:canDone?'#080808':'#2a2a2a',border:`2px solid ${canDone?'#ff8c00':'#252525'}`,borderRadius:6,cursor:canDone?'pointer':'default',fontSize:canDone?22:16,fontWeight:900,display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column',gap:1,width:'100%',transition:'all 0.15s'}}>
            <span>{canDone?'✓':'○'}</span><span style={{fontSize:8,letterSpacing:1,fontWeight:800}}>{canDone?'HECHA':'—'}</span>
          </button>
        )}
      </div>
      {/* RIR + 1RM */}
      <div style={{display:'flex',alignItems:'center',gap:6,padding:'4px 8px 7px',borderTop:`1px solid ${s.done?'#1a2e1a':'#141414'}`}}>
        <div style={{fontSize:7,color:'#2e2e2e',letterSpacing:1,fontWeight:700,flexShrink:0}}>RIR</div>
        {[['0','#ff4444'],['1','#ff8c00'],['2','#ffd12d'],['3','#7ed957'],['4+','#4caf50']].map(([v,col]) => {
          const active = s.rir === v
          return <button key={v} onClick={()=>onChange('rir',active?'':v)} style={{flex:1,height:26,background:active?col:'#161616',color:active?'#080808':col,border:`1.5px solid ${active?col:'#252525'}`,borderRadius:4,cursor:'pointer',fontSize:11,fontWeight:900,fontFamily:'inherit',transition:'all 0.12s',minWidth:0}}>{v}</button>
        })}
        <div style={{textAlign:'center',flexShrink:0,minWidth:50}}>
          <div style={{fontSize:7,color:'#2e2e2e',letterSpacing:1,fontWeight:700}}>1RM</div>
          <div style={{fontSize:12,fontWeight:800,color:isPR?'#ffd12d':rm?'#7ed957':'#333',marginTop:1}}>{isPR?'🏆':''}{rm?`${rm}kg`:'—'}</div>
        </div>
        <button onClick={onDelete} style={{background:'transparent',border:'none',color:'#2a2a2a',fontSize:15,cursor:'pointer',flexShrink:0,padding:'0 2px'}}>✕</button>
      </div>
    </div>
  )
}

/* ═══════════ EXERCISE CARD ═══════════ */
function ExCard({ ex, ei, expanded, onToggle, onChange, onSetDone, onSetUndone, prevEx, onRest, restDuration, allTimeBests, showTechnique, onToggleTechnique, progConfig, progStatus, stagnant, onConfigEdit }) {
  const done = ex.sets.filter(s => s.load && s.reps && s.done)
  const best1RM = ex.sets.length ? Math.max(...ex.sets.map(s => calc1RM(s.load,s.reps)||0)) : 0
  const isNewPR = best1RM > 0 && allTimeBests[ex.name] && best1RM >= allTimeBests[ex.name]
  const leftCol = isNewPR ? '#ffd12d' : done.length > 0 && done.length === ex.sets.filter(s=>s.load&&s.reps).length ? '#4caf50' : done.length > 0 ? '#ff8c00' : '#222'
  const SvgComp = EXERCISE_SVGS[ex.name]
  const primaryMuscles = Object.entries(MUSCLE_MAP[ex.name]||{}).filter(([,w])=>w>=0.7).map(([m])=>m)
  const cfg = getProgConfig(ex.name, progConfig)
  const status = progStatus[ex.name]
  const addSet = () => onChange(e => ({...e,sets:[...e.sets,{...EMPTY_SET,load:e.sets[e.sets.length-1]?.load||''}]}))
  const removeSet = i => onChange(e => ({...e,sets:e.sets.filter((_,j)=>j!==i)}))
  const updateSet = (i,f,v) => onChange(e => { const sets=[...e.sets]; sets[i]={...sets[i],[f]:v}; return{...e,sets} })
  const handlePhoto = ev => { const file=ev.target.files[0]; if(!file)return; const r=new FileReader(); r.onload=e2=>{ const img=new Image(); img.onload=()=>{ const c=document.createElement('canvas'); const sc=Math.min(1,400/img.width); c.width=img.width*sc; c.height=img.height*sc; c.getContext('2d').drawImage(img,0,0,c.width,c.height); onChange(ex=>({...ex,photo:c.toDataURL('image/jpeg',0.6)})) }; img.src=e2.target.result }; r.readAsDataURL(file) }
  return (
    <div style={{background:'#0f0f0f',border:'1.5px solid #181818',borderLeft:`3px solid ${leftCol}`,borderRadius:8,marginBottom:7,overflow:'hidden'}}>
      <div onClick={onToggle} style={{display:'flex',alignItems:'center',padding:'11px 12px',cursor:'pointer',gap:9}}>
        <div style={{width:24,height:24,flexShrink:0,background:done.length>0?leftCol:'#1c1c1c',color:done.length>0?'#080808':'#3a3a3a',borderRadius:4,display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:900}}>{isNewPR?'🏆':ei+1}</div>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontSize:13,fontWeight:800,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{ex.name}</div>
          <div style={{fontSize:9,color:'#383838',marginTop:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
            {primaryMuscles.join(' · ')}
            {!expanded&&done.length>0&&<span style={{color:'#484848'}}> · {done.length} ✓{best1RM>0?` · 1RM ~${best1RM}kg`:''}</span>}
          </div>
          {stagnant?.stagnant&&<div style={{fontSize:9,color:'#ffd12d',background:'#2a2000',borderRadius:3,padding:'1px 5px',marginTop:3,display:'inline-block'}}>⚠️ Sin mejora en 3 sesiones</div>}
        </div>
        {!expanded&&done.length>0&&(()=>{const last=ex.sets.filter(s=>s.done).at(-1);return last?<div style={{fontSize:11,color:'#ff8c00',fontWeight:700,flexShrink:0}}>{last.load}kg×{last.reps}</div>:null})()}
        <div style={{color:'#2e2e2e',fontSize:13,flexShrink:0}}>{expanded?'▲':'▼'}</div>
      </div>
      {expanded && (
        <div style={{borderTop:'1px solid #181818',padding:'10px 12px 14px'}}>
          {/* PROGRESSION INDICATOR */}
          <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:10}}>
            <div style={{display:'flex',alignItems:'center',gap:6,background:'#0d0d0d',border:'1px solid #1e1e1e',borderRadius:5,padding:'5px 8px',flex:1}}>
              <span style={{fontSize:10,color:'#ff8c00',fontWeight:800,letterSpacing:1}}>{cfg.setsTarget}×{cfg.repsMin}-{cfg.repsMax}</span>
              <span style={{fontSize:9,color:'#383838'}}>· +{cfg.loadIncrement}kg · RIR≥{cfg.rirTarget}</span>
            </div>
            <button onClick={e=>{e.stopPropagation();onConfigEdit()}} style={{background:'#1a1a1a',border:'1px solid #2a2a2a',borderRadius:5,padding:'5px 8px',fontSize:13,cursor:'pointer',color:'#555'}}>⚙️</button>
          </div>
          {/* STATUS BADGE */}
          {status&&(
            <div style={{marginBottom:10,padding:'7px 10px',borderRadius:6,background:status.status==='up'?'#1a3a1a':status.status==='down'?'#2a0a0a':'#1a1a00',border:`1px solid ${status.status==='up'?'#2e5a2e':status.status==='down'?'#4a1a1a':'#3a3000'}`}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <span style={{fontSize:11,fontWeight:900,color:status.status==='up'?'#4caf50':status.status==='down'?'#ff6b6b':'#ffd12d',letterSpacing:1}}>
                  {status.status==='up'?`🟢 +${cfg.loadIncrement}kg SIGUIENTE SESIÓN`:status.status==='down'?'🔴 AJUSTAR CARGA':'🟡 MANTENER CARGA'}
                </span>
                {status.status==='up'&&status.suggestedLoad>0&&<span style={{fontSize:11,color:'#4caf50',fontWeight:700}}>{status.suggestedLoad}kg</span>}
              </div>
            </div>
          )}
          <button onClick={onToggleTechnique} style={{width:'100%',padding:'7px',background:showTechnique?'#1a1a1a':'transparent',color:showTechnique?'#ff8c00':'#383838',border:`1px solid ${showTechnique?'#ff8c00':'#222'}`,borderRadius:6,fontSize:10,fontWeight:800,cursor:'pointer',fontFamily:'inherit',letterSpacing:1,marginBottom:10}}>
            {showTechnique?'▲ OCULTAR TÉCNICA':'🎯 VER TÉCNICA Y MÚSCULOS'}
          </button>
          {showTechnique && (
            <div style={{display:'flex',gap:8,marginBottom:12,background:'#090909',borderRadius:8,padding:8}}>
              <div style={{width:90,height:108,flexShrink:0,background:'#0a0a0a',borderRadius:6,overflow:'hidden'}}>
                {SvgComp?<SvgComp/>:<div style={{width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:20}}>🏋️</div>}
              </div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:8,letterSpacing:2,color:'#3a3a3a',fontWeight:800,marginBottom:4}}>ACTIVACIÓN MUSCULAR</div>
                <div style={{height:108,overflow:'hidden'}}><BodyMuscleMap name={ex.name}/></div>
              </div>
            </div>
          )}
          {prevEx&&prevEx.sets.some(s=>s.load&&s.reps)&&(
            <div style={{background:'#090909',border:'1px solid #181818',borderRadius:6,padding:'8px 10px',marginBottom:10}}>
              <div style={{fontSize:8,letterSpacing:3,color:'#ff8c00',fontWeight:800,marginBottom:5}}>↺ SESIÓN ANTERIOR</div>
              <div style={{display:'flex',gap:5,flexWrap:'wrap'}}>
                {prevEx.sets.filter(s=>s.load&&s.reps).map((s,i)=>(
                  <span key={i} style={{background:'#161616',borderRadius:4,padding:'3px 7px',fontSize:11,color:'#777'}}>
                    {s.load}kg×{s.reps}{s.rir&&<span style={{color:'#484848'}}> RIR {s.rir}</span>}
                  </span>
                ))}
              </div>
              {Math.max(...prevEx.sets.map(s=>calc1RM(s.load,s.reps)||0))>0&&(
                <div style={{fontSize:10,color:'#383838',marginTop:4}}>1RM ant: <span style={{color:'#7ed957'}}>~{Math.max(...prevEx.sets.map(s=>calc1RM(s.load,s.reps)||0))}kg</span></div>
              )}
            </div>
          )}
          <div style={{fontSize:8,color:'#2a2a2a',letterSpacing:1,fontWeight:700,marginBottom:6}}>SERIES — rellena carga y reps, luego pulsa ✓</div>
          {ex.sets.map((s,si)=>(
            <SetRow key={si} s={s} si={si} onChange={(f,v)=>updateSet(si,f,v)} onDelete={()=>removeSet(si)} onDone={()=>onSetDone(si)} onUndone={()=>onSetUndone(si)} exName={ex.name} allTimeBests={allTimeBests}/>
          ))}
          <div style={{display:'flex',gap:7,marginTop:8}}>
            <button onClick={addSet} style={{flex:1,padding:'10px',background:'transparent',color:'#ff8c00',border:'1.5px dashed #252525',borderRadius:6,fontSize:11,fontWeight:800,cursor:'pointer',fontFamily:'inherit',letterSpacing:1}}>+ SERIE MANUAL</button>
            <button onClick={()=>onRest(restDuration)} style={{padding:'10px 16px',background:'#161616',color:'#ff8c00',border:'1.5px solid #222',borderRadius:6,fontSize:16,cursor:'pointer'}}>⏱</button>
          </div>
          <textarea value={ex.notes} rows={2} onChange={e=>onChange(ex=>({...ex,notes:e.target.value}))} placeholder="Técnica, sensaciones..." style={{width:'100%',background:'#090909',border:'1.5px solid #1c1c1c',borderRadius:6,color:'#aaa',padding:'8px 10px',fontSize:12,outline:'none',resize:'none',lineHeight:1.5,marginTop:10,boxSizing:'border-box',fontFamily:'inherit'}}/>
          <div style={{marginTop:8}}>
            <label style={{display:'flex',alignItems:'center',gap:8,background:'#090909',border:'1.5px dashed #1c1c1c',borderRadius:6,padding:'9px 12px',cursor:'pointer',fontSize:11,color:'#383838'}}>
              📷 {ex.photo?'Cambiar foto':'Añadir foto de técnica'}
              <input type="file" accept="image/*" onChange={handlePhoto} style={{display:'none'}}/>
            </label>
            {ex.photo&&(<div style={{position:'relative',marginTop:6}}><img src={ex.photo} alt="técnica" style={{width:'100%',borderRadius:6,border:'1px solid #1e1e1e',objectFit:'cover',maxHeight:220}}/><button onClick={()=>onChange(ex=>({...ex,photo:null}))} style={{position:'absolute',top:6,right:6,background:'rgba(0,0,0,0.75)',color:'#fff',border:'none',borderRadius:'50%',width:26,height:26,fontSize:13,cursor:'pointer'}}>✕</button></div>)}
          </div>
        </div>
      )}
    </div>
  )
}

/* ═══════════ PROGRESSION SETUP ═══════════ */
function ProgressionSetup({exerciseName, config, onSave, onClose}) {
  const [cfg, setCfg] = useState({...config})
  const upd = (k,v) => setCfg(p=>({...p,[k]:v}))
  const stepper = (label, key, min, max) => (
    <div style={{marginBottom:14}}>
      <div style={{fontSize:9,color:'#555',letterSpacing:2,fontWeight:800,marginBottom:6}}>{label}</div>
      <div style={{display:'flex',alignItems:'center',gap:10}}>
        <button onClick={()=>upd(key,Math.max(min,cfg[key]-1))} style={{width:38,height:38,background:'#1a1a1a',color:'#ff8c00',border:'1px solid #2a2a2a',borderRadius:6,fontSize:20,cursor:'pointer',fontWeight:900}}>−</button>
        <div style={{flex:1,textAlign:'center',fontSize:24,fontWeight:900,color:'#f0ece3'}}>{cfg[key]}</div>
        <button onClick={()=>upd(key,Math.min(max,cfg[key]+1))} style={{width:38,height:38,background:'#1a1a1a',color:'#ff8c00',border:'1px solid #2a2a2a',borderRadius:6,fontSize:20,cursor:'pointer',fontWeight:900}}>+</button>
      </div>
    </div>
  )
  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.85)',zIndex:400,display:'flex',alignItems:'flex-end',justifyContent:'center'}}>
      <div style={{background:'#111',border:'1px solid #2a2a2a',borderRadius:'16px 16px 0 0',padding:'24px 20px 32px',width:'100%',maxWidth:480,maxHeight:'90vh',overflowY:'auto'}}>
        <div style={{fontSize:12,fontWeight:900,letterSpacing:2,marginBottom:4,color:'#ff8c00'}}>⬡ PROGRESIÓN</div>
        <div style={{fontSize:15,fontWeight:800,color:'#f0ece3',marginBottom:20}}>{exerciseName}</div>
        {stepper('SERIES OBJETIVO','setsTarget',1,10)}
        <div style={{marginBottom:14}}>
          <div style={{fontSize:9,color:'#555',letterSpacing:2,fontWeight:800,marginBottom:6}}>RANGO DE REPS</div>
          <div style={{display:'flex',gap:10,alignItems:'center'}}>
            <div style={{flex:1}}>
              <div style={{fontSize:8,color:'#444',marginBottom:4,textAlign:'center'}}>MÍN</div>
              <div style={{display:'flex',alignItems:'center',gap:6}}>
                <button onClick={()=>upd('repsMin',Math.max(1,cfg.repsMin-1))} style={{width:32,height:32,background:'#1a1a1a',color:'#ff8c00',border:'1px solid #2a2a2a',borderRadius:5,fontSize:18,cursor:'pointer',fontWeight:900}}>−</button>
                <div style={{flex:1,textAlign:'center',fontSize:20,fontWeight:900,color:'#f0ece3'}}>{cfg.repsMin}</div>
                <button onClick={()=>upd('repsMin',Math.min(cfg.repsMax-1,cfg.repsMin+1))} style={{width:32,height:32,background:'#1a1a1a',color:'#ff8c00',border:'1px solid #2a2a2a',borderRadius:5,fontSize:18,cursor:'pointer',fontWeight:900}}>+</button>
              </div>
            </div>
            <div style={{color:'#333',fontSize:18,fontWeight:900}}>—</div>
            <div style={{flex:1}}>
              <div style={{fontSize:8,color:'#444',marginBottom:4,textAlign:'center'}}>MÁX</div>
              <div style={{display:'flex',alignItems:'center',gap:6}}>
                <button onClick={()=>upd('repsMax',Math.max(cfg.repsMin+1,cfg.repsMax-1))} style={{width:32,height:32,background:'#1a1a1a',color:'#ff8c00',border:'1px solid #2a2a2a',borderRadius:5,fontSize:18,cursor:'pointer',fontWeight:900}}>−</button>
                <div style={{flex:1,textAlign:'center',fontSize:20,fontWeight:900,color:'#f0ece3'}}>{cfg.repsMax}</div>
                <button onClick={()=>upd('repsMax',Math.min(30,cfg.repsMax+1))} style={{width:32,height:32,background:'#1a1a1a',color:'#ff8c00',border:'1px solid #2a2a2a',borderRadius:5,fontSize:18,cursor:'pointer',fontWeight:900}}>+</button>
              </div>
            </div>
          </div>
        </div>
        <div style={{marginBottom:14}}>
          <div style={{fontSize:9,color:'#555',letterSpacing:2,fontWeight:800,marginBottom:6}}>INCREMENTO DE CARGA (kg)</div>
          <div style={{display:'flex',gap:6}}>
            {[0,1.25,2.5,5,10].map(v=>(
              <button key={v} onClick={()=>upd('loadIncrement',v)} style={{flex:1,padding:'10px 2px',background:cfg.loadIncrement===v?'#ff8c00':'#1a1a1a',color:cfg.loadIncrement===v?'#080808':'#555',border:`1.5px solid ${cfg.loadIncrement===v?'#ff8c00':'#222'}`,borderRadius:6,fontSize:12,fontWeight:900,cursor:'pointer',fontFamily:'inherit'}}>{v}</button>
            ))}
          </div>
        </div>
        <div style={{marginBottom:24}}>
          <div style={{fontSize:9,color:'#555',letterSpacing:2,fontWeight:800,marginBottom:6}}>RIR MÍNIMO PARA SUBIR CARGA</div>
          <div style={{display:'flex',gap:6}}>
            {[1,2,3].map(v=>(
              <button key={v} onClick={()=>upd('rirTarget',v)} style={{flex:1,padding:'12px',background:cfg.rirTarget===v?'#ff8c00':'#1a1a1a',color:cfg.rirTarget===v?'#080808':'#555',border:`1.5px solid ${cfg.rirTarget===v?'#ff8c00':'#222'}`,borderRadius:6,fontSize:16,fontWeight:900,cursor:'pointer',fontFamily:'inherit'}}>{v}</button>
            ))}
          </div>
        </div>
        <div style={{display:'flex',gap:8}}>
          <button onClick={onClose} style={{flex:1,padding:'14px',background:'transparent',color:'#555',border:'1.5px solid #2a2a2a',borderRadius:8,fontSize:14,fontWeight:800,cursor:'pointer',fontFamily:'inherit'}}>CANCELAR</button>
          <button onClick={()=>onSave(cfg)} style={{flex:2,padding:'14px',background:'linear-gradient(135deg,#ff8c00,#e06600)',color:'#080808',border:'none',borderRadius:8,fontSize:14,fontWeight:900,cursor:'pointer',fontFamily:'inherit',letterSpacing:2}}>GUARDAR</button>
        </div>
      </div>
    </div>
  )
}

/* ═══════════ MESO SETUP ═══════════ */
function MesoSetup({ current, onSave, onClose }) {
  const [startDate, setStartDate] = useState(current?.startDate || new Date().toISOString().split('T')[0])
  const [totalWeeks, setTotalWeeks] = useState(current?.totalWeeks || 6)
  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.85)',zIndex:400,display:'flex',alignItems:'flex-end',justifyContent:'center'}}>
      <div style={{background:'#111',border:'1px solid #2a2a2a',borderRadius:'16px 16px 0 0',padding:'24px 20px 32px',width:'100%',maxWidth:480}}>
        <div style={{fontSize:16,fontWeight:900,letterSpacing:2,marginBottom:20,color:'#ff8c00'}}>⬡ MESOCICLO</div>
        <div style={{fontSize:9,color:'#555',letterSpacing:2,fontWeight:800,marginBottom:6}}>FECHA DE INICIO</div>
        <input type="date" value={startDate} onChange={e=>setStartDate(e.target.value)} style={{width:'100%',background:'#0d0d0d',border:'1.5px solid #2a2a2a',borderRadius:6,color:'#f0ece3',padding:'10px 12px',fontSize:14,fontFamily:'inherit',outline:'none',marginBottom:16,boxSizing:'border-box'}}/>
        <div style={{fontSize:9,color:'#555',letterSpacing:2,fontWeight:800,marginBottom:8}}>DURACIÓN (semanas)</div>
        <div style={{display:'flex',gap:8,marginBottom:24}}>
          {[4,5,6,8,10,12].map(w=>(
            <button key={w} onClick={()=>setTotalWeeks(w)} style={{flex:1,padding:'12px 4px',background:totalWeeks===w?'#ff8c00':'#1a1a1a',color:totalWeeks===w?'#080808':'#555',border:`1.5px solid ${totalWeeks===w?'#ff8c00':'#222'}`,borderRadius:6,fontSize:14,fontWeight:900,cursor:'pointer',fontFamily:'inherit'}}>{w}</button>
          ))}
        </div>
        <div style={{display:'flex',gap:8}}>
          <button onClick={onClose} style={{flex:1,padding:'14px',background:'transparent',color:'#555',border:'1.5px solid #2a2a2a',borderRadius:8,fontSize:14,fontWeight:800,cursor:'pointer',fontFamily:'inherit'}}>CANCELAR</button>
          <button onClick={()=>onSave(startDate,totalWeeks)} style={{flex:2,padding:'14px',background:'linear-gradient(135deg,#ff8c00,#e06600)',color:'#080808',border:'none',borderRadius:8,fontSize:14,fontWeight:900,cursor:'pointer',fontFamily:'inherit',letterSpacing:2}}>GUARDAR</button>
        </div>
      </div>
    </div>
  )
}

/* ═══════════ VOLUME VIEW ═══════════ */
function VolumeView({ sessions }) {
  const [weekOffset, setWeekOffset] = useState(0)
  const getOW = off => { const d=new Date(); d.setDate(d.getDate()+off*7); return getWeekYear(d.toISOString().split('T')[0]) }
  const tw = getOW(weekOffset)
  const { muscles, tonelaje } = calcWeekVolume(sessions, tw)
  const prev = calcWeekVolume(sessions, getOW(weekOffset-1))
  const totalT = Object.values(tonelaje).reduce((a,b)=>a+b,0)
  const prevT = Object.values(prev.tonelaje).reduce((a,b)=>a+b,0)
  return (
    <div style={{padding:12}}>
      <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:14,background:'#0e0e0e',border:'1px solid #1a1a1a',borderRadius:8,padding:'10px 12px'}}>
        <button onClick={()=>setWeekOffset(w=>w-1)} style={{background:'transparent',border:'none',color:'#ff8c00',fontSize:18,cursor:'pointer',padding:'0 4px'}}>‹</button>
        <div style={{flex:1,textAlign:'center'}}>
          <div style={{fontSize:10,color:'#444',letterSpacing:2,fontWeight:700}}>SEMANA</div>
          <div style={{fontSize:14,fontWeight:800,color:weekOffset===0?'#ff8c00':'#f0ece3'}}>{weekOffset===0?'ACTUAL':weekOffset===-1?'ANTERIOR':`hace ${Math.abs(weekOffset)} sem.`}</div>
        </div>
        <button onClick={()=>setWeekOffset(w=>Math.min(0,w+1))} style={{background:'transparent',border:'none',color:weekOffset===0?'#333':'#ff8c00',fontSize:18,cursor:'pointer',padding:'0 4px'}}>›</button>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:8,marginBottom:14}}>
        {[{label:'TONELAJE',value:`${Math.round(totalT/100)/10}t`,color:'#ff8c00'},{label:'VS ANT.',value:totalT>0&&prevT>0?`${Math.round((totalT/prevT-1)*100)}%`:'—',color:'#7ed957'},{label:'SESIONES',value:Object.values(sessions).flat().filter(s=>getWeekYear(s.date)===tw).length,color:'#f0ece3'}].map(({label,value,color})=>(
          <div key={label} style={{background:'#0d0d0d',border:'1px solid #181818',borderRadius:7,padding:'10px 6px',textAlign:'center'}}>
            <div style={{fontSize:8,letterSpacing:2,color:'#2e2e2e',fontWeight:800}}>{label}</div>
            <div style={{fontSize:18,fontWeight:900,color,marginTop:3}}>{value}</div>
          </div>
        ))}
      </div>
      {Object.keys(VOLUME_TARGETS).map(muscle => {
        const sets = Math.round((muscles[muscle]||0)*10)/10
        const t = VOLUME_TARGETS[muscle]
        const ps = Math.round((prev.muscles[muscle]||0)*10)/10
        const delta = sets - ps
        let zc='#555',zl='Sin datos'
        if(sets>0){if(sets<t.mev){zc='#ffd12d';zl='Bajo MEV';}else if(sets<=t.mavH){zc='#7ed957';zl='MAV ✓';}else if(sets<=t.mrv){zc='#ff6b2d';zl='~MRV';}else{zc='#ff2d2d';zl='MRV+';}}
        const bm=t.mrv*1.2, bp=v=>Math.min(100,(v/bm)*100)
        return (
          <div key={muscle} style={{background:'#0e0e0e',border:`1px solid ${sets>0?'#1e1e1e':'#141414'}`,borderLeft:`3px solid ${zc}`,borderRadius:7,padding:'10px 12px',marginBottom:8}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:7}}>
              <div style={{display:'flex',alignItems:'center',gap:6}}>
                <span style={{fontSize:11,fontWeight:800,color:sets>0?'#f0ece3':'#333'}}>{muscle}</span>
                <span style={{fontSize:9,color:zc,fontWeight:700,background:`${zc}22`,padding:'2px 5px',borderRadius:3}}>{zl}</span>
              </div>
              <div style={{display:'flex',alignItems:'center',gap:8}}>
                {delta!==0&&ps>0&&<span style={{fontSize:10,color:delta>0?'#7ed957':'#ff6b6b',fontWeight:700}}>{delta>0?`+${delta.toFixed(1)}`:`${delta.toFixed(1)}`}</span>}
                <span style={{fontSize:16,fontWeight:900,color:zc}}>{sets===0?'—':sets}</span>
                <span style={{fontSize:9,color:'#444'}}>series</span>
              </div>
            </div>
            <div style={{position:'relative',height:8,background:'#141414',borderRadius:4,overflow:'hidden'}}>
              <div style={{position:'absolute',left:`${bp(t.mev)}%`,top:0,width:1,height:'100%',background:'#333',zIndex:2}}/>
              <div style={{position:'absolute',left:`${bp(t.mavL)}%`,top:0,width:`${bp(t.mavH)-bp(t.mavL)}%`,height:'100%',background:'#1e2e0e',zIndex:1}}/>
              <div style={{position:'absolute',left:`${bp(t.mrv)}%`,top:0,width:1,height:'100%',background:'#3a1a1a',zIndex:2}}/>
              {sets>0&&<div style={{position:'absolute',left:0,top:0,height:'100%',borderRadius:4,background:zc,width:`${bp(sets)}%`,transition:'width 0.6s ease',zIndex:3}}/>}
            </div>
            <div style={{position:'relative',height:14,marginTop:2}}>
              <div style={{position:'absolute',left:`${bp(t.mev)}%`,fontSize:7,color:'#383838',transform:'translateX(-50%)'}}>MEV{t.mev}</div>
              <div style={{position:'absolute',left:`${(bp(t.mavL)+bp(t.mavH))/2}%`,fontSize:7,color:'#2e3e1e',transform:'translateX(-50%)'}}>MAV</div>
              <div style={{position:'absolute',left:`${bp(t.mrv)}%`,fontSize:7,color:'#3e1e1e',transform:'translateX(-50%)'}}>MRV{t.mrv}</div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

/* ═══════════ PROGRESS VIEW ═══════════ */
function ProgressView({ sessions, exercises, allTimeBests, allSessions, dayIdx }) {
  const [sel, setSel] = useState(0)
  const allData = [...sessions].reverse().map(s=>({date:s.date,ex:s.exercises[sel]})).filter(d=>d.ex)
  const chartData = allData.map(d=>{const best=Math.max(...d.ex.sets.map(s=>calc1RM(s.load,s.reps)||0));const maxL=Math.max(...d.ex.sets.map(s=>parseFloat(s.load)||0));return{date:d.date,rm1:best,load:maxL};}).filter(d=>d.rm1>0||d.load>0)
  const first=chartData[0], last=chartData[chartData.length-1]
  const delta = last&&first ? Math.round((last.rm1-first.rm1)*10)/10 : 0
  const exBest = allTimeBests[exercises[sel]] || 0
  const recentChart = chartData.slice(-3)
  const trendKg = recentChart.length >= 2 ? Math.round((recentChart[recentChart.length-1].rm1 - recentChart[0].rm1)*10)/10 : null
  const trendLabel = trendKg === null ? '—' : trendKg > 0 ? `↗ +${trendKg}kg` : trendKg < 0 ? `↘ ${trendKg}kg` : '→ Estable'
  const trendColor = trendKg === null ? '#333' : trendKg > 0 ? '#4caf50' : trendKg < 0 ? '#ff4444' : '#ffd12d'
  return (
    <div style={{padding:12}}>
      <div style={{display:'flex',flexWrap:'wrap',gap:5,marginBottom:14}}>
        {exercises.map((name,i)=>{
          const stag = allSessions ? detectStagnation(allSessions, dayIdx??0, name) : {stagnant:false}
          return (
            <button key={i} onClick={()=>setSel(i)} style={{padding:'6px 9px',background:sel===i?'#ff8c00':'#0e0e0e',color:sel===i?'#080808':'#3a3a3a',border:`1px solid ${sel===i?'#ff8c00':'#1a1a1a'}`,borderRadius:4,fontSize:10,fontWeight:700,cursor:'pointer',fontFamily:'inherit',position:'relative'}}>
              {name.split(' ').slice(0,2).join(' ')}
              {stag.stagnant&&<span style={{position:'absolute',top:2,right:2,width:5,height:5,borderRadius:'50%',background:'#ff4444',display:'block'}}/>}
            </button>
          )
        })}
      </div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
        <div style={{fontSize:14,fontWeight:800,borderLeft:'3px solid #ff8c00',paddingLeft:10}}>{exercises[sel]}</div>
        {exBest>0&&<div style={{fontSize:11,color:'#ffd12d',fontWeight:800}}>🏆 PR: ~{exBest}kg</div>}
      </div>
      {!chartData.length?(<div style={{color:'#222',fontSize:13,textAlign:'center',padding:30}}>Sin datos para este ejercicio</div>):(
        <>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:14}}>
            {[{label:'INICIO 1RM',value:`${first?.rm1||0}kg`,color:'#444'},{label:'MEJOR 1RM',value:`${exBest||Math.max(...chartData.map(d=>d.rm1))}kg`,color:'#ffd12d'},{label:'PROGRESO',value:`${delta>=0?'+':''}${delta}kg`,color:delta>=0?'#7ed957':'#ff4444'},{label:'TENDENCIA',value:trendLabel,color:trendColor}].map(({label,value,color})=>(
              <div key={label} style={{background:'#0d0d0d',border:'1px solid #181818',borderRadius:7,padding:'10px 6px',textAlign:'center'}}>
                <div style={{fontSize:8,letterSpacing:2,color:'#2e2e2e',fontWeight:800}}>{label}</div>
                <div style={{fontSize:20,fontWeight:900,color,marginTop:3}}>{value}</div>
              </div>
            ))}
          </div>
          {chartData.length>=2&&(()=>{
            const vals=chartData.map(d=>d.rm1).filter(v=>v>0)
            const mn=Math.min(...vals)*0.92, mx=Math.max(exBest||0,...vals)*1.06
            const W=320, H=65
            const pts=chartData.map((d,i)=>({x:(i/(chartData.length-1))*W,y:H-((d.rm1-mn)/(mx-mn||1))*H}))
            const path=pts.map((p,i)=>`${i===0?'M':'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
            const area=path+` L${W},${H} L0,${H} Z`
            const bestY=exBest?H-((exBest-mn)/(mx-mn||1))*H:null
            return (
              <div style={{background:'#0a0a0a',borderRadius:8,padding:'12px 8px 6px'}}>
                <div style={{fontSize:8,color:'#282828',letterSpacing:3,marginBottom:4}}>1RM ESTIMADO — EPLEY</div>
                <svg viewBox={`0 0 ${W} ${H}`} style={{width:'100%',height:65}}>
                  <defs><linearGradient id="gr" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#ff8c00" stopOpacity="0.2"/><stop offset="100%" stopColor="#ff8c00" stopOpacity="0"/></linearGradient></defs>
                  <path d={area} fill="url(#gr)"/>
                  {bestY&&<line x1={0} y1={bestY} x2={W} y2={bestY} stroke="#ffd12d" strokeWidth={1} strokeDasharray="4 4" opacity={0.5}/>}
                  <path d={path} fill="none" stroke="#ff8c00" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round"/>
                  {pts.map((p,i)=>{const isPR=chartData[i].rm1>=exBest&&exBest>0;return<circle key={i} cx={p.x} cy={p.y} r={i===pts.length-1?4:2.5} fill={isPR?'#ffd12d':i===pts.length-1?'#ff8c00':'#3a3a3a'}/>})}
                </svg>
                <div style={{display:'flex',justifyContent:'space-between',fontSize:9,color:'#2e2e2e',marginTop:2}}>
                  {chartData.map((d,i)=><span key={i}>{new Date(d.date).toLocaleDateString('es-ES',{day:'numeric',month:'numeric'})}</span>)}
                </div>
              </div>
            )
          })()}
          <div style={{marginTop:14}}>
            {[...chartData].reverse().map((d,i)=>{const isPR=d.rm1>0&&exBest>0&&d.rm1>=exBest;return(<div key={i} style={{display:'flex',justifyContent:'space-between',padding:'7px 0',borderTop:'1px solid #141414',fontSize:11}}><div style={{color:'#444'}}>{new Date(d.date).toLocaleDateString('es-ES',{day:'numeric',month:'short'}).toUpperCase()}</div><div style={{color:'#555'}}>{d.load}kg</div><div style={{color:isPR?'#ffd12d':'#7ed957',fontWeight:700}}>{isPR?'🏆':''} ~{d.rm1}kg</div></div>)})}
          </div>
        </>
      )}
    </div>
  )
}

/* ═══════════ MAIN APP ═══════════ */
export default function App() {
  const [activeDay,setActiveDay] = useState(0)
  const [view,setView] = useState('log')
  const [sessions,setSessions] = useState({0:[],1:[]})
  const [current,setCurrent] = useState({0:defaultSession(0),1:defaultSession(1)})
  const [expandedEx,setExpandedEx] = useState(0)
  const [saved,setSaved] = useState(false)
  const [loaded,setLoaded] = useState(false)
  const [sessionStarted,setSessionStarted] = useState(false)
  const [sessionPaused,setSessionPaused] = useState(false)
  const [sessionElapsed,setSessionElapsed] = useState(0)
  const [restTime,setRestTime] = useState(0)
  const [restRunning,setRestRunning] = useState(false)
  const [restDuration,setRestDuration] = useState(120)
  const [autoRest,setAutoRest] = useState(true)
  const [now,setNow] = useState(new Date())
  const [allTimeBests,setAllTimeBests] = useState({})
  const [newPRs,setNewPRs] = useState({})
  const [mesocycle,setMesocycle] = useState(null)
  const [showMesoSetup,setShowMesoSetup] = useState(false)
  const [showTechnique,setShowTechnique] = useState({})
  const [progConfig,setProgConfig] = useState({})
  const [progStatus,setProgStatus] = useState({})
  const [deloadDismissedWeek,setDeloadDismissedWeek] = useState(null)
  const [showProgSetup,setShowProgSetup] = useState(false)
  const [progSetupEx,setProgSetupEx] = useState(null)
  const [fatigueSignals,setFatigueSignals] = useState([])
  const sessRef=useRef(null), restRef=useRef(null)

  useEffect(()=>{const t=setInterval(()=>setNow(new Date()),1000);return()=>clearInterval(t);},[])
  useEffect(()=>{
    if(sessionStarted&&!sessionPaused)sessRef.current=setInterval(()=>setSessionElapsed(e=>e+1),1000)
    else clearInterval(sessRef.current)
    return()=>clearInterval(sessRef.current)
  },[sessionStarted,sessionPaused])
  useEffect(()=>{
    if(restRunning&&restTime>0){restRef.current=setInterval(()=>setRestTime(t=>{if(t<=1){setRestRunning(false);return 0;}return t-1;}),1000)}
    else clearInterval(restRef.current)
    return()=>clearInterval(restRef.current)
  },[restRunning,restTime])

  useEffect(()=>{
    (async()=>{
      let parsedSess=null, loadedProgConfig={}
      const s=await storage.get('sess');if(s){parsedSess=JSON.parse(s.value);setSessions(parsedSess);setAllTimeBests(calcAllTimeBests(parsedSess));}
      const c=await storage.get('curr');if(c)setCurrent(JSON.parse(c.value))
      const m=await storage.get('meso');if(m)setMesocycle(JSON.parse(m.value))
      const ar=await storage.get('autorest');if(ar)setAutoRest(JSON.parse(ar.value))
      const pc=await storage.get('progression_config');if(pc){loadedProgConfig=JSON.parse(pc.value);setProgConfig(loadedProgConfig)}
      const ps=await storage.get('progression_status');if(ps)setProgStatus(JSON.parse(ps.value))
      const ddw=await storage.get('deload_dismissed_week');if(ddw)setDeloadDismissedWeek(JSON.parse(ddw.value))
      if(parsedSess)setFatigueSignals(detectFatigueSignals(parsedSess,loadedProgConfig))
      setLoaded(true)
    })()
  },[])

  const persist = useCallback(async(ns,nc)=>{
    await storage.set('sess',JSON.stringify(ns))
    const clean={}
    for(const d of[0,1])clean[d]={...nc[d],exercises:nc[d].exercises.map(ex=>({...ex,photo:null}))}
    await storage.set('curr',JSON.stringify(clean))
  },[])

  const startRest = dur => { setRestTime(dur||restDuration); setRestRunning(true) }
  const toggleAutoRest = () => { const nv=!autoRest; setAutoRest(nv); storage.set('autorest',JSON.stringify(nv)) }
  const saveMeso = (startDate,totalWeeks) => { const m={startDate,totalWeeks}; setMesocycle(m); setShowMesoSetup(false); storage.set('meso',JSON.stringify(m)) }
  const getMesoWeek = () => {
    if(!mesocycle)return null
    const week=Math.max(1,Math.floor((new Date()-new Date(mesocycle.startDate))/604800000)+1)
    return{week,total:mesocycle.totalWeeks,pct:Math.min(100,Math.round((week/mesocycle.totalWeeks)*100)),deload:week>=mesocycle.totalWeeks}
  }

  const updateEx = (ei,updater) => {
    setCurrent(prev=>{
      const u={...prev,[activeDay]:{...prev[activeDay],exercises:[...prev[activeDay].exercises]}}
      u[activeDay].exercises[ei]=updater(u[activeDay].exercises[ei])
      persist(sessions,u)
      return u
    })
  }

  const handleSetDone = (ei,si) => {
    const ex=current[activeDay].exercises[ei]
    const s=ex.sets[si]
    if(!s.load||!s.reps)return
    const rm=calc1RM(s.load,s.reps)
    if(rm){const prevBest=allTimeBests[ex.name]||0;if(rm>=prevBest){setAllTimeBests(prev=>({...prev,[ex.name]:rm}));setNewPRs(prev=>({...prev,[ex.name]:rm}));setTimeout(()=>setNewPRs(prev=>{const n={...prev};delete n[ex.name];return n;}),4000)}}
    if(!sessionStarted){setSessionStarted(true);setSessionElapsed(0)}
    updateEx(ei,e=>{const sets=[...e.sets];sets[si]={...sets[si],done:true};if(si===sets.length-1)sets.push({...EMPTY_SET,load:s.load,rir:s.rir});return{...e,sets}})
    if(autoRest)startRest(restDuration)
  }

  const handleSetUndone = (ei,si) => { updateEx(ei,e=>{const sets=[...e.sets];sets[si]={...sets[si],done:false};return{...e,sets}}) }

  const saveSession = () => {
    const s={...current[activeDay],savedAt:new Date().toISOString(),duration:sessionElapsed,exercises:current[activeDay].exercises.map(ex=>({...ex,photo:null}))}
    const ns={...sessions,[activeDay]:[s,...(sessions[activeDay]||[])]}
    const nc={...current,[activeDay]:defaultSession(activeDay)}
    setSessions(ns);setCurrent(nc);setSessionStarted(false);setSessionPaused(false);setSessionElapsed(0)
    setAllTimeBests(calcAllTimeBests(ns));persist(ns,nc);setSaved(true);setTimeout(()=>setSaved(false),2500)
    const newPS=evaluateProgression(s.exercises,progConfig)
    const mergedPS={...progStatus,...newPS}
    setProgStatus(mergedPS);storage.set('progression_status',JSON.stringify(mergedPS))
    setFatigueSignals(detectFatigueSignals(ns,progConfig))
  }

  const dismissDeload = () => {
    if(!mesocycle)return
    const key=`${getMesoWeek()?.week}-${mesocycle.startDate}`
    setDeloadDismissedWeek(key);storage.set('deload_dismissed_week',JSON.stringify(key))
  }

  const copyLastSession = () => {
    const prev=(sessions[activeDay]||[])[0];if(!prev)return
    const nc={...current,[activeDay]:{...current[activeDay],exercises:prev.exercises.map(ex=>({...ex,photo:null,sets:ex.sets.map(s=>({...s,done:false}))}))}}
    setCurrent(nc);persist(sessions,nc)
  }

  const handleBackup = async () => {
    const [s,c,m,ar] = await Promise.all([storage.get('sess'),storage.get('curr'),storage.get('meso'),storage.get('autorest')])
    const data = {version:1,exportedAt:new Date().toISOString(),sess:s?.value,curr:c?.value,meso:m?.value,autorest:ar?.value}
    const blob = new Blob([JSON.stringify(data,null,2)],{type:'application/json'})
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href=url; a.download='iron-log-backup.json'; a.click()
    URL.revokeObjectURL(url)
  }

  const handleRestore = async e => {
    const file = e.target.files[0]; if(!file)return
    if(!window.confirm('¿Restaurar backup? Se sobreescribirán todos los datos actuales.'))return
    try {
      const data = JSON.parse(await file.text())
      if(data.sess){await storage.set('sess',data.sess);const p=JSON.parse(data.sess);setSessions(p);setAllTimeBests(calcAllTimeBests(p))}
      if(data.curr){await storage.set('curr',data.curr);setCurrent(JSON.parse(data.curr))}
      if(data.meso){await storage.set('meso',data.meso);setMesocycle(JSON.parse(data.meso))}
      if(data.autorest!=null){await storage.set('autorest',data.autorest);setAutoRest(JSON.parse(data.autorest))}
      alert('✓ Backup restaurado')
    } catch {
      alert('Error al leer el archivo')
    }
    e.target.value=''
  }

  if(!loaded) return (
    <div style={{background:'#080808',height:'100vh',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:16}}>
      <div style={{fontSize:64,color:'#ff8c00'}}>⬡</div>
      <div style={{fontSize:13,letterSpacing:4,color:'#383838',fontWeight:800}}>IRON LOG · CARGANDO...</div>
    </div>
  )

  const sess=current[activeDay]
  const prevSess=(sessions[activeDay]||[])[0]
  const mesoInfo=getMesoWeek()

  return (
    <div style={{background:'#080808',minHeight:'100vh',fontFamily:"'Barlow Condensed','Arial Narrow',sans-serif",color:'#f0ece3',maxWidth:480,margin:'0 auto',paddingBottom:110}}>
      <style>{`
        *{box-sizing:border-box;-webkit-tap-highlight-color:transparent}
        body{overscroll-behavior:none}
        input[type=number]::-webkit-inner-spin-button{-webkit-appearance:none}
        input[type=number]{-moz-appearance:textfield}
        textarea,input{font-family:'Barlow Condensed','Arial Narrow',sans-serif!important}
        @keyframes blink{0%,100%{opacity:1}50%{opacity:0.2}}
        @keyframes pa{0%,38%{opacity:1}48%,88%{opacity:0}98%,100%{opacity:1}}
        @keyframes pb{0%,38%{opacity:0}48%,88%{opacity:1}98%,100%{opacity:0}}
        @keyframes slideDown{from{opacity:0;transform:translateX(-50%) translateY(-20px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}
        ::-webkit-scrollbar{width:3px}::-webkit-scrollbar-thumb{background:#333}
      `}</style>

      {/* HEADER */}
      <div style={{background:'#0e0e0e',borderBottom:'2px solid #ff8c00',padding:'12px 14px 10px',position:'sticky',top:0,zIndex:100}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:10}}>
          <div>
            <div style={{fontSize:9,letterSpacing:5,color:'#ff8c00',fontWeight:800}}>⬡ IRON LOG</div>
            <div style={{fontSize:11,color:'#3a3a3a',letterSpacing:1,marginTop:1}}>{now.toLocaleDateString('es-ES',{weekday:'long',day:'numeric',month:'long'}).toUpperCase()}</div>
          </div>
          <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:4}}>
            <div style={{fontSize:28,fontWeight:900,letterSpacing:2,color:'#ff8c00',lineHeight:1}}>{now.toLocaleTimeString('es-ES',{hour:'2-digit',minute:'2-digit'})}</div>
            {sessionStarted?(
              <div style={{display:'flex',alignItems:'center',gap:5,background:'#161616',border:'1px solid #2a2a2a',borderRadius:20,padding:'3px 8px'}}>
                <div style={{width:6,height:6,borderRadius:'50%',background:sessionPaused?'#ffaa2d':'#ff4444',animation:sessionPaused?'none':'blink 1s infinite'}}/>
                <span style={{fontSize:13,fontWeight:800,letterSpacing:1,color:sessionPaused?'#ffaa2d':'#f0ece3'}}>{fmt(sessionElapsed)}</span>
                <button onClick={()=>setSessionPaused(p=>!p)} style={{background:'transparent',border:'none',color:'#ff8c00',fontSize:13,cursor:'pointer',padding:'0 2px'}}>{sessionPaused?'▶':'⏸'}</button>
                <button onClick={saveSession} style={{background:'transparent',border:'none',color:'#555',fontSize:11,cursor:'pointer',padding:0}}>■</button>
              </div>
            ):(
              <div style={{fontSize:10,color:'#383838',fontWeight:700,letterSpacing:1}}>INICIA AL MARCAR 1ª SERIE</div>
            )}
          </div>
        </div>
        <div style={{display:'flex',gap:5}}>
          {[['log','📋 SESIÓN'],['volume','📊 VOLUMEN'],['progress','📈 PROGRESO'],['history','🗂 HISTORIAL']].map(([v,l])=>(
            <button key={v} onClick={()=>setView(v)} style={{flex:1,padding:'8px 2px',background:view===v?'#ff8c00':'transparent',color:view===v?'#080808':'#555',border:`1.5px solid ${view===v?'#ff8c00':'#222'}`,borderRadius:5,fontSize:9,fontWeight:800,letterSpacing:0.5,cursor:'pointer',fontFamily:'inherit'}}>{l}</button>
          ))}
        </div>
      </div>

      {/* MESO STRIP */}
      <div onClick={()=>setShowMesoSetup(true)} style={{display:'flex',alignItems:'center',gap:8,margin:'8px 12px 0',background:'#0d0d0d',border:`1px solid ${mesoInfo?.deload?'#ff8c00':'#1e1e1e'}`,borderRadius:6,padding:'7px 10px',cursor:'pointer'}}>
        {mesoInfo?(<>
          <div style={{fontSize:9,letterSpacing:2,color:'#444',fontWeight:800,flexShrink:0}}>MESOCICLO</div>
          <div style={{flex:1,height:4,background:'#1a1a1a',borderRadius:2}}><div style={{height:4,borderRadius:2,background:'#ff8c00',width:`${mesoInfo.pct}%`,transition:'width 0.5s'}}/></div>
          <div style={{fontSize:11,fontWeight:800,color:mesoInfo.deload?'#ff8c00':'#f0ece3',flexShrink:0}}>{mesoInfo.deload?'🔄 ':''}{fatigueSignals.length>0?'⚠️ ':''}SEM {mesoInfo.week}/{mesoInfo.total}</div>
          <div style={{fontSize:9,color:'#333'}}>⚙️</div>
        </>):(
          <div style={{fontSize:10,color:'#333',fontWeight:700,letterSpacing:2,width:'100%',textAlign:'center'}}>+ CONFIGURAR MESOCICLO</div>
        )}
      </div>

      {/* DELOAD BANNER */}
      {mesoInfo?.deload && deloadDismissedWeek !== `${mesoInfo.week}-${mesocycle?.startDate}` && (
        <div style={{margin:'8px 12px 0',background:'#0d0900',border:'1px solid #ff8c00',borderRadius:6,padding:'10px 12px',display:'flex',alignItems:'center',gap:8}}>
          <div style={{flex:1}}>
            <div style={{fontSize:10,fontWeight:900,color:'#ff8c00',letterSpacing:2}}>🔄 SEMANA DE DELOAD</div>
            <div style={{fontSize:11,color:'#777',marginTop:2}}>Reduce el volumen y la intensidad esta semana</div>
          </div>
          <button onClick={dismissDeload} style={{background:'#1a1200',border:'1px solid #3a2800',borderRadius:5,padding:'6px 10px',fontSize:10,color:'#ff8c00',cursor:'pointer',fontFamily:'inherit',fontWeight:800,flexShrink:0,letterSpacing:1}}>Entendido</button>
        </div>
      )}

      {/* DAY TABS */}
      <div style={{display:'flex',margin:'8px 12px 0',gap:8}}>
        {['DÍA A','DÍA B'].map((d,i)=>(
          <button key={i} onClick={()=>{setActiveDay(i);setExpandedEx(0)}} style={{flex:1,padding:'11px 8px',background:activeDay===i?'#161616':'transparent',border:`2px solid ${activeDay===i?'#ff8c00':'#1e1e1e'}`,borderRadius:6,color:activeDay===i?'#ff8c00':'#333',fontSize:15,fontWeight:900,letterSpacing:3,cursor:'pointer',fontFamily:'inherit',position:'relative'}}>
            {d}
            {(sessions[i]||[]).length>0&&<span style={{position:'absolute',top:4,right:6,background:'#ff8c00',color:'#080808',borderRadius:10,fontSize:9,fontWeight:900,padding:'1px 5px'}}>{(sessions[i]||[]).length}</span>}
          </button>
        ))}
      </div>

      {/* REST TIMER */}
      {(restTime>0||restRunning)&&(
        <div style={{position:'fixed',bottom:14,left:'50%',transform:'translateX(-50%)',background:'#111',border:`2px solid ${restTime===0?'#4caf50':restTime<30?'#ff4444':'#ff8c00'}`,borderRadius:14,padding:'10px 20px',zIndex:200,boxShadow:'0 8px 32px rgba(0,0,0,0.8)',textAlign:'center',minWidth:210}}>
          <div style={{fontSize:8,letterSpacing:4,color:'#444',fontWeight:800}}>DESCANSO</div>
          <div style={{fontSize:44,fontWeight:900,color:restTime===0?'#4caf50':restTime<30?'#ff4444':'#ff8c00',lineHeight:1.1}}>{restTime===0?'¡VAMOS!':fmt(restTime)}</div>
          <div style={{height:3,background:'#1e1e1e',borderRadius:2,margin:'7px 0 8px'}}><div style={{height:3,borderRadius:2,background:restTime<30?'#ff4444':'#ff8c00',width:`${(restTime/restDuration)*100}%`,transition:'width 1s linear'}}/></div>
          <div style={{display:'flex',gap:6,justifyContent:'center'}}>
            {restRunning?<button onClick={()=>setRestRunning(false)} style={pill('#333','#aaa')}>⏸</button>:<button onClick={()=>setRestRunning(true)} style={pill('#ff8c00','#080808')}>▶</button>}
            <button onClick={()=>{setRestTime(t=>t+30);setRestRunning(true)}} style={pill('#222','#888')}>+30s</button>
            <button onClick={()=>{setRestTime(0);setRestRunning(false)}} style={pill('#1a1a1a','#555')}>✕</button>
          </div>
        </div>
      )}

      {/* PR TOAST */}
      {Object.entries(newPRs).map(([name,rm])=>(
        <div key={name} style={{position:'fixed',top:80,left:'50%',transform:'translateX(-50%)',background:'linear-gradient(135deg,#2a1a00,#1a0f00)',border:'2px solid #ff8c00',borderRadius:12,padding:'12px 20px',zIndex:300,boxShadow:'0 4px 20px rgba(255,140,0,0.4)',textAlign:'center',animation:'slideDown 0.4s ease',whiteSpace:'nowrap'}}>
          <div style={{fontSize:22}}>🏆</div>
          <div style={{fontSize:14,fontWeight:900,color:'#ff8c00',letterSpacing:2}}>NUEVO RÉCORD</div>
          <div style={{fontSize:11,color:'#f0ece3',marginTop:2}}>{name}</div>
          <div style={{fontSize:20,fontWeight:900,color:'#ffd12d',marginTop:2}}>1RM ~{rm}kg</div>
        </div>
      ))}

      {/* LOG VIEW */}
      {view==='log'&&(
        <div style={{padding:'10px 12px'}}>
          <div style={{background:'#0e0e0e',border:'1px solid #1a1a1a',borderRadius:8,padding:'8px 10px',marginBottom:8,display:'flex',alignItems:'center',gap:6}}>
            <span style={{fontSize:8,letterSpacing:1,color:'#444',fontWeight:800,flexShrink:0}}>⏱</span>
            <div style={{display:'flex',gap:3,flex:1}}>
              {REST_PRESETS.map(s=>(
                <button key={s} onClick={()=>setRestDuration(s)} style={{flex:1,padding:'5px 0',background:restDuration===s?'#ff8c00':'#1a1a1a',color:restDuration===s?'#080808':'#555',border:`1px solid ${restDuration===s?'#ff8c00':'#222'}`,borderRadius:3,fontSize:9,fontWeight:800,cursor:'pointer',fontFamily:'inherit'}}>
                  {s>=60?`${s/60}'`:`${s}"`}
                </button>
              ))}
            </div>
            <button onClick={toggleAutoRest} style={{background:autoRest?'#ff8c0022':'transparent',border:`1px solid ${autoRest?'#ff8c00':'#2a2a2a'}`,borderRadius:4,padding:'4px 7px',fontSize:8,color:autoRest?'#ff8c00':'#444',cursor:'pointer',fontFamily:'inherit',fontWeight:800,flexShrink:0,letterSpacing:1}}>
              AUTO {autoRest?'●':'○'}
            </button>
          </div>
          {prevSess&&(
            <div style={{display:'flex',alignItems:'center',gap:8,background:'#0d0d0d',border:'1px solid #191919',borderLeft:'3px solid #ff8c00',borderRadius:6,padding:'7px 10px',marginBottom:10}}>
              <div style={{flex:1,fontSize:11,color:'#444'}}><span style={{color:'#ff8c00',fontWeight:700}}>↺</span>{' '}{new Date(prevSess.date).toLocaleDateString('es-ES',{weekday:'short',day:'numeric',month:'short'}).toUpperCase()}{prevSess.duration&&<span> · {fmt(prevSess.duration)}</span>}</div>
              <button onClick={copyLastSession} style={{background:'#1a1a1a',border:'1.5px solid #ff8c00',borderRadius:5,padding:'5px 10px',fontSize:10,color:'#ff8c00',cursor:'pointer',fontFamily:'inherit',fontWeight:800,flexShrink:0,letterSpacing:1}}>📋 COPIAR</button>
            </div>
          )}
          {fatigueSignals.length>0&&(
            <div style={{background:'#1a0a0a',border:'1px solid #4a1a1a',borderRadius:6,padding:'9px 12px',marginBottom:10}}>
              <div style={{fontSize:9,letterSpacing:2,color:'#ff4444',fontWeight:800,marginBottom:4}}>⚠️ SEÑALES DE FATIGA</div>
              {fatigueSignals.map((sig,i)=><div key={i} style={{fontSize:11,color:'#ff6b6b',marginTop:2}}>• {sig}</div>)}
            </div>
          )}
          {sess.exercises.map((ex,ei)=>(
            <ExCard key={ei} ex={ex} ei={ei} expanded={expandedEx===ei}
              onToggle={()=>setExpandedEx(expandedEx===ei?null:ei)}
              onChange={u=>updateEx(ei,u)}
              onSetDone={si=>handleSetDone(ei,si)}
              onSetUndone={si=>handleSetUndone(ei,si)}
              prevEx={prevSess?.exercises[ei]}
              onRest={startRest} restDuration={restDuration}
              allTimeBests={allTimeBests}
              showTechnique={showTechnique[ei]||false}
              onToggleTechnique={()=>setShowTechnique(p=>({...p,[ei]:!p[ei]}))}
              progConfig={progConfig}
              progStatus={progStatus}
              stagnant={detectStagnation(sessions, activeDay, ex.name)}
              onConfigEdit={()=>{setProgSetupEx(ex.name);setShowProgSetup(true)}}
            />
          ))}
          {sessionStarted&&(
            <button onClick={saveSession} style={{width:'100%',marginTop:16,padding:'17px',background:saved?'#0f2a0f':'linear-gradient(135deg,#ff8c00,#e06600)',color:saved?'#4caf50':'#080808',border:saved?'2px solid #4caf50':'none',borderRadius:8,fontSize:17,fontWeight:900,letterSpacing:3,cursor:'pointer',fontFamily:'inherit'}}>
              {saved?'✓ SESIÓN GUARDADA':'GUARDAR SESIÓN'}
            </button>
          )}
        </div>
      )}

      {view==='volume'&&<VolumeView sessions={sessions}/>}

      {view==='history'&&(
        <div style={{padding:12}}>
          <div style={{display:'flex',gap:8,marginBottom:14}}>
            <button onClick={handleBackup} style={{flex:1,padding:'11px 8px',background:'#0e0e0e',color:'#ff8c00',border:'1.5px solid #ff8c00',borderRadius:6,fontSize:11,fontWeight:800,cursor:'pointer',fontFamily:'inherit',letterSpacing:1}}>⬇ EXPORTAR BACKUP</button>
            <label style={{flex:1,padding:'11px 8px',background:'#0e0e0e',color:'#555',border:'1.5px solid #2a2a2a',borderRadius:6,fontSize:11,fontWeight:800,cursor:'pointer',fontFamily:'inherit',letterSpacing:1,textAlign:'center'}}>
              ⬆ RESTAURAR
              <input type="file" accept=".json,application/json" onChange={handleRestore} style={{display:'none'}}/>
            </label>
          </div>
          <div style={{fontSize:11,color:'#3a3a3a',letterSpacing:3,marginBottom:12,fontWeight:700}}>HISTORIAL — {activeDay===0?'DÍA A':'DÍA B'}</div>
          {!(sessions[activeDay]||[]).length?<div style={{textAlign:'center',color:'#222',padding:40}}>Sin sesiones aún</div>:
          (sessions[activeDay]||[]).map((s,si)=>(
            <div key={si} style={{background:'#0e0e0e',border:'1px solid #1a1a1a',borderRadius:8,padding:12,marginBottom:10}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
                <div style={{fontSize:13,fontWeight:800,color:'#ff8c00'}}>{new Date(s.date).toLocaleDateString('es-ES',{weekday:'short',day:'numeric',month:'short'}).toUpperCase()}</div>
                <div style={{display:'flex',gap:8}}>
                  {s.duration&&<span style={{fontSize:10,color:'#383838'}}>⏱ {fmt(s.duration)}</span>}
                  <span style={{fontSize:10,color:'#2a2a2a'}}>#{(sessions[activeDay]||[]).length-si}</span>
                </div>
              </div>
              {s.exercises.map((ex,ei)=>{
                const done=ex.sets.filter(st=>st.load&&st.reps);if(!done.length)return null
                const best=Math.max(...done.map(st=>calc1RM(st.load,st.reps)||0))
                const isPR=allTimeBests[ex.name]&&best>=allTimeBests[ex.name]&&best>0
                return(<div key={ei} style={{borderTop:'1px solid #161616',paddingTop:6,paddingBottom:6,display:'flex',justifyContent:'space-between',alignItems:'center',gap:8}}>
                  <div style={{fontSize:11,fontWeight:700,flex:1,color:'#bbb'}}>{ex.name}</div>
                  <div style={{display:'flex',gap:4,flexWrap:'wrap',justifyContent:'flex-end'}}>
                    {done.map((st,i)=><span key={i} style={{fontSize:10,background:'#1a1a1a',padding:'2px 5px',borderRadius:3,color:'#777'}}>{st.load}×{st.reps}</span>)}
                    {best>0&&<span style={{fontSize:10,color:isPR?'#ffd12d':'#7ed957',fontWeight:700}}>{isPR?'🏆':''} ~{best}kg</span>}
                  </div>
                </div>)
              })}
            </div>
          ))}
          <div style={{marginTop:24,paddingTop:16,borderTop:'1px solid #222',textAlign:'center'}}>
            <div style={{fontSize:13,color:'#ff8c00',fontWeight:800,letterSpacing:3}}>⬡ IRON LOG</div>
            <div style={{fontSize:13,color:'#555',marginTop:6,fontWeight:700,letterSpacing:1}}>v{VERSION} · {BUILD_DATE}</div>
          </div>
        </div>
      )}

      {view==='progress'&&<ProgressView key={activeDay} sessions={sessions[activeDay]||[]} exercises={EXERCISES[activeDay]} allTimeBests={allTimeBests} allSessions={sessions} dayIdx={activeDay}/>}

      {showMesoSetup&&<MesoSetup current={mesocycle} onSave={saveMeso} onClose={()=>setShowMesoSetup(false)}/>}
      {showProgSetup&&progSetupEx&&(
        <ProgressionSetup
          exerciseName={progSetupEx}
          config={getProgConfig(progSetupEx,progConfig)}
          onSave={cfg=>{const nc={...progConfig,[progSetupEx]:cfg};setProgConfig(nc);storage.set('progression_config',JSON.stringify(nc));setShowProgSetup(false);setProgSetupEx(null)}}
          onClose={()=>{setShowProgSetup(false);setProgSetupEx(null)}}
        />
      )}
    </div>
  )
}
