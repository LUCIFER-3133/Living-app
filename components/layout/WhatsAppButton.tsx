'use client';

// Floating "Chat on WhatsApp" button, fixed above the bottom nav pill so the
// two never overlap. Opens wa.me with a pre-filled greeting in a new tab.
export default function WhatsAppButton() {
  const rawPhone = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || process.env.NEXT_PUBLIC_STUDIO_PHONE || '+917984925843';
  const digits = rawPhone.replace(/[^0-9]/g, '');
  const text = encodeURIComponent("Hi! I'd like to know more about Living Yoga classes.");
  const href = `https://wa.me/${digits}?text=${text}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with us on WhatsApp"
      title="Chat on WhatsApp"
      className="flex h-12 w-12 items-center justify-center rounded-full bg-[#25D366] text-white shadow-glass transition-transform duration-300 hover:scale-105"
    >
      <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor" aria-hidden="true">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
        <path d="M12.001 2C6.478 2 2 6.477 2 12c0 1.986.583 3.833 1.588 5.386L2 22l4.735-1.564A9.943 9.943 0 0 0 12.001 22C17.523 22 22 17.523 22 12S17.523 2 12.001 2zm0 18.183a8.16 8.16 0 0 1-4.166-1.14l-.299-.177-3.087 1.02.98-3.155-.194-.31A8.146 8.146 0 0 1 3.818 12c0-4.517 3.667-8.183 8.183-8.183 4.516 0 8.182 3.666 8.182 8.183 0 4.516-3.666 8.183-8.182 8.183z" />
      </svg>
    </a>
  );
}
