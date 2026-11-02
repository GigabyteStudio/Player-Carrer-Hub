const express = require('express');
const db = require('../database/db');
const router = express.Router();
function view(res,status=200,error=null,form=null) {
  res.status(status).render('manage-seasons',{title:'Temporadas',seasons:db.prepare('SELECT * FROM seasons ORDER BY start_date DESC,id DESC').all(),error,form});
}
router.get('/',(_req,res)=>view(res));
const validDate = s => /^\d{4}-\d{2}-\d{2}$/.test(s||'') && !Number.isNaN(Date.parse(s)) && new Date(s+'T12:00:00Z').toISOString().slice(0,10)===s;
function save(req,res,editing=false) {
  const name = String(req.body.name||'').trim(); const start = req.body.start_date; const end=req.body.end_date;
  if(!name || name.length>30 || !validDate(start) || !validDate(end) || end<start) return view(res,400,'Informe nome e datas válidas (a data final não pode ser anterior à inicial).',req.body);
  try {
    const tx=db.transaction(() => {
      if(editing) db.prepare('UPDATE seasons SET name=?,start_date=?,end_date=?,updated_at=CURRENT_TIMESTAMP WHERE id=?').run(name,start,end,req.params.id);
      else db.prepare('INSERT INTO seasons(name,start_date,end_date,is_current) VALUES(?,?,?,0)').run(name,start,end);
    }); tx(); res.redirect('/gerenciar/temporadas');
  } catch(e) { console.error(e); view(res,400,'Não foi possível salvar: o nome da temporada já pode estar cadastrado.',req.body); }
}
router.post('/adicionar',(req,res)=>save(req,res));
router.post('/editar/:id',(req,res)=>save(req,res,true));
router.post('/atual/:id',(req,res)=> {
  const exists=db.prepare('SELECT id FROM seasons WHERE id=?').get(req.params.id);
  if(!exists) return view(res,404,'Temporada não encontrada.');
  db.transaction(()=>{db.prepare('UPDATE seasons SET is_current=0 WHERE is_current=1').run();db.prepare('UPDATE seasons SET is_current=1,updated_at=CURRENT_TIMESTAMP WHERE id=?').run(exists.id);})();
  res.redirect('/gerenciar/temporadas');
});
router.post('/excluir/:id',(req,res)=>{
  try { db.prepare('DELETE FROM seasons WHERE id=?').run(req.params.id);res.redirect('/gerenciar/temporadas'); }
  catch(e) {view(res,400,'Não é possível excluir uma temporada vinculada a registros da carreira.');}
});
module.exports=router;
