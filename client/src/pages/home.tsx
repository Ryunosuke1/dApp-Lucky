import { useState } from "react";
import { DiscoveryPanel } from "@/components/discovery-panel";
import { FavoritesPanel } from "@/components/favorites-panel";
import { ShareExperienceModal } from "@/components/share-experience-modal";
import { TextListModal } from "@/components/text-list-modal";
import { QRCodeModal } from "@/components/qr-code-modal";
import { DApp } from "@/types/dapp";

export default function Home() {
  const [showShareExperienceModal, setShowShareExperienceModal] = useState(false);
  const [showTextListModal, setShowTextListModal] = useState(false);
  const [showQRCodeModal, setShowQRCodeModal] = useState(false);
  const [selectedDApp, setSelectedDApp] = useState<DApp | null>(null);
  
  return (
    <main className="flex-grow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Discovery Panel */}
          <div className="lg:col-span-2">
            <DiscoveryPanel
              onShareExperience={() => {
                setShowShareExperienceModal(true);
              }}
              onSetSelectedDApp={setSelectedDApp}
            />
          </div>
          
          {/* Favorites Panel */}
          <div>
            <FavoritesPanel
              onGenerateTextList={() => setShowTextListModal(true)}
              onGenerateQRCode={() => setShowQRCodeModal(true)}
            />
          </div>
        </div>
      </div>
      
      {/* Modals */}
      <ShareExperienceModal
        isOpen={showShareExperienceModal}
        onClose={() => setShowShareExperienceModal(false)}
        dapp={selectedDApp}
      />
      
      <TextListModal
        isOpen={showTextListModal}
        onClose={() => setShowTextListModal(false)}
      />
      
      <QRCodeModal
        isOpen={showQRCodeModal}
        onClose={() => setShowQRCodeModal(false)}
      />
    </main>
  );
}
