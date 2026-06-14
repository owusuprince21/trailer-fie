export type TicketmasterEvent = {
  id: string;
  name: string;
  url?: string;
  info?: string;
  pleaseNote?: string;
  images?: Array<{ url: string; width?: number; height?: number; ratio?: string }>;
  dates?: {
    start?: {
      localDate?: string;
      localTime?: string;
      dateTime?: string;
      timezone?: string;
    };
    status?: {
      code?: string;
    };
  };
  classifications?: Array<{
    segment?: { name?: string };
    genre?: { name?: string };
    subGenre?: { name?: string };
    type?: { name?: string };
    subType?: { name?: string };
  }>;
  sales?: {
    public?: {
      startDateTime?: string;
      endDateTime?: string;
    };
  };
  priceRanges?: Array<{
    min?: number;
    max?: number;
    currency?: string;
  }>;
  seatmap?: {
    staticUrl?: string;
  };
  promoter?: {
    name?: string;
  };
  promoters?: Array<{
    name?: string;
  }>;
  _embedded?: {
    venues?: Array<{
      name?: string;
      city?: { name?: string };
      state?: { name?: string; stateCode?: string };
      country?: { name?: string; countryCode?: string };
      address?: { line1?: string; line2?: string };
      postalCode?: string;
      url?: string;
      location?: { latitude?: string; longitude?: string };
      parkingDetail?: string;
      accessibleSeatingDetail?: string;
      generalInfo?: {
        generalRule?: string;
        childRule?: string;
      };
    }>;
    attractions?: Array<{
      id?: string;
      name?: string;
      url?: string;
      images?: Array<{ url: string; width?: number; height?: number; ratio?: string }>;
      classifications?: TicketmasterEvent['classifications'];
    }>;
  };
};

export type MovieEvent = ReturnType<typeof normalizeEvent>;

function pickEventImage(images: TicketmasterEvent['images']) {
  const sorted = [...(images ?? [])].sort((a, b) => (b.width ?? 0) - (a.width ?? 0));
  return sorted.find((image) => image.ratio === '16_9')?.url || sorted[0]?.url;
}

export function normalizeEvent(event: TicketmasterEvent) {
  const venue = event._embedded?.venues?.[0];
  const classification = event.classifications?.[0];
  const price = event.priceRanges?.[0];
  const attraction = event._embedded?.attractions?.[0];

  return {
    id: event.id,
    title: event.name,
    description: event.info || event.pleaseNote || '',
    info: event.info || '',
    pleaseNote: event.pleaseNote || '',
    url: event.url,
    imageUrl: pickEventImage(event.images),
    seatmapUrl: event.seatmap?.staticUrl,
    startsAt: event.dates?.start?.dateTime || event.dates?.start?.localDate || '',
    localDate: event.dates?.start?.localDate,
    localTime: event.dates?.start?.localTime,
    timezone: event.dates?.start?.timezone,
    status: event.dates?.status?.code,
    segment: classification?.segment?.name,
    genre: classification?.genre?.name,
    subGenre: classification?.subGenre?.name,
    type: classification?.type?.name,
    subType: classification?.subType?.name,
    promoter: event.promoter?.name || event.promoters?.[0]?.name,
    sales: {
      startsAt: event.sales?.public?.startDateTime,
      endsAt: event.sales?.public?.endDateTime,
    },
    attraction: attraction
      ? {
          id: attraction.id,
          name: attraction.name,
          url: attraction.url,
          imageUrl: pickEventImage(attraction.images),
          genre: attraction.classifications?.[0]?.genre?.name,
          subGenre: attraction.classifications?.[0]?.subGenre?.name,
        }
      : null,
    venue: {
      name: venue?.name,
      address: [venue?.address?.line1, venue?.address?.line2].filter(Boolean).join(', '),
      city: venue?.city?.name,
      state: venue?.state?.stateCode || venue?.state?.name,
      country: venue?.country?.countryCode || venue?.country?.name,
      postalCode: venue?.postalCode,
      url: venue?.url,
      latitude: venue?.location?.latitude,
      longitude: venue?.location?.longitude,
      parkingDetail: venue?.parkingDetail,
      accessibleSeatingDetail: venue?.accessibleSeatingDetail,
      generalRule: venue?.generalInfo?.generalRule,
      childRule: venue?.generalInfo?.childRule,
    },
    priceRange:
      price?.min !== undefined || price?.max !== undefined
        ? {
            min: price.min,
            max: price.max,
            currency: price.currency,
          }
        : null,
  };
}

export function isoWithoutMs(date: Date) {
  return date.toISOString().replace(/\.\d{3}Z$/, 'Z');
}
