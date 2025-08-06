# UNILAG CGPA Calculator

A comprehensive CGPA calculator specifically designed for University of Lagos (UNILAG) students. Calculate your CGPA, track academic progress, and generate professional transcripts.

## Features

- ✅ **UNILAG Grading System**: Accurate 5.0 scale calculation (A=5.0, B=4.0, C=3.0, D=2.0, E=1.0, F=0)
- ✅ **4.0 Scale Conversion**: See your CGPA on the standard 4.0 scale
- ✅ **Course Management**: Add, edit, and remove courses with validation
- ✅ **Data Persistence**: Save and load your data in JSON format
- ✅ **PDF Transcript**: Generate professional academic transcripts
- ✅ **Responsive Design**: Works on desktop and mobile devices
- ✅ **Error Handling**: Comprehensive validation and duplicate detection

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
\`\`\`bash
git clone <repository-url>
cd unilag-cgpa-calculator
\`\`\`

2. Install dependencies:
\`\`\`bash
npm install
\`\`\`

3. Run the development server:
\`\`\`bash
npm run dev
\`\`\`

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Connect your GitHub repository to Vercel
3. Deploy with one click

Or use the Vercel CLI:
\`\`\`bash
npm install -g vercel
vercel
\`\`\`

## Usage

1. **Add Courses**: Click "Add Course" to input course codes, grades, and credit hours
2. **Calculate CGPA**: Your CGPA is calculated automatically as you add courses
3. **Switch Scales**: Toggle between UNILAG (5.0) and Standard (4.0) scales
4. **Save Data**: Download your data as JSON for backup
5. **Load Data**: Upload previously saved JSON files to continue
6. **Generate PDF**: Create professional transcripts with all your course details

## Tech Stack

- **Framework**: Next.js 14
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI
- **PDF Generation**: jsPDF
- **TypeScript**: Full type safety
- **Deployment**: Vercel

## License

MIT License - feel free to use this project for educational purposes.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
