/**
 * FilmVault 相机常量
 *
 * 统一管理常用的相机型号列表
 * 替代组件中重复的相机数组定义
 */

export const CAMERAS = [
  // Canon
  'Canon AE-1',
  'Canon A-1',
  'Canon EOS 5',
  'Canon EOS 3',
  'Canon EOS 5D',
  'Canon EOS 50',
  'Canon EOS 30',
  'Canon EOS 20',
  'Canon EOS 10',
  'Canon EOS 1',
  'Canon EOS 1000',
  'Canon EOS 750',
  'Canon EOS 700',
  'Canon EOS 600',
  'Canon EOS 500',

  // Nikon
  'Nikon FM2',
  'Nikon F3',
  'Nikon FE2',
  'Nikon FM',
  'Nikon FA',
  'Nikon EM',
  'Nikon EL',
  'Nikon FG',
  'Nikon F4',
  'Nikon F5',
  'Nikon F100',
  'Nikon N80',
  'Nikon N75',
  'Nikon N65',
  'Nikon N55',
  'Nikon N50',

  // Olympus
  'Olympus OM-1',
  'Olympus OM-2',
  'Olympus OM-3',
  'Olympus OM-4',
  'Olympus OM-10',
  'Olympus OM-20',
  'Olympus OM-30',
  'Olympus OM-40',

  // Pentax
  'Pentax K1000',
  'Pentax MX',
  'Pentax LX',
  'Pentax ME',
  'Pentax KX',
  'Pentax KM',
  'Pentax Spotmatic',

  // Minolta
  'Minolta X-700',
  'Minolta X-570',
  'Minolta X-500',
  'Minolta X-300',
  'Minolta X-370',
  'Minolta SRT-101',
  'Minolta SRT-102',

  // Leica
  'Leica M6',
  'Leica M3',
  'Leica M2',
  'Leica M4',
  'Leica M5',
  'Leica CL',
  'Leica M7',
  'Leica M4-P',

  // Contax
  'Contax T2',
  'Contax T3',
  'Contax T4',
  'Contax TVS',
  'Contax T',
  'Contax RTS',
  'Contax G2',
  'Contax AX',

  // Yashica
  'Yashica T4',
  'Yashica T5',
  'Yashica T3',
  'Yashica GSN',

  // Ricoh
  'Ricoh GR1',
  'Ricoh GR21',
  'Ricoh GR1s',
  'Ricoh GR III',
  'Ricoh GR II',

  // Fujifilm
  'Fujifilm Klasse W',
  'Fujifilm GA645',
  'Fujifilm GW690',
  'Fujifilm GW690II',
  'Fujifilm GA645Zi',

  // Mamiya
  'Mamiya 645',
  'Mamiya 7',
  'Mamiya 6',
  'Mamiya RZ67',
  'Mamiya C330',
  'Mamiya 7II',

  // Hasselblad
  'Hasselblad 500C/M',
  'Hasselblad 500C',
  'Hasselblad 501C',
  'Hasselblad 503CW',
  'Hasselblad 555ELD',
  'Hasselblad X1D',
  'Hasselblad 2000FC',

  // Rollei
  'Rollei 35',
  'Rollei 35S',
  'Rollei 35T',
  'Rollei 2.8F',
  'Rollei 6008',
  'Rollei 6006',

  // Voigtlander
  'Voigtlander Bessa',
  'Voigtlander Vitoret',
  'Voigtlander Prominent',

  // 其他
  'Other',
] as const;

/**
 * 按品牌分组相机
 */
export const CAMERAS_BY_BRAND = {
  Canon: CAMERAS.filter(c => c.startsWith('Canon')),
  Nikon: CAMERAS.filter(c => c.startsWith('Nikon')),
  Olympus: CAMERAS.filter(c => c.startsWith('Olympus')),
  Pentax: CAMERAS.filter(c => c.startsWith('Pentax')),
  Minolta: CAMERAS.filter(c => c.startsWith('Minolta')),
  Leica: CAMERAS.filter(c => c.startsWith('Leica')),
  Contax: CAMERAS.filter(c => c.startsWith('Contax')),
  Yashica: CAMERAS.filter(c => c.startsWith('Yashica')),
  Ricoh: CAMERAS.filter(c => c.startsWith('Ricoh')),
  Fujifilm: CAMERAS.filter(c => c.startsWith('Fujifilm')),
  Mamiya: CAMERAS.filter(c => c.startsWith('Mamiya')),
  Hasselblad: CAMERAS.filter(c => c.startsWith('Hasselblad')),
  Rollei: CAMERAS.filter(c => c.startsWith('Rollei')),
  Other: CAMERAS.filter(c => c === 'Other'),
} as const;

/**
 * 按系列分组相机
 */
export const CAMERAS_BY_SERIES = {
  'Canon EOS': CAMERAS.filter(c => c.startsWith('Canon EOS')),
  'Canon AE': CAMERAS.filter(c => c.startsWith('Canon AE')),
  'Nikon F': CAMERAS.filter(c => c.startsWith('Nikon F')),
  'Nikon FM': CAMERAS.filter(c => c.startsWith('Nikon FM')),
  'Nikon N': CAMERAS.filter(c => c.startsWith('Nikon N')),
  'Olympus OM': CAMERAS.filter(c => c.startsWith('Olympus OM')),
  'Pentax K': CAMERAS.filter(c => c.startsWith('Pentax K')),
  'Pentax M': CAMERAS.filter(c => c.startsWith('Pentax M')),
  'Minolta X': CAMERAS.filter(c => c.startsWith('Minolta X')),
  'Minolta SRT': CAMERAS.filter(c => c.startsWith('Minolta SRT')),
  'Leica M': CAMERAS.filter(c => c.startsWith('Leica M')),
  'Contax T': CAMERAS.filter(c => c.startsWith('Contax T')),
} as const;

/**
 * 热门/流行的相机（用于快速选择）
 */
export const POPULAR_CAMERAS = [
  'Canon AE-1',
  'Nikon FM2',
  'Olympus OM-1',
  'Pentax K1000',
  'Leica M6',
  'Contax T2',
  'Yashica T4',
  'Fujifilm Klasse W',
  'Mamiya 7',
  'Hasselblad 500C/M',
] as const;

/**
 * 从相机名称获取品牌
 */
export function getCameraBrand(camera: string): string {
  return Object.entries(CAMERAS_BY_BRAND).find(([, cameras]) =>
    cameras.includes(camera as any)
  )?.[0] || 'Other';
}

/**
 * 搜索相机（模糊匹配）
 */
export function searchCameras(query: string): readonly string[] {
  if (!query) return CAMERAS;

  const lowerQuery = query.toLowerCase();
  return CAMERAS.filter(camera =>
    camera.toLowerCase().includes(lowerQuery)
  );
}
