import { useState, ChangeEvent, FormEvent } from 'react';

interface UseFormReturn<T> {
  values: T;
  errors: Partial<Record<keyof T, string>>;
  handleChange: (_e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  handleSubmit: (_onSubmit: (_values: T) => void) => (_e: FormEvent) => void;
  setFieldValue: (_field: keyof T, _value: unknown) => void;
  setFieldError: (_field: keyof T, _error: string) => void;
  resetForm: () => void;
  isValid: boolean;
}

const useForm = <T extends Record<string, unknown>>(
  initialValues: T,
  validationRules?: Partial<Record<keyof T, (_value: unknown) => string | undefined>>
): UseFormReturn<T> => {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});

  const validateField = (field: keyof T, value: unknown): string | undefined => {
    if (validationRules && validationRules[field]) {
      return validationRules[field]!(value);
    }
    return undefined;
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const fieldName = name as keyof T;
    
    let fieldValue: unknown = value;
    if (type === 'checkbox') {
      fieldValue = (e.target as HTMLInputElement).checked;
    }

    setValues(prev => ({
      ...prev,
      [fieldName]: fieldValue
    }));

    // 실시간 유효성 검사
    const error = validateField(fieldName, fieldValue);
    setErrors(prev => ({
      ...prev,
      [fieldName]: error
    }));
  };

  const setFieldValue = (field: keyof T, value: unknown) => {
    setValues(prev => ({
      ...prev,
      [field]: value
    }));

    const error = validateField(field, value);
    setErrors(prev => ({
      ...prev,
      [field]: error
    }));
  };

  const setFieldError = (field: keyof T, error: string) => {
    setErrors(prev => ({
      ...prev,
      [field]: error
    }));
  };

  const handleSubmit = (onSubmit: (_values: T) => void) => (e: FormEvent) => {
    e.preventDefault();
    
    // 모든 필드 유효성 검사
    const newErrors: Partial<Record<keyof T, string>> = {};
    let hasErrors = false;

    if (validationRules) {
      Object.keys(validationRules).forEach(key => {
        const field = key as keyof T;
        const error = validateField(field, values[field]);
        if (error) {
          newErrors[field] = error;
          hasErrors = true;
        }
      });
    }

    setErrors(newErrors);

    if (!hasErrors) {
      onSubmit(values);
    }
  };

  const resetForm = () => {
    setValues(initialValues);
    setErrors({});
  };

  const isValid = Object.keys(errors).length === 0 || 
    Object.values(errors).every(error => !error);

  return {
    values,
    errors,
    handleChange,
    handleSubmit,
    setFieldValue,
    setFieldError,
    resetForm,
    isValid
  };
};

export default useForm; 