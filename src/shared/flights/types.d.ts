import { SegmentType } from "./index";
import { BatteryCycle } from "../batteries/types";

export interface Flight {
  id: string;
  plane: string;
  startDate: Date;
  endDate: Date;
  duration: number;
  armedTime: number;
  flightTime: number;
  segments: Segment[];
  batteries?: BatteryCycle[];
  batteryNames?: string;
  notes?: FlightNotes;
  videos?: string[];
}

export interface FlightNotes {
  osd?: string;
  location?: string;
  journal?: string;
}

export interface FlightDay {
  date: Date;
  flights: number;
  planes: string[];
  duration: number;
  armedTime: number;
  flightTime: number;
}

export interface Plane {
  batterySlots: number;
  batteries: string[];
}

export interface Segment {
  type: SegmentType;
  rows: SegmentItem[];
  startDate: Date;
  endDate: Date;
  duration: number;
}

export interface SegmentItem {}
