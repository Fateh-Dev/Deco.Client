// reservation-pdf.service.ts
import { Injectable } from '@angular/core';
import { ToastrService } from 'ngx-toastr'; 
import { Client } from '../../models/client';
import { Reservation } from '../../models/reservation'; 
import { ReservationItem } from '../../models/reservation-item';

// Import pdfMake as a global variable
declare const pdfMake: {
  createPdf: (documentDefinition: any) => {
    open: () => void;
    print: () => void;
    download: (filename?: string) => void;
  };
};

export interface ReservationPdfData {
  client: Client;
  startDate: string;
  endDate: string;
  remarques?: string;
  reservationItems: Array<{
    articleId: number;
    quantity: number;
    article?: {
      id?: number;
      name: string;
      pricePerDay: number;
      description?: string;
      category?: {
        id?: number;
        name: string;
      };
    };
  }>;
  reservationId?: number;
  isEditMode?: boolean;
  totalDays: number;
}

@Injectable({
  providedIn: 'root'
})
export class ReservationPdfService {

  constructor(private toastr: ToastrService) {}

  /**
   * Check if pdfMake is available
   */
  isPdfMakeAvailable(): boolean {
    return typeof pdfMake !== 'undefined' && typeof pdfMake.createPdf === 'function';
  }

  /**
   * Format date to French locale
   */
  private formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('fr-FR');
  }

  /**
   * Calculate total price for all items
   */
  private calculateTotalPrice(items: ReservationPdfData['reservationItems']): number {
    return items.reduce((total, item) => {
      return total + ((item.article?.pricePerDay || 0) * item.quantity);
    }, 0);
  }

  /**
   * Create PDF document definition
   */
// Option 1: More Professional Business Layout
  private createDocumentDefinitionOption1(data: ReservationPdfData): any {
    const totalPrice = this.calculateTotalPrice(data.reservationItems);
    const grandTotal = totalPrice * data.totalDays;
    const categorySummary = this.calculateCategorySummary(data.reservationItems);

    // Define the document definition with proper TypeScript typing
    interface PdfStyle {
      fontSize?: number;
      bold?: boolean;
      margin?: number[];
      color?: string;
      fillColor?: string;
      lineHeight?: number;
      decoration?: string;
      italics?: boolean;
      alignment?: string;
    }

    interface PdfDocumentDefinition {
      pageSize: string;
      pageOrientation: string;
      pageMargins: number[];
      info: {
        title: string;
        author: string;
        subject: string;
        keywords: string;
      };
      defaultStyle: PdfStyle;
      content: any[];
      styles?: Record<string, PdfStyle>;
      footer?: (currentPage: number, pageCount: number) => any;
    }

    // Define styles
    const styles: Record<string, PdfStyle> = {
      header: {
        fontSize: 14,
        bold: true,
        margin: [0, 0, 0, 2]
      },
      subheader: {
        fontSize: 10,
        margin: [0, 0, 0, 1]
      },
      companyName: {
        fontSize: 12,
        bold: true,
        margin: [0, 0, 0, 1]
      },
      companyInfo: {
        fontSize: 8,
        margin: [0, 0, 0, 1]
      },
      sectionHeader: {
        fontSize: 10,
        bold: true,
        margin: [0, 5, 0, 3],
        color: '#000',
        decoration: 'underline'
      },
      infoText: {
        fontSize: 9,
        margin: [0, 1, 0, 1]
      },
      tableHeader: {
        bold: true,
        fontSize: 7.5,
        color: '#333333',
        fillColor: '#f8f8f8',
        margin: [0, 1, 0, 1],
        lineHeight: 1
      },
      itemName: {
        fontSize: 7.5,
        margin: [0, 0, 0, 0],
        lineHeight: 1
      },
      itemCategory: {
        fontSize: 8,
        color: '#666',
        margin: [0, 2, 0, 2]
      },
      totalLabel: {
        bold: true,
        fontSize: 10,
        margin: [5, 0, 0, 0]
      },
      totalGeneral: {
        bold: true,
        fontSize: 9,
        margin: [0, 1, 0, 1],
        lineHeight: 1,
        color: '#000000',
        fillColor: '#f0f0f0'
      },
      totalValue: {
        bold: true,
        fontSize: 12,
        margin: [5, 0, 0, 0]
      },
      footerNote: {
        fontSize: 8,
        color: '#666',
        italics: true
      }
    };

    // Create the document definition
    const docDefinition: PdfDocumentDefinition = {
      pageSize: 'A4',
      pageOrientation: 'portrait',
      pageMargins: [20, 20, 20, 20],
      info: {
        title: `Réservation - ${data.client.name}`,
        author: 'Location Déco',
        subject: 'Détails de réservation',
        keywords: 'réservation, location, décoration'
      },
      defaultStyle: {
        fontSize: 8,
        lineHeight: 1,
        margin: [0, 1, 0, 1]
      },
      content: [
        // Single copy of the reservation details
        {
          stack: [
            // Header
            {
              columns: [
                {
                  width: '60%',
                  stack: [
                    { text: 'LOCATION DÉCO', style: 'companyName', margin: [0, 0, 0, 0] },
                    { text: 'Service de location d\'articles de décoration', style: 'companySubtitle', margin: [0, 0, 0, 5], fontSize: 8 }
                  ]
                },
                {
                  width: '40%',
                  stack: [
                    {
                      text: data.reservationId ?
                        (data.isEditMode ? `Réservation #${data.reservationId} (Modifiée)` : `Réservation #${data.reservationId}`) :
                        'Nouvelle Réservation',
                      style: 'reservationNumber',
                      alignment: 'right'
                    },
                    {
                      text: `Date d'émission: ${new Date().toLocaleDateString('fr-FR')}`,
                      style: 'dateEmission',
                      alignment: 'right',
                      margin: [0, 2, 0, 0]
                    }
                  ]
                }
              ],
              margin: [0, 0, 0, 10]
            },

            // Title
            { text: 'DÉTAILS DE LA RÉSERVATION', style: 'documentTitle', alignment: 'center', margin: [0, 0, 0, 12] },

            // Client and Event Info
            {
              columns: [
                {
                  width: '48%',
                  stack: [
                    { text: 'INFORMATIONS CLIENT', style: 'sectionHeader', margin: [0, 0, 0, 4] },
                    { text: `Nom: ${data.client.name}`, margin: [0, 1] },
                    { text: `Téléphone: ${data.client.phone}`, margin: [0, 1] },
                    { text: `Adresse: ${data.client.address || 'Non spécifiée'}`, margin: [0, 1] }
                  ]
                },
                { width: '4%', text: '' },
                {
                  width: '48%',
                  stack: [
                    { text: 'DÉTAILS DE L\'ÉVÉNEMENT', style: 'sectionHeader', margin: [0, 0, 0, 4] },
                    { text: `Date: ${this.formatDate(data.startDate)}`, margin: [0, 1] },
                    { text: `Durée: ${data.totalDays} jour(s)`, margin: [0, 1] },
                    data.remarques ? { text: `Remarques: ${data.remarques}`, style: 'remarks', margin: [0, 3] } : null
                  ].filter(Boolean)
                }
              ],
              margin: [0, 0, 0, 12]
            },

            // Articles Table
            { text: 'ARTICLES RÉSERVÉS', style: 'sectionHeader', margin: [0, 0, 0, 6] },
            {
              table: {
                headerRows: 1,
                widths: ['*', 'auto', 'auto', 'auto'],
                body: [
                  [
                    { text: 'Article', style: 'tableHeader' },
                    { text: 'Prix/Jour', style: 'tableHeader', alignment: 'right' },
                    { text: 'Quantité', style: 'tableHeader', alignment: 'center' },
                    { text: 'Sous-total', style: 'tableHeader', alignment: 'right' }
                  ],
                  // Sort items by category and then by article name
                  ...this.getItemsSortedByCategory(data.reservationItems).map(item => [
                    { text: item.article?.name || 'Article inconnu', style: 'itemName' },
                    { text: `${item.article?.pricePerDay || 0} DZD`, alignment: 'right', style: 'itemName' },
                    { text: item.quantity.toString(), alignment: 'center', style: 'itemName' },
                    { text: `${(item.article?.pricePerDay || 0) * item.quantity} DZD`, alignment: 'right', style: 'itemName' }
                  ])
                ]
              },
              layout: {
                hLineWidth: function(i: number, node: any) {
                  return (i === 0 || i === node.table.body.length) ? 0.5 : 0.3;
                },
                vLineWidth: function() { return 0; },
                hLineColor: function() { return '#e0e0e0'; },
                paddingTop: function() { return 2; },
                paddingBottom: function() { return 2; }
              },
              margin: [0, 0, 0, 5]
            },

            // Totals
            {
              table: {
                widths: ['*', 'auto'],
                body: [
                  ['Total par jour:', `${totalPrice} DZD`],
                  [`Total (${data.totalDays} jour(s)) :`, `${grandTotal} DZD`]
                ]
              },
              layout: 'lightHorizontalLines',
              margin: [0, 8, 0, 15]
            },

            // Dashed line separator
            {
              canvas: [
                { type: 'line', x1: 0, y1: 5, x2: 595-40, y2: 5, lineWidth: 0.5, lineColor: '#999', dash: { length: 2 } }
              ],
              margin: [0, 15, 0, 15]
            },

            // Category Summary
            { text: 'RÉCAPITULATIF PAR CATÉGORIE', style: 'sectionHeader', margin: [0, 0, 0, 5] },
            {
              table: {
                headerRows: 1,
                widths: ['60%', '20%', '20%'],
                body: [
                  [
                    { text: 'CATÉGORIE', style: 'tableHeader' },
                    { text: 'QTE', style: 'tableHeader', alignment: 'center' },
                    { text: 'TOTAL', style: 'tableHeader', alignment: 'right' }
                  ],
                  ...categorySummary.map((item: any) => [
                    { text: item.category, style: 'itemName' },
                    { text: item.quantity, alignment: 'center', style: 'itemName' },
                    { text: `${item.total} DZD`, alignment: 'right', style: 'itemName' }
                  ]),
                  // Add total row
                  [
                    { 
                      text: 'TOTAL GÉNÉRAL', 
                      style: 'totalGeneral',
                      colSpan: 2 
                    },
                    {},
                    { 
                      text: `${grandTotal} DZD`, 
                      style: 'totalGeneral',
                      alignment: 'right' 
                    }
                  ]
                ]
              },
              layout: {
                hLineWidth: function(i: number, node: any) {
                  return (i === 0 || i === node.table.body.length - 2) ? 0.5 : 0;
                },
                vLineWidth: function() { return 0; },
                hLineColor: function() { return '#e0e0e0'; },
                paddingTop: function() { return 2; },
                paddingBottom: function() { return 2; },
                hLineStyle: function() { return { dash: { length: 1, space: 2 } }; }
              },
              margin: [0, 0, 0, 5]
            },

            // Versement section for handwritten amount
            {
              margin: [0, 20, 0, 20],
              columns: [
                {
                  width: '40%',
                  stack: [
                    { text: 'VERSEMENT:', style: 'sectionHeader', margin: [0, 0, 0, 10] },
                    // { 
                    //   // canvas: [
                    //   //   { type: 'line', x1: 0, y1: 0, x2: 200, y2: 0, lineWidth: 1, lineColor: '#000000' }
                    //   // ],
                    //   margin: [0, 10, 0, 0]
                    // }
                  ]
                },
                { width: '20%', text: '' },
                {
                  width: '40%',
                  stack: [
                    { text: 'DATE:', style: 'sectionHeader', margin: [0, 0, 0, 10] },
                    // { 
                    //   // canvas: [
                    //   //   { type: 'line', x1: 0, y1: 0, x2: 200, y2: 0, lineWidth: 1, lineColor: '#000000' }
                    //   // ],
                    //   margin: [0, 10, 0, 0]
                    // }
                  ]
                }
              ]
            },

            // Edit mode footer
            data.isEditMode ? {
              text: `Modifié le: ${new Date().toLocaleString('fr-FR')}`,
              alignment: 'right',
              fontSize: 8,
              italics: true,
              margin: [0, 5, 0, 0]
            } : null,

            // Terms at very bottom
            {
              text: 'CONDITIONS DE RÉSERVATION',
              style: 'termsTitle',
              margin: [0, 20, 0, 3]
            },
            {
              ul: [
                'La réservation est confirmée après paiement d\'un acompte de 30% du montant total.',
                'Les articles doivent être retournés dans l\'état où ils ont été livrés.'
              ],
              style: 'termsText',
              margin: [0, 0, 0, 10]
            }
          ]
        }
      ]
    };

    // // Add footer and styles to the document definition
    // docDefinition.footer = (currentPage: number, pageCount: number) => ({
    //   columns: [
    //     { 
    //       text: 'Location Déco - Service de location d\'articles de décoration', 
    //       alignment: 'center' as const, 
    //       fontSize: 8 
    //     },
    //     { 
    //       text: `Page ${currentPage} sur ${pageCount}`, 
    //       alignment: 'right' as const, 
    //       fontSize: 8 
    //     }
    //   ],
    //   margin: [40, 10]
    // });

    docDefinition.styles = styles;
    return docDefinition;
  }

  // Helper method to get items sorted by category and then by article name
  private getItemsSortedByCategory(items: any[]): any[] {
    // Create a copy of the array to avoid mutating the original
    return [...items].sort((a, b) => {
      // Get category names (with fallback to 'Autres' if not specified)
      const categoryA = a.article?.category?.name || 'Autres';
      const categoryB = b.article?.category?.name || 'Autres';
      
      // First sort by category
      if (categoryA < categoryB) return -1;
      if (categoryA > categoryB) return 1;
      
      // If same category, sort by article name
      const nameA = a.article?.name || '';
      const nameB = b.article?.name || '';
      return nameA.localeCompare(nameB);
    });
  }

  // Helper method to calculate category summary
  private calculateCategorySummary(items: any[]): any[] {
    const categoryMap = new Map();
    
    items.forEach(item => {
      const categoryName = item.article?.category?.name || 'Autres';
      const total = (item.article?.pricePerDay || 0) * item.quantity;
      
      if (categoryMap.has(categoryName)) {
        const existing = categoryMap.get(categoryName);
        existing.quantity += item.quantity;
        existing.total += total;
      } else {
        categoryMap.set(categoryName, {
          category: categoryName,
          quantity: item.quantity,
          total: total
        });
      }
    });
    
    // Sort categories alphabetically for the summary
    return Array.from(categoryMap.values())
      .sort((a, b) => a.category.localeCompare(b.category));
  }

  /**
   * Generate and view PDF
   */
  viewPDF(data: ReservationPdfData): void {
    if (!this.isPdfMakeAvailable()) {
      //this.toastr.error('PDF generation is not available. Please ensure pdfMake is loaded.');
      return;
    }

    try {
      const documentDefinition = this.createDocumentDefinitionOption1(data);
      const pdfDoc = pdfMake.createPdf(documentDefinition);
      pdfDoc.open();
      //this.toastr.success('PDF généré avec succès!', 'Succès');
    } catch (error) {
      console.error('Error generating PDF:', error);
      //this.toastr.error('Erreur lors de la génération du PDF');
    }
  }

  /**
   * Print PDF directly
   */
  printPDF(data: ReservationPdfData): void {
    if (!this.isPdfMakeAvailable()) {
      //this.toastr.error('PDF printing is not available. Please ensure pdfMake is loaded.');
      return;
    }

    try {
      const documentDefinition = this.createDocumentDefinitionOption1(data);
      const pdfDoc = pdfMake.createPdf(documentDefinition);
      pdfDoc.print();
      // //this.toastr.success('Document envoyé vers l\'imprimante!', 'Succès');
    } catch (error) {
      console.error('Error printing PDF:', error);
      // //this.toastr.error('Erreur lors de l\'impression du PDF');
    }
  }

  /**
   * Download PDF
   */
  downloadPDF(data: ReservationPdfData, customFilename?: string): void {
    if (!this.isPdfMakeAvailable()) {
      //this.toastr.error('PDF download is not available. Please ensure pdfMake is loaded.');
      return;
    }

    try {
      const filename = customFilename || this.generateFilename(data);
      const documentDefinition = this.createDocumentDefinitionOption1(data);
      const pdfDoc = pdfMake.createPdf(documentDefinition);
      pdfDoc.download(filename);
      //this.toastr.success('PDF téléchargé avec succès!', 'Succès');
    } catch (error) {
      console.error('Error downloading PDF:', error);
      //this.toastr.error('Erreur lors du téléchargement du PDF');
    }
  }

  /**
   * Generate filename for PDF
   */
  private generateFilename(data: ReservationPdfData): string {
    const clientName = data.client.name.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '');
    const date = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const prefix = data.isEditMode ? 'reservation_modifiee' : 'reservation';
    const reservationId = data.reservationId ? `_${data.reservationId}` : '';
    
    return `${prefix}_${clientName}${reservationId}_${date}.pdf`;
  }

  /**
   * Create PDF data from reservation object
   */
  createPdfDataFromReservation(
    reservation: Reservation, 
    client: Client, 
    totalDays: number,
    isEditMode: boolean = false
  ): ReservationPdfData {
    return {
      client,
      startDate: reservation.startDate.toISOString(),
      endDate: reservation.endDate.toISOString(),
      remarques: reservation.remarques,
      reservationItems: (reservation.reservationItems || []).map(item => ({
        articleId: item.articleId,
        quantity: item.quantity,
        article: item.article ? {
          id: item.article.id,
          name: item.article.name,
          pricePerDay: item.article.pricePerDay || 0,
          description: item.article.description
        } : undefined
      })),
      reservationId: reservation.id,
      isEditMode,
      totalDays
    };
  }

  /**
   * Create PDF data from form data (before saving)
   */
  createPdfDataFromForm(
    client: Client,
    startDate: string,
    endDate: string,
    remarques: string,
    reservationItems: Array<{
      articleId: number;
      quantity: number;
      article?: any;
    }>,
    totalDays: number,
    reservationId?: number,
    isEditMode: boolean = false
  ): ReservationPdfData {
    return {
      client,
      startDate,
      endDate,
      remarques,
      reservationItems,
      reservationId,
      isEditMode,
      totalDays
    };
  }

  /**
   * Validate PDF data before generation
   */
  validatePdfData(data: ReservationPdfData): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data.client) {
      errors.push('Client information is missing');
    }

    if (!data.startDate || !data.endDate) {
      errors.push('Reservation dates are missing');
    }

    if (!data.reservationItems || data.reservationItems.length === 0) {
      errors.push('No reservation items found');
    }

    if (data.totalDays <= 0) {
      errors.push('Invalid reservation duration');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Generate PDF with validation
   */
  generatePDFWithValidation(
    data: ReservationPdfData, 
    action: 'view' | 'print' | 'download' = 'view',
    customFilename?: string
  ): boolean {
    const validation = this.validatePdfData(data);
    
    if (!validation.isValid) {
      //this.toastr.error(`PDF generation failed: ${validation.errors.join(', ')}`);
      return false;
    }

    switch (action) {
      case 'view':
        this.viewPDF(data);
        break;
      case 'print':
        this.printPDF(data);
        break;
      case 'download':
        this.downloadPDF(data, customFilename);
        break;
    }

    return true;
  }
}