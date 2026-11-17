export function sundaysInMonth(month){
 if(!/^\d{4}-(0[1-9]|1[0-2])$/.test(month))return [];
 const [year,m]=month.split('-').map(Number),result=[];
 for(let n=1;n<=31;n++){const d=new Date(Date.UTC(year,m-1,n,12));if(d.getUTCMonth()!==m-1)break;if(d.getUTCDay()===0)result.push(d.toISOString().slice(0,10));}
 return result;
}
export function nextSunday(day){const date=new Date(day+'T12:00:00Z');date.setUTCDate(date.getUTCDate()+(7-date.getUTCDay())%7);return date.toISOString().slice(0,10);}
