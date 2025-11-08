const fs = require('fs');
const path = require('path');
const readline = require('readline');

// ASCII color codes
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Function to validate URL format
function isValidUrl(string) {
  if (!string || string.trim() === '') {
    return false;
  }
  
  try {
    const url = new URL(string);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch (_) {
    return false;
  }
}

// Function to prompt user for input
function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, resolve);
  });
}

// Function to process a single HTML file
function processFile(filePath, cssUrl, jsUrl) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let originalContent = content;
    let changesMade = false;

    // Pattern to match any doki-docs.css reference (local or CDN)
    const cssRegex = /href\s*=\s*["'][^"']*doki-docs\.css["']/gi;
    const jsRegex = /src\s*=\s*["'][^"']*doki-docs\.js["']/gi;

    // Replace CSS references
    const newCssContent = content.replace(cssRegex, `href="${cssUrl}"`);
    if (newCssContent !== content) {
      changesMade = true;
      content = newCssContent;
    }

    // Replace JS references
    const newJsContent = content.replace(jsRegex, `src="${jsUrl}"`);
    if (newJsContent !== content) {
      changesMade = true;
      content = newJsContent;
    }

    if (changesMade) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(colors.green + '[SUCCESS] Updated: ' + colors.reset + filePath);
      return { success: true, changes: true };
    } else {
      console.log(colors.yellow + '[SKIPPED] No changes needed: ' + colors.reset + filePath);
      return { success: true, changes: false };
    }
  } catch (error) {
    console.log(colors.red + '[ERROR] Failed to process: ' + colors.reset + filePath);
    console.log(colors.red + '        ' + error.message + colors.reset);
    return { success: false, changes: false, error: error.message };
  }
}

// Function to recursively find and process HTML files
function processDirectory(directory, cssUrl, jsUrl) {
  let stats = {
    processed: 0,
    updated: 0,
    errors: 0,
    skipped: 0
  };

  try {
    const items = fs.readdirSync(directory);

    for (const item of items) {
      const fullPath = path.join(directory, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        // Recursively process subdirectories (excluding node_modules and .git)
        if (!item.startsWith('.') && item !== 'node_modules') {
          const subStats = processDirectory(fullPath, cssUrl, jsUrl);
          stats.processed += subStats.processed;
          stats.updated += subStats.updated;
          stats.errors += subStats.errors;
          stats.skipped += subStats.skipped;
        }
      } else if (stat.isFile() && item.endsWith('.html')) {
        // Process HTML files
        stats.processed++;
        const result = processFile(fullPath, cssUrl, jsUrl);
        
        if (!result.success) {
          stats.errors++;
        } else if (result.changes) {
          stats.updated++;
        } else {
          stats.skipped++;
        }
      }
    }
  } catch (error) {
    console.log(colors.red + '[ERROR] Cannot read directory: ' + colors.reset + directory);
    console.log(colors.red + '        ' + error.message + colors.reset);
    stats.errors++;
  }

  return stats;
}

// Main function
async function main() {
  console.log(colors.cyan + '=========================================' + colors.reset);
  console.log(colors.bright + colors.cyan + '      DokiDocs Link Updater' + colors.reset);
  console.log(colors.cyan + '=========================================' + colors.reset);
  console.log('');

  // Get CSS URL from user
  const cssUrl = await askQuestion(colors.blue + 'Enter CSS URL: ' + colors.reset);
  if (!isValidUrl(cssUrl)) {
    console.log(colors.red + '[ERROR] Invalid CSS URL provided' + colors.reset);
    console.log(colors.yellow + 'Please provide a valid HTTP/HTTPS URL' + colors.reset);
    rl.close();
    return;
  }

  // Get JS URL from user
  const jsUrl = await askQuestion(colors.blue + 'Enter JS URL: ' + colors.reset);
  if (!isValidUrl(jsUrl)) {
    console.log(colors.red + '[ERROR] Invalid JS URL provided' + colors.reset);
    console.log(colors.yellow + 'Please provide a valid HTTP/HTTPS URL' + colors.reset);
    rl.close();
    return;
  }

  console.log('');
  console.log(colors.cyan + 'Configuration:' + colors.reset);
  console.log('  CSS: ' + colors.green + cssUrl + colors.reset);
  console.log('  JS:  ' + colors.green + jsUrl + colors.reset);
  console.log('');

  // Confirm with user
  const confirm = await askQuestion(colors.yellow + 'Proceed with updating files? (y/N): ' + colors.reset);
  if (confirm.toLowerCase() !== 'y' && confirm.toLowerCase() !== 'yes') {
    console.log(colors.yellow + 'Operation cancelled by user' + colors.reset);
    rl.close();
    return;
  }

  console.log('');
  console.log(colors.blue + 'Starting file processing...' + colors.reset);
  console.log('');

  const startDir = process.cwd();
  const stats = processDirectory(startDir, cssUrl, jsUrl);

  console.log('');
  console.log(colors.cyan + '=========================================' + colors.reset);
  console.log(colors.bright + colors.cyan + '           Processing Complete' + colors.reset);
  console.log(colors.cyan + '=========================================' + colors.reset);
  console.log('');
  console.log(colors.white + 'Summary:' + colors.reset);
  console.log('  Files processed: ' + colors.blue + stats.processed + colors.reset);
  console.log('  Files updated:   ' + colors.green + stats.updated + colors.reset);
  console.log('  Files skipped:   ' + colors.yellow + stats.skipped + colors.reset);
  console.log('  Errors:          ' + (stats.errors > 0 ? colors.red + stats.errors + colors.reset : colors.green + stats.errors + colors.reset));
  console.log('');

  if (stats.updated > 0) {
    console.log(colors.green + 'Successfully updated doki-docs references!' + colors.reset);
  } else if (stats.errors > 0) {
    console.log(colors.red + 'Completed with errors. Check the output above.' + colors.reset);
  } else {
    console.log(colors.yellow + 'No files required updates.' + colors.reset);
  }

  rl.close();
}

// Handle script termination
process.on('SIGINT', () => {
  console.log('');
  console.log(colors.yellow + 'Operation cancelled by user' + colors.reset);
  rl.close();
  process.exit(0);
});

// Run the script
if (require.main === module) {
  main().catch(error => {
    console.log(colors.red + '[FATAL ERROR] ' + error.message + colors.reset);
    rl.close();
    process.exit(1);
  });
}

module.exports = { 
  processFile, 
  processDirectory, 
  isValidUrl,
  colors
};
