
export const generateItemCode = (year: number, sequence: number): string => {
  const seqStr = sequence.toString().padStart(3, '0');
  return `K/H/${year}/${seqStr}`;
};

export const generateBarcode = (year: number, sequence: number): string => {
  const seqStr = sequence.toString().padStart(3, '0');
  // 213 is a prefix used in the examples
  return `213${year}${seqStr}`;
};

export const generateCategoryCode = (category: string): string => {
  // Simple category code generator
  const prefix = category.substring(0, 2).toUpperCase();
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `${prefix}-${random}`;
};
