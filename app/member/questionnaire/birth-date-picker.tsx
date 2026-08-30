"use client";

import { useMemo, useState } from "react";
import { Label } from "@/components/ui/label";

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 101 }, (_, i) => CURRENT_YEAR - i);
const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);

function daysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate();
}

const selectClass =
  "h-8 flex-1 rounded-lg border border-input bg-transparent px-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export function BirthDatePicker() {
  const [year, setYear] = useState("");
  const [month, setMonth] = useState("");
  const [day, setDay] = useState("");

  const days = useMemo(() => {
    const count = year && month ? daysInMonth(Number(year), Number(month)) : 31;
    return Array.from({ length: count }, (_, i) => i + 1);
  }, [year, month]);

  function handleYearChange(value: string) {
    setYear(value);
    if (value && month && day && Number(day) > daysInMonth(Number(value), Number(month))) {
      setDay("");
    }
  }

  function handleMonthChange(value: string) {
    setMonth(value);
    if (year && value && day && Number(day) > daysInMonth(Number(year), Number(value))) {
      setDay("");
    }
  }

  const birthDate =
    year && month && day
      ? `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`
      : "";

  return (
    <div className="space-y-1.5">
      <Label>생년월일</Label>
      <div className="flex gap-2">
        <select
          required
          value={year}
          onChange={(e) => handleYearChange(e.target.value)}
          className={selectClass}
        >
          <option value="" disabled>
            연도
          </option>
          {YEARS.map((y) => (
            <option key={y} value={y}>
              {y}년
            </option>
          ))}
        </select>
        <select
          required
          value={month}
          onChange={(e) => handleMonthChange(e.target.value)}
          className={selectClass}
        >
          <option value="" disabled>
            월
          </option>
          {MONTHS.map((m) => (
            <option key={m} value={m}>
              {m}월
            </option>
          ))}
        </select>
        <select
          required
          value={day}
          onChange={(e) => setDay(e.target.value)}
          className={selectClass}
        >
          <option value="" disabled>
            일
          </option>
          {days.map((d) => (
            <option key={d} value={d}>
              {d}일
            </option>
          ))}
        </select>
      </div>
      <input type="hidden" name="birth_date" value={birthDate} />
    </div>
  );
}
