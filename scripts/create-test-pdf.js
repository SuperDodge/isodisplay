const fs = require('fs');
const path = require('path');
const { createCanvas } = require('canvas');
const PDFDocument = require('pdfkit');

// Create a simple PDF with pdfkit
const doc = new PDFDocument();
const outputPath = path.join(__dirname, '../public/test.pdf');

doc.pipe(fs.createWriteStream(outputPath));

// Add some content
doc.fontSize(20)
   .text('Test PDF Document ' + Date.now(), 100, 100);

doc.fontSize(14)
   .text('This is a test PDF for thumbnail generation.', 100, 150);

doc.fontSize(12)
   .text('Lorem ipsum dolor sit amet, consectetur adipiscing elit.', 100, 200)
   .text('Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.', 100, 220)
   .text('Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.', 100, 240);

// Add a rectangle
doc.rect(100, 300, 200, 100)
   .fillAndStroke('#f56600', '#252c3a');

doc.fillColor('white')
   .fontSize(16)
   .text('Orange Box', 150, 340);

doc.end();

console.log('Test PDF created at:', outputPath);