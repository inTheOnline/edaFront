// src/types/dayjs.d.ts
import { Dayjs } from "dayjs";

declare module "dayjs" {
  interface Dayjs {
    tz(timezone: string): Dayjs;
  }
}
