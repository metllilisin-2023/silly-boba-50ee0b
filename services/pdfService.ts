import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

/**
 * Generates a high-quality PDF from a DOM element.
 * @param element The HTML element to capture.
 * @param filename The name of the resulting PDF file (without extension).
 */
export const generatePDFFromElement = async (element: HTMLElement, filename: string): Promise<void> => {
  try {
    // Save original styles to restore later
    const originalDisplay = element.style.display;
    const originalPosition = element.style.position;
    const originalLeft = element.style.left;

    // Ensure element is visible and has a fixed width for the capture
    element.style.display = 'block';
    element.style.position = 'relative';
    element.style.left = '0';
    element.style.width = '800px'; // Standard width for consistent rendering

    const canvas = await html2canvas(element, {
      scale: 2, // Higher scale for better text quality
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff'
    });

    // Restore original styles
    element.style.display = originalDisplay;
    element.style.position = originalPosition;
    element.style.left = originalLeft;
    element.style.width = '';

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`${filename}.pdf`);
  } catch (error) {
    console.error('PDF Generation Error:', error);
    throw error;
  }
};
