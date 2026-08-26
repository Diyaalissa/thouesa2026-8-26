import { Hub, Shipment, FinancialTransaction } from '../types';
import { formatCurrency } from './crypto';

/**
 * THOUESA Air Waybill & Tax Invoice PDF / Print Generator
 * Formats standardized international airway bills and customs invoices
 */

export function generateAirWaybillHtml(
  shipment: Shipment,
  originHub?: Hub,
  destHub?: Hub,
  qrCodeDataUrl?: string
): string {
  const originName = originHub ? `${originHub.nameAr} (${originHub.cityAr} - ${originHub.countryCode})` : 'فرع عمان (الأردن)';
  const destName = destHub ? `${destHub.nameAr} (${destHub.cityAr} - ${destHub.countryCode})` : 'فرع الجزائر (الجزائر)';

  return `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <title>Air Waybill — ${shipment.trackingNumber}</title>
  <style>
    @media print {
      body { margin: 0; padding: 15mm; }
      .no-print { display: none !important; }
    }
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      color: #0f172a;
      background: #ffffff;
      margin: 0;
      padding: 24px;
      font-size: 13px;
      line-height: 1.5;
    }
    .awb-container {
      max-width: 800px;
      margin: 0 auto;
      border: 2px solid #1e293b;
      padding: 24px;
      border-radius: 8px;
    }
    .header-table {
      width: 100%;
      border-bottom: 2px solid #1e293b;
      padding-bottom: 16px;
      margin-bottom: 16px;
    }
    .brand-title {
      font-size: 24px;
      font-weight: 900;
      color: #1e3a8a;
      margin: 0;
    }
    .brand-sub {
      font-size: 11px;
      color: #64748b;
    }
    .tracking-badge {
      font-family: monospace;
      font-size: 18px;
      font-weight: 800;
      background: #f1f5f9;
      border: 1px solid #cbd5e1;
      padding: 6px 14px;
      border-radius: 6px;
      display: inline-block;
    }
    .section-title {
      font-size: 12px;
      font-weight: 800;
      background: #e2e8f0;
      padding: 4px 8px;
      border-radius: 4px;
      margin: 12px 0 6px 0;
      color: #1e293b;
      text-transform: uppercase;
    }
    .grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }
    .box {
      border: 1px solid #e2e8f0;
      padding: 12px;
      border-radius: 6px;
      background: #fafafa;
    }
    .box-title {
      font-size: 11px;
      font-weight: 700;
      color: #475569;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 4px;
      margin-bottom: 6px;
    }
    .data-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 4px;
    }
    .data-label { color: #64748b; font-size: 11px; }
    .data-value { font-weight: 600; font-size: 12px; }
    .security-stamp {
      border: 2px dashed #059669;
      background: #ecfdf5;
      color: #065f46;
      padding: 10px;
      border-radius: 6px;
      text-align: center;
      margin-top: 14px;
      font-weight: 700;
    }
    .legal-footer {
      margin-top: 20px;
      border-top: 1px solid #cbd5e1;
      padding-top: 12px;
      font-size: 10px;
      color: #64748b;
      text-align: center;
    }
    .signatures-table {
      width: 100%;
      margin-top: 24px;
      border-top: 1px dashed #cbd5e1;
      padding-top: 16px;
    }
    .btn-print {
      background: #2563eb;
      color: #ffffff;
      border: none;
      padding: 10px 20px;
      font-weight: bold;
      border-radius: 6px;
      cursor: pointer;
      margin-bottom: 16px;
    }
  </style>
</head>
<body>
  <div class="no-print" style="text-align: center; margin-bottom: 16px;">
    <button class="btn-print" onclick="window.print()">🖨️ طباعة بوليصة الشحن (Print Air Waybill)</button>
  </div>

  <div class="awb-container">
    <table class="header-table">
      <tr>
        <td style="text-align: right;">
          <h1 class="brand-title">THOUESA ESCROW LOGISTICS</h1>
          <div class="brand-sub">منصة الشحن الجوي التشاركي والضمان المالي المشدد | Air Cargo & Transit Waybill</div>
        </td>
        <td style="text-align: left;">
          <div class="tracking-badge">${shipment.trackingNumber}</div>
          <div style="font-size: 10px; color: #64748b; margin-top: 4px;">تاريخ الإصدار: ${new Date(shipment.createdAt).toLocaleDateString('ar-EG')}</div>
        </td>
      </tr>
    </table>

    <div class="grid-2">
      <!-- Sender Details -->
      <div class="box">
        <div class="box-title">معلومات المرسل (Shipper / Consignor)</div>
        <div class="data-row"><span class="data-label">الاسم:</span><span class="data-value">${shipment.senderName}</span></div>
        <div class="data-row"><span class="data-label">رقم الهاتف:</span><span class="data-value" dir="ltr">${shipment.senderPhone}</span></div>
        <div class="data-row"><span class="data-label">فرع الإرسال:</span><span class="data-value">${originName}</span></div>
      </div>

      <!-- Recipient Details -->
      <div class="box">
        <div class="box-title">معلومات المستلم (Consignee)</div>
        <div class="data-row"><span class="data-label">الاسم:</span><span class="data-value">${shipment.recipientName}</span></div>
        <div class="data-row"><span class="data-label">رقم الهاتف:</span><span class="data-value" dir="ltr">${shipment.recipientPhone}</span></div>
        <div class="data-row"><span class="data-label">فرع الوصول:</span><span class="data-value">${destName}</span></div>
        <div class="data-row"><span class="data-label">رقم الهوية الوطنية:</span><span class="data-value">${shipment.recipientNationalId || 'N/A'}</span></div>
      </div>
    </div>

    <div class="section-title">بيانات الشحنة والمواصفات الأمنية (Shipment & Security Spec)</div>
    <div class="grid-2">
      <div class="box">
        <div class="data-row"><span class="data-label">وصف المحتويات:</span><span class="data-value">${shipment.itemDescription}</span></div>
        <div class="data-row"><span class="data-label">التصنيف:</span><span class="data-value">${shipment.itemCategory}</span></div>
        <div class="data-row"><span class="data-label">الغرض / الاستخدام:</span><span class="data-value">${shipment.purpose || 'شخصي'}</span></div>
        <div class="data-row"><span class="data-label">القيمة المصرحة:</span><span class="data-value">${formatCurrency(shipment.declaredValue, 'USD')}</span></div>
      </div>
      <div class="box">
        <div class="data-row"><span class="data-label">الوزن التقديري:</span><span class="data-value">${shipment.estimatedWeightKg} كغ</span></div>
        <div class="data-row"><span class="data-label">الوزن الفعلي المفحوص:</span><span class="data-value">${shipment.actualWeightKg || shipment.estimatedWeightKg} كغ</span></div>
        <div class="data-row"><span class="data-label">رمز الختم الأمني:</span><span class="data-value" style="color: #059669; font-weight: 800;">${shipment.securitySealId || 'SEAL-SECURED'}</span></div>
        <div class="data-row"><span class="data-label">رقم الرحلة الجوية:</span><span class="data-value">${shipment.flightNumber || 'RJ-511 (Royal Jordanian)'}</span></div>
      </div>
    </div>

    <!-- Security & Escrow Guarantee Stamp -->
    <div class="security-stamp">
      🔒 تم فحص الطرد أمنياً وتثبيت الختم ضد العبث (Tamper-Proof Seal) تحت بروتوكول IATA وضمام Escrow محجوز بالكامل ($${shipment.escrowDepositRequired || shipment.declaredValue}).
    </div>

    <table class="signatures-table">
      <tr>
        <td style="width: 33%; text-align: center;">
          <div style="font-size: 11px; font-weight: 700;">توقيع ضابط الفرع المفحص</div>
          <div style="height: 45px; border-bottom: 1px solid #94a3b8; margin: 8px 16px;"></div>
          <div style="font-size: 10px; color: #64748b;">عمر النجار (AMM-01)</div>
        </td>
        <td style="width: 33%; text-align: center;">
          ${qrCodeDataUrl ? `<img src="${qrCodeDataUrl}" style="width: 75px; height: 75px;" alt="QR Code" />` : ''}
          <div style="font-size: 9px; color: #64748b; font-family: monospace;">${shipment.trackingNumber}</div>
        </td>
        <td style="width: 33%; text-align: center;">
          <div style="font-size: 11px; font-weight: 700;">توقيع واستلام المسافر/المستلم</div>
          <div style="height: 45px; border-bottom: 1px solid #94a3b8; margin: 8px 16px;"></div>
          <div style="font-size: 10px; color: #64748b;">مطابق للمعاينة والختم</div>
        </td>
      </tr>
    </table>

    <div class="legal-footer">
      تخضع هذه البوليصة للشروط والأحكام الدولية لاتفاقية وارسو/مونتريال للنقل الجوي، ويقر المرسل بخلو الطرد من أي مواد محظورة أو سوائل غير مصرح بها.
    </div>
  </div>
</body>
</html>
`;
}

export function printAirWaybill(
  shipment: Shipment,
  originHub?: Hub,
  destHub?: Hub,
  qrCodeDataUrl?: string
) {
  const html = generateAirWaybillHtml(shipment, originHub, destHub, qrCodeDataUrl);
  const printWindow = window.open('', '_blank', 'width=900,height=750');
  if (printWindow) {
    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
  }
}
