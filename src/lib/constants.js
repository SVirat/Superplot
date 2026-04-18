export const DOC_TYPES = [
  { key: 'encumbrance_certificate', label: 'Encumbrance Certificate', tip: 'Proves no loans or legal claims exist on the property' },
  { key: 'certified_sale_deed', label: 'Certified Sale Deed', tip: 'Legal proof of ownership transfer between buyer and seller' },
  { key: 'pahani_ror1b', label: 'Pahani / ROR 1B', tip: 'Government land record showing ownership and crop details' },
  { key: 'survey_map', label: 'Survey Map', tip: 'Official map showing property boundaries and measurements' },
  { key: 'bhu_bharati_ec', label: 'Bhu Bharati EC', tip: 'Online encumbrance certificate from the Bhu Bharati portal' },
  { key: 'pattadhar_passbook', label: 'Pattadhar Passbook', tip: 'Booklet issued to landowners with ownership and transaction records' },
  { key: 'property_report', label: 'Property Report', tip: 'Detailed report on the property\'s legal and physical status' },
  { key: 'property_tax_receipt', label: 'Property Tax Receipt', tip: 'Receipt confirming property tax has been paid to the local body' },
  { key: 'cdma_property_tax_receipt', label: 'CDMA Property Tax Receipt', tip: 'Tax receipt issued by the City Development & Municipal Authority' },
  { key: 'building_permission', label: 'Building Permission', tip: 'Approval from local authority to construct on the property' },
  { key: 'land_use_certificate', label: 'Land Use Certificate', tip: 'Certifies the permitted use of land (residential, commercial, etc.)' },
  { key: 'mortgage_report', label: 'Mortgage Report', tip: 'Details of any mortgage or loan secured against the property' },
  { key: 'vaastu_report', label: 'Vaastu Report', tip: 'Assessment of the property\'s alignment with Vaastu Shastra principles' },
  { key: 'rera_certificate', label: 'RERA Certificate', tip: 'Registration under the Real Estate Regulatory Authority' },
  { key: 'sale_deed_receipt', label: 'Sale Deed Receipt', tip: 'Acknowledgment of payment for the registered sale deed' },
  { key: 'other', label: 'Other', tip: 'Any other documents related to this property' },
  { key: 'photos', label: 'Photos', tip: 'Property photos for reference and records' },
];

export const SCORED_TYPES = DOC_TYPES.filter(t => t.key !== 'other' && t.key !== 'photos');
export const SCORED_COUNT = SCORED_TYPES.length; // 15

export const OWNERSHIP_STATUSES = [
  { key: 'owned', label: 'Owned' },
  { key: 'jointly_owned', label: 'Jointly Owned' },
  { key: 'leased', label: 'Leased' },
  { key: 'inherited', label: 'Inherited' },
  { key: 'under_dispute', label: 'Under Dispute' },
];

export const ROLE_LABELS = {
  admin: 'Admin',
  family_contributor: 'Family — Contributor',
  family_view: 'Family — View Only',
  non_family_view: 'Non-Family — View Only',
};

export const MEMBER_ROLES = [
  { key: 'family_contributor', label: 'Family — Contributor' },
  { key: 'family_view', label: 'Family — View Only' },
  { key: 'non_family_view', label: 'Non-Family — View Only' },
];

export function docLabel(key) {
  return DOC_TYPES.find(t => t.key === key)?.label || key;
}

export function docTip(key) {
  return DOC_TYPES.find(t => t.key === key)?.tip || '';
}

export function ownershipLabel(key) {
  return OWNERSHIP_STATUSES.find(s => s.key === key)?.label || key;
}

export function docScore(documents) {
  if (!documents?.length) return { uploaded: 0, total: SCORED_COUNT, pct: 0 };
  const types = new Set(documents.filter(d => d.type !== 'other' && d.type !== 'photos').map(d => d.type));
  return { uploaded: types.size, total: SCORED_COUNT, pct: Math.round((types.size / SCORED_COUNT) * 100) };
}

export function slugify(name) {
  return name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}
