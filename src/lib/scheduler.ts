import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';

dayjs.extend(customParseFormat);

export interface ScheduleItem {
  equipamento: number;
  inicio: string;
  fim: string;
  duracao: string;
}

export interface ScheduleParams {
  startJourney: string; // "HH:mm"
  startLunch: string;
  endLunch: string;
  endJourney: string;
  totalOrders: number;
  travelTime: number; // minutes
}

export interface ScheduleResult {
  schedule: ScheduleItem[];
  beforeLunch: ScheduleItem[];
  afterLunch: ScheduleItem[];
  summary: {
    totalScheduled: number;
    notAllocated: number;
    totalTimeWorkedMinutes: number;
  };
}

export function gerarCronograma(params: ScheduleParams): ScheduleResult {
  const {
    startJourney,
    startLunch,
    endLunch,
    endJourney,
    totalOrders,
    travelTime,
  } = params;

  const schedule: ScheduleItem[] = [];
  const beforeLunch: ScheduleItem[] = [];
  const afterLunch: ScheduleItem[] = [];

  const baseDate = '2024-01-01 '; // Arbitrary date for time calculations
  const tStart = dayjs(baseDate + startJourney, 'YYYY-MM-DD HH:mm');
  const tLunchStart = dayjs(baseDate + startLunch, 'YYYY-MM-DD HH:mm');
  const tLunchEnd = dayjs(baseDate + endLunch, 'YYYY-MM-DD HH:mm');
  const tJourneyEnd = dayjs(baseDate + endJourney, 'YYYY-MM-DD HH:mm');

  // a)
  const morningAvailSeconds = tLunchStart.diff(tStart, 'second');
  const afternoonAvailSeconds = tJourneyEnd.diff(tLunchEnd, 'second');
  const totalAvailSeconds = morningAvailSeconds + afternoonAvailSeconds;
  
  // Proporção de ordens com base no tempo disponível em cada bloco
  let morningOrders = Math.round(totalOrders * (morningAvailSeconds / totalAvailSeconds));
  if (morningOrders < 0) morningOrders = 0;
  if (morningOrders > totalOrders) morningOrders = totalOrders;
  
  const afternoonOrders = totalOrders - morningOrders;

  // Calculo Morning
  const morningTravelSeconds = Math.max(0, morningOrders - 1) * travelTime * 60;
  const morningUsefulSeconds = Math.max(0, morningAvailSeconds - morningTravelSeconds);
  const morningDurationSeconds = morningOrders > 0 ? Math.round(morningUsefulSeconds / morningOrders) : 0;

  // Calculo Afternoon
  const afternoonTravelSeconds = Math.max(0, afternoonOrders - 1) * travelTime * 60;
  const afternoonUsefulSeconds = Math.max(0, afternoonAvailSeconds - afternoonTravelSeconds);
  const afternoonDurationSeconds = afternoonOrders > 0 ? Math.round(afternoonUsefulSeconds / afternoonOrders) : 0;

  let ordersCreated = 0;
  let totalTimeWorkedSeconds = 0;
  let currentTime = tStart;

  for (let i = 1; i <= totalOrders; i++) {
    const isMorning = i <= morningOrders;
    
    // Se for a primeira ordem da tarde, forçar o tempo para comecar do fim do almoço
    if (!isMorning && i === morningOrders + 1) {
      if (currentTime.isBefore(tLunchEnd)) {
         currentTime = tLunchEnd;
      }
    }

    const currentDuration = isMorning ? morningDurationSeconds : afternoonDurationSeconds;
    
    let orderStart = currentTime;
    let orderEnd = orderStart.add(currentDuration, 'second');

    // Forçar fim exato nos blocos (O último da manhã bate 100% com o almoço, e o da tarde bate com o fim da jornada)
    if (isMorning && i === morningOrders) {
      orderEnd = tLunchStart;
    } else if (!isMorning && i === totalOrders) {
      orderEnd = tJourneyEnd;
    }

    const item: ScheduleItem = {
      equipamento: i,
      inicio: orderStart.format('HH:mm'),
      fim: orderEnd.format('HH:mm'),
      duracao: Math.round(orderEnd.diff(orderStart, 'second') / 60) + 'm',
    };

    schedule.push(item);
    
    // Split for visual separation
    if (isMorning) {
      beforeLunch.push(item);
    } else {
      afterLunch.push(item);
    }

    ordersCreated++;
    totalTimeWorkedSeconds += orderEnd.diff(orderStart, 'second');

    currentTime = orderEnd.add(travelTime, 'minute');
  }

  return {
    schedule,
    beforeLunch,
    afterLunch,
    summary: {
      totalScheduled: ordersCreated,
      notAllocated: totalOrders - ordersCreated,
      totalTimeWorkedMinutes: Math.round(totalTimeWorkedSeconds / 60),
    },
  };
}
