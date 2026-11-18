import { useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
export default function ValidatedForm({
  children,
  className = '',
  onSubmit,
}: {
  children: ReactNode;
  className?: string;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  const [attempted, setAttempted] = useState(false);
  function updateInput(event: FormEvent<HTMLFormElement>) {
    const input = event.target as HTMLInputElement;
    if (attempted && input.validity) {
      input.setAttribute('aria-invalid', String(!input.validity.valid));
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    const form = event.currentTarget;
    if (!form.checkValidity()) {
      event.preventDefault();
      setAttempted(true);
      form.querySelectorAll<HTMLInputElement>('input').forEach((input) => {
        input.setAttribute('aria-invalid', String(!input.validity.valid));
      });
      form.querySelector<HTMLInputElement>('input:invalid')?.focus();
      return;
    }

    setAttempted(false);
    form.querySelectorAll('input').forEach((input) => input.removeAttribute('aria-invalid'));
    onSubmit(event);
  }
  return (
    <form
      noValidate
      className={`${className} validated-form${attempted ? ' show-errors' : ''}`}
      onInputCapture={updateInput}
      onSubmit={handleSubmit}
    >
      {children}
    </form>
  );
}
