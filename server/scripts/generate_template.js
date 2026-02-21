const xlsx = require('xlsx');
const wb = xlsx.utils.book_new();

// Headers matching DrillingEntry schema
const headers = [
    'Date',               // MANDATORY
    'Rig',                // MANDATORY - must match Admin rig name
    'Project',            // MANDATORY - must match Admin project name
    'Shift',              // MANDATORY - Day or Night
    'Meters Drilled',     // MANDATORY - number
    'Hole Depth',         // optional
    'Bit Type',           // optional - PDC, Tricone, etc.
    'Formation',          // optional - Sandstone, Shale, Mixed
    'Mud Type',           // optional - Water-Based, Oil-Based
    'Total Shift Hours',  // optional (default 12)
    'Drilling Hours',     // optional (default 0)
    'Mechanical Downtime',// optional hours (default 0)
    'Operational Delay',  // optional hours (default 0)
    'Weather Downtime',   // optional hours (default 0)
    'Safety Downtime',    // optional hours (default 0)
    'Waiting On Parts',   // optional hours (default 0)
    'Standby Hours',      // optional hours (default 0)
    'NPT Hours',          // optional (default 0)
    'Fuel Consumed',      // optional liters
    'Consumables Cost',   // optional USD
    'Supervisor Name',    // optional
    'Remarks',            // optional
];

// Sample rows
const sampleData = [
    ['2026-01-15', 'Rig 04', 'Hansagnare', 'Day', 120, 450, 'PDC', 'Sandstone', 'Water-Based', 12, 9, 1.5, 0.5, 0, 0, 0, 1, 2, 85, 150, 'John Doe', 'Normal operations'],
    ['2026-01-15', 'Rig 04', 'Hansagnare', 'Night', 95, 545, 'PDC', 'Sandstone', 'Water-Based', 12, 8, 2, 1, 0, 0, 0, 1, 3, 70, 120, 'Jane Smith', 'Slightly reduced ROP'],
    ['2026-01-16', 'Rig 03', 'Bamako', 'Day', 85, 200, 'Tricone', 'Shale', 'Oil-Based', 12, 7, 3, 1, 0, 0.5, 0, 0.5, 4, 90, 200, 'Michael T', 'Hard formation'],
    // Minimal row - only mandatory fields filled
    ['2026-01-16', 'Rig 03', 'Bamako', 'Night', 110, '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
];

const ws = xlsx.utils.aoa_to_sheet([headers, ...sampleData]);

// Set column widths
ws['!cols'] = headers.map(h => ({ wch: Math.max(h.length + 2, 15) }));

xlsx.utils.book_append_sheet(wb, ws, 'Drilling Data');

// Write template
const outPath = '/Users/michaelteklegzi/Downloads/Equinox_Import_Template.xlsx';
xlsx.writeFile(wb, outPath);
console.log('Template saved to:', outPath);
