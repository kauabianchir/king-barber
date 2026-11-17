import {useState} from 'react';
import {sundaysInMonth} from './sundays.mjs';
export default function SundayPicker({day,onChange,min,max}:{day:string,onChange:(day:string)=>void,min:string,max:string}){
 const [month,setMonth]=useState((day||min).slice(0,7));
 return <section className="sunday-picker" aria-label="Domingos para o Dia do Noivo"><p>Dia do Noivo acontece somente aos domingos. Escolha o mês e a data.</p><label>Mês do atendimento <span className="required-star" aria-hidden="true">*</span><input type="month" value={month} min={min.slice(0,7)} max={max.slice(0,7)} onInput={e=>{setMonth(e.currentTarget.value);onChange('');}} required/></label><div className="sunday-days">{sundaysInMonth(month).map((d:string)=><button key={d} type="button" disabled={d<min||d>max} aria-pressed={day===d} aria-label={`Domingo, ${d.split('-').reverse().join('/')}`} onClick={()=>onChange(d)}><span>Domingo</span><b>{Number(d.slice(-2))}</b></button>)}</div><small>Domingos passados ou fora do prazo de 90 dias aparecem indisponíveis. Os horários livres são consultados abaixo.</small></section>;
}
