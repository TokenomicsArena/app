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
    
    // Calculate colors based on the percentage
    // At 0%: Right side is blue
    // At 50%: Both sides are white
    // At 100%: Left side is red
    
    // For the track (right side)
    // Blue (hsl(210, 100%, 50%)) at 0% to White (hsl(210, 0%, 100%)) at 50%
    // Keep hue fixed at blue (210), only interpolate saturation and lightness
    const trackHue = 210; // Fixed blue hue
    
    // Square the normalized value to make changes more evident around 50%
    // First normalize to [0,1] range for 0-50% range
    const normalizedTrack = percentage <= 50 ? percentage / 50 : 1;
    // Square the normalized value (makes curve steeper near 50%)
    const squaredTrack = Math.pow(normalizedTrack, 10);
    // Scale back to get the saturation (100% at 0, 0% at 50)
    const trackSaturation = percentage <= 50 ? 100 - (squaredTrack * 100) : 0;
    
    const trackLightness = percentage <= 50 ? 50 + percentage : 100;
    const trackColor = percentage <= 50 
      ? `hsl(${trackHue}, ${trackSaturation}%, ${trackLightness}%)`
      : "hsl(0, 0%, 100%)";
    
    // For the range (left side)
    // White (hsl(0, 0%, 100%)) at 50% to Red (hsl(0, 100%, 50%)) at 100%
    // Keep hue fixed at red (0), only interpolate saturation and lightness
    const rangeHue = 0; // Fixed red hue
    
    // Square the normalized value to make changes more evident around 50%
    // First normalize to [0,1] range for 50-100% range
    const normalizedRange = percentage >= 50 ? (percentage - 50) / 50 : 0;
    // Square the normalized value (makes curve steeper near 50%)
    const squaredRange = Math.pow(normalizedRange, 0.1);
    // Scale back to get the saturation (0% at 50, 100% at 100)
    const rangeSaturation = percentage >= 50 ? squaredRange * 100 : 0;
    
    const rangeLightness = percentage >= 50 ? 100 - (percentage - 50) : 100;
    const rangeColor = percentage >= 50 
      ? `hsl(${rangeHue}, ${rangeSaturation}%, ${rangeLightness}%)`
      : "hsl(0, 0%, 100%)";
    
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
