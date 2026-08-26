const fs = require('fs');
let code = fs.readFileSync('server/routes/trips.ts', 'utf8');

const newEndpoint = `
// Upload Document for Trip
tripsRouter.post('/:id/documents', (req: Request, res: Response) => {
  const { id } = req.params;
  const { docType, fileData, fileName } = req.body;
  
  const trip = db.trips.get(id);
  if (!trip) {
    return res.status(404).json({ success: false, error: 'Trip not found' });
  }
  
  // In a real MariaDB/cPanel environment, fileData (Base64) would be saved to disk
  // and the path saved to the DB. Here we just store a mock URL indicating success.
  const docUrl = \`/uploads/trips/\${id}/\${docType}-\${Date.now()}.png\`;
  
  if (!trip.documents) {
    trip.documents = {};
  }
  trip.documents[docType] = { url: docUrl, fileName, uploadedAt: new Date().toISOString() };
  
  db.trips.set(trip.id, trip);
  
  db.logAudit({
    actorId: trip.travelerId,
    actorName: trip.travelerName,
    actorRole: 'TRAVELER',
    domain: 'Compliance',
    action: 'UPLOAD_DOCUMENT',
    resourceType: 'Trip',
    resourceId: trip.id,
    details: { docType, fileName }
  });
  
  // Also create a notification for admins
  db.pushNotification({
    type: 'SYSTEM_ALERT',
    titleEn: 'New Traveler Document',
    titleAr: 'مستند مسافر جديد',
    messageEn: \`Traveler \${trip.travelerName} uploaded \${docType} for flight \${trip.flightNumber}.\`,
    messageAr: \`قام المسافر \${trip.travelerName} برفع \${docType} للرحلة \${trip.flightNumber}.\`,
    targetRole: 'ADMIN',
    referenceId: trip.id,
    priority: 'NORMAL'
  });

  res.json({ success: true, trip, message: 'Document uploaded successfully' });
});
`;

if (!code.includes("tripsRouter.post('/:id/documents'")) {
  code = code + newEndpoint;
  fs.writeFileSync('server/routes/trips.ts', code);
  console.log("Added endpoint");
}
