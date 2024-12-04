# Invoice Generator

A web-based invoice generator with PDF creation and email capabilities.

## Features
- Generate professional PDF invoices
- Upload work images
- Email invoices automatically
- PayPal payment integration
- Line item management
- License and insurance information
- Client information management
- Basic authentication protection

## Prerequisites
- Node.js (v14 or higher)
- npm (Node Package Manager)
- Gmail account (for email functionality)

## Installation

1. Clone the repository or create a new directory:
```
git clone https://github.com/your-username/invoice-generator.git
```

2. Navigate to the project directory:
```
cd invoice-generator
```

3. Install the dependencies:
```
npm install
```

This will install all dependencies listed in the `package.json` file.

## Dependencies

The following dependencies are required to run the project:

```json
{
  "dependencies": {
    "dotenv": "^16.0.0",
    "ejs": "^3.1.6",
    "express": "^4.17.1",
    "express-basic-auth": "^1.2.1",
    "multer": "^1.4.4",
    "nodemailer": "^6.7.2",
    "pdfkit": "^0.13.0"
  },
  "devDependencies": {
    "nodemon": "^2.0.15"
  }
}
```

To install all dependencies from a fresh clone, someone would just need to run:

```bash
npm install
```

This will install all dependencies listed in the `package.json` file.