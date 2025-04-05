# ICML 2025 Submission Guide

## 1. Submission Requirements

### 1.1 Paper Format
- Maximum 8 pages (excluding references)
- Additional pages allowed for:
  - References
  - Appendices
  - Supplementary materials
- Format: LaTeX (ICML style)
- Font size: 10pt
- Double-column format

### 1.2 Required Sections
- Abstract (max 200 words)
- Introduction
- Related Work
- Methods
- Experiments
- Results
- Discussion
- References

### 1.3 Supplementary Materials
- Code
- Datasets
- Additional results
- Proofs
- Implementation details

## 2. Submission Process

### 2.1 Registration
1. Go to https://icml.cc/Conferences/2025/PaperSubmission
2. Click "Register" or "Sign Up"
3. Fill out author information:
   - Full name
   - Affiliation
   - Email
   - ORCID (optional)
4. Create account credentials
5. Verify email

### 2.2 Paper Submission
1. Log in to submission system
2. Click "New Submission"
3. Fill out submission form:
   - Title
   - Abstract
   - Keywords
   - Subject areas
   - Conflicts of interest
4. Upload files:
   - Main paper (PDF)
   - Supplementary materials (ZIP)
   - Code (ZIP)
5. Review submission
6. Submit

### 2.3 Important Dates
- Submission opens: January 15, 2025
- Submission deadline: February 15, 2025
- Author response period: March 15-22, 2025
- Final decisions: April 15, 2025
- Camera-ready deadline: May 1, 2025

## 3. Preparing Our Submission

### 3.1 Convert to ICML Format
```bash
# Convert our markdown to LaTeX
pandoc submission/icml_2025/icml_2025_submission.md \
  -o submission/icml_2025/paper.tex \
  --template=icml2025.tex
```

### 3.2 Prepare Supplementary Materials
```bash
# Create supplementary materials package
cd submission/icml_2025
zip -r supplementary.zip \
  icml_2025_supplementary.md \
  package/ \
  test_images/
```

### 3.3 Prepare Code Package
```bash
# Create code package
cd submission/icml_2025
zip -r code.zip \
  src/python/ml/computer_vision/quantum_attention.py \
  src/python/ml/computer_vision/quantum_fusion.py \
  src/quantum_py/optimization/contest_strategy.py
```

## 4. Submission Checklist

### 4.1 Before Submission
- [ ] Convert paper to ICML format
- [ ] Check page limits
- [ ] Verify references
- [ ] Prepare supplementary materials
- [ ] Prepare code package
- [ ] Check for conflicts of interest

### 4.2 During Submission
- [ ] Log in to submission system
- [ ] Fill out submission form
- [ ] Upload paper
- [ ] Upload supplementary materials
- [ ] Upload code
- [ ] Review submission
- [ ] Submit

### 4.3 After Submission
- [ ] Save confirmation email
- [ ] Note submission ID
- [ ] Mark calendar for author response period
- [ ] Prepare for potential revisions

## 5. Contact Information

### 5.1 ICML 2025 Contacts
- Program Chairs: chairs@icml.cc
- Submission Help: help@icml.cc
- General Inquiries: info@icml.cc

### 5.2 Our Team Contacts
- Primary Contact: [Your Email]
- Backup Contact: [Team Member Email]
- Technical Support: [Technical Contact]

## 6. Troubleshooting

### 6.1 Common Issues
- File size limits
- Formatting problems
- Submission system errors
- Account issues

### 6.2 Solutions
- Compress large files
- Check LaTeX compilation
- Contact support
- Try different browser

## 7. Next Steps
1. Register on ICML platform
2. Convert paper to ICML format
3. Prepare supplementary materials
4. Submit before deadline
5. Monitor submission status
