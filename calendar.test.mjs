import test from 'node:test';
import assert from 'node:assert/strict';
import {weekDays,addDays,calendarEvent} from './calendar.mjs';
test('semana começa segunda e termina domingo',()=>assert.deepEqual(weekDays('2026-11-17'),['2026-11-16','2026-11-17','2026-11-18','2026-11-19','2026-11-20','2026-11-21','2026-11-22']));
test('navegação atravessa mês e ano',()=>{assert.equal(addDays('2026-12-29',7),'2027-01-05');assert.equal(weekDays('2027-01-03')[0],'2026-12-28');});
test('corte e combo ocupam blocos proporcionais no horário de Brasília',()=>{assert.deepEqual(calendarEvent({start:'2026-11-18T13:00:00Z',end:'2026-11-18T14:30:00Z'}),{day:'2026-11-18',row:7,span:3});});
test('limpar filtro de data não quebra o calendário',()=>assert.equal(weekDays('').length,7));
