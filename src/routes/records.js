const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../database/db');
const router = express.Router();
const types = ['estatisticas','evolucao','transferencias','conquistas','lesoes'];
const locations = {estatisticas:'/estatisticas',evolucao:'/evolucao',transferencias:'/transferencias',conquistas:'/trofeus',lesoes:'/lesoes'};
const titles = {estatisticas:'Estatísticas',evolucao:'Evolução',transferencias:'Transferências',conquistas:'Conquistas',lesoes:'Lesões'};
const rows = sql => db.prepare(sql).all();
const exists = (table,id) => !!db.prepare(`SELECT id FROM ${table} WHERE id = ?`).get(id);
const nonnegative = x => { const n=Number(x); return Number.isFinite(n) && n>=0 ? n : null; };
const int = (x,max=999999) => {const n=Number(x); return Number.isInteger(n)&&n>=0&&n<=max?n:null;};
const opt = x => x === undefined || x === '' ? null : x;
const attrKeys=['pace','shooting','passing','dribbling','defending','physical','gk_diving','gk_handling','gk_kicking','gk_reflexes','gk_speed','gk_positioning'];
const attrLabels={pace:'Ritmo',shooting:'Finalização',passing:'Passes',dribbling:'Condução',defending:'Defesa',physical:'Físico',gk_diving:'Mergulho',gk_handling:'Manejo',gk_kicking:'Chute',gk_reflexes:'Reflexos',gk_speed:'Velocidade',gk_positioning:'Posicionamento'};
const uploadDir=path.join(__dirname,'../../public/uploads/trophies');fs.mkdirSync(uploadDir,{recursive:true});
const uploader=multer({storage:multer.diskStorage({destination:(_r,_f,cb)=>cb(null,uploadDir),filename:(req,file,cb)=>{const stem=String(req.body.name||'conquista').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/^_|_$/g,'').slice(0,80)||'conquista';cb(null,stem+'_'+Date.now()+path.extname(file.originalname).toLowerCase());}}),limits:{fileSize:5*1024*1024},fileFilter:(_req,file,cb)=>cb(null,['image/png','image/jpeg','image/webp'].includes(file.mimetype))}).single('image');
router.get('/:type', (req,res,next)=>{
 const type=req.params.type;if(!types.includes(type))return next();
 const player=db.prepare('SELECT age, positions FROM players LIMIT 1').get()||{};
 const seasons=rows('SELECT id,name,is_current FROM seasons ORDER BY is_current DESC, start_date DESC');
 const clubs=rows('SELECT id,name,type FROM clubs ORDER BY name');
 const competitions=rows('SELECT id,name,category FROM competitions ORDER BY name');
 const campaigns= type==='estatisticas'?rows(`SELECT cc.id,s.name AS season_name,c.name AS club_name,co.name AS competition_name FROM competition_campaigns cc JOIN seasons s ON s.id=cc.season_id JOIN clubs c ON c.id=cc.club_id JOIN competitions co ON co.id=cc.competition_id LEFT JOIN career_stats cs ON cs.campaign_id=cc.id WHERE cs.id IS NULL ORDER BY s.start_date DESC,c.name`):[];
 const trophies=type==='conquistas'?rows('SELECT id,name FROM trophies ORDER BY name'):[];
 res.render('register-record',{title:'Registrar '+titles[type],type,seasons,clubs,competitions,campaigns,trophies,player,attrLabels,returnUrl:locations[type],error:null});
});
router.post('/:type', (req,res,next)=>{
 const type=req.params.type;if(!types.includes(type))return next();
 const b=req.body;
 try{
 if(type==='estatisticas'){
  let campaignId=b.campaign_id;
  const games=int(b.games),goals=int(b.goals),assists=int(b.assists);
  if([games,goals,assists].includes(null))throw Error('Informe quantidades válidas de partidas, gols e assistências.');
  if(!campaignId){
   if(!exists('seasons',b.season_id)||!exists('clubs',b.club_id)||!exists('competitions',b.competition_id))throw Error('Selecione temporada, clube e competição.');
   const found=db.prepare('SELECT id FROM competition_campaigns WHERE season_id=? AND club_id=? AND competition_id=?').get(b.season_id,b.club_id,b.competition_id);
   if(found){campaignId=found.id;}
   else{campaignId=db.prepare('INSERT INTO competition_campaigns (season_id,club_id,competition_id,final_position) VALUES (?,?,?,?)').run(b.season_id,b.club_id,b.competition_id,opt(b.final_position)).lastInsertRowid;}
  }
  if(!exists('competition_campaigns',campaignId))throw Error('Campanha não encontrada.');
  // Preserve a posição anterior quando o campo não for preenchido.
  // Atualiza também campanhas já existentes, não somente novas campanhas.
  if (b.final_position !== undefined && String(b.final_position).trim() !== '') {
   db.prepare('UPDATE competition_campaigns SET final_position = ? WHERE id = ?').run(String(b.final_position).trim(), campaignId);
  }
  const values=['yellow_cards','second_yellow_cards','red_cards'].map(k=>int(b[k]||0));
  if(values.includes(null))throw Error('Informe cartões válidos.');
  if(b.average_rating && (Number(b.average_rating)<0||Number(b.average_rating)>10))throw Error('A nota média deve ficar entre 0 e 10.');
  db.prepare(`INSERT INTO career_stats (campaign_id,games,goals,assists,yellow_cards,second_yellow_cards,red_cards,average_rating,top_scorer,top_assister) VALUES (?,?,?,?,?,?,?,?,?,?) ON CONFLICT(campaign_id) DO UPDATE SET games=excluded.games,goals=excluded.goals,assists=excluded.assists,yellow_cards=excluded.yellow_cards,second_yellow_cards=excluded.second_yellow_cards,red_cards=excluded.red_cards,average_rating=excluded.average_rating,top_scorer=excluded.top_scorer,top_assister=excluded.top_assister,updated_at=CURRENT_TIMESTAMP`).run(campaignId,games,goals,assists,...values,opt(b.average_rating),b.top_scorer?1:0,b.top_assister?1:0);
 }else if(type==='evolucao'){
  if(!/^\d{4}-\d{2}-\d{2}$/.test(b.date))throw Error('Informe a data do registro.');
  if(int(b.overall,99)===null)throw Error('Informe um overall entre 0 e 99.');
  const values=attrKeys.map(k=>b[k]===''||b[k]===undefined?null:int(b[k],99));
  if(values.some((v,i)=>v===null && b[attrKeys[i]]!==''&&b[attrKeys[i]]!==undefined))throw Error('Os atributos devem ficar entre 0 e 99.');
  const cols=['date','age','overall',...attrKeys,'market_value','salary'];
  db.prepare(`INSERT INTO attribute_progress (${cols.join(',')}) VALUES (${cols.map(()=>'?').join(',')})`).run(b.date,opt(b.age),b.overall,...values,opt(b.market_value),opt(b.salary));
 }else if(type==='transferencias'){
  if(!exists('seasons',b.season_id)||!exists('clubs',b.to_club_id)||!/^\d{4}-\d{2}-\d{2}$/.test(b.date))throw Error('Informe temporada, data e clube de destino.');
  if(b.from_club_id&&!exists('clubs',b.from_club_id))throw Error('Clube de origem inválido.');
  db.prepare('INSERT INTO transfers (season_id,date,from_club_id,to_club_id,market_value,transfer_fee,contract_until) VALUES (?,?,?,?,?,?,?)').run(b.season_id,b.date,opt(b.from_club_id),b.to_club_id,opt(b.market_value),opt(b.transfer_fee),opt(b.contract_until));
 }else if(type==='lesoes'){
  if(!exists('seasons',b.season_id)||!String(b.injury_name||'').trim())throw Error('Informe temporada e nome da lesão.');
  db.prepare('INSERT INTO injuries (season_id,injury_name,injury_date,days_injured,games_missed) VALUES (?,?,?,?,?)').run(b.season_id,String(b.injury_name).trim(),opt(b.injury_date),int(b.days_injured||0),int(b.games_missed||0));
 }else if(type==='conquistas'){
  if(b.action==='entry'){
   if(!exists('trophies',b.trophy_id))throw Error('Selecione uma conquista cadastrada.');
   for(const [key,table] of [['season_id','seasons'],['club_id','clubs'],['competition_id','competitions']])if(b[key]&&!exists(table,b[key]))throw Error('Referência inválida: '+key);
   db.prepare('INSERT INTO trophy_entries (trophy_id,season_id,club_id,competition_id,extra_info) VALUES (?,?,?,?,?)').run(b.trophy_id,opt(b.season_id),opt(b.club_id),opt(b.competition_id),opt(b.extra_info));
  }else throw Error('Use o formulário de novo título/prêmio para adicionar um tipo de conquista.');
 }
 return res.redirect(locations[type]);
 }catch(err){
  if(err.code==='SQLITE_CONSTRAINT_UNIQUE')return res.status(400).send('Já existe um registro para essa campanha. <a href="/registrar/estatisticas">Voltar</a>');
  console.error(err);return res.status(400).send('Não foi possível salvar: '+String(err.message).replace(/[<>&]/g,'')+` <a href="/registrar/${type}">Voltar</a>`);
 }
});
router.post('/conquistas/tipo', (req,res)=>{
 uploader(req,res,err=>{
  if(err)return res.status(400).send('Imagem inválida ou maior que 5 MB.');
  const name=String(req.body.name||'').trim();if(!name)return res.status(400).send('Informe o nome do título ou prêmio.');
  db.prepare('INSERT INTO trophies (name,image,importance) VALUES (?,?,?)').run(name,req.file?'/uploads/trophies/'+req.file.filename:null,int(req.body.importance||1,100)||1);
  res.redirect('/registrar/conquistas');
 });
});

// Edição e exclusão a partir das páginas públicas da carreira.
const editable={evolucao:{table:'attribute_progress',url:'/evolucao'},lesoes:{table:'injuries',url:'/lesoes'},conquistas:{table:'trophy_entries',url:'/trofeus'}};
const formData=(kind,record)=>({title:'Editar '+(titles[kind]||'Título ou prêmio'),kind,record,returnUrl:kind==='tipo'?'/trofeus':editable[kind].url,action:kind==='tipo'?'/registrar/conquistas/tipo/editar/'+record.id:'/registrar/'+kind+'/editar/'+record.id,seasons:rows('SELECT id,name FROM seasons ORDER BY start_date DESC'),clubs:rows('SELECT id,name FROM clubs ORDER BY name'),competitions:rows('SELECT id,name FROM competitions ORDER BY name'),trophies:rows('SELECT id,name FROM trophies ORDER BY name'),isGK:!!(db.prepare('SELECT positions FROM players LIMIT 1').get()?.positions||'').split(',').includes('GOL'),attrLabels});
router.get('/conquistas/tipo/editar/:id',(req,res)=>{const record=db.prepare('SELECT * FROM trophies WHERE id=?').get(req.params.id);if(!record)return res.sendStatus(404);res.render('edit-record',formData('tipo',record));});
router.post('/conquistas/tipo/editar/:id',(req,res)=>{uploader(req,res,err=>{if(err)return res.status(400).send('Arquivo inválido.');const record=db.prepare('SELECT * FROM trophies WHERE id=?').get(req.params.id);if(!record)return res.sendStatus(404);const name=String(req.body.name||'').trim(),importance=int(req.body.importance,100);if(!name||!importance)return res.status(400).send('Informe nome e importância válidos.');db.prepare('UPDATE trophies SET name=?,importance=?,image=?,updated_at=CURRENT_TIMESTAMP WHERE id=?').run(name,importance,req.file?'/uploads/trophies/'+req.file.filename:record.image,req.params.id);res.redirect('/trofeus');});});
router.post('/conquistas/tipo/excluir/:id',(req,res)=>{db.prepare('DELETE FROM trophies WHERE id=?').run(req.params.id);res.redirect('/trofeus');});
router.get('/:type/editar/:id',(req,res)=>{const meta=editable[req.params.type];if(!meta)return res.sendStatus(404);const record=db.prepare(`SELECT * FROM ${meta.table} WHERE id=?`).get(req.params.id);if(!record)return res.sendStatus(404);res.render('edit-record',formData(req.params.type,record));});
router.post('/:type/editar/:id',(req,res)=>{const type=req.params.type,meta=editable[type];if(!meta)return res.sendStatus(404);const b=req.body;const original=db.prepare(`SELECT * FROM ${meta.table} WHERE id=?`).get(req.params.id);if(!original)return res.sendStatus(404);try{
 if(type==='evolucao'){
 if(!/^\d{4}-\d{2}-\d{2}$/.test(b.date)||int(b.overall,99)===null)throw Error('Data ou overall inválidos.');const keys=attrKeys;const vals=keys.map(k=>b[k]===undefined?original[k]:(b[k]===''?null:int(b[k],99)));if(vals.some((n)=>n!==null&&(!Number.isInteger(n)||n<0||n>99)))throw Error('Atributo inválido.');const cols=['date','age','overall',...keys,'market_value','salary'];const values=[b.date,opt(b.age),b.overall,...vals,opt(b.market_value),opt(b.salary)];db.prepare(`UPDATE attribute_progress SET ${cols.map(c=>c+'=?').join(',')} WHERE id=?`).run(...values,req.params.id);
 } else if(type==='lesoes'){
 if(!exists('seasons',b.season_id)||!String(b.injury_name||'').trim()||int(b.days_injured||0)===null||int(b.games_missed||0)===null)throw Error('Dados de lesão inválidos.');db.prepare('UPDATE injuries SET season_id=?,injury_name=?,injury_date=?,days_injured=?,games_missed=? WHERE id=?').run(b.season_id,String(b.injury_name).trim(),opt(b.injury_date),b.days_injured||0,b.games_missed||0,req.params.id);
 }else{
 if(!exists('trophies',b.trophy_id))throw Error('Conquista inválida.');for(const [k,table] of [['season_id','seasons'],['club_id','clubs'],['competition_id','competitions']])if(b[k]&&!exists(table,b[k]))throw Error('Referência inválida.');db.prepare('UPDATE trophy_entries SET trophy_id=?,season_id=?,club_id=?,competition_id=?,extra_info=?,updated_at=CURRENT_TIMESTAMP WHERE id=?').run(b.trophy_id,opt(b.season_id),opt(b.club_id),opt(b.competition_id),opt(b.extra_info),req.params.id);
 }res.redirect(meta.url);
 }catch(err){res.status(400).send(String(err.message).replace(/[<>&]/g,'')+' <a href="javascript:history.back()">Voltar</a>');}
});
// Exclusão individual do histórico de transferências (sem afetar o cadastro dos clubes).
router.post('/transferencias/excluir/:id', (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isSafeInteger(id) || id <= 0) return res.sendStatus(400);
  try {
    db.prepare('DELETE FROM transfers WHERE id = ?').run(id);
    res.redirect('/transferencias');
  } catch (err) {
    console.error('Erro ao excluir transferência:', err);
    res.status(400).send('Não foi possível excluir a transferência. <a href="/transferencias">Voltar</a>');
  }
});

router.post('/:type/excluir/:id',(req,res)=>{const meta=editable[req.params.type];if(!meta)return res.sendStatus(404);db.prepare(`DELETE FROM ${meta.table} WHERE id=?`).run(req.params.id);res.redirect(meta.url);});

module.exports=router;
