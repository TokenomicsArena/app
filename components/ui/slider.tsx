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
    
    // Calculate colors based on the percentage using HSV
    // At 0%: Blue side is fully saturated
    // At 50%: Both sides are white
    // At 100%: Red side is fully saturated
    
    // Define base colors that match the token colors in token-selection.tsx
    const blueHue = 210; // Blue hue in HSL
    const redHue = 0;    // Red hue in HSL
    
    // Determine which token is "winning"
    const isRedWinning = percentage > 50;
    const isBlueWinning = percentage < 50;
    
    // For the blue side (first token)
    // Square the normalized value to make changes more evident around 50%
    const normalizedBlue = percentage <= 50 ? percentage / 50 : 1;
    const squaredBlue = Math.pow(normalizedBlue, 10);
    const blueSaturation = percentage <= 50 ? 100 - (squaredBlue * 100) : 0;
    const blueLightness = percentage <= 50 ? 50 + percentage : 100;
    const blueColor = `hsl(${blueHue}, ${blueSaturation}%, ${blueLightness}%)`;
    
    // For the red side (second token)
    const normalizedRed = percentage >= 50 ? (percentage - 50) / 50 : 0;
    const squaredRed = Math.pow(normalizedRed, 0.1);
    const redSaturation = percentage >= 50 ? squaredRed * 100 : 0;
    const redLightness = percentage >= 50 ? 100 - (percentage - 50) : 100;
    const redColor = `hsl(${redHue}, ${redSaturation}%, ${redLightness}%)`;
    
    // Set track and range colors based on who's winning, maintaining the current element-color assignment
    const trackColor = isBlueWinning ? blueColor : redColor;
    const rangeColor = isRedWinning ? redColor : blueColor;
    
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
