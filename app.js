const express = require('express');
const multer = require('multer');
const path = require('path');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const nodemailer = require('nodemailer');
const basicAuth = require('express-basic-auth');
const app = express();

// Set up multer for file uploads
const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, './public/uploads/');
    },
    filename: function(req, file, cb) {
        cb(null, 'work-image-' + Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: multer.diskStorage({
        destination: 'uploads/',
        filename: function (req, file, cb) {
            cb(null, Date.now() + '-' + file.originalname)
        }
    }),
    limits: {
        files: 10, // Maximum number of files
        fileSize: 5 * 1024 * 1024 // 5MB limit per file
    },
    fileFilter: function (req, file, cb) {
        // Accept images only
        if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
            return cb(new Error('Only image files are allowed!'), false);
        }
        cb(null, true);
    }
}).array('workImages', 10);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.set('view engine', 'ejs');

// Add email configuration
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER, // Add your email
        pass: process.env.EMAIL_PASS  // Add your app password
    }
});

// Add basic authentication
app.use(basicAuth({
    users: { 
        'admin': 'yourpassword123',  // Add more users as needed
        'user2': 'anotherpassword'
    },
    challenge: true,
    realm: 'Invoice Generator'
}));

// Routes
app.get('/invoice', (req, res) => {
    res.render('invoice');
});

app.post('/generate-invoice', upload, async (req, res) => {
    try {
        const invoiceNumber = Date.now();
        const pdfPath = path.join(__dirname, 'public', 'invoices', `invoice-${invoiceNumber}.pdf`);
        
        const doc = new PDFDocument({
            size: 'A4',
            layout: 'portrait',
            margin: 50
        });

        const writeStream = fs.createWriteStream(pdfPath);
        doc.pipe(writeStream);
        
        // Company Header - Large and centered
        doc.fontSize(28)
           .fillColor('#2E5090')
           .text(req.body.companyName || 'Company Name', { align: 'center' });
        
        // Company Details - Smaller, centered
        doc.fontSize(10)
           .fillColor('#666666')
           .text(`License: ${req.body.license || 'N/A'}`, { align: 'center' })
           .text(`Insurance: ${req.body.insurance || 'N/A'}`, { align: 'center' })
           .moveDown(2);

        // INVOICE title
        doc.fontSize(20)
           .fillColor('#2E5090')
           .text('INVOICE', { align: 'right' });
        
        // Invoice details
        doc.fontSize(10)
           .fillColor('#333333')
           .text(`Invoice #: ${invoiceNumber}`, { align: 'right' })
           .text(`Date: ${new Date().toLocaleDateString()}`, { align: 'right' })
           .moveDown(2);

        // Bill To Section
        doc.fontSize(12)
           .fillColor('#2E5090')
           .text('BILL TO:')
           .fontSize(10)
           .fillColor('#333333')
           .text(req.body.clientName || 'Client Name')
           .text(req.body.clientEmail || 'Client Email')
           .moveDown(2);

        // Line Items Table
        const tableTop = doc.y;
        const tableHeaders = ['Description', 'Quantity', 'Price', 'Total'];
        const columnWidth = 125;
        
        // Table Headers
        doc.fontSize(10)
           .fillColor('#FFFFFF');
        
        // Header Background
        doc.rect(50, tableTop, 520, 20)
           .fill('#2E5090');
        
        // Header Text
        tableHeaders.forEach((header, i) => {
            doc.fillColor('#FFFFFF')
               .text(
                   header,
                   50 + (i * columnWidth),
                   tableTop + 5,
                   { width: columnWidth, align: 'center' }
               );
        });

        // Table Content
        let y = tableTop + 25;
        let total = 0;
        
        if (req.body.lineItems) {
            const lineItems = JSON.parse(req.body.lineItems);
            lineItems.forEach((item, index) => {
                const quantity = parseFloat(item.quantity) || 0;
                const price = parseFloat(item.price) || 0;
                const subtotal = quantity * price;
                total += subtotal;

                // Alternate row colors
                if (index % 2 === 0) {
                    doc.rect(50, y - 5, 520, 20)
                       .fill('#F8F8F8');
                }

                doc.fillColor('#333333')
                   .text(item.description || '', 50, y, { width: columnWidth })
                   .text(quantity.toString(), 50 + columnWidth, y, { width: columnWidth, align: 'center' })
                   .text(`$${price.toFixed(2)}`, 50 + (columnWidth * 2), y, { width: columnWidth, align: 'center' })
                   .text(`$${subtotal.toFixed(2)}`, 50 + (columnWidth * 3), y, { width: columnWidth, align: 'center' });

                y += 20;
            });
        }

        // Total Amount
        doc.moveDown()
           .fontSize(12)
           .fillColor('#2E5090')
           .text(`Total Amount: $${total.toFixed(2)}`, { align: 'right' })
           .moveDown(2);

        // Payment Options Section
        doc.fontSize(12)
           .fillColor('#2E5090')
           .text('PAYMENT OPTIONS')
           .moveDown();

        // Payment Methods Box
        doc.rect(50, doc.y, 520, 100)
           .fillAndStroke('#F8F8F8', '#CCCCCC');
        
        const paymentY = doc.y + 10;
        doc.fontSize(10)
           .fillColor('#333333');

        // PayPal
        doc.text('PayPal:', 70, paymentY)
           .fillColor('#333333')
           .text(process.env.PAYPAL_EMAIL || '[PayPal email]', 170, paymentY);

        // Venmo
        const venmoLink = `https://venmo.com/${process.env.VENMO_HANDLE || '[Venmo handle]'}`;
        doc.text('Venmo:', 70, paymentY + 20)
           .fillColor('#0000FF')
           .text(process.env.VENMO_HANDLE || '[Venmo handle]', 170, paymentY + 20, { link: venmoLink })
           .fillColor('#333333');

        // Zelle
        doc.text('Zelle:', 70, paymentY + 40)
           .fillColor('#333333')
           .text(process.env.ZELLE_EMAIL || '[Zelle email]', 170, paymentY + 40);

        // Cash App
        const cashAppLink = `https://cash.app/${process.env.CASHAPP_HANDLE || '[Cash App handle]'}`;
        doc.text('Cash App:', 70, paymentY + 60)
           .fillColor('#0000FF')
           .text(process.env.CASHAPP_HANDLE || '[Cash App handle]', 170, paymentY + 60, { link: cashAppLink })
           .fillColor('#333333');

        // Add images if any
        if (req.files && req.files.length > 0) {
            doc.addPage();
            doc.fontSize(16)
               .fillColor('#2E5090')
               .text('WORK DOCUMENTATION', { align: 'center' })
               .moveDown();
            
            // Calculate grid layout
            const imagesPerRow = 2;
            const imageWidth = 250;
            const imageHeight = 200;
            const margin = 20;
            let currentY = doc.y;
            
            for (let i = 0; i < req.files.length; i++) {
                const file = req.files[i];
                const row = Math.floor(i / imagesPerRow);
                const col = i % imagesPerRow;
                
                // Calculate x position based on column
                const x = 50 + (col * (imageWidth + margin));
                
                // Add new page if needed
                if (currentY + imageHeight > doc.page.height - 50) {
                    doc.addPage();
                    currentY = 50;
                }

                try {
                    doc.image(file.path, x, currentY, {
                        fit: [imageWidth, imageHeight],
                        align: 'center'
                    });
                } catch (error) {
                    console.error('Error adding image:', error);
                }

                // Only update Y position when we've finished a row
                if (col === imagesPerRow - 1) {
                    currentY += imageHeight + margin;
                }
            }
        }

        // Footer
        doc.fontSize(10)
           .fillColor('#666666')
           .text('Thank you for your business!', 50, doc.page.height - 50, {
               align: 'center'
           });

        // Finalize PDF
        doc.end();

        writeStream.on('finish', () => {
            res.json({
                success: true,
                invoiceId: invoiceNumber,
                pdfUrl: `/invoices/invoice-${invoiceNumber}.pdf`
            });
        });

    } catch (error) {
        console.error('Error generating invoice:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to generate invoice'
        });
    }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
}); 