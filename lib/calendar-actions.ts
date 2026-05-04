'use server'

import { auth } from "@/auth";

export async function fetchCalComBookings(dateFromStr?: string, dateToStr?: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Não autorizado.' };
    }

    const token = process.env.CALCOM_API_KEY;
    if (!token) {
      return { success: false, error: "Token da API do Cal.com não configurado no arquivo .env" };
    }

    // 1. Fetch bookings directly made via Cal.com
    const bookingsResponse = await fetch("https://api.cal.com/v2/bookings", {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`,
        "cal-api-version": "2024-08-13"
      },
      next: { revalidate: 0 }
    });

    let calComEvents: any[] = [];
    if (bookingsResponse.ok) {
      const json = await bookingsResponse.json();
      if (json && json.status === "success" && Array.isArray(json.data)) {
        calComEvents = json.data;
      } else if (Array.isArray(json.data)) {
        calComEvents = json.data;
      } else if (Array.isArray(json)) {
        calComEvents = json;
      }
    }

    const mappedEvents = calComEvents.map((ev: any) => ({
      id: ev.id || ev.uid || Math.random().toString(),
      uid: ev.uid || ev.id?.toString(),
      title: ev.title || "Sem título",
      description: ev.description || "",
      startTime: ev.startTime || ev.start,
      endTime: ev.endTime || ev.end,
      status: ev.status || "ACCEPTED",
      attendees: ev.attendees || []
    }));

    // 2. Fetch all external busy slots from connected calendars via Cal.com v2
    try {
      const calendarsRes = await fetch("https://api.cal.com/v2/calendars", {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
          "cal-api-version": "2024-08-13"
        },
        next: { revalidate: 0 }
      });

      if (calendarsRes.ok) {
        const calJson = await calendarsRes.json();
        let calendars: any[] = [];
        if (calJson && calJson.status === "success" && calJson.data) {
          if (Array.isArray(calJson.data.connectedCalendars)) {
            for (const item of calJson.data.connectedCalendars) {
              if (Array.isArray(item.calendars)) {
                for (const cal of item.calendars) {
                  if (cal.externalId && (cal.credentialId || item.credentialId)) {
                    calendars.push({
                      credentialId: cal.credentialId || item.credentialId,
                      externalId: cal.externalId,
                      name: cal.name || cal.integration || "Agenda Externa"
                    });
                  }
                }
              }
            }
          } else if (Array.isArray(calJson.data)) {
            for (const item of calJson.data) {
              if (Array.isArray(item.calendars)) {
                for (const cal of item.calendars) {
                  if (cal.externalId && (cal.credentialId || item.credentialId)) {
                    calendars.push({
                      credentialId: cal.credentialId || item.credentialId,
                      externalId: cal.externalId,
                      name: cal.name || cal.integration || "Agenda Externa"
                    });
                  }
                }
              } else if (item.externalId && item.credentialId) {
                calendars.push({
                  credentialId: item.credentialId,
                  externalId: item.externalId,
                  name: item.name || item.integration || "Agenda Externa"
                });
              }
            }
          }
        }

        // Default range to current month +/- 1 month to get a complete schedule context
        let from = dateFromStr;
        let to = dateToStr;
        if (!from || !to) {
          const today = new Date();
          const fromDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
          const toDate = new Date(today.getFullYear(), today.getMonth() + 2, 0);
          from = fromDate.toISOString().split('T')[0];
          to = toDate.toISOString().split('T')[0];
        } else {
          from = from.split('T')[0];
          to = to.split('T')[0];
        }

        // Fetch busy times for each connected calendar in parallel
        const busyPromises = calendars.map(async (cal) => {
          if (cal.credentialId && cal.externalId) {
            try {
              const url = `https://api.cal.com/v2/calendars/busy-times?timeZone=America/Sao_Paulo&dateFrom=${from}&dateTo=${to}&calendarsToLoad[0][credentialId]=${cal.credentialId}&calendarsToLoad[0][externalId]=${encodeURIComponent(cal.externalId)}`;

              const busyRes = await fetch(url, {
                method: "GET",
                headers: {
                  "Authorization": `Bearer ${token}`,
                  "cal-api-version": "2024-08-13"
                },
                next: { revalidate: 0 }
              });

              if (busyRes.ok) {
                const busyJson = await busyRes.json();
                let slots: any[] = [];
                if (busyJson && busyJson.status === "success" && Array.isArray(busyJson.data)) {
                  slots = busyJson.data;
                } else if (Array.isArray(busyJson.data)) {
                  slots = busyJson.data;
                } else if (Array.isArray(busyJson)) {
                  slots = busyJson;
                } else if (busyJson && typeof busyJson === "object") {
                  if (Array.isArray(busyJson.busy)) {
                    slots = busyJson.busy;
                  } else if (busyJson.data && Array.isArray(busyJson.data.busy)) {
                    slots = busyJson.data.busy;
                  } else if (Array.isArray(busyJson.busyTimes)) {
                    slots = busyJson.busyTimes;
                  }
                }

                if (Array.isArray(slots)) {
                  return slots.map((slot: any, idx: number) => ({
                    id: `busy-${cal.id || cal.credentialId}-${idx}-${slot.start}`,
                    uid: `busy-${cal.id || cal.credentialId}-${idx}-${slot.start}`,
                    title: "Ocupado (Agenda Externa)",
                    description: `Horário ocupado na sua agenda (${cal.name || cal.integration || "Agenda Externa"}).`,
                    startTime: slot.start,
                    endTime: slot.end,
                    status: "BUSY",
                    attendees: []
                  }));
                }
              }
            } catch (err) {
              console.error(`Erro ao buscar busy-times para ${cal.externalId}:`, err);
            }
          }
          return [];
        });

        const busySlotsArrays = await Promise.all(busyPromises);
        for (const slots of busySlotsArrays) {
          if (slots && slots.length > 0) {
            mappedEvents.push(...slots);
          }
        }
      }
    } catch (busyError) {
      console.error("Erro ao buscar busy-times do Cal.com:", busyError);
    }

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const filteredEvents = mappedEvents.filter((ev: any) => {
      const start = new Date(ev.startTime);
      return start >= todayStart;
    });

    return {
      success: true,
      data: filteredEvents
    };
  } catch (err: any) {
    console.error("fetchCalComBookings error:", err);
    return { success: false, error: err.message || "Erro desconhecido ao buscar dados" };
  }
}

import { prisma as globalPrisma } from "@/lib/prisma";
import { PrismaClient } from "@prisma/client";

function getPrismaClient() {
  if (globalPrisma) {
    return globalPrisma;
  }
  let dbUrl = process.env.DATABASE_URL;
  if (dbUrl && !dbUrl.includes("pgbouncer=true") && !dbUrl.includes("statement_cache_size=0")) {
    const separator = dbUrl.includes("?") ? "&" : "?";
    dbUrl = `${dbUrl}${separator}pgbouncer=true&statement_cache_size=0`;
  }
  return new PrismaClient({
    datasources: dbUrl
      ? {
          db: {
            url: dbUrl,
          },
        }
      : undefined,
  });
}


export async function getCalendarEvents(dateFromStr?: string, dateToStr?: string) {
  try {
    const session = await auth();
    const prismaClient = getPrismaClient();
    const where: any = {};
    if (dateFromStr && dateToStr) {
      where.startTime = { lte: new Date(dateToStr) };
      where.endTime = { gte: new Date(dateFromStr) };
    }

    let userId: string | null = null;
    if (session?.user?.id) {
      const dbUser = await prismaClient.user.findUnique({
        where: { id: session.user.id },
        select: { id: true }
      });
      if (dbUser) {
        userId = dbUser.id;
      }
    }

    if (session?.user?.role !== 'ADMIN') {
      where.OR = [
        { userId: userId },
        { userId: null },
      ];
    }

    const dbEvents = await prismaClient.calendarEvent.findMany({
      where,
      orderBy: { startTime: "asc" },
    });

    const mappedEvents = dbEvents.map((ev) => ({
      id: ev.id,
      uid: ev.uid || undefined,
      title: ev.title,
      description: ev.description || undefined,
      startTime: ev.startTime.toISOString(),
      endTime: ev.endTime.toISOString(),
      status: ev.status,
      attendees: ev.attendees ? JSON.parse(ev.attendees) : undefined,
    }));

    return { success: true, data: mappedEvents };
  } catch (err: any) {
    console.error("getCalendarEvents error:", err);
    return { success: false, error: err.message || "Erro desconhecido ao buscar eventos do banco de dados" };
  }
}

export async function syncCalComEvents(dateFromStr?: string, dateToStr?: string) {
  try {
    const session = await auth();
    const prismaClient = getPrismaClient();

    let userId: string | null = null;
    if (session?.user?.id) {
      const dbUser = await prismaClient.user.findUnique({
        where: { id: session.user.id },
        select: { id: true }
      });
      if (!dbUser) {
        return { success: false, error: "Usuário não encontrado no banco de dados." };
      }
      userId = dbUser.id;
    }

    const fromDateStr = dateFromStr || new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1).toISOString();
    const toDateStr = dateToStr || new Date(new Date().getFullYear(), new Date().getMonth() + 2, 0).toISOString();

    const origStartRange = new Date(fromDateStr);
    const origEndRange = new Date(toDateStr);

    // 1. Controle de sync de 5 minutos
    const lastSync = await prismaClient.calendarSyncLog.findFirst({
      where: { userId: userId || null },
      orderBy: { lastSync: "desc" },
    });

    const now = new Date();
    if (lastSync && now.getTime() - new Date(lastSync.lastSync).getTime() < 5 * 60 * 1000) {
      const finalWhere: any = {
        startTime: { lte: origEndRange },
        endTime: { gte: origStartRange },
      };

      if (session?.user?.role !== 'ADMIN') {
        finalWhere.OR = [
          { userId: userId },
          { userId: null },
        ];
      }

      const cachedEvents = await prismaClient.calendarEvent.findMany({
        where: finalWhere,
        orderBy: { startTime: "asc" },
      });

      const mappedCachedEvents = cachedEvents.map((ev) => ({
        id: ev.id,
        uid: ev.uid || undefined,
        title: ev.title,
        description: ev.description || undefined,
        startTime: ev.startTime.toISOString(),
        endTime: ev.endTime.toISOString(),
        status: ev.status,
        attendees: ev.attendees ? JSON.parse(ev.attendees) : undefined,
      }));

      return { success: true, data: mappedCachedEvents };
    }

    // Never fetch from Cal.com in the past
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let effectiveDateFromStr = dateFromStr;
    if (effectiveDateFromStr) {
      const parsedFrom = new Date(effectiveDateFromStr);
      if (parsedFrom < today) {
        effectiveDateFromStr = today.toISOString();
      }
    } else {
      effectiveDateFromStr = today.toISOString();
    }

    const calRes = await fetchCalComBookings(effectiveDateFromStr, dateToStr);
    if (!calRes.success || !calRes.data) {
      return calRes;
    }

    // Filtrar eventos ativos e ignorar cancelados ou deletados
    const calComEvents = calRes.data.filter((ev: any) => {
      const status = String(ev.status || '').toUpperCase();
      return status !== "CANCELLED" && status !== "REJECTED" && !status.includes("CANCEL");
    });

    const startRange = origStartRange < today ? today : origStartRange;
    const endRange = origEndRange;

    // 1. Get current DB events in timeframe (only today onwards)
    const existingDbWhere: any = {
      startTime: { lte: endRange },
      endTime: { gte: startRange },
    };

    if (session?.user?.role !== 'ADMIN') {
      existingDbWhere.userId = userId;
    }

    const existingDbEvents = await prismaClient.calendarEvent.findMany({
      where: existingDbWhere,
    });

    const calComIds = new Set(calComEvents.map((ev: any) => String(ev.id)));

    // 2. Delete events from DB that are no longer in Cal.com list for this timeframe (today onwards)
    const idsToDelete = existingDbEvents
      .filter((ev) => !calComIds.has(ev.id))
      .map((ev) => ev.id);

    if (idsToDelete.length > 0) {
      await prismaClient.calendarEvent.deleteMany({
        where: { id: { in: idsToDelete } },
      });
    }

    // 3. Upsert Cal.com events into the DB (today onwards)
    for (const ev of calComEvents) {
      const evData = {
        id: String(ev.id),
        userId: userId,
        uid: ev.uid || null,
        title: ev.title || "Sem título",
        description: ev.description || null,
        startTime: new Date(ev.startTime),
        endTime: new Date(ev.endTime),
        status: ev.status || "ACCEPTED",
        attendees: ev.attendees ? JSON.stringify(ev.attendees) : null,
      };

      await prismaClient.calendarEvent.upsert({
        where: { id: evData.id },
        update: {
          userId: evData.userId,
          uid: evData.uid,
          title: evData.title,
          description: evData.description,
          startTime: evData.startTime,
          endTime: evData.endTime,
          status: evData.status,
          attendees: evData.attendees,
        },
        create: evData,
      });
    }

    // Registrar o sync log no banco
    await prismaClient.calendarSyncLog.create({
      data: {
        userId: userId || null,
        lastSync: new Date(),
      }
    });

    // 4. Return complete set of events from the ORIGINAL requested timeframe
    const finalWhere: any = {
      startTime: { lte: origEndRange },
      endTime: { gte: origStartRange },
    };

    if (session?.user?.role !== 'ADMIN') {
      finalWhere.OR = [
        { userId: userId },
        { userId: null },
      ];
    }

    const updatedDbEvents = await prismaClient.calendarEvent.findMany({
      where: finalWhere,
      orderBy: { startTime: "asc" },
    });

    const mappedEvents = updatedDbEvents.map((ev) => ({
      id: ev.id,
      uid: ev.uid || undefined,
      title: ev.title,
      description: ev.description || undefined,
      startTime: ev.startTime.toISOString(),
      endTime: ev.endTime.toISOString(),
      status: ev.status,
      attendees: ev.attendees ? JSON.parse(ev.attendees) : undefined,
    }));

    return { success: true, data: mappedEvents };
  } catch (err: any) {
    console.error("syncCalComEvents error:", err);
    return { success: false, error: err.message || "Erro desconhecido ao sincronizar eventos" };
  }
}



