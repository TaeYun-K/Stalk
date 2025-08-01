// 쿠키 관리 유틸리티
export const setCookie = (name: string, value: string, days: number = 7) => {
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  
  // 보안 강화된 쿠키 설정
  const isSecure = window.location.protocol === 'https:' || import.meta.env.DEV;
  const secureFlag = isSecure ? ';Secure' : '';
  
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Strict${secureFlag}`;
};

export const getCookie = (name: string): string | null => {
  const nameEQ = name + "=";
  const ca = document.cookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
  }
  return null;
};

export const removeCookie = (name: string) => {
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
}; 