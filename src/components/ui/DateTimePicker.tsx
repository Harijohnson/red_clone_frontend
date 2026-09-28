import { useState } from "react"
import { format, parse, isValid } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { cn } from "cn"

type DatePickerProps = {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  hasError?: boolean
  minDate?: Date
  showTime?: false
  className?: string
}

type DateTimePickerProps = {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  hasError?: boolean
  minDate?: Date
  showTime: true
  className?: string
}

export function DateTimePicker(props: DatePickerProps | DateTimePickerProps) {
  const { value, onChange, placeholder, hasError, minDate, showTime, className } = props
  const [open, setOpen] = useState(false)

  // Parse value depending on mode
  const dateObj: Date | undefined = (() => {
    if (!value) return undefined
    if (showTime) {
      const d = new Date(value)
      return isValid(d) ? d : undefined
    }
    const d = parse(value, "yyyy-MM-dd", new Date())
    return isValid(d) ? d : undefined
  })()

  const timeStr = dateObj && showTime ? format(dateObj, "HH:mm") : "00:00"

  function handleDaySelect(day: Date | undefined) {
    if (!day) return
    if (showTime) {
      const [h, m] = timeStr.split(":").map(Number)
      day.setHours(h, m, 0, 0)
      onChange(format(day, "yyyy-MM-dd'T'HH:mm"))
    } else {
      onChange(format(day, "yyyy-MM-dd"))
      setOpen(false)
    }
  }

  function handleTimeChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (!showTime) return
    const base = dateObj ?? new Date()
    const [h, m] = e.target.value.split(":").map(Number)
    base.setHours(h, m, 0, 0)
    onChange(format(base, "yyyy-MM-dd'T'HH:mm"))
  }

  const displayLabel = (() => {
    if (!dateObj) return placeholder ?? (showTime ? "Pick date & time" : "Pick a date")
    if (showTime) return format(dateObj, "dd MMM yyyy, hh:mm a")
    return format(dateObj, "dd MMM yyyy")
  })()

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start gap-2 text-left font-normal",
            !dateObj && "text-muted-foreground",
            hasError && "border-destructive focus-visible:ring-destructive/40",
            className,
          )}
        >
          <CalendarIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
          <span className="truncate">{displayLabel}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={dateObj}
          onSelect={handleDaySelect}
          disabled={(day) => !!minDate && day < minDate}
          initialFocus
        />
        {showTime && (
          <div className="border-t px-3 pb-3 pt-2">
            <p className="mb-1.5 text-xs font-medium text-muted-foreground">Time</p>
            <input
              type="time"
              value={timeStr}
              onChange={handleTimeChange}
              className="w-full rounded-md border bg-background px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
            />
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}
