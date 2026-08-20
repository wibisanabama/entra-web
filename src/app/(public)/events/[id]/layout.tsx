import type { Metadata } from 'next';

type Props = {
  params: Promise<{ id: string }>;
  children: React.ReactNode;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const eventApiUrl = process.env.NEXT_PUBLIC_EVENT_API_URL || 'http://localhost:8082';

  try {
    const res = await fetch(`${eventApiUrl}/api/v1/events/${id}`, { next: { revalidate: 60 } });
    if (res.ok) {
      const json = await res.json();
      const event = json.data || json;
      if (event && event.title) {
        return {
          title: `${event.title} - Entra Ticketing`,
          description: event.description || 'Beli tiket event resmi online di Entra.',
          openGraph: {
            title: `${event.title} | Entra`,
            description: event.description || 'Beli tiket event resmi online di Entra.',
            images: event.banner_url ? [{ url: event.banner_url }] : [],
            type: 'website',
          },
          twitter: {
            card: 'summary_large_image',
            title: event.title,
            description: event.description || 'Beli tiket event resmi online di Entra.',
            images: event.banner_url ? [event.banner_url] : [],
          },
        };
      }
    }
  } catch (e) {
    // Fallback on network or API failure
  }

  return {
    title: 'Detail Event - Entra Ticketing',
    description: 'Platform tiket event terpercaya dan modern di Indonesia.',
  };
}

export default function EventLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
