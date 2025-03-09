"use client"

import * as React from "react"
import * as SliderPrimitive from "@radix-ui/react-slider"

import { cn } from "@/lib/utils"

interface SliderProps extends React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root> {
  thumbClassName?: string
  trackClassName?: string
  rangeClassName?: string
}

const Slider = React.forwardRef<React.ElementRef<typeof SliderPrimitive.Root>, SliderProps>(
  ({ className, thumbClassName, trackClassName, rangeClassName, ...props }, ref) => {
    const [value, setValue] = React.useState<number[]>(props.defaultValue || [0]);
    
    // Calculate the current percentage (0-100)
    const percentage = value.length > 0 ? value[0] : 0;
    
    // Note: We don't need to manually adjust for step here
    // The Radix UI Slider component already handles step constraints
    // We just need to use the current value for color calculations
    
    // Use fixed colors for the track and range that match the token colors in token-selection.tsx
    // Track (right side) is always red-500
    // Range (left side) is always blue-500
    const trackColor = "rgb(239, 68, 68)"; // red-500 in RGB
    const rangeColor = "rgb(59, 130, 246)"; // blue-500 in RGB
    
    React.useEffect(() => {
      if (props.value) {
        setValue(props.value);
      }
    }, [props.value]);
    
    const handleValueChange = (newValue: number[]) => {
      setValue(newValue);
      if (props.onValueChange) {
        props.onValueChange(newValue);
      }
    };
    
    return (
      <SliderPrimitive.Root
        ref={ref}
        className={cn("relative flex w-full touch-none select-none items-center", className)}
        onValueChange={handleValueChange}
        {...props}
      >
        <SliderPrimitive.Track
          className={cn("relative h-6 w-full grow overflow-hidden rounded-full", trackClassName)}
          style={{ backgroundColor: trackColor }}
        >
          <SliderPrimitive.Range 
            className={cn("absolute h-full", rangeClassName)} 
            style={{ backgroundColor: rangeColor }}
          />
        </SliderPrimitive.Track>
        <SliderPrimitive.Thumb
          className={cn(
            "block h-8 w-8 rounded-full border-2 border-white bg-background ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
            thumbClassName,
          )}
        />
      </SliderPrimitive.Root>
    );
  }
)
Slider.displayName = SliderPrimitive.Root.displayName

export { Slider }
