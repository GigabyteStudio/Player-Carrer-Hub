// Formata valores em euros durante a digitação; envia número simples ao Express.
document.querySelectorAll('input[data-money]').forEach(input => {
 const format = value => { const digits=String(value||'').replace(/\D/g,''); return digits?Number(digits).toLocaleString('pt-BR',{maximumFractionDigits:0}):''; };
 input.value=format(input.value);
 input.addEventListener('input',()=>{input.value=format(input.value);});
 input.form?.addEventListener('submit',()=>{input.value=input.value.replace(/\D/g,'');});
});
