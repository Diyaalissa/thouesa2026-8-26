const fs = require('fs');
let code = fs.readFileSync('src/components/traveler/TravelerPortal.tsx', 'utf8');

// Add import
const importStatement = `import { TripManager } from './TripManager';\n`;
code = code.replace(/import { InspectionProofModal } from '.\/InspectionProofModal';/, importStatement + "import { InspectionProofModal } from './InspectionProofModal';");

// Add state
const stateDeclaration = `  const [activeTripId, setActiveTripId] = useState<string | null>(null);\n`;
code = code.replace(/const \[activeTab, setActiveTab\] = useState/, stateDeclaration + "  const [activeTab, setActiveTab] = useState");

// In the MY_TRIPS rendering map, add a "Manage Trip" button.
// Let's replace the whole action buttons div inside the card mapping.
const actionButtonsRegex = /<div className="flex flex-wrap items-center justify-between gap-2 pt-1">[\s\S]*?<\/div>\s*<\/div>\s*\);\s*\}\)\}\s*<\/div>/;
const newActionButtons = `<div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100 mt-2">
                    <button
                      onClick={() => setActiveTripId(trip.id)}
                      className="w-full flex items-center justify-center gap-1.5 px-4 py-3 bg-teal-50 hover:bg-teal-100 text-teal-700 text-xs font-bold rounded-xl transition-colors cursor-pointer border border-teal-200"
                    >
                      <Plane className="w-4 h-4" />
                      <span>{isAr ? 'إدارة الرحلة والمستندات' : 'Manage Trip & Documents'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>`;

code = code.replace(actionButtonsRegex, newActionButtons);

// Render TripManager if activeTripId is set, else render the normal MY_TRIPS view.
// Let's replace: {activeTab === 'MY_TRIPS' && ( ... )}
// With {activeTab === 'MY_TRIPS' && activeTripId ? <TripManager ... /> : <div ... />}

const myTripsStart = /\{\/\* TAB 1: MY TRIPS \*\/\}\s*\{activeTab === 'MY_TRIPS' && \(/;
const replacement = `{/* TAB 1: MY TRIPS */}
      {activeTab === 'MY_TRIPS' && activeTripId && (() => {
        const trip = travelerTrips.find(t => t.id === activeTripId);
        if (!trip) return null;
        return (
          <TripManager 
            trip={trip}
            manifests={manifests}
            shipments={shipments}
            locale={locale}
            onBack={() => setActiveTripId(null)}
            onLockEscrow={onLockEscrow}
            onEmergencyUnassign={onEmergencyUnassign}
            onOpenQR={handleOpenQR}
            onViewInspection={(s) => setSelectedShipmentForProof(s)}
          />
        );
      })()}
      {activeTab === 'MY_TRIPS' && !activeTripId && (`;

code = code.replace(myTripsStart, replacement);

fs.writeFileSync('src/components/traveler/TravelerPortal.tsx', code);
