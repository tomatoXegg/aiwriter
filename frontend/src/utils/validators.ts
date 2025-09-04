export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePhone = (phone: string): boolean => {
  const phoneRegex = /^1[3-9]\d{9}$/;
  return phoneRegex.test(phone);
};

export const validatePassword = (password: string): { isValid: boolean; message: string } => {
  if (password.length < 8) {
    return { isValid: false, message: '密码长度至少8位' };
  }
  
  if (!/[a-zA-Z]/.test(password)) {
    return { isValid: false, message: '密码必须包含字母' };
  }
  
  if (!/[0-9]/.test(password)) {
    return { isValid: false, message: '密码必须包含数字' };
  }
  
  return { isValid: true, message: '密码格式正确' };
};

export const validateRequired = (value: any, fieldName: string): { isValid: boolean; message: string } => {
  if (value === null || value === undefined || value === '') {
    return { isValid: false, message: `${fieldName}不能为空` };
  }
  
  return { isValid: true, message: '' };
};

export const validateUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

export const validateMaxLength = (value: string, maxLength: number, fieldName: string): { isValid: boolean; message: string } => {
  if (value.length > maxLength) {
    return { isValid: false, message: `${fieldName}长度不能超过${maxLength}个字符` };
  }
  
  return { isValid: true, message: '' };
};