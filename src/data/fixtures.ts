import type { Booking } from '@/availability';

export const ROOM_NAME = 'Room 301';

export const INITIAL_NOW = 540; // 09:00
export const INITIAL_BLOCKED = false;
export const INITIAL_BOOKINGS: Booking[] = [{ start: 600, end: 660 }]; // 10:00 - 11:00
