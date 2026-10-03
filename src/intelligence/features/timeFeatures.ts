export interface TimeFeatureOutput {
  dayOfWeek: number;
  dayName: string;
  hourOfDay: number;
  isWeekend: boolean;
  isPeakSurgeryHours: boolean;
  isTraumaSurgeWindow: boolean;
  expectedDiurnalFactor: number;
}

export function extractTimeFeatures(referenceTime: Date = new Date()): TimeFeatureOutput {
  const dayOfWeek = referenceTime.getDay();
  const hourOfDay = referenceTime.getHours();
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
  const isPeakSurgeryHours = hourOfDay >= 8 && hourOfDay <= 16;
  const isTraumaSurgeWindow = (hourOfDay >= 20 || hourOfDay <= 4) || isWeekend;

  // Diurnal activity multiplier: surgery hours increase elective demand, weekend nights increase emergency demand
  let expectedDiurnalFactor = 1.0;
  if (isPeakSurgeryHours) {
    expectedDiurnalFactor = 1.15;
  } else if (isTraumaSurgeWindow) {
    expectedDiurnalFactor = 1.25;
  } else {
    expectedDiurnalFactor = 0.85;
  }

  return {
    dayOfWeek,
    dayName: dayNames[dayOfWeek],
    hourOfDay,
    isWeekend,
    isPeakSurgeryHours,
    isTraumaSurgeWindow,
    expectedDiurnalFactor,
  };
}
