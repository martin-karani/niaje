import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

const spinnerVariants = cva(
  "inline-block rounded-full border-4 border-solid border-r-transparent animate-spin",
  {
    variants: {
      size: {
        sm: "h-4 w-4 border-2",
        md: "h-8 w-8 border-3",
        lg: "h-12 w-12 border-4",
        xl: "h-16 w-16 border-4",
      },
      variant: {
        primary: "border-primary border-r-transparent",
        secondary: "border-secondary border-r-transparent",
        muted: "border-muted-foreground border-r-transparent",
      },
    },
    defaultVariants: {
      size: "md",
      variant: "primary",
    },
  }
);

export interface LoadingSpinnerProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof spinnerVariants> {
  label?: string;
}

const LoadingSpinner = ({
  className,
  size,
  variant,
  label,
  ...props
}: LoadingSpinnerProps) => {
  return (
    <div className="flex flex-col items-center justify-center" {...props}>
      <div
        className={cn(spinnerVariants({ size, variant }), className)}
        role="status"
        aria-label="Loading"
      />
      {label && (
        <span className="mt-2 text-sm text-muted-foreground">{label}</span>
      )}
    </div>
  );
};

export default LoadingSpinner;
