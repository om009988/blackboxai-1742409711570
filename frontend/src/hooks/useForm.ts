import { useState, useCallback, ChangeEvent, FormEvent } from 'react';

export type ValidationRule<T> = {
  validate: (value: T) => boolean;
  message: string;
};

export type FieldConfig<T> = {
  initialValue: T;
  rules?: ValidationRule<T>[];
};

export type FormConfig<T extends Record<string, any>> = {
  [K in keyof T]: FieldConfig<T[K]>;
};

export interface FormState<T extends Record<string, any>> {
  values: T;
  errors: Partial<Record<keyof T, string>>;
  touched: Partial<Record<keyof T, boolean>>;
  isValid: boolean;
  isDirty: boolean;
}

export function useForm<T extends Record<string, any>>(config: FormConfig<T>) {
  // Initialize form state
  const initialValues = Object.entries(config).reduce(
    (acc, [key, field]) => ({
      ...acc,
      [key]: field.initialValue,
    }),
    {} as T
  );

  const [formState, setFormState] = useState<FormState<T>>({
    values: initialValues,
    errors: {},
    touched: {},
    isValid: true,
    isDirty: false,
  });

  // Validate a single field
  const validateField = useCallback(
    (name: keyof T, value: T[keyof T]): string | undefined => {
      const fieldConfig = config[name];
      if (!fieldConfig.rules) return undefined;

      for (const rule of fieldConfig.rules) {
        if (!rule.validate(value)) {
          return rule.message;
        }
      }

      return undefined;
    },
    [config]
  );

  // Validate all fields
  const validateForm = useCallback(
    (values: T): Partial<Record<keyof T, string>> => {
      const errors: Partial<Record<keyof T, string>> = {};
      
      Object.keys(config).forEach((key) => {
        const error = validateField(key as keyof T, values[key as keyof T]);
        if (error) {
          errors[key as keyof T] = error;
        }
      });

      return errors;
    },
    [config, validateField]
  );

  // Handle field change
  const handleChange = useCallback(
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const { name, value, type } = event.target;
      const newValue = type === 'checkbox' ? (event.target as HTMLInputElement).checked : value;

      setFormState((prev) => {
        const newValues = { ...prev.values, [name]: newValue };
        const error = validateField(name as keyof T, newValue as T[keyof T]);
        const newErrors = { ...prev.errors };

        if (error) {
          newErrors[name as keyof T] = error;
        } else {
          delete newErrors[name as keyof T];
        }

        return {
          ...prev,
          values: newValues,
          errors: newErrors,
          touched: { ...prev.touched, [name]: true },
          isValid: Object.keys(newErrors).length === 0,
          isDirty: true,
        };
      });
    },
    [validateField]
  );

  // Handle form submission
  const handleSubmit = useCallback(
    (onSubmit: (values: T) => void) => async (event: FormEvent) => {
      event.preventDefault();

      const errors = validateForm(formState.values);
      const isValid = Object.keys(errors).length === 0;

      setFormState((prev) => ({
        ...prev,
        errors,
        isValid,
        touched: Object.keys(config).reduce(
          (acc, key) => ({ ...acc, [key]: true }),
          {}
        ),
      }));

      if (isValid) {
        onSubmit(formState.values);
      }
    },
    [config, formState.values, validateForm]
  );

  // Reset form to initial state
  const reset = useCallback(() => {
    setFormState({
      values: initialValues,
      errors: {},
      touched: {},
      isValid: true,
      isDirty: false,
    });
  }, [initialValues]);

  // Set field value programmatically
  const setValue = useCallback(
    (name: keyof T, value: T[keyof T]) => {
      setFormState((prev) => {
        const error = validateField(name, value);
        const newErrors = { ...prev.errors };

        if (error) {
          newErrors[name] = error;
        } else {
          delete newErrors[name];
        }

        return {
          ...prev,
          values: { ...prev.values, [name]: value },
          errors: newErrors,
          touched: { ...prev.touched, [name]: true },
          isValid: Object.keys(newErrors).length === 0,
          isDirty: true,
        };
      });
    },
    [validateField]
  );

  // Set multiple values programmatically
  const setValues = useCallback(
    (newValues: Partial<T>) => {
      setFormState((prev) => {
        const updatedValues = { ...prev.values, ...newValues };
        const errors = validateForm(updatedValues);

        return {
          ...prev,
          values: updatedValues,
          errors,
          touched: Object.keys(newValues).reduce(
            (acc, key) => ({ ...acc, [key]: true }),
            prev.touched
          ),
          isValid: Object.keys(errors).length === 0,
          isDirty: true,
        };
      });
    },
    [validateForm]
  );

  return {
    values: formState.values,
    errors: formState.errors,
    touched: formState.touched,
    isValid: formState.isValid,
    isDirty: formState.isDirty,
    handleChange,
    handleSubmit,
    reset,
    setValue,
    setValues,
  };
}