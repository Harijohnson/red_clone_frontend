import { Fragment } from "react"
import { Bus, Grid2X2, User, CheckCircle2, Search } from "lucide-react"

const STEPS = [
  { id: 1, label: "Search", Icon: Search },
  { id: 2, label: "Choose Bus", Icon: Bus },
  { id: 3, label: "Seats", Icon: Grid2X2 },
  { id: 4, label: "Passengers", Icon: User },
  { id: 5, label: "Confirm", Icon: CheckCircle2 },
] as const

type StepId = 1 | 2 | 3 | 4 | 5

export function BookingSteps({ current }: { current: StepId }) {
  return (
    <nav aria-label="Booking progress" className="mb-8">
      <ol className="flex items-center">
        {STEPS.map((step, i) => {
          const done = step.id < current
          const active = step.id === current
          const { Icon } = step
          return (
            <Fragment key={step.id}>
              <li className="flex flex-col items-center gap-1.5">
                <div
                  aria-current={active ? "step" : undefined}
                  className={[
                    "flex h-9 w-9 items-center justify-center rounded-full transition-all",
                    done
                      ? "bg-primary text-primary-foreground"
                      : active
                        ? "bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2"
                        : "bg-muted text-muted-foreground",
                  ].join(" ")}
                >
                  {done ? (
                    <CheckCircle2 className="h-4 w-4" aria-hidden />
                  ) : (
                    <Icon className="h-4 w-4" aria-hidden />
                  )}
                </div>
                <span
                  className={[
                    "hidden text-center text-[11px] leading-tight sm:block",
                    active ? "font-semibold text-foreground" : "text-muted-foreground",
                  ].join(" ")}
                >
                  {step.label}
                </span>
              </li>
              {i < STEPS.length - 1 && (
                <div
                  aria-hidden="true"
                  className={[
                    "mx-1 h-px flex-1 self-start transition-colors",
                    "mt-[18px]",
                    done ? "bg-primary" : "bg-muted",
                  ].join(" ")}
                />
              )}
            </Fragment>
          )
        })}
      </ol>
    </nav>
  )
}
