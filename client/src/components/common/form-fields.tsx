import {
  Autocomplete,
  Badge,
  Box,
  Checkbox,
  FileInput,
  Group,
  MultiSelect,
  NumberInput,
  PasswordInput,
  RangeSlider,
  Select,
  Slider,
  Switch,
  Text,
  Textarea,
  TextInput,
} from "@mantine/core";
import { DatePickerInput } from "@mantine/dates";
import { IconEye, IconEyeOff, IconUpload } from "@tabler/icons-react";

// Base props for all form fields
interface BaseFieldProps {
  label?: string;
  description?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
}

// Text input props
export interface TextFieldProps extends BaseFieldProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: "text" | "email" | "tel" | "url";
  autoComplete?: string;
  icon?: React.ReactNode;
}

// Password input props
export interface PasswordFieldProps extends BaseFieldProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  autoComplete?: string;
}

// Number input props
export interface NumberFieldProps extends BaseFieldProps {
  value: number | "";
  onChange: (value: number | "") => void;
  placeholder?: string;
  min?: number;
  max?: number;
  step?: number;
  precision?: number;
  formatter?: (value: string) => string;
  parser?: (value: string) => string;
  icon?: React.ReactNode;
  prefix?: string;
  suffix?: string;
}

// Textarea props
export interface TextareaFieldProps extends BaseFieldProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  autosize?: boolean;
  minRows?: number;
  maxRows?: number;
}

// Select props
export interface SelectFieldProps extends BaseFieldProps {
  value: string | null;
  onChange: (value: string | null) => void;
  data: { value: string; label: string }[] | string[];
  placeholder?: string;
  searchable?: boolean;
  clearable?: boolean;
  nothingFound?: string;
  icon?: React.ReactNode;
}

// Multi-select props
export interface MultiSelectFieldProps extends BaseFieldProps {
  value: string[];
  onChange: (value: string[]) => void;
  data: { value: string; label: string }[] | string[];
  placeholder?: string;
  searchable?: boolean;
  clearable?: boolean;
  nothingFound?: string;
  maxSelectedValues?: number;
}

// Checkbox props
export interface CheckboxFieldProps extends BaseFieldProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  indeterminate?: boolean;
}

// Switch props
export interface SwitchFieldProps extends BaseFieldProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  onLabel?: string;
  offLabel?: string;
}

// Date input props
export interface DateFieldProps extends BaseFieldProps {
  value: Date | null;
  onChange: (value: Date | null) => void;
  placeholder?: string;
  minDate?: Date;
  maxDate?: Date;
  excludeDate?: (date: Date) => boolean;
  format?: string;
  clearable?: boolean;
}

// File input props
export interface FileFieldProps extends BaseFieldProps {
  value: File | null;
  onChange: (file: File | null) => void;
  accept?: string;
  placeholder?: string;
  clearable?: boolean;
  multiple?: boolean;
}

// Autocomplete props
export interface AutocompleteFieldProps extends BaseFieldProps {
  value: string;
  onChange: (value: string) => void;
  data: string[];
  placeholder?: string;
  limit?: number;
  nothingFound?: string;
  icon?: React.ReactNode;
}

// Slider props
export interface SliderFieldProps extends BaseFieldProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  marks?: { value: number; label?: string }[];
  labelAlwaysOn?: boolean;
}

// Range slider props
export interface RangeSliderFieldProps extends BaseFieldProps {
  value: [number, number];
  onChange: (value: [number, number]) => void;
  min?: number;
  max?: number;
  step?: number;
  marks?: { value: number; label?: string }[];
  labelAlwaysOn?: boolean;
}

// Badge select field props
export interface BadgeSelectFieldProps extends BaseFieldProps {
  value: string[];
  onChange: (value: string[]) => void;
  data: { value: string; label: string }[];
}

// Text Input Field
export function TextField({
  label,
  description,
  error,
  required,
  disabled,
  readOnly,
  value,
  onChange,
  placeholder,
  type = "text",
  autoComplete,
  icon,
}: TextFieldProps) {
  return (
    <TextInput
      label={label}
      description={description}
      error={error}
      required={required}
      disabled={disabled}
      readOnly={readOnly}
      value={value}
      onChange={(e) => onChange(e.currentTarget.value)}
      placeholder={placeholder}
      type={type}
      autoComplete={autoComplete}
      leftSection={icon}
    />
  );
}

// Password Input Field
export function PasswordField({
  label,
  description,
  error,
  required,
  disabled,
  readOnly,
  value,
  onChange,
  placeholder,
  autoComplete,
}: PasswordFieldProps) {
  return (
    <PasswordInput
      label={label}
      description={description}
      error={error}
      required={required}
      disabled={disabled}
      readOnly={readOnly}
      value={value}
      onChange={(e) => onChange(e.currentTarget.value)}
      placeholder={placeholder}
      autoComplete={autoComplete}
      visibilityToggleIcon={({ reveal }) =>
        reveal ? <IconEye size="1rem" /> : <IconEyeOff size="1rem" />
      }
    />
  );
}

// Number Input Field
export function NumberField({
  label,
  description,
  error,
  required,
  disabled,
  readOnly,
  value,
  onChange,
  placeholder,
  min,
  max,
  step,
  precision,
  formatter,
  parser,
  icon,
  prefix,
  suffix,
}: NumberFieldProps) {
  return (
    <NumberInput
      label={label}
      description={description}
      error={error}
      required={required}
      disabled={disabled}
      readOnly={readOnly}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      min={min}
      max={max}
      step={step}
      precision={precision}
      leftSection={icon}
      prefix={prefix}
      suffix={suffix}
    />
  );
}

// Textarea Field
export function TextareaField({
  label,
  description,
  error,
  required,
  disabled,
  readOnly,
  value,
  onChange,
  placeholder,
  autosize,
  minRows,
  maxRows,
}: TextareaFieldProps) {
  return (
    <Textarea
      label={label}
      description={description}
      error={error}
      required={required}
      disabled={disabled}
      readOnly={readOnly}
      value={value}
      onChange={(e) => onChange(e.currentTarget.value)}
      placeholder={placeholder}
      autosize={autosize}
      minRows={minRows}
      maxRows={maxRows}
    />
  );
}

// Select Field
export function SelectField({
  label,
  description,
  error,
  required,
  disabled,
  readOnly,
  value,
  onChange,
  data,
  placeholder,
  searchable,
  clearable,
  nothingFound,
  icon,
}: SelectFieldProps) {
  return (
    <Select
      label={label}
      description={description}
      error={error}
      required={required}
      disabled={disabled}
      readOnly={readOnly}
      value={value}
      onChange={onChange}
      data={data}
      placeholder={placeholder}
      searchable={searchable}
      clearable={clearable}
      nothingFound={nothingFound}
      leftSection={icon}
    />
  );
}

// Multi-select Field
export function MultiSelectField({
  label,
  description,
  error,
  required,
  disabled,
  readOnly,
  value,
  onChange,
  data,
  placeholder,
  searchable,
  clearable,
  nothingFound,
  maxSelectedValues,
}: MultiSelectFieldProps) {
  return (
    <MultiSelect
      label={label}
      description={description}
      error={error}
      required={required}
      disabled={disabled}
      readOnly={readOnly}
      value={value}
      onChange={onChange}
      data={data}
      placeholder={placeholder}
      searchable={searchable}
      clearable={clearable}
      nothingFound={nothingFound}
      maxValues={maxSelectedValues}
    />
  );
}

// Checkbox Field
export function CheckboxField({
  label,
  description,
  error,
  required,
  disabled,
  readOnly,
  checked,
  onChange,
  indeterminate,
}: CheckboxFieldProps) {
  return (
    <Checkbox
      label={label}
      description={description}
      error={error}
      required={required}
      disabled={disabled}
      readOnly={readOnly}
      checked={checked}
      onChange={(e) => onChange(e.currentTarget.checked)}
      indeterminate={indeterminate}
    />
  );
}

// Switch Field
export function SwitchField({
  label,
  description,
  error,
  required,
  disabled,
  readOnly,
  checked,
  onChange,
  onLabel,
  offLabel,
}: SwitchFieldProps) {
  return (
    <Switch
      label={label}
      description={description}
      error={error}
      required={required}
      disabled={disabled}
      readOnly={readOnly}
      checked={checked}
      onChange={(e) => onChange(e.currentTarget.checked)}
      onLabel={onLabel}
      offLabel={offLabel}
    />
  );
}

// Date Input Field
export function DateField({
  label,
  description,
  error,
  required,
  disabled,
  readOnly,
  value,
  onChange,
  placeholder,
  minDate,
  maxDate,
  excludeDate,
  format,
  clearable,
}: DateFieldProps) {
  return (
    <DatePickerInput
      label={label}
      description={description}
      error={error}
      required={required}
      disabled={disabled}
      readOnly={readOnly}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      minDate={minDate}
      maxDate={maxDate}
      excludeDate={excludeDate}
      valueFormat={format}
      clearable={clearable}
    />
  );
}

// File Input Field
export function FileField({
  label,
  description,
  error,
  required,
  disabled,
  readOnly,
  value,
  onChange,
  accept,
  placeholder,
  clearable,
  multiple,
}: FileFieldProps) {
  return (
    <FileInput
      label={label}
      description={description}
      error={error}
      required={required}
      disabled={disabled}
      readOnly={readOnly}
      value={value}
      onChange={onChange}
      accept={accept}
      placeholder={placeholder}
      clearable={clearable}
      multiple={multiple}
      leftSection={<IconUpload size="1rem" />}
    />
  );
}

// Autocomplete Field
export function AutocompleteField({
  label,
  description,
  error,
  required,
  disabled,
  readOnly,
  value,
  onChange,
  data,
  placeholder,
  limit,
  nothingFound,
  icon,
}: AutocompleteFieldProps) {
  return (
    <Autocomplete
      label={label}
      description={description}
      error={error}
      required={required}
      disabled={disabled}
      readOnly={readOnly}
      value={value}
      onChange={onChange}
      data={data}
      placeholder={placeholder}
      limit={limit}
      nothingFound={nothingFound}
      leftSection={icon}
    />
  );
}

// Slider Field
export function SliderField({
  label,
  description,
  error,
  required,
  disabled,
  readOnly,
  value,
  onChange,
  min,
  max,
  step,
  marks,
  labelAlwaysOn,
}: SliderFieldProps) {
  return (
    <Box>
      {label && (
        <Text size="sm" fw={500} mb={5}>
          {label}
          {required && <span style={{ color: "red" }}> *</span>}
        </Text>
      )}
      {description && (
        <Text size="xs" color="dimmed" mb={5}>
          {description}
        </Text>
      )}
      <Slider
        value={value}
        onChange={onChange}
        min={min}
        max={max}
        step={step}
        marks={marks}
        labelAlwaysOn={labelAlwaysOn}
        disabled={disabled || readOnly}
      />
      {error && (
        <Text size="xs" color="red" mt={5}>
          {error}
        </Text>
      )}
    </Box>
  );
}

// Range Slider Field
export function RangeSliderField({
  label,
  description,
  error,
  required,
  disabled,
  readOnly,
  value,
  onChange,
  min,
  max,
  step,
  marks,
  labelAlwaysOn,
}: RangeSliderFieldProps) {
  return (
    <Box>
      {label && (
        <Text size="sm" fw={500} mb={5}>
          {label}
          {required && <span style={{ color: "red" }}> *</span>}
        </Text>
      )}
      {description && (
        <Text size="xs" color="dimmed" mb={5}>
          {description}
        </Text>
      )}
      <RangeSlider
        value={value}
        onChange={onChange}
        min={min}
        max={max}
        step={step}
        marks={marks}
        labelAlwaysOn={labelAlwaysOn}
        disabled={disabled || readOnly}
      />
      {error && (
        <Text size="xs" color="red" mt={5}>
          {error}
        </Text>
      )}
    </Box>
  );
}

// Badge Select Field
export function BadgeSelectField({
  label,
  description,
  error,
  required,
  disabled,
  readOnly,
  value,
  onChange,
  data,
}: BadgeSelectFieldProps) {
  const toggleBadge = (badgeValue: string) => {
    if (value.includes(badgeValue)) {
      onChange(value.filter((v) => v !== badgeValue));
    } else {
      onChange([...value, badgeValue]);
    }
  };

  return (
    <Box>
      {label && (
        <Text size="sm" fw={500} mb={5}>
          {label}
          {required && <span style={{ color: "red" }}> *</span>}
        </Text>
      )}
      {description && (
        <Text size="xs" color="dimmed" mb={5}>
          {description}
        </Text>
      )}
      <Group spacing="xs">
        {data.map((item) => (
          <Badge
            key={item.value}
            size="lg"
            variant={value.includes(item.value) ? "filled" : "outline"}
            color={value.includes(item.value) ? "primary" : "gray"}
            onClick={() => !disabled && !readOnly && toggleBadge(item.value)}
            style={{
              cursor: disabled || readOnly ? "default" : "pointer",
              opacity: disabled ? 0.5 : 1,
            }}
          >
            {item.label}
          </Badge>
        ))}
      </Group>
      {error && (
        <Text size="xs" color="red" mt={5}>
          {error}
        </Text>
      )}
    </Box>
  );
}
