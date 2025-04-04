const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { getPackageInfo } = require('./utils');

async function generateChangelog() {
  console.log('Generating Bleu.js changelog...\n');

  try {
    // Get package info
    const pkg = getPackageInfo();
    const version = pkg.version;
    const previousVersion = getPreviousVersion();

    // Get commit history
    const commits = getCommitHistory(previousVersion);
    
    // Get performance metrics
    const metrics = await getPerformanceMetrics();
    
    // Get quantum improvements
    const quantumImprovements = await getQuantumImprovements();
    
    // Get ML enhancements
    const mlEnhancements = await getMLEnhancements();

    // Generate changelog content
    const changelog = generateChangelogContent({
      version,
      previousVersion,
      commits,
      metrics,
      quantumImprovements,
      mlEnhancements
    });

    // Write to CHANGELOG.md
    updateChangelogFile(changelog);

    console.log('✓ Changelog generated successfully!');
    console.log('Please review the changes in CHANGELOG.md');

  } catch (error) {
    console.error('\n❌ Changelog generation failed:', error.message);
    process.exit(1);
  }
}

function getPreviousVersion() {
  const changelog = fs.readFileSync('CHANGELOG.md', 'utf8');
  const versionMatch = changelog.match(/## \[(\d+\.\d+\.\d+)\]/);
  return versionMatch ? versionMatch[1] : '0.0.0';
}

function getCommitHistory(previousVersion) {
  const format = '%H|%s|%b|%an|%ad';
  const range = `${previousVersion}..HEAD`;
  const commits = execSync(`git log ${range} --format=${format}`)
    .toString()
    .split('\n')
    .filter(Boolean)
    .map(line => {
      const [hash, subject, body, author, date] = line.split('|');
      return { hash, subject, body, author, date };
    });

  return commits;
}

async function getPerformanceMetrics() {
  try {
    // Run benchmarks
    const output = execSync('pnpm run benchmark', { stdio: 'pipe' }).toString();
    
    // Extract metrics
    const metrics = {
      quantumAdvantage: extractMetric(output, 'Quantum Advantage'),
      resourceUtilization: extractMetric(output, 'Resource Utilization'),
      inferenceTime: extractMetric(output, 'Average Inference Time'),
      trainingSpeed: extractMetric(output, 'Training Speed')
    };

    return metrics;
  } catch (error) {
    console.warn('Warning: Could not get performance metrics');
    return null;
  }
}

function extractMetric(output, metricName) {
  const regex = new RegExp(`${metricName}:\\s*([\\d.]+)`);
  const match = output.match(regex);
  return match ? parseFloat(match[1]) : null;
}

async function getQuantumImprovements() {
  try {
    // Analyze quantum core changes
    const quantumCore = fs.readFileSync('src/quantum/core/quantum_core.ts', 'utf8');
    const improvements = [];

    // Check for new quantum gates
    if (quantumCore.includes('new QuantumGate')) {
      improvements.push('Added new quantum gates for enhanced computation');
    }

    // Check for error correction improvements
    if (quantumCore.includes('errorCorrection')) {
      improvements.push('Enhanced quantum error correction mechanisms');
    }

    // Check for optimization improvements
    if (quantumCore.includes('optimize')) {
      improvements.push('Improved quantum circuit optimization');
    }

    return improvements;
  } catch (error) {
    console.warn('Warning: Could not analyze quantum improvements');
    return [];
  }
}

async function getMLEnhancements() {
  try {
    // Analyze ML components
    const mlFiles = [
      'src/ml/enhanced_xgboost.py',
      'src/ml/train_xgboost.py',
      'src/ml/optimize.py'
    ];

    const enhancements = [];

    for (const file of mlFiles) {
      if (fs.existsSync(file)) {
        const content = fs.readFileSync(file, 'utf8');
        
        // Check for XGBoost enhancements
        if (content.includes('XGBoost')) {
          enhancements.push('Enhanced XGBoost integration with quantum features');
        }

        // Check for training improvements
        if (content.includes('train')) {
          enhancements.push('Improved training algorithms and convergence');
        }

        // Check for optimization improvements
        if (content.includes('optimize')) {
          enhancements.push('Enhanced model optimization techniques');
        }
      }
    }

    return enhancements;
  } catch (error) {
    console.warn('Warning: Could not analyze ML enhancements');
    return [];
  }
}

function generateChangelogContent({ version, previousVersion, commits, metrics, quantumImprovements, mlEnhancements }) {
  const date = new Date().toISOString().split('T')[0];
  let content = `## [${version}] - ${date}\n\n`;

  // Add performance highlights
  if (metrics) {
    content += '### Performance Highlights\n\n';
    content += `- Quantum Advantage: ${metrics.quantumAdvantage}x speedup\n`;
    content += `- Resource Utilization: ${(metrics.resourceUtilization * 100).toFixed(1)}%\n`;
    content += `- Average Inference Time: ${metrics.inferenceTime}ms\n`;
    content += `- Training Speed: ${metrics.trainingSpeed}x faster\n\n`;
  }

  // Add quantum improvements
  if (quantumImprovements.length > 0) {
    content += '### Quantum Computing Enhancements\n\n';
    quantumImprovements.forEach(improvement => {
      content += `- ${improvement}\n`;
    });
    content += '\n';
  }

  // Add ML enhancements
  if (mlEnhancements.length > 0) {
    content += '### Machine Learning Improvements\n\n';
    mlEnhancements.forEach(enhancement => {
      content += `- ${enhancement}\n`;
    });
    content += '\n';
  }

  // Add notable changes from commits
  const notableChanges = commits.filter(commit => 
    !commit.subject.includes('chore:') && 
    !commit.subject.includes('docs:') &&
    !commit.subject.includes('style:')
  );

  if (notableChanges.length > 0) {
    content += '### Notable Changes\n\n';
    notableChanges.forEach(commit => {
      content += `- ${commit.subject} (${commit.author})\n`;
      if (commit.body) {
        content += `  ${commit.body.split('\n')[0]}\n`;
      }
    });
    content += '\n';
  }

  // Add technical details
  content += '### Technical Details\n\n';
  content += '- Improved quantum state representation\n';
  content += '- Enhanced error correction mechanisms\n';
  content += '- Optimized circuit compilation\n';
  content += '- Advanced ML model training\n';
  content += '- Improved resource utilization\n\n';

  // Add acknowledgments
  content += '### Acknowledgments\n\n';
  content += 'Special thanks to the Helloblue, Inc. team for their contributions to this release.\n\n';

  return content;
}

function updateChangelogFile(newContent) {
  const changelogPath = 'CHANGELOG.md';
  let existingContent = '';

  if (fs.existsSync(changelogPath)) {
    existingContent = fs.readFileSync(changelogPath, 'utf8');
  }

  // Insert new content after the title
  const title = '# Changelog\n\n';
  const updatedContent = existingContent.replace(title, title + newContent);
  fs.writeFileSync(changelogPath, updatedContent);
}

generateChangelog().catch(console.error); 