import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

export const generateActionItemsPDF = (personName, actions) => {
    const doc = new jsPDF();

    // Add header with branding
    doc.setFillColor(255, 107, 53); // Equinox orange
    doc.rect(0, 0, 210, 35, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('EQUINOX DASHBOARD', 105, 15, { align: 'center' });

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('Action Items Report', 105, 25, { align: 'center' });

    // Reset text color
    doc.setTextColor(0, 0, 0);

    // Add report details
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(`Responsible Person:`, 14, 45);
    doc.setFont('helvetica', 'normal');
    doc.text(personName, 60, 45);

    doc.setFont('helvetica', 'bold');
    doc.text(`Generated:`, 14, 52);
    doc.setFont('helvetica', 'normal');
    doc.text(new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    }), 60, 52);

    doc.setFont('helvetica', 'bold');
    doc.text(`Total Actions:`, 14, 59);
    doc.setFont('helvetica', 'normal');
    doc.text(actions.length.toString(), 60, 59);

    // Prepare table data
    const tableData = actions.map((action, index) => [
        index + 1,
        action.title,
        action.status,
        action.priority,
        action.category,
        new Date(action.meetingDate).toLocaleDateString(),
        action.targetCompletionDate ? new Date(action.targetCompletionDate).toLocaleDateString() : 'N/A'
    ]);

    // Add table
    doc.autoTable({
        startY: 68,
        head: [['#', 'Title', 'Status', 'Priority', 'Category', 'Meeting Date', 'Target Date']],
        body: tableData,
        styles: {
            fontSize: 9,
            cellPadding: 3,
        },
        headStyles: {
            fillColor: [255, 107, 53],
            textColor: [255, 255, 255],
            fontStyle: 'bold',
        },
        alternateRowStyles: {
            fillColor: [245, 245, 245],
        },
        columnStyles: {
            0: { cellWidth: 10, halign: 'center' },
            1: { cellWidth: 50 },
            2: { cellWidth: 25 },
            3: { cellWidth: 20 },
            4: { cellWidth: 25 },
            5: { cellWidth: 28 },
            6: { cellWidth: 28 },
        },
        didParseCell: function (data) {
            // Color code status
            if (data.column.index === 2 && data.section === 'body') {
                const status = data.cell.raw;
                if (status === 'Completed') {
                    data.cell.styles.textColor = [34, 197, 94]; // green
                } else if (status === 'Delayed') {
                    data.cell.styles.textColor = [239, 68, 68]; // red
                } else if (status === 'Ongoing') {
                    data.cell.styles.textColor = [59, 130, 246]; // blue
                }
            }
            // Color code priority
            if (data.column.index === 3 && data.section === 'body') {
                const priority = data.cell.raw;
                if (priority === 'High') {
                    data.cell.styles.textColor = [239, 68, 68]; // red
                    data.cell.styles.fontStyle = 'bold';
                } else if (priority === 'Medium') {
                    data.cell.styles.textColor = [234, 179, 8]; // yellow
                }
            }
        }
    });

    // Add descriptions if available
    let currentY = doc.lastAutoTable.finalY + 10;

    if (actions.some(a => a.description)) {
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text('Action Details:', 14, currentY);
        currentY += 7;

        doc.setFontSize(9);
        actions.forEach((action, index) => {
            if (action.description) {
                // Check if we need a new page
                if (currentY > 270) {
                    doc.addPage();
                    currentY = 20;
                }

                doc.setFont('helvetica', 'bold');
                doc.text(`${index + 1}. ${action.title}`, 14, currentY);
                currentY += 5;

                doc.setFont('helvetica', 'normal');
                const splitDescription = doc.splitTextToSize(action.description, 180);
                doc.text(splitDescription, 20, currentY);
                currentY += splitDescription.length * 4 + 3;
            }
        });
    }

    // Add footer to all pages
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(128, 128, 128);
        doc.text(
            `Equinox Dashboard - Confidential | Page ${i} of ${pageCount}`,
            105,
            290,
            { align: 'center' }
        );
    }

    return doc;
};

export const exportPDFAsBase64 = (personName, actions) => {
    const doc = generateActionItemsPDF(personName, actions);
    return doc.output('datauristring').split(',')[1]; // Return base64 string
};

export const downloadPDF = (personName, actions) => {
    const doc = generateActionItemsPDF(personName, actions);
    const filename = `ActionItems_${personName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(filename);
};
