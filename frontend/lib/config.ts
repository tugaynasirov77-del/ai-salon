// Единая точка для констант рантайма. Когда подключим Clerk —
// SALON_ID начнём брать из user.publicMetadata.salonId, а не из env.

export const SALON_ID =
  process.env.NEXT_PUBLIC_DEFAULT_SALON_ID || 'cmpfhd7ha00001s7ud34xwfmw';
