const fs = require('fs');
let code = fs.readFileSync('src/components/traveler/TripManager.tsx', 'utf8');

const importReplacement = `import { Trip, Manifest, Shipment, Locale } from '../../types';
import { safeFetchJson } from '../../lib/constants';`;

code = code.replace(/import { Trip, Manifest, Shipment, Locale } from '\.\.\/\.\.\/types';/, importReplacement);

const newUploadLogic = `
  const [isUploading, setIsUploading] = useState<Record<string, boolean>>({});

  const handleUpload = async (docType: string) => {
    // Create an input element to select file
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*,application/pdf';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      setIsUploading(prev => ({ ...prev, [docType]: true }));
      
      try {
        // Read file as base64
        const reader = new FileReader();
        reader.onload = async () => {
          const base64 = reader.result as string;
          
          try {
            const res = await safeFetchJson(\`/api/trips/\${trip.id}/documents\`, {
              method: 'POST',
              body: JSON.stringify({
                docType,
                fileName: file.name,
                fileData: base64
              })
            });
            
            if (res.success && res.trip) {
              setUploadedDocs(prev => ({ ...prev, [docType]: true }));
              // In a real app we would update the trip prop or trigger a refresh
              // For now, we update local state or trigger a refresh callback if it existed.
              if (trip) {
                if (!trip.documents) trip.documents = {};
                trip.documents[docType] = { url: 'uploaded', fileName: file.name, uploadedAt: new Date().toISOString() };
              }
            }
          } catch (error) {
            console.error('Upload failed', error);
          } finally {
            setIsUploading(prev => ({ ...prev, [docType]: false }));
          }
        };
        reader.readAsDataURL(file);
      } catch (err) {
        console.error(err);
        setIsUploading(prev => ({ ...prev, [docType]: false }));
      }
    };
    input.click();
  };
`;

// Replace the old mock handleUpload
code = code.replace(/const handleUpload = \(docType: string\) => \{[\s\S]*?\};\s*$/, '');
code = code.replace(/const handleUpload = \(docType: string\) => \{[\s\S]*?\};/, newUploadLogic);

// Wait, the regex might not match exactly. Let me find the exact old block and replace it.
