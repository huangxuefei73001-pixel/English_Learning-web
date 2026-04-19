"use client";

import Link from "next/link";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type CardProps = {
  children: ReactNode;
  className?: string;
};

export function Card({ children, className }: CardProps) {
  return (
    <section
      className={cn(
        "rounded-[30px] border border-line bg-white/88 p-5 shadow-soft backdrop-blur-sm sm:p-6",
        className,
      )}
    >
      {children}
    </section>
  );
}

type SectionHeadingProps = {
  eyebrow: string;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
};

export function SectionHeading({
  eyebrow,
  title,
  description,
  action,
  className,
}: SectionHeadingProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between",
        className,
      )}
    >
      <div className="max-w-2xl">
        <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-primary">
          {eyebrow}
        </p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-text sm:text-3xl">
          {title}
        </h2>
        {description ? (
          <p className="mt-3 max-w-2xl text-sm leading-7 text-muted sm:text-base">
            {description}
          </p>
        ) : null}
      </div>
      {action ? <div>{action}</div> : null}
    </div>
  );
}

type PillProps = {
  children: ReactNode;
  tone?: "soft" | "line" | "deep" | "primary";
  className?: string;
};

export function Pill({ children, tone = "soft", className }: PillProps) {
  const toneClasses = {
    soft: "bg-soft text-deep",
    line: "border border-line bg-white text-muted",
    deep: "bg-deep text-white",
    primary: "bg-primary text-white",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold",
        toneClasses[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

type ButtonProps = {
  children: ReactNode;
  tone?: "primary" | "secondary" | "ghost";
  className?: string;
  type?: "button" | "submit";
  onClick?: () => void;
  disabled?: boolean;
};

export function Button({
  children,
  tone = "primary",
  className,
  type = "button",
  onClick,
  disabled,
}: ButtonProps) {
  const toneClasses = {
    primary: "bg-primary text-white shadow-[0_14px_28px_rgba(47,107,87,0.18)] hover:bg-deep",
    secondary: "border border-line bg-white text-text hover:border-primary hover:text-primary",
    ghost: "bg-transparent text-primary hover:bg-soft/70",
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "inline-flex min-h-12 items-center justify-center rounded-full px-5 py-3 text-sm font-semibold transition-transform duration-200 hover:-translate-y-0.5 disabled:pointer-events-none disabled:opacity-60",
        toneClasses[tone],
        className,
      )}
    >
      {children}
    </button>
  );
}

type LinkButtonProps = {
  href: string;
  children: ReactNode;
  tone?: "primary" | "secondary" | "ghost";
  className?: string;
};

export function LinkButton({
  href,
  children,
  tone = "primary",
  className,
}: LinkButtonProps) {
  const toneClasses = {
    primary: "bg-primary text-white shadow-[0_14px_28px_rgba(47,107,87,0.18)] hover:bg-deep",
    secondary: "border border-line bg-white text-text hover:border-primary hover:text-primary",
    ghost: "bg-transparent text-primary hover:bg-soft/70",
  };

  return (
    <Link
      href={href}
      className={cn(
        "inline-flex min-h-12 items-center justify-center rounded-full px-5 py-3 text-sm font-semibold transition-transform duration-200 hover:-translate-y-0.5",
        toneClasses[tone],
        className,
      )}
    >
      {children}
    </Link>
  );
}

type FieldLabelProps = {
  label: string;
  value: string;
  className?: string;
};

export function FieldLabel({ label, value, className }: FieldLabelProps) {
  return (
    <div className={cn("rounded-[24px] border border-line bg-white/85 p-4", className)}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted">
        {label}
      </p>
      <p className="mt-2 text-sm leading-7 text-text">{value}</p>
    </div>
  );
}

type TextAreaFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
};

export function TextAreaField({
  label,
  value,
  onChange,
  placeholder,
  className,
}: TextAreaFieldProps) {
  return (
    <label className={cn("block", className)}>
      <span className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted">
        {label}
      </span>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="mt-3 min-h-32 w-full rounded-[24px] border border-line bg-bg px-4 py-4 text-sm leading-7 text-text outline-none transition placeholder:text-muted/70 focus:border-primary focus:bg-white"
      />
    </label>
  );
}

type TextFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  labelClassName?: string;
  autoFocus?: boolean;
};

export function TextField({
  label,
  value,
  onChange,
  placeholder,
  className,
  labelClassName,
  autoFocus,
}: TextFieldProps) {
  return (
    <label className={cn("block", className)}>
      <span className={cn("text-[11px] font-semibold uppercase tracking-[0.24em] text-muted", labelClassName)}>
        {label}
      </span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className="mt-3 h-14 w-full rounded-[24px] border border-line bg-bg px-4 text-sm text-text outline-none transition placeholder:text-muted/70 focus:border-primary focus:bg-white"
      />
    </label>
  );
}

export function SectionRule() {
  return <div className="h-px w-full bg-line/90" />;
}
