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

  return {
    info: {
      title: `Réservation - ${data.client.name}`,
      author: 'Location Déco',
      subject: 'Détails de réservation',
      keywords: 'réservation, location, décoration'
    },
    content: [
      // Header (compact)
      {
        columns: [
          {
            width: '60%',
            stack: [
              { text: 'LOCATION DÉCO', style: 'companyName', margin: [0, 0, 0, 2] },
              { text: 'Service de location d\'articles de décoration', style: 'companySubtitle', margin: [0, 0, 0, 5] }
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
        margin: [0, 0, 0, 10] // reduced
      },

      // Title
      { text: 'DÉTAILS DE LA RÉSERVATION', style: 'documentTitle', alignment: 'center', margin: [0, 0, 0, 12] },

      // Client and Event Info (reduced spacing)
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
        margin: [0, 0, 0, 12] // reduced
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
              { text: 'Prix/Jour', style: 'tableHeader' },
              { text: 'Quantité', style: 'tableHeader' },
              { text: 'Sous-total', style: 'tableHeader' }
            ],
            ...data.reservationItems.map(item => [
              item.article?.name || 'Article inconnu',
              `${item.article?.pricePerDay || 0} DZD`,
              item.quantity.toString(),
              `${(item.article?.pricePerDay || 0) * item.quantity} DZD`
            ])
          ]
        },
        layout: 'lightHorizontalLines',
        margin: [0, 0, 0, 10]
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
          // 'Le solde doit être réglé au plus tard le jour de la livraison.',
          // 'En cas d\'annulation moins de 15 jours avant l\'événement, l\'acompte n\'est pas remboursable.',
          'Les articles doivent être retournés dans l\'état où ils ont été livrés.'
        ],
        style: 'termsText',
        margin: [0, 0, 0, 10]
      }

    ].filter(Boolean),

    footer: (currentPage: number, pageCount: number) => {
      return {
        columns: [
          { text: 'Location Déco - Service de location d\'articles de décoration', alignment: 'center', fontSize: 8 },
          { text: `Page ${currentPage} sur ${pageCount}`, alignment: 'right', fontSize: 8 }
        ],
        margin: [40, 10]
      };
    },

    styles: {
      companyName: { fontSize: 16, bold: true },
      companySubtitle: { fontSize: 9 },
      documentTitle: { fontSize: 13, bold: true },
      reservationNumber: { fontSize: 12, bold: true },
      dateEmission: { fontSize: 8 },
      sectionHeader: { fontSize: 11, bold: true, decoration: 'underline' },
      tableHeader: { bold: true, fontSize: 10 },
      remarks: { fontSize: 8, italics: true },
      termsTitle: { fontSize: 8, bold: true },
      termsText: { fontSize: 7 }
    },

    defaultStyle: {
      fontSize: 9,
      lineHeight: 1.2
    },

    pageSize: 'A4',
    pageMargins: [40, 40, 40, 60] // tighter margins
  };
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