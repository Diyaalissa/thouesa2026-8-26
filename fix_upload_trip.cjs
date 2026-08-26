const fs = require('fs');
let code = fs.readFileSync('src/components/traveler/TripManager.tsx', 'utf8');

if (!code.includes("import { safeFetchJson } from")) {
  code = code.replace(
    "import { formatCurrency } from '../../lib/crypto';", 
    "import { formatCurrency } from '../../lib/crypto';\nimport { safeFetchJson } from '../../lib/constants';"
  );
}

const newUploadBlock = `
  const [isUploading, setIsUploading] = useState<Record<string, boolean>>({});

  const handleUpload = async (docType: string) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*,application/pdf';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      setIsUploading(prev => ({ ...prev, [docType]: true }));
      
      try {
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
              if (trip) {
                if (!trip.documents) trip.documents = {};
                trip.documents[docType] = res.trip.documents[docType];
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

code = code.replace(/const handleUpload = \(docType: string\) => \{[\s\S]*?\};\s*};/g, newUploadBlock); // Using global regex might be risky, better to use exact replace
