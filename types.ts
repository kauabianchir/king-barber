import type { Notice } from './NotificationsBell';

export type Service = {
  id: string;
  name: string;
  price: number;
  minutes: number;
  sunday: number;
  active: number;
};

export type Booking = {
  id: string;
  user_id: string;
  name: string;
  phone: string;
  service_name: string;
  start: string;
  end: string;
  price: number;
  deposit: number;
  status: string;
  paid_at: string | null;
};

export type Expense = { id: string; day: string; description: string; amount: number };

export type Data = {
  user: { id: string; name: string; email: string; admin: boolean };
  services: Service[];
  bookings: Booking[];
  expenses: Expense[];
  deletedExpenses?: Expense[];
  notifications: Notice[];
};
