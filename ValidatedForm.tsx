'use client';
import {useRef,useState,useEffect} from 'react';
import type {FormEvent,ReactNode} from 'react';
export default function ValidatedForm({children,className='',onSubmit}:{children:ReactNode,className?:string,onSubmit:(event:FormEvent<HTMLFormElement>)=>void}){
 const [attempted,setAttempted]=useState(false);
 const ref=useRef<HTMLFormElement>(null);
 useEffect(()=>{if(attempted)ref.current?.querySelectorAll<HTMLInputElement>('input').forEach(input=>input.setAttribute('aria-invalid',String(!input.validity.valid)));},[attempted]);
 return <form noValidate ref={ref} className={`${className} validated-form${attempted?' show-errors':''}`} onInvalidCapture={()=>setAttempted(true)} onInputCapture={e=>{const input=e.target as HTMLInputElement;if(attempted&&input.validity)input.setAttribute('aria-invalid',String(!input.validity.valid));}} onSubmit={e=>{if(!e.currentTarget.checkValidity()){e.preventDefault();setAttempted(true);e.currentTarget.querySelector<HTMLInputElement>('input:invalid')?.focus();return;}onSubmit(e);}}>{children}</form>;
}
