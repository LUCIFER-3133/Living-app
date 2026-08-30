import WhatsAppButton from '@/components/layout/WhatsAppButton';
import ChatBot from '@/components/layout/ChatBot';

// Stacked above the BottomNav pill (which sits at bottom-5, ~64px tall) so
// nothing overlaps on small screens.
export default function FloatingWidgets() {
  return (
    <div className="fixed bottom-24 right-4 z-[90] flex flex-col items-end gap-3 sm:right-6">
      <ChatBot />
      <WhatsAppButton />
    </div>
  );
}
